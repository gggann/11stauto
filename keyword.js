/**
 * 키워드 관련 유틸리티 함수들
 * tt.js에서 분리된 키워드 처리 로직
 */

import { kwd } from "./kwd.js?v=1.1.1";
import { validCategories } from "./검카체크.js?v=1.1.0";

/**
 * 키워드 처리 클래스
 */
export class KeywordProcessor {

  /**
   * 상품명에서 키워드 추출
   * @param {string} productName - 상품명
   * @returns {string[]} 추출된 키워드 배열
   */
  static extractProductKeywords(productName) {
    if (!productName) return [];
    const cleanedName = KeywordProcessor.removeExcludedContent(productName);
    const koreanKeywords = cleanedName.match(/[가-힣]{2,}/g) || [];
    const englishKeywords = cleanedName.match(/[a-zA-Z]{2,}/g) || [];
    const mixedKeywords = cleanedName.match(/[a-zA-Z0-9]{2,}/g) || [];
    const allKeywords = [...new Set([...koreanKeywords, ...englishKeywords, ...mixedKeywords])];
    return allKeywords.sort((a, b) => b.length - a.length);
  }

  /**
   * 텍스트에서 대괄호/소괄호 내용 제거
   * @param {string} text - 처리할 텍스트
   * @returns {string} 정리된 텍스트
   */
  static removeExcludedContent(text) {
    if (!text) return text;
    let cleanedText = text.replace(/\[[^\]]*\]/g, '');
    cleanedText = cleanedText.replace(/\([^)]*\)/g, '');
    cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
    return cleanedText;
  }

  /**
   * 한글 부분 문자열 추출
   * @param {string} text - 처리할 텍스트
   * @returns {string[]} 한글 부분 문자열 배열
   */
  static extractKoreanSubstrings(text) {
    if (!text) return [];
    const cleanedText = KeywordProcessor.removeExcludedContent(text);
    const koreanParts = cleanedText.match(/[가-힣]+/g) || [];
    const substrings = [];
    koreanParts.forEach(part => {
      for (let i = 0; i < part.length; i++) {
        for (let j = i + 2; j <= part.length; j++) {
          substrings.push(part.substring(i, j));
        }
      }
    });
    return [...new Set(substrings)].sort((a, b) => b.length - a.length);
  }

  /**
   * 공통 단어 찾기
   * @param {string[]} textWords - 텍스트 단어 배열
   * @param {string[]} compareWords - 비교할 단어 배열
   * @returns {string[]} 공통 단어 배열
   */
  static findCommonWords(textWords, compareWords) {
    if (!compareWords?.length) return [];
    const commonWords = [];
    textWords.forEach(textWord => {
      compareWords.forEach(compareWord => {
        if (textWord === compareWord) commonWords.push(textWord);
      });
    });
    return [...new Set(commonWords)].sort((a, b) => b.length - a.length);
  }

  /**
   * 카테고리에 키워드 포함 여부 확인
   * @param {string} category - 카테고리 문자열
   * @param {string} keyword - 검색할 키워드
   * @returns {boolean} 포함 여부
   */
  static categoryContainsKeyword(category, keyword) {
    const categoryLower = category.toLowerCase();
    const keywordLower = keyword.toLowerCase();
    if (categoryLower.includes(keywordLower)) return true;

    const categoryParts = category.split(' > ');
    for (const part of categoryParts) {
      const partLower = part.toLowerCase();
      if (partLower.includes(keywordLower)) return true;
      if (partLower.includes('/')) {
        const subParts = partLower.split('/');
        for (const subPart of subParts) {
          const cleanSubPart = subPart.trim();
          if (cleanSubPart.includes(keywordLower) || cleanSubPart.startsWith(keywordLower)) return true;
        }
      }
      if (partLower.startsWith(keywordLower) && partLower.length > keywordLower.length) return true;
    }
    return false;
  }

  /**
   * 여러 키워드로 카테고리 찾기
   * @param {string[]} keywords - 키워드 배열
   * @returns {string[]} 매칭된 카테고리 배열
   */
  static findCategoriesByMultipleKeywords(keywords) {
    if (!keywords || keywords.length === 0) return [];

    const matchingCategories = validCategories.filter(category => {
      return keywords.every(keyword => KeywordProcessor.categoryContainsKeyword(category, keyword));
    });

    if (matchingCategories.length === 0) return [];

    // 점수 기반 매칭 제거 - 단순 알파벳 순서로 정렬

    const categoryGroups = {};
    matchingCategories.forEach(category => {
      const mainCategory = category.split(' > ')[0];
      if (!categoryGroups[mainCategory]) categoryGroups[mainCategory] = [];
      categoryGroups[mainCategory].push(category);
    });

    Object.keys(categoryGroups).forEach(mainCat => {
      categoryGroups[mainCat].sort(); // 알파벳 순서로 정렬
    });

    const categoryOrder = [
      '도서', '패션의류', '패션잡화', '화장품/미용', '생활/건강',
      '출산/육아', '가구/인테리어', '스포츠/레저', '디지털/가전',
      '식품', '여가/생활편의'
    ];

    const orderedCategories = [];
    categoryOrder.forEach(mainCat => {
      if (categoryGroups[mainCat]?.length) orderedCategories.push(...categoryGroups[mainCat]);
    });
    Object.keys(categoryGroups).forEach(mainCat => {
      if (!categoryOrder.includes(mainCat) && categoryGroups[mainCat]?.length) {
        orderedCategories.push(...categoryGroups[mainCat]);
      }
    });

    return orderedCategories;
  }

  /**
   * 입력된 여러 키워드로 카테고리 찾기
   * @param {string} inputText - 입력 텍스트
   * @returns {string[]} 매칭된 카테고리 배열
   */
  static findCategoriesByMultipleInputKeywords(inputText) {
    if (!inputText) return [];
    const keywords = inputText
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length >= 1); // 1글자도 허용
    if (keywords.length === 0) return [];

    // 쉼표가 없는 경우 (단일 입력): 키워드가 포함된 카테고리 찾기
    if (keywords.length === 1) {
      const inputTrimmed = keywords[0].trim();
      const inputLower = inputTrimmed.toLowerCase();

      const matchingCategories = validCategories.filter(category => {
        const categoryLower = category.toLowerCase();

        // 1. 정확히 일치하는 경우
        if (categoryLower === inputLower) return true;

        // 2. 입력이 카테고리의 정확한 prefix인 경우 (뒤에 " > "가 와야 함)
        if (categoryLower.startsWith(inputLower)) {
          const remainingPart = categoryLower.substring(inputLower.length);
          return remainingPart.startsWith(' > ');
        }

        // 3. 카테고리에 키워드가 포함된 경우 (기존 동작 복원)
        if (categoryLower.includes(inputLower)) return true;

        return false;
      });

      return matchingCategories.sort(); // 알파벳 순으로 정렬
    }

    // 쉼표가 있는 경우 (다중 키워드): 모든 키워드가 포함된 카테고리만 필터링
    const matchingCategories = validCategories.filter(category => {
      const categoryLower = category.toLowerCase();
      return keywords.every(keyword => {
        const kw = keyword.toLowerCase();
        return categoryLower.includes(kw);
      });
    });

    return matchingCategories.sort(); // 알파벳 순으로 정렬
  }

  /**
   * 검색카테고리에서 첫 번째 카테고리 추출
   * @param {string} searchCategory - 검색 카테고리
   * @returns {string} 메인 카테고리
   */
  static extractMainCategory(searchCategory) {
    if (!searchCategory) return "";
    const parts = searchCategory.split(' > ');
    return parts[0] || searchCategory;
  }

  /**
   * 카테고리별 키워드 가져오기
   * @param {string} mainCategory - 메인 카테고리
   * @returns {string[]} 키워드 배열
   */
  static getCategoryKeywords(mainCategory) {
    if (!mainCategory) return [];
    const categoryGroups = {
      '스포츠패션': ['스포츠/레저', '패션의류', '패션잡화', '디지털/가전'],
      '생활건강': ['화장품/미용', '출산/육아', '생활/건강', '가구/인테리어', '스포츠/레저', '디지털/가전'],
      '독립': ['도서', '식품', '여가/생활편의']
    };
    const targetCategories = KeywordProcessor.getTargetCategories(mainCategory, categoryGroups);
    const keywordStrings = kwd
      .filter(item => targetCategories.includes(item.검카))
      .map(item => item.키워드)
      .filter(Boolean);
    return KeywordProcessor.splitAndFilterKeywords(keywordStrings);
  }

  /**
   * 대상 카테고리 그룹 찾기
   * @param {string} mainCategory - 메인 카테고리
   * @param {Object} categoryGroups - 카테고리 그룹
   * @returns {string[]} 대상 카테고리 배열
   */
  static getTargetCategories(mainCategory, categoryGroups) {
    for (const [groupName, categories] of Object.entries(categoryGroups)) {
      if (categories.includes(mainCategory)) {
        return groupName === '독립' ? [mainCategory] : categories;
      }
    }
    return [mainCategory];
  }

  /**
   * 키워드 분할 및 필터링
   * @param {string[]} keywordStrings - 키워드 문자열 배열
   * @returns {string[]} 분할된 키워드 배열
   */
  static splitAndFilterKeywords(keywordStrings) {
    const splitKeywords = [];
    keywordStrings.forEach(keywordString => {
      const keywords = keywordString.split('/').map(k => k.trim()).filter(k => k !== '');
      splitKeywords.push(...keywords);
    });
    return [...new Set(splitKeywords)].filter(keyword => keyword && keyword.length > 1);
  }

  /**
   * 리프(최종) 카테고리명 추출
   * @param {string} searchCategory - 검색 카테고리
   * @returns {string} 리프 카테고리
   */
  static extractLeafCategory(searchCategory) {
    if (!searchCategory) return '';
    const categories = searchCategory.split('>').map(cat => cat.trim());
    return categories[categories.length - 1] || '';
  }

  /**
   * 모든 카테고리에서 리프 키워드 추출
   * @param {string} searchCategory - 검색 카테고리
   * @param {string} correctedCategory - 수정 카테고리
   * @param {string} displayCategory - 표시 카테고리
   * @returns {string[]} 리프 키워드 배열
   */
  static getLeafKeywordsForAllCategories(searchCategory, correctedCategory, displayCategory) {
    const leafKeywords = [];

    const pushLeaf = (leafText) => {
      if (!leafText) return;
      const arr = KeywordProcessor.extractKoreanSubstrings(leafText);
      leafKeywords.push(...arr);
    };

    // 검색
    pushLeaf(KeywordProcessor.extractLeafCategory(searchCategory));

    // 수정
    if (correctedCategory) {
      const parts = correctedCategory.split('>').map(cat => cat.trim());
      pushLeaf(parts[parts.length - 1] || '');
    }

    // 전시
    if (displayCategory) {
      const parts = displayCategory.split('>').map(cat => cat.trim());
      pushLeaf(parts[parts.length - 1] || '');
    }

    return [...new Set(leafKeywords)].filter(k => k.length >= 2);
  }

  /**
   * 카테고리 리스트에서 키워드 추출
   * @param {string[]} categories - 카테고리 배열
   * @returns {string[]} 추출된 키워드 배열
   */
  static extractAllKeywordsFromCategories(categories) {
    const keywords = new Set();
    categories.forEach(category => {
      const parts = category.split(' > ');
      parts.forEach(part => {
        const koreanKeywords = part.match(/[가-힣]{2,}/g) || [];
        koreanKeywords.forEach(keyword => keywords.add(keyword));
        const englishKeywords = part.match(/[a-zA-Z]{2,}/g) || [];
        englishKeywords.forEach(keyword => keywords.add(keyword));
      });
    });
    return Array.from(keywords);
  }
}

// 기본 내보내기 (하위 호환성)
export const {
  extractProductKeywords,
  removeExcludedContent,
  extractKoreanSubstrings,
  findCommonWords,
  categoryContainsKeyword,
  findCategoriesByMultipleKeywords,
  findCategoriesByMultipleInputKeywords,
  extractMainCategory,
  getCategoryKeywords,
  getTargetCategories,
  splitAndFilterKeywords,
  extractLeafCategory,
  getLeafKeywordsForAllCategories,
  extractAllKeywordsFromCategories
} = KeywordProcessor;
