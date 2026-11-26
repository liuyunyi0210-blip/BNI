# 大芯分會會員資料庫（前後台）

- 前台：`/` 搜尋與瀏覽會員
- 後台：`/admin` 新增／編輯／停用、匯出 CSV
- 匯入：`/admin/import` 上傳 CSV
- 範本：`/samples/members-template.csv`
- 大芯現有名單：`/samples/members-daxin.csv`

本地開發使用 PGlite（記憶體／檔案皆無正式庫）。發布到 Cursor Apps 時會建立 Postgres，並在 build 跑 migrations。

```bash
npm install
npm run dev
```
