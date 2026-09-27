import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { AxiosError } from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { http } from '../src/api/http.ts'
import { useUsersStore } from '../src/stores/users.ts'

const originalAdapter = http.defaults.adapter
const user = {
  login: { uuid: 'user-1', password: 'unused' },
  name: { first: 'Alex', last: 'Chen' },
  email: 'alex@example.com',
  picture: { large: 'https://randomuser.me/api/portraits/men/1.jpg' },
  location: { city: 'Taipei', country: 'Taiwan' },
}

function respondWith(data) {
  http.defaults.adapter = async (config) => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  })
}

beforeEach(() => setActivePinia(createPinia()))
afterEach(() => {
  http.defaults.adapter = originalAdapter
})

test('loads a stable user model without retaining the raw API payload', async () => {
  respondWith({ results: [user] })
  const store = useUsersStore()
  await store.fetchUsers()

  assert.deepEqual(store.users, [
    {
      id: 'user-1',
      name: 'Alex Chen',
      email: 'alex@example.com',
      avatarUrl: user.picture.large,
      city: 'Taipei',
      country: 'Taiwan',
    },
  ])
})

test('uses a new API seed for each refresh so cached responses do not repeat a batch', async () => {
  const seeds = []
  http.defaults.adapter = async (config) => {
    seeds.push(config.params.seed)
    return { data: { results: [user] }, status: 200, headers: {}, config }
  }
  const store = useUsersStore()
  await store.fetchUsers()
  await store.fetchUsers()
  assert.equal(seeds.length, 2)
  assert.equal(typeof seeds[0], 'string')
  assert.ok(seeds[0])
  assert.notEqual(seeds[0], seeds[1])
})

test('preserves existing users on network failure and recovers on retry', async () => {
  respondWith({ results: [user] })
  const store = useUsersStore()
  await store.fetchUsers()

  const originalError = new AxiosError('Network Error', 'ERR_NETWORK')
  http.defaults.adapter = async () => {
    throw originalError
  }
  await assert.rejects(store.fetchUsers(), (error) => {
    assert.match(error.message, /無法連線/)
    assert.equal(error.cause, originalError)
    return true
  })
  assert.equal(store.users[0].id, 'user-1')

  respondWith({ results: [{ ...user, login: { uuid: 'user-2' } }] })
  await store.fetchUsers()
  assert.deepEqual(
    store.users.map((item) => item.id),
    ['user-2'],
  )
})

test('reports timeout errors', async () => {
  http.defaults.adapter = async () => {
    throw new AxiosError('timeout', 'ECONNABORTED')
  }
  const store = useUsersStore()
  await assert.rejects(store.fetchUsers(), /逾時/)
})

for (const status of [401, 502]) {
  test(`propagates HTTP ${status} with the original Axios error as its cause`, async () => {
    let originalError
    http.defaults.adapter = async (config) => {
      originalError = new AxiosError(
        'Request failed',
        'ERR_BAD_RESPONSE',
        config,
        null,
        {
          status,
          data: {},
          headers: {},
          config,
        },
      )
      throw originalError
    }
    const store = useUsersStore()
    await assert.rejects(store.fetchUsers(), (error) => {
      assert.match(error.message, new RegExp(`HTTP ${status}`))
      assert.equal(error.cause, originalError)
      assert.equal(error.cause.response.status, status)
      return true
    })
  })
}

test('preserves existing users when the API returns an error payload with HTTP 200', async () => {
  respondWith({ results: [user] })
  const store = useUsersStore()
  await store.fetchUsers()
  respondWith({ error: 'Unavailable' })
  await assert.rejects(store.fetchUsers(), (error) => {
    assert.match(error.message, /使用者服務暫時無法使用/)
    assert.equal(error.cause, 'Unavailable')
    return true
  })
  assert.equal(store.users[0].id, 'user-1')
})

test('treats an empty result as a successful empty list', async () => {
  respondWith({ results: [] })
  const store = useUsersStore()
  await store.fetchUsers()
  assert.deepEqual(store.users, [])
})

test('propagates programming errors unchanged and preserves existing users', async () => {
  respondWith({ results: [user] })
  const store = useUsersStore()
  await store.fetchUsers()
  const originalError = new TypeError('Unexpected application failure')
  http.defaults.adapter = async () => {
    throw originalError
  }
  await assert.rejects(store.fetchUsers(), (error) => error === originalError)
  assert.equal(store.users[0].id, 'user-1')
})

test('propagates mapping exceptions without adding runtime validation', async () => {
  respondWith({ results: [user] })
  const store = useUsersStore()
  await store.fetchUsers()
  respondWith({ results: [{ ...user, name: null }] })
  await assert.rejects(store.fetchUsers(), TypeError)
  assert.equal(store.users[0].id, 'user-1')
})
