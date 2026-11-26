# 大芯分會會員資料庫（前後台）

- 前台：`/` 免登入搜尋公開資源欄位（不含電話／信箱）；`/register` 送出待審申請
- 主辦：`/host`（名單、匯入、媒合、待審）
  - Public App：在 Secrets 設定 `HOST_PIN`（至少 10 字），於 `/host` 輸入密碼登入（有次數限制）
  - Private／Team：可用 Cursor 身分；Team 需 **admin**，或信箱在 `HOST_EMAILS`（逗號分隔）
- 範本：`/samples/members-template.csv`（假資料）
- 現場組別／回饋：仍用結果碼，訪客不必登入

本地開發使用 PGlite。發布到 Cursor Apps 時會建立 Postgres，並在 build 跑 migrations。

```bash
npm install
npm run dev
```
