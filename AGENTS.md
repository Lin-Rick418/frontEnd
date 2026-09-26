# 團隊 AI 協作規範

本檔案是此 repository 的共用 AI 規範入口；安裝、指令與 commit 格式詳見 `README.md`。

- 使用 npm 管理 dependencies，更新套件時一併更新 `package-lock.json`。
- Prettier 負責格式；ESLint 負責程式品質與規範，避免加入互相衝突的格式規則。
- 型別檢查使用 `npm run typecheck`，目前涵蓋 `src/` 的 JavaScript、TypeScript 與 Vue template。
- 依變更範圍執行相關驗證：`npm run lint`、`npm run format:check`、`npm run typecheck`、`npm run build`。純文件變更只需格式檢查。
- Commit 訊息遵循 README 的 Conventional Commits 規範。
- 團隊 skills 放在 `.agents/skills/<skill-name>/SKILL.md`，按任務需要載入，不預先載入所有 skills。
- 共用 skills 的輔助資源使用相對路徑，不依賴個人家目錄、帳號或本機絕對路徑。
- 共用 AI 規範與 skills 隨程式碼一起 review；個人偏好放在使用者層級設定，本機草稿可放在已忽略的 `.agents/local/`。
- 保留他人的未提交變更，不把 credentials、個人對話紀錄或本機 cache 加入共用檔案。
