import { defineStore } from 'pinia'
import { getUsers } from '../api/users'
import type { User } from '../api/users'

interface UsersState {
  users: User[]
}

export const useUsersStore = defineStore('users', {
  state: (): UsersState => ({
    users: [],
  }),
  actions: {
    async fetchUsers() {
      this.users = await getUsers()
    },
  },
})
