export type ExecutionTemplateTask = {
  title: string
  description: string
  department: string
  reviewerDepartment?: string
  startOffset: number
  dueOffset: number
  priority: '高' | '中' | '低'
  dependencyTitle?: string
}

export type ExecutionTemplateSection = {
  name: string
  description: string
  tasks: ExecutionTemplateTask[]
}

export const EXECUTION_TEMPLATE: ExecutionTemplateSection[] = [
  {
    name: '商品資料與行政',
    description: '把新品正式品名、型號、SKU、條碼、ERP、價格與產品資料先建完整。',
    tasks: [
      { title: '確認正式品名', description: '確認對外正式品名與內部稱呼一致。', department: '負責人', reviewerDepartment: '電商營運', startOffset: -60, dueOffset: -55, priority: '高' },
      { title: '確認型號與版本', description: '確認型號、版本與後續包裝／ERP／認證使用一致。', department: '負責人', startOffset: -60, dueOffset: -55, priority: '高' },
      { title: '建立 SKU／顏色規格', description: '建立所有顏色、容量、規格組合與內部 SKU。', department: '電商營運', startOffset: -55, dueOffset: -50, priority: '高', dependencyTitle: '確認型號與版本' },
      { title: '建立國際條碼', description: '依 SKU 建立 EAN／GTIN 等正式商品條碼。', department: '電商營運', reviewerDepartment: '負責人', startOffset: -52, dueOffset: -47, priority: '高', dependencyTitle: '建立 SKU／顏色規格' },
      { title: '建立 ERP 商品資料', description: '建立品號、品名、規格、單位、成本與必要欄位。', department: '電商營運', reviewerDepartment: '負責人', startOffset: -50, dueOffset: -45, priority: '高', dependencyTitle: '建立 SKU／顏色規格' },
      { title: '確認成本與毛利資料', description: '進貨成本、物流、平台費與主要銷售價格的毛利確認。', department: '負責人', startOffset: -50, dueOffset: -42, priority: '高' },
      { title: '確認各通路價格表', description: '正式售價、團購價、經銷價與活動價框架。', department: '負責人', reviewerDepartment: '電商營運', startOffset: -45, dueOffset: -38, priority: '高', dependencyTitle: '確認成本與毛利資料' },
      { title: '完成產品規格總表', description: '尺寸、重量、材質、功能、輸入輸出、內容物、保固等最終版本。', department: '電商營運', reviewerDepartment: '客服', startOffset: -48, dueOffset: -38, priority: '高', dependencyTitle: '確認型號與版本' },
    ],
  },
  {
    name: '包裝與基礎設計',
    description: '完成正式包裝、說明書、產品標示、警語與印刷前確認。',
    tasks: [
      { title: '確認包裝結構與尺寸', description: '確認盒型、內襯、吊掛／陳列方式與印刷尺寸。', department: '設計', reviewerDepartment: '負責人', startOffset: -55, dueOffset: -48, priority: '高' },
      { title: '包裝視覺設計', description: '正背面與各側面視覺、賣點與品牌資訊。', department: '設計', reviewerDepartment: '負責人', startOffset: -50, dueOffset: -38, priority: '高', dependencyTitle: '確認包裝結構與尺寸' },
      { title: '產品標示／警語整理', description: '型號、額定資訊、注意事項、產地、商檢與法規必要文字。', department: '電商營運', reviewerDepartment: '客服', startOffset: -48, dueOffset: -40, priority: '高', dependencyTitle: '完成產品規格總表' },
      { title: '說明書內容製作', description: '操作方式、功能說明、注意事項、保固與客服資訊。', department: '設計', reviewerDepartment: '客服', startOffset: -45, dueOffset: -35, priority: '中', dependencyTitle: '完成產品規格總表' },
      { title: '包裝與說明書校對', description: '品名、型號、規格、條碼、警語與文案交叉校對。', department: '電商營運', reviewerDepartment: '負責人', startOffset: -38, dueOffset: -32, priority: '高', dependencyTitle: '包裝視覺設計' },
      { title: '包裝打樣／實樣確認', description: '確認印刷顏色、材質、盒型與產品裝入後狀態。', department: '設計', reviewerDepartment: '負責人', startOffset: -34, dueOffset: -28, priority: '高', dependencyTitle: '包裝與說明書校對' },
      { title: '包裝正式生產確認', description: '最終檔案、數量、交期與版本確認後放行生產。', department: '負責人', startOffset: -28, dueOffset: -25, priority: '高', dependencyTitle: '包裝打樣／實樣確認' },
    ],
  },
  {
    name: '商品攝影',
    description: '完成商品白底、各色、細節、功能與情境照片，供銷售頁與行銷共用。',
    tasks: [
      { title: '建立商品拍攝 Brief', description: '列出必拍角度、功能、顏色、情境、比例與禁用畫面。', department: '行銷', reviewerDepartment: '設計', startOffset: -45, dueOffset: -40, priority: '高', dependencyTitle: '完成產品規格總表' },
      { title: '確認拍攝樣品與完整度', description: '正式顏色、LOGO、包裝與外觀版本可供拍攝。', department: '設計', reviewerDepartment: '負責人', startOffset: -42, dueOffset: -38, priority: '高' },
      { title: '白底商品照拍攝', description: '正面、背面、側面、45 度與主要展示角度。', department: '設計', startOffset: -38, dueOffset: -32, priority: '高', dependencyTitle: '建立商品拍攝 Brief' },
      { title: '各色商品照拍攝', description: '所有正式販售顏色建立一致角度素材。', department: '設計', startOffset: -38, dueOffset: -31, priority: '高', dependencyTitle: '建立商品拍攝 Brief' },
      { title: '產品細節／功能照拍攝', description: '接口、按鍵、結構、磁吸、線材或主要功能細節。', department: '設計', startOffset: -36, dueOffset: -30, priority: '高', dependencyTitle: '建立商品拍攝 Brief' },
      { title: '生活情境／模特照拍攝', description: '依主力受眾與使用情境建立 Lifestyle 素材。', department: '設計', reviewerDepartment: '行銷', startOffset: -34, dueOffset: -26, priority: '中', dependencyTitle: '建立商品拍攝 Brief' },
      { title: '照片修圖與最終驗收', description: '色差、比例、LOGO、產品結構與輸出尺寸最終檢查。', department: '設計', reviewerDepartment: '負責人', startOffset: -28, dueOffset: -22, priority: '高', dependencyTitle: '白底商品照拍攝' },
    ],
  },
  {
    name: '影音製作',
    description: '完成新品功能與情境影音，供商品頁、社群與廣告投放使用。',
    tasks: [
      { title: '建立影片製作 Brief', description: '影片目的、受眾、核心訊息、平台尺寸與必拍功能。', department: '行銷', reviewerDepartment: '設計', startOffset: -42, dueOffset: -36, priority: '高' },
      { title: '影片腳本撰寫', description: '開場 Hook、功能證明、情境、CTA 與禁止說法。', department: '行銷', reviewerDepartment: '負責人', startOffset: -36, dueOffset: -31, priority: '高', dependencyTitle: '建立影片製作 Brief' },
      { title: '影片分鏡與拍攝清單', description: '鏡位、畫面、道具、場景與產品動作確認。', department: '設計', reviewerDepartment: '行銷', startOffset: -32, dueOffset: -28, priority: '中', dependencyTitle: '影片腳本撰寫' },
      { title: '功能影片拍攝', description: '主要功能實測與證明型內容。', department: '設計', startOffset: -28, dueOffset: -23, priority: '高', dependencyTitle: '影片分鏡與拍攝清單' },
      { title: '情境短影音拍攝', description: '社群／廣告使用的生活情境與人物內容。', department: '設計', startOffset: -27, dueOffset: -22, priority: '中', dependencyTitle: '影片分鏡與拍攝清單' },
      { title: '影片剪輯／字幕／音樂', description: '依平台輸出主版與必要尺寸版本。', department: '設計', startOffset: -23, dueOffset: -16, priority: '高', dependencyTitle: '功能影片拍攝' },
      { title: '影片最終審核與輸出', description: '功能正確、文字正確、價格資訊與 CTA 最終確認。', department: '負責人', reviewerDepartment: '行銷', startOffset: -17, dueOffset: -13, priority: '高', dependencyTitle: '影片剪輯／字幕／音樂' },
    ],
  },
  {
    name: '銷售頁製作',
    description: '把產品資訊、策略與素材整理成可以承接轉換的完整商品頁。',
    tasks: [
      { title: '確認商品核心賣點', description: '確認首屏要講什麼、主要差異與購買理由。', department: '行銷', reviewerDepartment: '負責人', startOffset: -35, dueOffset: -30, priority: '高' },
      { title: '建立商品頁架構', description: '首屏、問題、功能、情境、規格、FAQ、保固的完整順序。', department: '電商營運', reviewerDepartment: '行銷', startOffset: -31, dueOffset: -27, priority: '高', dependencyTitle: '確認商品核心賣點' },
      { title: '完成商品頁文案', description: '標題、賣點、功能說明、規格與 CTA 文案。', department: '行銷', reviewerDepartment: '客服', startOffset: -29, dueOffset: -23, priority: '高', dependencyTitle: '建立商品頁架構' },
      { title: '商品首圖／主 Banner 設計', description: '商品頁首屏與電商平台首圖。', department: '設計', reviewerDepartment: '行銷', startOffset: -25, dueOffset: -19, priority: '高', dependencyTitle: '照片修圖與最終驗收' },
      { title: '功能介紹圖設計', description: '核心功能、使用方式、差異與證明素材。', department: '設計', reviewerDepartment: '行銷', startOffset: -24, dueOffset: -17, priority: '高', dependencyTitle: '完成商品頁文案' },
      { title: '規格／尺寸／內容物圖設計', description: '完整規格、尺寸比例、盒內內容物與相容性。', department: '設計', reviewerDepartment: '電商營運', startOffset: -23, dueOffset: -16, priority: '高', dependencyTitle: '完成產品規格總表' },
      { title: 'FAQ／保固區塊完成', description: '常見問題、注意事項、售後與保固說明。', department: '客服', reviewerDepartment: '電商營運', startOffset: -20, dueOffset: -14, priority: '中', dependencyTitle: '完成商品頁文案' },
      { title: '完整銷售頁最終校稿', description: '圖片、文案、規格、價格、法規與手機版顯示確認。', department: '電商營運', reviewerDepartment: '負責人', startOffset: -14, dueOffset: -10, priority: '高', dependencyTitle: '功能介紹圖設計' },
    ],
  },
  {
    name: '電商與通路上架',
    description: '完成自營平台與必要通路商品建立、價格、庫存、優惠及購買測試。',
    tasks: [
      { title: '官網商品建立', description: '商品名稱、SEO、分類、規格、售價、庫存與商品頁。', department: '電商營運', reviewerDepartment: '負責人', startOffset: -14, dueOffset: -8, priority: '高', dependencyTitle: '完整銷售頁最終校稿' },
      { title: '蝦皮商品建立', description: '商品資料、規格、主圖、詳情、物流與售價。', department: '電商營運', reviewerDepartment: '負責人', startOffset: -14, dueOffset: -8, priority: '高', dependencyTitle: '完整銷售頁最終校稿' },
      { title: '其他自營通路商品建立', description: '依實際通路建立商品與規格；不使用可標記不適用。', department: '電商營運', startOffset: -13, dueOffset: -7, priority: '中', dependencyTitle: '完整銷售頁最終校稿' },
      { title: 'ERP 品號與平台 SKU 核對', description: 'ERP、官網、蝦皮等 SKU／規格對應一致。', department: '電商營運', reviewerDepartment: '倉管', startOffset: -10, dueOffset: -6, priority: '高', dependencyTitle: '建立 ERP 商品資料' },
      { title: '平台售價／活動價設定', description: '正式價、會員價、活動價與團購價不衝突。', department: '電商營運', reviewerDepartment: '負責人', startOffset: -9, dueOffset: -5, priority: '高', dependencyTitle: '確認各通路價格表' },
      { title: '庫存與物流設定', description: '倉別、可售庫存、配送方式、運費與預購設定。', department: '電商營運', reviewerDepartment: '倉管', startOffset: -8, dueOffset: -4, priority: '高' },
      { title: '優惠券／組合包設定', description: '新品券、組合包、加價購或會員活動設定。', department: '電商營運', reviewerDepartment: '行銷', startOffset: -7, dueOffset: -3, priority: '中', dependencyTitle: '平台售價／活動價設定' },
      { title: '實際下單與付款測試', description: '手機／電腦實際購買一次，確認付款、折扣、物流與通知。', department: '電商營運', reviewerDepartment: '客服', startOffset: -3, dueOffset: -2, priority: '高', dependencyTitle: '官網商品建立' },
    ],
  },
  {
    name: '行銷上市準備',
    description: '完成上市企劃、社群、廣告、KOL、團購與私域推播準備。',
    tasks: [
      { title: '完成新品上市企劃', description: '上市節奏、主題、通路、內容、KPI 與各渠道分工。', department: '行銷', reviewerDepartment: '負責人', startOffset: -30, dueOffset: -23, priority: '高' },
      { title: '確認上市主視覺', description: '主視覺、標題與品牌畫面方向定稿。', department: '設計', reviewerDepartment: '行銷', startOffset: -22, dueOffset: -16, priority: '高', dependencyTitle: '完成新品上市企劃' },
      { title: '社群內容與發布排程', description: 'IG／FB／限動／短影音預熱、上市與延續內容。', department: '行銷', reviewerDepartment: '負責人', startOffset: -18, dueOffset: -10, priority: '高', dependencyTitle: '完成新品上市企劃' },
      { title: '廣告素材準備', description: '依受眾與漏斗準備靜態、影音、文案與尺寸。', department: '行銷', reviewerDepartment: '負責人', startOffset: -18, dueOffset: -9, priority: '高', dependencyTitle: '確認上市主視覺' },
      { title: '廣告活動／受眾設定', description: 'Meta、Google 或其他渠道的活動結構、預算與追蹤。', department: '行銷', reviewerDepartment: '負責人', startOffset: -10, dueOffset: -4, priority: '高', dependencyTitle: '廣告素材準備' },
      { title: 'KOL／創作者名單與合作確認', description: '名單、合作目的、報價、檔期與內容形式。', department: '行銷', reviewerDepartment: '負責人', startOffset: -30, dueOffset: -18, priority: '中', dependencyTitle: '完成新品上市企劃' },
      { title: 'KOL 寄樣／腳本／上刊確認', description: '寄樣、必講資訊、連結、優惠、審稿與上刊日期。', department: '行銷', startOffset: -18, dueOffset: -5, priority: '中', dependencyTitle: 'KOL／創作者名單與合作確認' },
      { title: 'EDM／LINE／會員推播準備', description: '新品訊息、購物金／點數、CTA 與發送時間。', department: '電商營運', reviewerDepartment: '行銷', startOffset: -10, dueOffset: -3, priority: '中', dependencyTitle: '完整銷售頁最終校稿' },
    ],
  },
  {
    name: '客服與倉儲準備',
    description: '確保客服知道怎麼回答、倉庫知道怎麼收貨、放貨、包裝與處理異常。',
    tasks: [
      { title: '客服產品教育', description: '功能、規格、適用情境、限制與主要賣點教育。', department: '客服', reviewerDepartment: '負責人', startOffset: -10, dueOffset: -6, priority: '高', dependencyTitle: '完成產品規格總表' },
      { title: '客服 FAQ 完成', description: '常見問題、購買前疑慮、使用問題與異常處理。', department: '客服', reviewerDepartment: '電商營運', startOffset: -10, dueOffset: -5, priority: '高', dependencyTitle: 'FAQ／保固區塊完成' },
      { title: '售後／保固規範確認', description: '保固期間、退換貨、維修、異常與必要注意事項。', department: '客服', reviewerDepartment: '負責人', startOffset: -10, dueOffset: -5, priority: '高' },
      { title: '首批產品到貨確認', description: '數量、品項、顏色、外箱與到貨時間。', department: '倉管', reviewerDepartment: '電商營運', startOffset: -12, dueOffset: -6, priority: '高' },
      { title: '到貨抽檢／外觀驗貨', description: '抽檢外觀、功能、包裝、條碼與規格是否正確。', department: '倉管', reviewerDepartment: '負責人', startOffset: -7, dueOffset: -4, priority: '高', dependencyTitle: '首批產品到貨確認' },
      { title: 'ERP 入庫與庫存確認', description: '正式入庫、倉別、數量與系統庫存一致。', department: '倉管', reviewerDepartment: '電商營運', startOffset: -5, dueOffset: -3, priority: '高', dependencyTitle: '到貨抽檢／外觀驗貨' },
      { title: '庫位與揀貨方式確認', description: '庫位、SKU 辨識、揀貨與盤點方式清楚。', department: '倉管', startOffset: -5, dueOffset: -2, priority: '中', dependencyTitle: 'ERP 入庫與庫存確認' },
      { title: '新品包裝／出貨方式確認', description: '外箱、緩衝、防刮、贈品與組合包出貨方式。', department: '倉管', reviewerDepartment: '客服', startOffset: -5, dueOffset: -2, priority: '中' },
    ],
  },
  {
    name: '上市前總檢核',
    description: 'D0 前最後總檢：資料、商品頁、價格、庫存、物流、客服與行銷全部確認。',
    tasks: [
      { title: '商品資料／條碼／ERP 最終確認', description: '品名、型號、SKU、條碼與 ERP 對應無誤。', department: '電商營運', reviewerDepartment: '負責人', startOffset: -3, dueOffset: -1, priority: '高', dependencyTitle: 'ERP 品號與平台 SKU 核對' },
      { title: '商品頁與通路上架最終確認', description: '所有預定通路頁面已完成且可正常瀏覽。', department: '電商營運', reviewerDepartment: '負責人', startOffset: -3, dueOffset: -1, priority: '高', dependencyTitle: '實際下單與付款測試' },
      { title: '價格／優惠／付款最終確認', description: '正式價、活動價、券、付款與運費全部正確。', department: '電商營運', reviewerDepartment: '負責人', startOffset: -2, dueOffset: -1, priority: '高', dependencyTitle: '平台售價／活動價設定' },
      { title: '庫存／物流／出貨能力最終確認', description: '可售庫存、系統庫存、倉庫與物流可承接上市量。', department: '倉管', reviewerDepartment: '負責人', startOffset: -2, dueOffset: -1, priority: '高', dependencyTitle: 'ERP 入庫與庫存確認' },
      { title: '客服／售後最終確認', description: 'FAQ、話術、保固與異常處理已可正式對外。', department: '客服', reviewerDepartment: '負責人', startOffset: -2, dueOffset: -1, priority: '高', dependencyTitle: '客服產品教育' },
      { title: '社群／廣告／KOL 上市排程確認', description: '發布、投放、上刊時間、連結與優惠資訊一致。', department: '行銷', reviewerDepartment: '負責人', startOffset: -2, dueOffset: -1, priority: '高', dependencyTitle: '廣告活動／受眾設定' },
      { title: '主管核准上市', description: '所有必要項目完成或明確標記不適用後，正式核准 D0 上市。', department: '負責人', startOffset: -1, dueOffset: -1, priority: '高', dependencyTitle: '商品頁與通路上架最終確認' },
    ],
  },
]

export const EXECUTION_TASK_COUNT = EXECUTION_TEMPLATE.reduce((sum, section) => sum + section.tasks.length, 0)
