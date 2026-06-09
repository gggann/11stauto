// 성별/연령대 검증용 키워드 그룹
export const GENDER_KEYWORDS = {
  // 성인 그룹
  ADULT_MALE: ['남성', '남자'],
  ADULT_FEMALE: ['여성', '여자', '우먼', '우먼스'],
  ADULT_UNISEX: ['남녀', '남여'],
  // 아동 그룹
  CHILD: ['키즈', '여아', '주니어', '남아', '아동', '어린이', '유아']
};

/**
 * 상품명과 카테고리 간의 성별/연령대 일치 검증
 * @param {string} productName - 상품명
 * @param {string} category - 비교할 카테고리
 * @returns {{ isValid: boolean, message: string }}
 */
export function validateGenderMatch(productName, category) {
  const trimmedProductName = (productName || "").trim();
  const trimmedCategory = (category || "").trim();

  if (!trimmedProductName || !trimmedCategory) {
    return { isValid: true, message: "" };
  }

  // 상품명에서 성별/연령대 키워드 찾기
  const hasMale = GENDER_KEYWORDS.ADULT_MALE.some(kw => trimmedProductName.includes(kw));
  const hasFemale = GENDER_KEYWORDS.ADULT_FEMALE.some(kw => trimmedProductName.includes(kw));
  const hasUnisex = GENDER_KEYWORDS.ADULT_UNISEX.some(kw => trimmedProductName.includes(kw));
  const hasChild = GENDER_KEYWORDS.CHILD.some(kw => trimmedProductName.includes(kw));

  // 카테고리에서 성별/연령대 키워드 찾기
  const categoryHasMale = GENDER_KEYWORDS.ADULT_MALE.some(kw => trimmedCategory.includes(kw));
  const categoryHasFemale = GENDER_KEYWORDS.ADULT_FEMALE.some(kw => trimmedCategory.includes(kw));
  const categoryHasChild = GENDER_KEYWORDS.CHILD.some(kw => trimmedCategory.includes(kw));

  // 남녀공용 상품(남성+여성 동시 포함 또는 남녀/남여 키워드)
  const isUnisexProduct = (hasMale && hasFemale) || hasUnisex;

  // 남녀공용 + 아동 키워드가 함께 있는 경우 (예: "남여공용 주니어")
  if (isUnisexProduct && hasChild) {
    // 성인/아동 모두 허용 (가족룩, 커플룩 등)
    return { isValid: true, message: "" };
  }

  // 남녀공용 상품 (아동 키워드 없음)
  if (isUnisexProduct) {
    // 카테고리가 아동인 경우만 에러
    if (categoryHasChild) {
      return { isValid: false, message: "성별 불일치: 성인 상품 → 아동 카테고리" };
    }
    return { isValid: true, message: "" };
  }

  // ① 성별이 정반대인 경우 (성인 간 충돌)
  if (hasMale && !hasFemale && categoryHasFemale && !categoryHasMale) {
    return { isValid: false, message: "성별 불일치: 남성 상품 → 여성 카테고리" };
  }
  if (hasFemale && !hasMale && categoryHasMale && !categoryHasFemale) {
    return { isValid: false, message: "성별 불일치: 여성 상품 → 남성 카테고리" };
  }

  // ② 성인 상품명인데 아동 카테고리인 경우 (연령 충돌)
  if ((hasMale || hasFemale) && !hasChild && categoryHasChild) {
    return { isValid: false, message: "성별 불일치: 성인 상품 → 아동 카테고리" };
  }

  // ③ 아동 상품명인데 성인 카테고리인 경우 (연령 충돌)
  if (hasChild && !hasMale && !hasFemale && (categoryHasMale || categoryHasFemale) && !categoryHasChild) {
    return { isValid: false, message: "성별 불일치: 아동 상품 → 성인 카테고리" };
  }

  return { isValid: true, message: "" };
}

/**
 * 상품명과 카테고리 간의 성별/연령대 일치 검증 (수정카테고리 우선, 없으면 검색카테고리)
 * @param {string} productName - 상품명
 * @param {string} correctedCategory - 수정카테고리
 * @param {string} searchCategory - 검색카테고리
 * @returns {{ isValid: boolean, message: string, categoryType: string }}
 */
export function checkGenderMismatch(productName, correctedCategory, searchCategory) {
  const trimmedCorrected = (correctedCategory || "").trim();
  const trimmedSearch = (searchCategory || "").trim();

  // 수정카테고리가 있으면 수정카테고리로 비교
  if (trimmedCorrected) {
    const result = validateGenderMatch(productName, trimmedCorrected);
    return { ...result, categoryType: "corrected" };
  }

  // 수정카테고리가 없으면 검색카테고리로 비교
  if (trimmedSearch && trimmedSearch !== "정보 없음" && trimmedSearch !== "오류 발생") {
    const result = validateGenderMatch(productName, trimmedSearch);
    if (!result.isValid) {
      // 검색카테고리 불일치 시 메시지에 "(검색카테고리)" 표시
      return {
        isValid: false,
        message: result.message + " (검색카테고리)",
        categoryType: "search"
      };
    }
    return { ...result, categoryType: "search" };
  }

  return { isValid: true, message: "", categoryType: "none" };
}
