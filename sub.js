/**
 * ========================================
 * SUB.JS - 간단한 유틸리티 함수 모음
 * ========================================
 * 
 * 이 파일은 tt.js에서 분리된 간단한 로직의 함수들을 포함합니다.
 * 각 함수는 독립적이고 재사용 가능한 유틸리티 기능을 제공합니다.
 * 
 * 포함된 함수들:
 * 
 * 1. copycopy(event, copyToClipboard)
 *    - 클릭된 요소의 텍스트를 추출하여 클립보드에 복사
 *    - event: 클릭 이벤트 객체
 *    - copyToClipboard: 복사 함수 참조
 * 
 * 2. copyToClipboard(text)
 *    - 텍스트를 클립보드에 복사하는 비동기 함수
 *    - 최신 Clipboard API 사용, 지원되지 않으면 에러 로그
 *    - text: 복사할 텍스트 문자열
 * 
 * 3. closeCard(message, emit)
 *    - Vue 컴포넌트의 카드를 닫는 함수
 *    - 부모 컴포넌트에 "remove" 이벤트 발생
 *    - message: 제거할 메시지/ID, emit: Vue의 $emit 함수
 * 
 * 4. toggleMoreInfo(showMoreInfo)
 *    - 더보기 정보 표시 상태를 토글
 *    - showMoreInfo: 현재 표시 상태 (boolean)
 *    - 반환값: 토글된 상태 (boolean)
 * 
 * 5. openCatalogLink(rep_ctlg_no)
 *    - 11번가 카탈로그 관리 페이지를 새 창으로 열기
 *    - rep_ctlg_no: 카탈로그 번호
 * 
 * 6. getProductTypeStyle(std_prd_yn)
 *    - 상품 타입(단일/다중)에 따른 CSS 스타일 문자열 반환
 *    - 다중상품: 초록색 강조, 단일상품: 회색 흐리게
 *    - std_prd_yn: 상품 타입 문자열
 * 
 * 7. getCategoryInputStyle(isCategoryValid)
 *    - 카테고리 입력 필드의 유효성에 따른 CSS 스타일 반환
 *    - 유효: 흰색 배경, 무효: 빨간색 배경
 *    - isCategoryValid: 카테고리 유효성 (boolean)
 * 
 * 8. getSubstring(a, b, c, d)
 *    - 문자열에서 특정 패턴 사이의 부분 문자열 추출
 *    - a: 대상 문자열, b: 시작 패턴, c: 종료 패턴, d: HTML 태그 제거 여부
 *    - jQuery의 $.trim() 사용하여 공백 제거
 * 
 * 9. clearData()
 *    - Vue 컴포넌트의 데이터를 초기 상태로 리셋
 *    - 상품 정보, 카테고리 정보, 검증 상태 등을 빈 값으로 초기화
 *    - 반환값: 초기화된 데이터 객체
 * 
 * ========================================
 */

import { PRODUCT_STATUS } from "./constants.js";

// 텍스트 복사 함수
export function copycopy(event, copyToClipboard) {
  const text = event.target.textContent || event.target.innerText || "";
  copyToClipboard(text);
}

// 클립보드 복사 통합 함수
export async function copyToClipboard(text) {
  try {
    // HTTPS 환경에서는 Clipboard API 사용
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      console.log('복사 성공:', text);
    } else {
      // HTTP 환경에서는 execCommand fallback 사용
      const textArea = document.createElement('textarea');
      textArea.value = text;

      // 화면에 보이지 않게 스타일 설정
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      textArea.style.opacity = '0';

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        console.log('복사 성공 (fallback):', text);
      } else {
        console.error('복사 실패: execCommand 실패');
      }
    }
  } catch (error) {
    console.error('복사 실패:', error);
  }
}

// 카드 닫기 함수
export function closeCard(message, emit) {
  console.log(message)
  this.$emit('remove', message);
}

// 더보기 정보 토글 함수
export function toggleMoreInfo(showMoreInfo) {
  return !showMoreInfo;
}

// 카탈로그 링크 열기 함수
export function openCatalogLink(rep_ctlg_no) {
  if (rep_ctlg_no) {
    const catalogUrl = `https://bo.11st.co.kr/catalog/CatalogAction.tmall?method=insertUpdateCatalogV2&ctlgNo=${rep_ctlg_no}`;
    window.open(catalogUrl, '_blank');
    console.log("카탈로그 링크 열기:", catalogUrl);
  }
}

// 상품 타입 스타일 반환 함수
export function getProductTypeStyle(std_prd_yn) {
  // 상품 타입에 따른 스타일 반환
  if (std_prd_yn === PRODUCT_STATUS.MULTIPLE) {
    return 'color: green; font-weight: bold;'; // 다중상품은 초록색으로 강조
  } else {
    return 'color: rgb(200, 200, 200); font-size: 0.9em;'; // 단일상품은 회색으로 흐리게
  }
}

// 카테고리 input 스타일 반환 함수
export function getCategoryInputStyle(isCategoryValid) {
  const baseStyle = "font-size: 12px; font-weight: bold; padding: 5px;";

  if (isCategoryValid) {
    // 유효한 경우 - 하얀색 스타일
    return baseStyle + " color: rgb(108 117 125); background-color: white; border: 1px solid rgb(206 212 218);";
  } else {
    // 무효한 경우 - 빨간색 스타일
    return baseStyle + " color: rgb(220 53 69); background-color: rgb(253 237 237); border: 1px solid rgb(220 53 69);";
  }
}

// 문자열에서 부분 문자열 추출 함수
export function getSubstring(a, b, c, d) {
  var e, f, g;
  return void 0 == a || null == a || "" == a
    ? ""
    : ((e = a.indexOf(b)),
      e >= 0
        ? ((f = a.indexOf(c, e + b.length)),
          (g = a.substring(e + b.length, f)),
          d && (g = g.replace(/<[^<>]+>/g, "")),
          $.trim(g))
        : "");
}

// 데이터 초기화 함수
export function clearData() {
  return {
    simboost_payloads: "",
    prd_nm: "",
    srch_prd_nm: "",
    brand_eng_nm: "",
    brand_nm: "",
    ctlg_brand_nm: "",
    ctlg_nm: "",
    rep_ctlg_no: "",
    img_url: "",
    대카: "",
    std_prd_yn: "",
    categoryValidationMessage: "",
    isCategoryValid: true,
    similarCategoryForClick: "",
    multiKeywordRecommendations: []
  };
}