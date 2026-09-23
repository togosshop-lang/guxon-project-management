# Codex 公司知識安裝與更新指南

## 一、建議放置方式

把這三個檔案放到你的公司系統 Git repository 根目錄：

```text
your-project/
├── AGENTS.md
├── COMPANY_KNOWLEDGE.md
├── UPDATE_GUIDE.md
├── package.json
└── ...
```

然後在這個目錄啟動 Codex：

```bash
cd /你的專案路徑
codex
```

Codex 啟動時會自動載入 `AGENTS.md`。`AGENTS.md` 會要求它在涉及公司業務時先讀 `COMPANY_KNOWLEDGE.md`。

## 二、第一次驗證

啟動 Codex 後輸入：

```text
請告訴我你讀到了哪些 AGENTS.md，並根據 COMPANY_KNOWLEDGE.md 摘要：公司、品牌、核心產品、客服安全規則、內部系統現況。不要修改任何檔案。
```

確認它能正確說出古敬有限公司、GUXON、iWALK、HALO、GFC10000，以及高溫／燒焦時不可再次測試的規則。

## 三、不要把完整知識放在全域 AGENTS.md

`~/.codex/AGENTS.md` 適合放你個人的固定偏好，例如：

```markdown
# Kent 的全域工作偏好

- 使用台灣繁體中文。
- 先說結論，再說原因與做法。
- 不要只給抽象建議；提供可直接執行的下一步。
- 修改程式後要測試並回報結果。
- 不確定公司資料時，先讀專案內的 COMPANY_KNOWLEDGE.md。
```

公司機密與詳細產品知識應放在公司專案內，不要放進每個專案都會載入的全域檔。

## 四、日後如何更新

有新資訊時，直接對 Codex 說：

```text
請更新 COMPANY_KNOWLEDGE.md：HALO 團購價從 690 改為 720，自 2026-10-01 生效。舊價格移到歷史紀錄，不要讓兩個價格都顯示為現行價格。更新變更紀錄，但先不要改程式。
```

或：

```text
以下是新的客服規則。請先檢查是否與 COMPANY_KNOWLEDGE.md 衝突，列出衝突後更新檔案，並在變更紀錄寫入今天日期：……
```

每次更新完，可要求：

```text
檢查 COMPANY_KNOWLEDGE.md 中所有沒有最後確認日期的價格、時程、庫存、員工與活動資料，整理成待確認清單，不要自行猜測。
```

## 五、建議的第二階段架構

當資料持續增加時，可把主知識拆成：

```text
knowledge/
├── company.md
├── products.md
├── pricing.md
├── customer-service.md
├── recall-and-safety.md
├── channels-and-partners.md
└── internal-system.md
```

此時 `COMPANY_KNOWLEDGE.md` 只保留索引與最重要的共同規則，讓 Codex 依任務讀取對應檔案，避免每次載入過多資訊。

## 六、版本與安全建議

- 把知識檔加入私人 Git repository，利用 Git 保留每次變更歷史。
- 若 repository 會公開，不要提交召回、事故、理賠、成本、客戶或員工資料。
- 建議另設私人內部 repo，公開網站程式只保留不敏感的品牌與開發規則。
- API key、Supabase service-role key、物流金鑰、LINE token、個資都不可寫進 Markdown；使用 `.env` 或正式的秘密管理功能。
- 每月檢查一次價格、活動、庫存、員工、合作名單與待確認事項。

