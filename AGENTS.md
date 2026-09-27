# 團隊 AI 協作規範

本檔案是此 repository 的共用 AI 規範入口；安裝、指令與 commit 格式詳見 `README.md`。

- 使用 npm 管理 dependencies，更新套件時一併更新 `package-lock.json`。
- Prettier 負責格式；ESLint 負責程式品質與規範，避免加入互相衝突的格式規則。
- 應用程式使用 TypeScript，Vue component 使用 `<script setup lang="ts">`。型別檢查使用 `npm run typecheck`，涵蓋 `src/` 的 TypeScript 與 Vue template。
- API 資料使用 DTO 宣告所需欄位，不額外做逐欄位 runtime validation；保留 API 明確回傳的錯誤處理，以及 DTO 轉成頁面 model 的資料轉換。
- 共用 HTTP 錯誤由 Axios interceptor 整理並繼續 reject，統一透過全域錯誤入口 `console.error`；store 不為了記錄錯誤而加 catch。Vue callback 內的非同步操作需 await 或 return Promise，避免錯誤脫離 Vue 處理範圍。
- 依變更範圍執行相關驗證：`npm run lint`、`npm run format:check`、`npm run typecheck`、`npm run build`。純文件變更只需格式檢查。
- Commit 訊息遵循 README 的 Conventional Commits 規範。
- PR 描述使用 `.github/pull_request_template.md`；review 流程、驗證證據及共用 AI review 指令遵循 `docs/code-review.md`。AI review 不取代人工核准。
- 團隊 skills 放在 `.agents/skills/<skill-name>/SKILL.md`，按任務需要載入，不預先載入所有 skills。
- 共用 skills 的輔助資源使用相對路徑，不依賴個人家目錄、帳號或本機絕對路徑。
- 共用 AI 規範與 skills 隨程式碼一起 review；個人偏好放在使用者層級設定，本機草稿可放在已忽略的 `.agents/local/`。
- 保留他人的未提交變更，不把 credentials、個人對話紀錄或本機 cache 加入共用檔案。
