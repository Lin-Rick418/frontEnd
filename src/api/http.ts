import axios from 'axios'

export const http = axios.create({
  baseURL: 'https://randomuser.me/api/1.4/',
  timeout: 10000,
  headers: { Accept: 'application/json' },
})

function getRequestErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return '請求逾時，請稍後再試。'
    }
    if (!error.response) {
      return '無法連線至服務，請確認網路後再試。'
    }
    return `API 請求失敗（HTTP ${error.response.status}）。`
  }
  return error instanceof Error ? error.message : '載入失敗，請稍後再試。'
}

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    // Keep programming errors and cancellations unchanged.
    if (!axios.isAxiosError(error) || axios.isCancel(error)) {
      return Promise.reject(error)
    }
    return Promise.reject(
      new Error(getRequestErrorMessage(error), { cause: error }),
    )
  },
)
