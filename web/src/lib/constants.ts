export const CHAPTERS = ["大展", "大豪", "大商之道", "大芯"] as const;

export const CHAINS = [
  "企業產業鏈",
  "行銷產業鏈",
  "網路行銷產業鏈",
  "企業內訓產業鏈",
  "外銷產品產業鏈",
  "資產規劃產業鏈",
  "美麗人生產業鏈",
  "文創產業鏈",
  "商品設計產業鏈",
  "快樂生活產業鏈",
  "幸福產業鏈",
  "好運氣產業鏈",
  "婚禮產業鏈",
  "兒童教育產業鏈",
  "銀髮族產業鏈",
  "健康產業鏈",
  "健康食品產業鏈",
  "醫療用品產業鏈",
  "生鮮食品產業鏈",
  "汽車產業鏈",
  "工程產業鏈",
  "營建工程產業鏈",
  "公共工程產業鏈",
  "居家服務產業鏈",
  "餐飲美食產業鏈",
  "節慶送禮產業鏈",
  "環保清潔產業鏈",
  "室內裝修產業鏈",
  "不動產產業鏈",
  "開店創業產業鏈",
  "展覽活動產業鏈",
] as const;

export const ROLE_OPTIONS = [
  "主席",
  "副主席",
  "秘書財務",
  "教育協調",
  "導師協調",
  "執事",
  "活動協調",
  "資訊協調",
  "接待協調",
  "成長協調",
  "大使",
  "董事顧問",
] as const;

/** @deprecated 使用 ROLE_OPTIONS */
export const ROLE_SUGGESTIONS = ROLE_OPTIONS;

export const MEMBER_CSV_HEADERS = [
  "name",
  "chapter",
  "role",
  "company",
  "industry",
  "chain",
  "have",
  "want",
  "phone",
  "email",
  "notes",
] as const;

export type MemberCsvHeader = (typeof MEMBER_CSV_HEADERS)[number];
