# 大芯分會會員資料庫（前後台）

- 前台：`/` 免登入搜尋公開資源欄位（不含電話／信箱）
- 後台：`/admin`、`/admin/import` 僅主辦可進
  - Team App：需 team **admin**
  - 其他：信箱需在密鑰 `HOST_EMAILS`（逗號分隔）內
- 範本：`/samples/members-template.csv`（假資料）
- 現場組別／回饋：仍用結果碼，訪客不必登入

本地開發使用 PGlite。發布到 Cursor Apps 時會建立 Postgres，並在 build 跑 migrations。

```bash
npm install
npm run dev
```
