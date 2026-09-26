# 團隊共用 AI skills

此目錄納入 Git，存放團隊可共用、可 review 的工作流程。目前先建立存放位置，尚未加入具體 skill。

每個 skill 使用獨立的 kebab-case 目錄：

```text
.agents/skills/
  <skill-name>/
    SKILL.md
    references/  # 選用：參考文件
    scripts/     # 選用：輔助程式
    assets/      # 選用：範本或資源
```

`SKILL.md` 開頭需有 YAML frontmatter：`name` 與 `description`。`description` 說明適用情境；正文列出工作步驟、驗證方式與預期產出。共用的專案規範放在根目錄 `AGENTS.md`，不必在每個 skill 重複。

- 一個 skill 專注於一個具體工作流程，名稱應能辨識用途。
- 將必要資源一起納入 Git，使用相對路徑，避免連結到作者的個人目錄。
- 新增或修改 skills 時，透過 pull request 與團隊 review，並用代表性任務驗證內容。
- 個人 skills 使用工具的使用者層級目錄；本機草稿可放在 `.agents/local/`，此目錄已被忽略，也不是共用 skills 的載入位置。

Codex 支援從 repository 的 `.agents/skills/` 載入 skills，見 [官方文件](https://learn.chatgpt.com/docs/build-skills)。其他 AI 工具請依各自的載入機制設定 adapter，保持此目錄為共用來源，避免維護多份內容。
