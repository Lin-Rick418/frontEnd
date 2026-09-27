# Vue 3 + Vite

使用 Vue 3 與 Vite 的基本專案，需要 Node.js 22.15+。

## 安裝與啟動

```sh
npm ci
npm run dev
```

開啟 http://127.0.0.1:5178/，頁面會載入六位隨機使用者，可按「換一批使用者」重新取得資料。

## 資料請求與 Pinia

範例使用 [Random User API](https://randomuser.me/documentation) 的 1.4 版本，不需要 API key。使用者資料為隨機產生的示範資料。

資料流為 `App.vue → Pinia action → API service → Axios`，取得結果後由 action 更新 state，頁面透過 `storeToRefs()` 讀取。

- `src/api/http.ts`：Axios instance，設定 API base URL、10 秒 timeout。Response interceptor 統一整理 HTTP／網路／timeout 錯誤，以 `Error.cause` 保留原始 Axios error 並繼續 reject，不在此輸出 console 或操作 UI。
- `src/api/users.ts`：宣告所需的 API DTO 與 `User` 型別，定義 endpoint 與請求參數。每次產生新的 seed，避免快取讓「換一批」仍取得相同資料；處理 API error payload，並將 DTO 轉成頁面使用的 `User` model，不保留完整 login 資料。
- `src/stores/users.ts`：只管理 `users`；`fetchUsers()` 取得資料後更新 state，不管理 loading、error 或請求 status，也不攔截錯誤。
- `src/App.vue`：觸發 action 並顯示 state，不直接呼叫 Axios 或 API service，也不另存一份使用者列表。

首次掛載時取得資料。目前不處理 loading、停用按鈕或重複請求攔截，也未新增 loading store；每次呼叫 action 都會發出請求，成功時更新資料。失敗會往呼叫端傳遞，不執行 state 賦值，因此保留上一批資料。錯誤只記錄到 console，頁面可按「換一批使用者」再次請求。資料只保存在記憶體，重新整理瀏覽器會重新請求。

API 型別是開發時的契約，不驗證實際 JSON；目前不做逐欄位 runtime validation，假設 API 符合宣告。`toUser()` 只做資料轉換；`'error' in data` 用於區分 API 定義的成功與失敗回應，並非欄位格式驗證。HTTP／網路錯誤與 timeout 處理仍保留。

後續新增業務資料時，沿用 service 與 store 的分工；表單草稿、dialog 開關等局部 UI state 保留在 component。新增搜尋、分頁或帳號切換時，需另外定義競態處理與資料清除規則。

### 全域錯誤記錄

`src/errors/handlers.ts` 在 `main.ts` 掛載 app 前註冊以下入口，統一使用 `console.error` 記錄原始錯誤物件（包含 stack／cause）：

- `app.config.errorHandler`：Vue render、setup、事件、watcher、lifecycle hooks 傳出的未處理錯誤。
- `window.error`：Vue 以外未捕捉的 JavaScript 執行錯誤。
- `window.unhandledrejection`：未處理的 Promise rejection。

同一個錯誤物件跨入口只記錄一次；瀏覽器事件在自行記錄後使用 `preventDefault()` 避免預設的重複輸出。App unmount 或 Vite HMR dispose 時會移除 handlers，避免重複註冊。瀏覽器本身的 Network 錯誤列不屬於這套記錄機制。

API service 處理 HTTP 200 但含有 `error` 的業務失敗；interceptor 處理 HTTP／網路錯誤。兩者都往上傳，不吞掉 rejection，也不各自重複輸出 console。程式執行例外保留原始錯誤。

Vue callback 內的非同步操作必須 `await` 或 `return` Promise，才能讓 Vue 接到失敗，例如 `onMounted(async () => { await usersStore.fetchUsers() })`。只有需要恢復操作或特定業務處理時才自行 `catch`；若 catch 後不再拋出，全域入口就不會收到該錯誤。這套機制只記錄執行時例外，不會偵測未拋出例外的邏輯錯誤，也不取代 typecheck。

```sh
npm test              # Node.js test runner + tsx；以 Axios adapter 模擬 API，不依賴外部網路
```

## 正式打包與預覽

```sh
npm run build
npm run preview
```

產物輸出至 `dist/`，本機預覽網址為 http://127.0.0.1:4178/。

## Git hooks

使用 [Husky](https://typicode.github.io/husky/get-started.html) 管理 Git hooks。執行 `npm ci` 或 `npm install` 時，`prepare` script 會自動安裝 hooks。

每次 `git commit` 前會透過 lint-staged，只處理 staged files：

- JavaScript、TypeScript 與 Vue：先執行 ESLint，通過後由 Prettier 自動格式化。
- JSON、CSS、HTML、Markdown、YAML 等：由 Prettier 自動格式化。
- lint-staged 會將格式化結果納入本次提交；ESLint 錯誤或 warning 會中止提交。

`commit-msg` 階段會使用 commitlint 檢查 commit 訊息，不符合下方規範時會中止提交。

每次 `git push` 前會執行 `npm run typecheck`，型別檢查失敗時會中止 push。檢查涵蓋目前工作目錄中 `src/` 下的 TypeScript 與 Vue components（含 template），而非僅檢查 staged files。

應用程式使用 `.ts` 與 Vue `<script setup lang="ts">`，透過 `interface`／`type` 宣告型別。型別檢查使用 [vue-tsc](https://vuejs.org/guide/typescript/overview.html)，在 `tsconfig.json` 啟用 strict 與 `verbatimModuleSyntax`，型別匯入使用 `import type`。不產生編譯檔案，也不檢查根目錄的工具設定檔及 `tests/` 的 JavaScript。工具設定與測試仍使用 JavaScript；測試以 tsx 載入 TypeScript 應用程式模組。

TypeScript 固定使用 5.9.3；目前搭配的 vue-tsc 3.3.11 在 TypeScript 7.0.2 下會發生啟動錯誤，升級時需一併驗證相容性。

Prettier 專責縮排、引號、分號與換行，沿用專案的單引號、不加分號風格。ESLint 使用 JavaScript recommended、TypeScript recommended 與 Vue essential 規則，檢查未使用變數、Vue 用法，以及嚴格相等、`const` / `let` 等規範。TypeScript 與 Vue 的未定義名稱交由 typecheck 檢查；JavaScript 保留 ESLint 的 `no-undef`。`eslint-config-prettier` 關閉與格式相關的衝突規則。

```sh
npm run lint          # 檢查整個專案的程式規範
npm run typecheck     # 檢查 src/ 的型別與 Vue template
npm run format        # 自動格式化
npm run format:check  # 只檢查格式，不修改檔案
```

`dist/`、`coverage/`、dependencies 與自動產生的檔案不納入格式檢查。完整 build 不在 pre-commit 執行；可手動執行 `npm run build`。目前尚未配置 CI，之後 CI 應執行 `npm test`、`npm run lint`、`npm run format:check`、`npm run typecheck` 與 `npm run build`。

若從不含 `.git` 的原始碼副本開始，請先執行 `git init`，再執行 `npm run prepare` 啟用 hooks。

## Commit 訊息規範

使用 [commitlint](https://commitlint.js.org/guides/local-setup.html) 的 `@commitlint/config-conventional`，設定檔為 `commitlint.config.js`。

```text
type(scope): 描述
```

`type` 必須使用下表的小寫值，`scope` 可省略（例如 `auth`、`ui`、`deps`）。冒號後加一個空白，描述不可空白；整個標題最多 100 字元，結尾不加英文句點 `.`。描述可用中文或英文，不限制大小寫，方便使用 API、Vue 等技術名稱。

| Type       | 用途                           | 範例                                    |
| ---------- | ------------------------------ | --------------------------------------- |
| `feat`     | 新增功能                       | `feat(auth): 新增登入功能`              |
| `fix`      | 修正 bug                       | `fix(form): 修正空白輸入仍可送出的問題` |
| `refactor` | 重構程式，不新增功能或修正 bug | `refactor: 抽出共用資料轉換函式`        |
| `style`    | 僅調整程式格式，不改變行為     | `style: 套用 Prettier 格式`             |
| `docs`     | 文件調整                       | `docs: 補充開發環境設定`                |
| `test`     | 新增或修改測試                 | `test(auth): 補上登入失敗案例`          |
| `perf`     | 效能改善                       | `perf(list): 減少重複計算`              |
| `build`    | 建置工具或 dependencies 調整   | `build(deps): 更新 Vite`                |
| `ci`       | CI/CD 設定調整                 | `ci: 新增型別檢查流程`                  |
| `chore`    | 其他維護、開發工具設定         | `chore: 設定 commitlint hook`           |
| `revert`   | 撤銷先前變更                   | `revert: 撤銷登入流程調整`              |

`style` 指程式碼格式；畫面外觀或 CSS 行為的變更，依目的使用 `feat` 或 `fix`。

Breaking change 可在 type 或 scope 後加 `!`，並在 footer 說明不相容的變更：

```text
feat(auth)!: 改用新的登入回應格式

BREAKING CHANGE: 登入回應由 token 改為 accessToken
```

有 body 或 footer 時，與前一段之間留一行空白。沿用 commitlint 預設忽略行為，例如自動產生的 merge 與 revert 訊息。

可在提交前手動驗證訊息：

```sh
echo 'feat(auth): 新增登入功能' | npm run commitlint
```

## 團隊協作與 Git 忽略規則

`.gitignore` 排除 dependencies、build 產物、測試報告、cache、log、本機環境變數、IDE 個人狀態及 AI 本機執行紀錄。

- `package-lock.json`、`.husky/` 的自訂 hooks、工具設定與共用 AI 規範需納入 Git；Husky 自動產生的 `.husky/_/` 忽略。
- `.env` 與 `.env.*` 忽略；`.env.example`、`.env.<mode>.example` 可提交，但只能包含變數說明與 placeholder。目前專案沒有需要提供的環境變數。
- `.vscode/` 僅允許提交團隊共用的 `settings.json`、`extensions.json`、`tasks.json`、`launch.json` 與 snippets，不放個人路徑或 credentials。
- 個人特有的忽略需求可放在 `.git/info/exclude`，不必修改整個團隊的 `.gitignore`。

### 共用 AI 規範與 skills

| 位置                                             | 用途                       | 納入 Git |
| ------------------------------------------------ | -------------------------- | -------- |
| `AGENTS.md`                                      | 專案共用規範入口           | 是       |
| `.agents/skills/<skill-name>/SKILL.md`           | 團隊共用工作流程及相關資源 | 是       |
| `.agents/local/`                                 | 個人草稿、臨時筆記         | 否       |
| `.claude/settings.local.json`、`CLAUDE.local.md` | Claude 個人設定或指示      | 否       |
| `.codex/auth.json`、`.codex/sessions/` 等        | 本機認證與執行紀錄         | 否       |

共用 skills 的目錄慣例與維護方式見 [.agents/skills/README.md](.agents/skills/README.md)。不整包忽略 `.agents/`、`.claude/` 或 `.codex/`，讓團隊共用設定與 skills 能持續接受版本管理。

## 檔案

- `src/main.ts`：Vue 應用程式入口。
- `src/App.vue`：根 component。
- `src/style.css`：全域樣式。
- `vite.config.js`：Vite 設定。
