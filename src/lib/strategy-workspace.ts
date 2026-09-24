export const STRATEGY_WORKSPACE_TEMPLATE = [
  {
    key: 'market',
    name: '市場與競品',
    description: '確認市場現況、主要競品、價格帶與真正值得切入的機會。',
    items: ['市場趨勢與機會', '主要競品與價格帶', '競品核心賣點', '市場差異化機會'],
  },
  {
    key: 'positioning',
    name: '商品定位與受眾',
    description: '決定產品主要賣給誰，以及希望消費者如何理解這個產品。',
    items: ['核心產品定位', '主要目標客群', '次要探索客群', '消費者需求與痛點'],
  },
  {
    key: 'selling-points',
    name: '賣點與使用情境',
    description: '把規格轉成購買理由，並確認最值得溝通的真實使用情境。',
    items: ['核心賣點', '差異化理由', '主要使用情境', '延伸／創意用途', '待佐證規格與宣稱'],
  },
  {
    key: 'commercial',
    name: '商業策略',
    description: '確認售價、毛利、首批數量與主要銷售方式。',
    items: ['正式售價與活動價', '毛利與成本條件', '首批數量／庫存策略', '主要銷售通路'],
  },
  {
    key: 'launch-marketing',
    name: '上市與行銷策略',
    description: '決定上市時對誰說什麼、在哪裡說，以及第一波如何驗證。',
    items: ['核心溝通主軸', '內容與素材方向', 'KOL／團購策略', '廣告與首波測試', '上市節奏與活動'],
  },
  {
    key: 'launch-decision',
    name: '上市前決策',
    description: '彙整仍未確認的關鍵事項，確認是否具備正式上市條件。',
    items: ['上市日期確認', '產品與規格最終確認', '價格／通路最終確認', '素材與商品頁確認', '庫存與出貨確認', '上市 KPI 與追蹤方式'],
  },
] as const

export const STRATEGY_SOURCE_STATUS = ['缺少資料', 'AI建議', '待確認', '已確認'] as const
export const STRATEGY_SECTION_STATUS = ['未開始', '進行中', '待確認', '已確認'] as const
