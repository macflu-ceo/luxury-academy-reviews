export type Entry = {
  id: string;
  title: string;
  /** 상품 사진 왼쪽 위 동그라미에 표시할 브랜드. 비우면 표시하지 않는다. */
  brand: string;
  /** 상품 사진 */
  productImage: string;
  /** 판매 내역 사진 (주문서 캡처 등) */
  image: string;
  body: string;
  /** 공급가 / 정가 / 마진. 셋 다 비우면 해당 후기에는 표시되지 않는다. */
  supply: string;
  retail: string;
  /** 비워두면 공급가와 정가로 자동 계산한다 */
  margin: string;
};

export type Page = {
  /** 내부 식별자 */
  id: string;
  /** 주소에 쓰이는 이름. 예) 2026-08 → /2026-08 */
  slug: string;
  /** 마지막 저장 시각 */
  updatedAt: string;
  /** 글 맨 위 날짜 표기 (예: 2026년 8월) */
  date: string;
  /** 전체 제목 */
  title: string;
  /** 제목 밑 소개 문단 */
  lead: string;
  /** 대표 사진 URL */
  cover: string;
  /** 후기글 목록 (제목 + 사진 + 내용) */
  entries: Entry[];
  /** 글 맨 아래 마무리 문구 */
  closing: { headline: string; body: string; ctaLabel: string };
  /** 상담신청 폼 */
  form: {
    title: string;
    note: string;
    capitalOptions: string[];
    privacyText: string;
    doneText: string;
  };
  /** 휴대폰에서 하단 고정 버튼 노출 여부 */
  fixedCta: boolean;
  /** 맨 아래 표기 */
  footer: string;
};

export type Consult = {
  createdAt: string;
  /** 어느 후기 페이지에서 신청했는지 */
  page: string;
  name: string;
  phone: string;
  capital: string;
  source: string;
};

export const DEFAULT_PAGE: Page = {
  id: "p1",
  slug: "2026-08",
  updatedAt: "",
  date: "2026년 8월",
  title: "명품창업사관학교 후기",
  lead: "이번 달에 새로 시작하신 분들의 이야기를 모았습니다. 홍보용으로 다듬지 않고, 시작한 날부터 지금까지 있었던 일을 그대로 옮겼습니다.",
  cover: "",
  entries: [
    {
      id: "e1",
      title: "퇴근 후 하루 2시간, 4개월 만에 월 매출 1,870만원",
      brand: "셀린느",
      productImage: "",
      image: "",
      supply: "2450000",
      retail: "3900000",
      margin: "",
      body: "9년차 사무직이었습니다. 재고 부담이 무서워서 3개월을 고민하다 들어왔는데, 지금 돌아보면 그 3개월이 제일 아깝습니다.\n\n첫 달은 딱 3건 팔았습니다. 지인 두 명, 인스타 DM 한 명. 그런데 그 세 분이 전부 재구매를 하셨어요. 물건과 가격이 정직하면 고객이 먼저 다음을 물어본다는 걸 그때 배웠습니다.\n\n7월 정산 기준 매출 1,870만원입니다. 아직 본업은 그만두지 않았고, 하루에 쓰는 시간은 여전히 2시간 남짓입니다. 대신 그 2시간을 매일 지켰습니다.",
    },
    {
      id: "e2",
      title: "카페를 접고 다시 창업했습니다, 이번엔 재고가 없습니다",
      brand: "프라다",
      productImage: "",
      image: "",
      supply: "1780000",
      retail: "2690000",
      margin: "",
      body: "5년간 카페를 했습니다. 마지막 달 정산서를 보는데 매출은 나쁘지 않은데 남는 게 없더군요. 절반이 임대료와 인건비로 나갔고, 남은 재료는 버렸습니다.\n\n다시 장사를 한다면 재고와 고정비가 없는 걸 하겠다고 그때 정했습니다. 여기엔 그 세 가지가 없었습니다.\n\n거창한 준비는 없었어요. 카페 단골 명단을 정리하고 그분들이 어떤 브랜드를 좋아하는지 메모했습니다. 첫 주에 연락드린 분들 중 11명이 상담으로 이어졌고 4명이 구매했습니다.",
    },
    {
      id: "e3",
      title: "아이 둘 키우면서, 하루 한 시간으로 만든 두 번째 수입",
      brand: "",
      productImage: "",
      image: "",
      supply: "",
      retail: "",
      margin: "",
      body: "경력이 끊긴 지 6년이었습니다. 다시 일할 수 있을까 싶었는데, 제가 부족한 건 능력이 아니라 팔 수 있는 물건과 통로였더군요.\n\n밤 10시부터 11시. 제가 확보할 수 있는 유일한 시간이었습니다. 그 시간에 상품을 익히고, 사진을 올리고, 문의에 답했습니다.\n\n첫 달 정산금은 42만원이었습니다. 큰돈은 아니지만 6년 만에 제 이름으로 들어온 돈이었어요. 지금은 월 200~300만원 사이를 오갑니다. 육아 시간은 그대로 지키면서요.",
    },
  ],
  closing: {
    headline: "고민하는 시간에도 누군가는 첫 건을 팝니다",
    body: "위 세 분 모두 상담 한 번으로 시작하셨습니다. 결정하지 않으셔도 됩니다. 궁금한 것만 물어보셔도 괜찮습니다.",
    ctaLabel: "상담 신청하기",
  },
  form: {
    title: "상담 신청",
    note: "남겨주시면 담당자가 순서대로 연락드립니다. 영업일 기준 1일 이내입니다.",
    capitalOptions: [
      "1천만원 이하",
      "1천만원~3천만원",
      "3천만원~5천만원",
      "5천만원~1억",
      "1억 이상",
    ],
    privacyText: "상담 연락을 위한 개인정보 수집·이용에 동의합니다.",
    doneText: "신청이 접수됐습니다. 순서대로 연락드리겠습니다.",
  },
  fixedCta: true,
  footer: "명품창업사관학교",
};

/** 새 후기 페이지 한 장을 만든다. */
export function blankPage(): Page {
  const id = `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return {
    ...DEFAULT_PAGE,
    id,
    slug: `r-${Math.random().toString(36).slice(2, 8)}`,
    updatedAt: "",
    title: "",
    lead: "",
    cover: "",
    entries: [
      {
        id: `e${Math.random().toString(36).slice(2, 8)}`,
        title: "",
        brand: "",
        productImage: "",
        image: "",
        body: "",
        supply: "",
        retail: "",
        margin: "",
      },
    ],
  };
}

/** 주소에 쓸 수 있는 형태로 다듬는다. */
export function cleanSlug(raw: string): string {
  return (raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

/**
 * 저장소가 안 붙었을 때 배포 환경에서 대신 보여줄 페이지.
 * 지어낸 후기 대신 상담신청 폼만 남긴다.
 */
export const FALLBACK_PAGE: Page = {
  ...DEFAULT_PAGE,
  id: "fallback",
  slug: "",
  date: "",
  title: "명품창업사관학교 상담 신청",
  lead: "후기를 준비하는 중입니다. 궁금하신 점은 아래로 남겨주시면 담당자가 연락드립니다.",
  cover: "",
  entries: [],
  closing: { headline: "", body: "", ctaLabel: "" },
  fixedCta: false,
};
