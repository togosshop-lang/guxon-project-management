【修正版 2026-08-13】
- 修正舊資料「已完成」狀態相容問題。
- 不再將「已完成」改名為「完成」。
- package.json 固定使用 Webpack。
- 覆蓋時請保留原本 .env.local。

GUXON 新品專案管理系統｜正式 V1
================================

一、這版已整合
- Dashboard：全部專案、進行中、逾期、卡關
- 專案搜尋、狀態篩選
- 依員工篩選需關注任務
- 新增／編輯／刪除專案
- 新增專案自動產生 6 階段、41 項完整標準工作、通關檢核
- 依「上市日 D0」自動計算每項工作的 D-30 ～ D+30 實際日期
- 專案負責人、版本、價格、預算版本、本輪性質、成功定義
- 任務新增／編輯／刪除
- 任務負責人、狀態、截止日期、備註／連結
- 未開始／進行中／待審／完成／卡關
- 階段通關檢核與階段核准備註
- 自動判斷「已通關 / 進行中 / 卡關」
- 前一階段未通關卻開始下一階段時自動警示
- 整體進度、階段進度
- 員工管理
- Supabase Realtime 多人同步
- 列印／存 PDF
- 手機／桌機響應式版面
- 選用 Supabase Auth 員工登入模式

二、安裝（既有專案升級）
1. 備份你現在的 guxon-project-management 資料夾。
2. 將本包內容覆蓋到原本 guxon-project-management。
3. 保留你原本的 .env.local，不要刪掉。
4. Supabase → SQL Editor → 執行「01_SUPABASE_必要設定.sql」一次。
5. PowerShell 在專案資料夾執行：
   npm run dev
6. 開啟：http://localhost:3000

注意：package.json 已把 dev 固定成 Webpack，所以之後只要 npm run dev，不用再加 --webpack。

三、.env.local
如果你原本檔案還在，只要保留即可。
若要補完整：
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase Project URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=你的 Publishable key
NEXT_PUBLIC_REQUIRE_AUTH=false

四、正式讓員工登入（等本機功能確認正常後）
1. employees 表每位員工填入公司 Email。
2. 執行「02_正式上線_登入與安全模式_選用.sql」。
3. .env.local 改 NEXT_PUBLIC_REQUIRE_AUTH=true
4. 重啟 npm run dev。
5. 員工第一次使用可在登入頁「建立帳號」。只有 Email 存在 employees 且 active=true 才能讀寫資料。

五、既有 HALO 專案
既有資料不會被刪除。舊專案可以繼續使用原本任務；新建立的專案會套用完整版 41 項標準流程與 Gate。
