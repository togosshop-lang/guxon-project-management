export type TemplateTask = { title: string; description: string; ownerDepartment: string; dueOffset: number }
export type TemplateStage = { name: string; range: string; description: string; tasks: TemplateTask[]; gates: string[] }

export const STANDARD_TEMPLATE: TemplateStage[] = [
  {
    name: '策略起始與執行前提', range: 'D-30 → D-21', description: '先確認這一輪要達成什麼，而不是急著把新品推出去。',
    tasks: [
      { title: '填寫專案啟動表', description: '本輪主要目標、成功定義、專案版本', ownerDepartment: '負責人', dueOffset: -30 },
      { title: '盤點已知資料與尚缺資料', description: '後台數據、問卷、競品觀察／成本、退貨率、平台費、庫存', ownerDepartment: '行銷', dueOffset: -29 },
      { title: '確認定價基準', description: '正式價與團購價，以及兩者不衝突的說法', ownerDepartment: '負責人', dueOffset: -28 },
      { title: '指定各模組負責人與確認窗口', description: '素材、商品頁、客服、KOL、廣告各自對應到人', ownerDepartment: '負責人', dueOffset: -27 },
      { title: '決定本輪是測試還是完整上市', description: '這決定後面所有預算與線數', ownerDepartment: '負責人', dueOffset: -26 },
    ],
    gates: ['已確認本輪目標，不只是「把新品推出去」','已確認定價基準（正式價／團購價）','已列出目前已知資料與尚缺資料','已指定各模組負責人與確認窗口','已確認用本表進行中途檢核與結案回顧'],
  },
  {
    name: '市場判斷與現場觀察', range: 'D-28 → D-18', description: '在做素材前，先確認市場現場是否支持這個定位。',
    tasks: [
      { title: '競品售價與促銷帶調查', description: '實體通路＋電商，記錄價格區間與組合包玩法', ownerDepartment: '行銷', dueOffset: -28 },
      { title: '外觀、包裝與陳列觀察', description: '哪些顏色、包裝、展示方式最容易讓人停下來', ownerDepartment: '設計', dueOffset: -26 },
      { title: '消費者輪廓觀察', description: '停下來的人是誰：自用、送禮、3C 使用者', ownerDepartment: '行銷', dueOffset: -24 },
      { title: '常見詢問彙整', description: '從客服紀錄與現場收集：功能、規格、價格、保固、退換貨', ownerDepartment: '客服', dueOffset: -22 },
      { title: '定位確認或修正', description: '是否仍維持原定位？若不完全支持，差異在哪', ownerDepartment: '負責人', dueOffset: -20 },
    ],
    gates: ['已確認不走低價競爭路線','能清楚說出與低價競品的差異','知道消費者最常被哪個外觀、顏色、價格或功能吸引','已整理出本輪必須處理的主要疑慮','已決定哪些現場觀察要回補到素材或商品頁'],
  },
  {
    name: '受眾與企劃線設定', range: 'D-21 → D-14', description: '受眾沒先決定，後面素材與廣告會各說各話。',
    tasks: [
      { title: '決定本輪主力受眾', description: '只能有一個主力，其餘為次要', ownerDepartment: '行銷', dueOffset: -21 },
      { title: '設定企劃線（主線／第二線／第三線）', description: '每條線寫清楚：接觸誰、解決什麼、用什麼驗證', ownerDepartment: '行銷', dueOffset: -20 },
      { title: '設定舊客／會員線', description: '是否啟用會員喚醒、點數折抵、交叉推薦', ownerDepartment: '電商營運', dueOffset: -19 },
      { title: '每條線列出需要準備的素材', description: '圖卡／短影音／商品頁／KOL 分別對應', ownerDepartment: '設計', dueOffset: -18 },
      { title: '標註已知資料與待驗證假設', description: '避免把假設當成已知在執行', ownerDepartment: '行銷', dueOffset: -17 },
    ],
    gates: ['已決定本輪主力受眾','每條企劃線都能說清楚「接觸誰、解決什麼、用什麼驗證」','企劃線數量與預算、人力、素材產能相符','已標註哪些受眾為已知資料、哪些只是待驗證假設','同意先用數據決定下一輪放大，而不是一開始全面展開'],
  },
  {
    name: '定價、CAC 與預算', range: 'D-18 → D-10', description: '預算不只決定投多少，也決定能同時做幾條線。',
    tasks: [
      { title: '補齊成本結構', description: '進貨成本、平台費、物流、退貨率、保固成本', ownerDepartment: '負責人', dueOffset: -18 },
      { title: '校正各銷售形式的 CAC 門檻與警戒區', description: '團購單入、正式單入、組合包、會員折抵後實收', ownerDepartment: '行銷', dueOffset: -16 },
      { title: '選定預算版本', description: '保守測試／標準上市／加速放大', ownerDepartment: '負責人', dueOffset: -15 },
      { title: '分配各平台預算', description: 'Meta、Google、站內廣告、創作者內容放大', ownerDepartment: '行銷', dueOffset: -14 },
      { title: '設定放大條件與暫停條件', description: 'CAC、ROAS、CVR、庫存、客服負荷、退款率', ownerDepartment: '負責人', dueOffset: -12 },
    ],
    gates: ['正式價、團購價、會員折抵與組合包互不衝突','預算級距符合素材完成度與通路承接能力','已設定 CAC、ROAS、庫存與客服負荷的放大條件','已設定暫停條件，避免預算失控','已確認本輪是「測試」還是「放大」'],
  },
  {
    name: '素材製作、KOL 與驗收', range: 'D-21 → D-3', description: '素材不依畫面美感分類，而依漏斗任務分類。',
    tasks: [
      { title: '撰寫素材 Brief', description: '每組重要素材一份：對應受眾、對應漏斗、核心訊息、禁止說法', ownerDepartment: '行銷', dueOffset: -21 },
      { title: '功能證明素材', description: '最高優先。用實測降低功能與價格疑慮', ownerDepartment: '設計', dueOffset: -18 },
      { title: '生活場景素材', description: '最高優先。讓消費者快速代入三大使用情境', ownerDepartment: '設計', dueOffset: -16 },
      { title: '配色／搭配素材', description: '強化外觀與風格搭配需求', ownerDepartment: '設計', dueOffset: -14 },
      { title: '送禮素材', description: '擴大非自用購買理由：外盒、雙入組、收禮無壓力', ownerDepartment: '設計', dueOffset: -12 },
      { title: '商品頁素材', description: '最高優先。首屏功能圖、規格圖、FAQ、保固說明', ownerDepartment: '設計', dueOffset: -10 },
      { title: 'KOL 合作目的定義與名單評估', description: '先定義任務再列名單。看受眾適配與內容能力，不看粉絲數', ownerDepartment: '行銷', dueOffset: -20 },
      { title: 'KOL 寄樣與腳本確認', description: '必拍功能、必講重點、禁止說法、CTA', ownerDepartment: '行銷', dueOffset: -14 },
      { title: 'KOL 上刊前審核', description: '圖文、短影音、導購連結、優惠資訊', ownerDepartment: '行銷', dueOffset: -5 },
      { title: '素材驗收', description: '不是看好不好看，是看有沒有對應原策略', ownerDepartment: '負責人', dueOffset: -3 },
    ],
    gates: ['素材對準指定受眾，而不是所有人都講同一套','清楚傳達指定功能或情境','足以支撐本輪的價格定位','符合投放平台與商品頁尺寸','有可追蹤的檔案連結與版本','素材不足處已指定補拍、改圖或重寫責任人'],
  },
  {
    name: '上線、承接、回收與結案', range: 'D-7 → D+30', description: '承接不足，廣告只會把問題放大；結案不是結束，是下一輪的起點。',
    tasks: [
      { title: '商品頁上架與分段檢查', description: '首屏賣點與價格、中段功能證明、下段規格與 FAQ', ownerDepartment: '電商營運', dueOffset: -7 },
      { title: '客服話術與 FAQ 統一', description: '常見問題統一回覆，避免說法不一致', ownerDepartment: '客服', dueOffset: -6 },
      { title: '私域／EDM／會員再行銷準備', description: '新品介紹、點數折抵、購物金提醒、已購客交叉推薦', ownerDepartment: '電商營運', dueOffset: -5 },
      { title: '跨通路一致性檢查', description: '官網、蝦皮、MOMO、團購頁的價格與說法是否一致', ownerDepartment: '電商營運', dueOffset: -4 },
      { title: '庫存與出貨承接確認', description: '預期流量下的庫存、揀貨與到貨速度', ownerDepartment: '倉管', dueOffset: -3 },
      { title: '廣告投放上線', description: '每組廣告填一份說明：任務、素材、受眾、預算、調整條件', ownerDepartment: '行銷', dueOffset: 0 },
      { title: 'KOL 上刊與品牌端承接', description: '轉發、留言互動、廣告放大、商品頁引用', ownerDepartment: '行銷', dueOffset: 1 },
      { title: '每週固定回收數據與客服問題', description: '廣告、電商、創作者導購、客服留言、會員再行銷', ownerDepartment: '行銷', dueOffset: 7 },
      { title: '第二波素材與再行銷調整', description: '依第一波數據修正素材與受眾，而非直接加預算', ownerDepartment: '行銷', dueOffset: 14 },
      { title: '結案回顧表', description: '原先假設 vs 實際結果、成立與不成立的判斷、需回補內容', ownerDepartment: '負責人', dueOffset: 30 },
      { title: '執行摘要與交接紀錄', description: '勝出方向、主要問題、可沿用做法、下輪提醒', ownerDepartment: '行銷', dueOffset: 30 },
    ],
    gates: ['商品頁首屏能快速說明本產品為何值得','已有完整功能證明與規格說明','FAQ 足以減少客服重複回答','各通路價格與說法一致','每組廣告都說得出在測什麼、何時加碼、何時停止','已規劃投放後要回收哪些數據','結案回顧與交接摘要已完成，可作為下一輪啟動依據'],
  },
]
