import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { installErrorHandlers } from './errors/handlers'
import './style.css'

const app = createApp(App)
const cleanupErrorHandlers = installErrorHandlers(app)

if (import.meta.hot) {
  import.meta.hot.dispose(cleanupErrorHandlers)
}

app.use(createPinia()).mount('#app')
