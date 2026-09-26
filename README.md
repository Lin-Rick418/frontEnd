# Vue 3 + Vite

使用 Vue 3 與 Vite 的基本專案，需要 Node.js 22.15+。

## 安裝與啟動

```sh
npm ci
npm run dev
```

開啟 http://127.0.0.1:5178/，從 `src/App.vue` 開始編輯。

## 正式打包與預覽

```sh
npm run build
npm run preview
```

產物輸出至 `dist/`，本機預覽網址為 http://127.0.0.1:4178/。

## Git hooks

使用 [Husky](https://typicode.github.io/husky/get-started.html) 管理 Git hooks。執行 `npm ci` 或 `npm install` 時，`prepare` script 會自動安裝 hooks。

每次 `git commit` 前會透過 lint-staged，只處理 staged files：

- JavaScript 與 Vue：先執行 ESLint，通過後由 Prettier 自動格式化。
- JSON、CSS、HTML、Markdown、YAML 等：由 Prettier 自動格式化。
- lint-staged 會將格式化結果納入本次提交；ESLint 錯誤或 warning 會中止提交。

`commit-msg` 階段會使用 commitlint 檢查 commit 訊息，不符合下方規範時會中止提交。

每次 `git push` 前會執行 `npm run typecheck`，型別檢查失敗時會中止 push。檢查涵蓋目前工作目錄中 `src/` 下的 JavaScript、TypeScript 與 Vue components（含 template），而非僅檢查 staged files。

型別檢查使用 [vue-tsc](https://vuejs.org/guide/typescript/overview.html)，在 `tsconfig.json` 啟用 `allowJs`、`checkJs` 與 strict 檢查，因此現有 JavaScript 不必改寫為 TypeScript；需要補充型別時可使用 JSDoc。不產生編譯檔案，也不檢查根目錄的工具設定檔。

TypeScript 固定使用 5.9.3；目前搭配的 vue-tsc 3.3.11 在 TypeScript 7.0.2 下會發生啟動錯誤，升級時需一併驗證相容性。

Prettier 專責縮排、引號、分號與換行，沿用專案的單引號、不加分號風格。ESLint 使用 JavaScript recommended 與 Vue essential 規則，檢查未定義變數、未使用變數、Vue 用法，以及嚴格相等、`const` / `let` 等規範。`eslint-config-prettier` 關閉與格式相關的衝突規則。

```sh
npm run lint          # 檢查整個專案的程式規範
npm run typecheck     # 檢查 src/ 的型別與 Vue template
npm run format        # 自動格式化
npm run format:check  # 只檢查格式，不修改檔案
```

`dist/`、`coverage/`、dependencies 與自動產生的檔案不納入格式檢查。完整 build 不在 pre-commit 執行；可手動執行 `npm run build`。目前尚未配置 test 或 CI，之後 CI 應執行 `npm run lint`、`npm run format:check`、`npm run typecheck` 與 `npm run build`。

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

- `src/main.js`：Vue 應用程式入口。
- `src/App.vue`：根 component。
- `src/style.css`：全域樣式。
- `vite.config.js`：Vite 設定。
