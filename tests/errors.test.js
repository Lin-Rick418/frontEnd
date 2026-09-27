import assert from 'node:assert/strict'
import { afterEach, test, mock } from 'node:test'
import { AxiosError } from 'axios'
import { createApp, createRenderer, h, onMounted } from 'vue'
import { createPinia } from 'pinia'
import { installErrorHandlers } from '../src/errors/handlers.ts'
import { http } from '../src/api/http.ts'
import { useUsersStore } from '../src/stores/users.ts'

const originalAdapter = http.defaults.adapter

afterEach(() => {
  mock.restoreAll()
  http.defaults.adapter = originalAdapter
})

function errorEvent(type, properties) {
  const event = new globalThis.Event(type, { cancelable: true })
  Object.assign(event, properties)
  return event
}

test('logs Vue and browser errors once per error object, preserving the error itself', () => {
  const log = mock.method(console, 'error', () => {})
  const target = new globalThis.EventTarget()
  const app = createApp({})
  const cleanup = installErrorHandlers(app, target)
  const error = new TypeError('Example failure')

  app.config.errorHandler(error, null, 'component event handler')
  const duplicate = errorEvent('unhandledrejection', { reason: error })
  target.dispatchEvent(duplicate)
  assert.equal(log.mock.callCount(), 1)
  assert.equal(log.mock.calls[0].arguments[1], error)
  assert.equal(duplicate.defaultPrevented, true)

  const runtimeError = new ReferenceError('Unknown variable')
  const browserEvent = errorEvent('error', { error: runtimeError })
  target.dispatchEvent(browserEvent)
  assert.equal(log.mock.callCount(), 2)
  assert.equal(log.mock.calls[1].arguments[1], runtimeError)
  assert.equal(browserEvent.defaultPrevented, true)
  cleanup()
})

test('logs unhandled Promise rejections and runtime errors without an Error object', () => {
  const log = mock.method(console, 'error', () => {})
  const target = new globalThis.EventTarget()
  const cleanup = installErrorHandlers(createApp({}), target)
  const rejection = errorEvent('unhandledrejection', {
    reason: 'Rejected operation',
  })
  target.dispatchEvent(rejection)
  assert.deepEqual(log.mock.calls[0].arguments, [
    '[Unhandled Promise]',
    'Rejected operation',
  ])
  assert.equal(rejection.defaultPrevented, true)

  const runtimeError = errorEvent('error', {
    error: null,
    message: 'Script error',
    filename: 'example.js',
    lineno: 12,
    colno: 3,
  })
  target.dispatchEvent(runtimeError)
  assert.deepEqual(log.mock.calls[1].arguments, [
    '[Window]',
    'Script error (example.js:12:3)',
  ])
  cleanup()
})

test('cleanup restores the previous Vue handler and removes browser listeners', () => {
  const log = mock.method(console, 'error', () => {})
  const app = createApp({})
  const previousHandler = () => {}
  app.config.errorHandler = previousHandler
  const target = new globalThis.EventTarget()
  const cleanup = installErrorHandlers(app, target)
  cleanup()
  assert.equal(app.config.errorHandler, previousHandler)

  const event = errorEvent('unhandledrejection', {
    reason: new Error('After cleanup'),
  })
  target.dispatchEvent(event)
  assert.equal(log.mock.callCount(), 0)
  assert.equal(event.defaultPrevented, false)
})

// Exercise Vue's actual async hook boundary without a browser or DOM dependency.
const renderer = createRenderer({
  patchProp() {},
  insert() {},
  remove() {},
  createElement: () => ({}),
  createText: () => ({}),
  createComment: () => ({}),
  setText() {},
  setElementText() {},
  parentNode: () => null,
  nextSibling: () => null,
})

for (const kind of ['http', 'programming']) {
  test(
    `an awaited store ${kind} failure reaches the Vue error handler exactly once`,
    { timeout: 2000 },
    async () => {
      const originalError =
        kind === 'http'
          ? new AxiosError('Network Error', 'ERR_NETWORK')
          : new TypeError('Application failure')
      http.defaults.adapter = async () => {
        throw originalError
      }
      let log
      const logged = new Promise((resolve) => {
        log = mock.method(console, 'error', (...args) => resolve(args))
      })
      const app = renderer.createApp({
        setup() {
          const store = useUsersStore()
          onMounted(async () => {
            await store.fetchUsers()
          })
          return () => h('div')
        },
      })
      app.use(createPinia())
      const target = new globalThis.EventTarget()
      const cleanup = installErrorHandlers(app, target)
      try {
        app.mount({})
        const [source, error] = await logged
        assert.match(source, /Vue: mounted hook/)
        if (kind === 'http') {
          assert.match(error.message, /無法連線/)
          assert.equal(error.cause, originalError)
        } else {
          assert.equal(error, originalError)
        }
        assert.equal(log.mock.callCount(), 1)
      } finally {
        app.unmount()
        cleanup()
      }
    },
  )
}
