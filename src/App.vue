<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useUsersStore } from './stores/users'

const usersStore = useUsersStore()
const { users } = storeToRefs(usersStore)
const searchQuery = ref('')
const filteredUsers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return users.value

  return users.value.filter(
    (user) =>
      user.name.toLowerCase().includes(query) &&
      user.email.toLowerCase().includes(query),
  )
})

onMounted(async () => {
  await usersStore.fetchUsers()
})
</script>

<template>
  <main class="directory">
    <header class="page-header">
      <div>
        <p class="eyebrow">VUE 3 · PINIA · AXIOS</p>
        <h1>認識隨機使用者</h1>
        <p class="intro">
          來自
          <a href="https://randomuser.me/">Random User</a>
          的隨機產生資料，供開發示範使用。
        </p>
      </div>
      <button type="button" @click="usersStore.fetchUsers()">
        換一批使用者
      </button>
    </header>

    <div class="search-field">
      <label for="user-search">搜尋使用者</label>
      <input
        id="user-search"
        v-model="searchQuery"
        type="search"
        placeholder="輸入姓名或 email"
      />
    </div>

    <p class="status" role="status">
      {{
        users.length
          ? `顯示 ${filteredUsers.length} / ${users.length} 位使用者。`
          : ''
      }}
    </p>

    <section aria-label="使用者列表">
      <ul v-if="filteredUsers.length" class="user-grid">
        <li v-for="user in filteredUsers" :key="user.id" class="user-card">
          <img
            :src="user.avatarUrl"
            alt=""
            width="80"
            height="80"
            loading="lazy"
          />
          <h2>{{ user.name }}</h2>
          <p class="location">{{ user.city }} · {{ user.country }}</p>
          <p class="email">{{ user.email }}</p>
        </li>
      </ul>
      <p v-else-if="users.length" class="empty">
        找不到符合的使用者，請調整或清除搜尋條件。
      </p>
      <p v-else class="empty">尚無使用者資料，可按「換一批使用者」取得。</p>
    </section>
  </main>
</template>
