import { http } from './http'

interface RandomUserDto {
  login: { uuid: string }
  name: { first: string; last: string }
  email: string
  picture: { large: string }
  location: { city: string; country: string }
}

type RandomUserResponse = { results: RandomUserDto[] } | { error: string }

export interface User {
  id: string
  name: string
  email: string
  avatarUrl: string
  city: string
  country: string
}

function toUser(user: RandomUserDto): User {
  return {
    id: user.login.uuid,
    name: `${user.name.first} ${user.name.last}`,
    email: user.email,
    avatarUrl: user.picture.large,
    city: user.location.city,
    country: user.location.country,
  }
}

export async function getUsers(): Promise<User[]> {
  const { data } = await http.get<RandomUserResponse>('', {
    params: {
      results: 6,
      inc: 'login,name,email,picture,location',
      // A new seed also prevents cached GET responses from repeating a batch.
      seed: crypto.randomUUID(),
    },
  })

  if ('error' in data) {
    throw new Error('使用者服務暫時無法使用，請稍後再試。', {
      cause: data.error,
    })
  }
  return data.results.map(toUser)
}
