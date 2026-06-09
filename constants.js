// 상품 상태 상수
export const PRODUCT_STATUS = {
  SINGLE: '단일상품',
  MULTIPLE: '다중상품'
};

// 카테고리 검증 메시지
export const CATEGORY_VALIDATION = {
  MESSAGES: {
    INVALID_FORMAT: '카테고리 양식이 틀림'
  }
};

// 색상 상수
export const COLORS = {
  PRIMARY: '#1976d2',
  SECONDARY: '#dc3545', 
  CATEGORY: '#c7002bff',
  PURPLE: '#ab008bff'
};

// 카테고리 순서
export const CATEGORY_ORDER = [
  '도서',
  '패션의류',
  '패션잡화',
  '화장품/미용',
  '생활/건강',
  '출산/육아',
  '가구/인테리어',
  '스포츠/레저',
  '디지털/가전',
  '식품',
  '여가/생활편의'
];

// 카테고리 그룹
export const CATEGORY_GROUPS = {
  스포츠패션: ['스포츠/레저', '패션의류', '패션잡화', '디지털/가전'],
  생활건강: [
    '화장품/미용',
    '출산/육아',
    '생활/건강',
    '가구/인테리어',
    '스포츠/레저',
    '디지털/가전',
  ],
  독립: ['도서', '식품', '여가/생활편의'],
};