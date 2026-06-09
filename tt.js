import modal from "./ttmodal.js";
import { validCategories } from "./검카체크.js";



import {
  copycopy,
  copyToClipboard,
  toggleMoreInfo,
  openCatalogLink,
  getProductTypeStyle,
  getCategoryInputStyle,
  getSubstring,
  clearData
} from "./sub.js";
import {
  PRODUCT_STATUS,
  CATEGORY_VALIDATION
} from "./constants.js";
import {
  calculateTooltipPosition,
  createTooltipStyle,
  generateTooltipHTML,
  removeAllTooltips
} from "./tooltip.js";
import { KeywordProcessor } from "./keyword.js";
import { BigImageModule } from "./bigimage.js";
import { checkGenderMismatch } from "./성별판별.js";

let ann = Vue.component("ann", {
  props: ["message", "idx"],
  components: { modal },
  template: `<div>
      <!-- 실패한 카드 (간략 표시) -->
      <div v-if="isApiFailure" class="card card-failure" id="실패카드">
        <div class="card-body" style="padding: 12px; text-align: center;">
          <span class="product-number-badge" style="position: static; display: block; margin-bottom: 4px;">{{ idx + 1 }}</span>
          <p style="margin: 0; font-size: 11px; color: #6c757d;">
            상품번호: <span @click="copycopy" style="cursor: pointer; color: #495057; text-decoration: underline;">{{ id }}</span>
          </p>
          <p style="margin: 6px 0; font-size: 10px; color: #dc3545;">{{ dealname || 'API 호출 실패' }}</p>
          <a :href="'https://www.11st.co.kr/products/' + id" target="_blank" 
             style="font-size: 11px; color: #007bff;">
            [상품링크]
          </a>
        </div>
      </div>
      <!-- 정상 카드 -->
      <div v-else class="card" :class="[cardColorClass, { 'card-selected': isSelected }]" v-if="message !== ''" v-show="isVisible" id="상품카드">
        <button v-if="!uiFlags.showImageOnly" class="close-btn" @click="closeCard" id="닫기버튼">×</button>
        <!-- 다중 선택 체크박스 - 우상단으로 이동 -->
        <div v-if="uiFlags.showMultiSelect && !uiFlags.showImageOnly" 
             class="multi-select-checkbox"
             style="position: absolute; top: 8px; right: 35px; z-index: 10;">
          <input type="checkbox" 
                 :id="'checkbox-' + id"
                 v-model="isSelected"
                 @change="handleSelectionChange"
                 style="width: 18px; height: 18px; cursor: pointer;">
        </div>
        <div style="position: relative;" id="이미지영역">
          <!-- 순번 배지 -->
          <span class="product-number-badge">{{ idx + 1 }}</span>
          <a :href="'https://www.11st.co.kr/products/' + id" target="_blank" id="상품링크">
            <img :class="['card-img-top', iscatalog]" :src="img_url" alt="상품 이미지" id="상품이미지" loading="lazy">
          </a>
          <!-- 이미지 확대 버튼 - 우하단으로 이동 -->
          <button @click="showImageModal" 
                  class="image-zoom-btn"
                  style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 4px; padding: 6px 8px; cursor: pointer; font-size: 12px; z-index: 10; opacity: 0; transition: opacity 0.3s ease;"
                  title="이미지 확대">
            🔍
          </button>
        </div>
        
        <div v-if="!uiFlags.showImageOnly" :class="['card-body', isdeleteprdNo]" id="카드본문" :style="isCompactView ? { height: 'auto', minHeight: '0', padding: '0' } : {}">
          <!-- 상품명 영역 -->
          <div v-if="isContentVisible('dealname')" class="product-name-row" style="display: flex; align-items: flex-start; gap: 8px;" id="상품명영역">
            <div style="flex: 1;">
              <div v-if="uiFlags.showHighlight && highlightedDealname" 
                   v-html="highlightedDealname" 
                   id="상품명"
                   data-field="highlighted.dealname"
                   style="font-size: 16px;color: #4b4b4bff; padding: 8px; min-height: 60px;"></div>
              <textarea v-else 
                        v-model="dealname" 
                        @input="updateHighlights" 
                        class="wide-input" 
                        id="상품명입력"
                        data-field="dealname"
                        style="font-size: 18px;"/>
            </div>
            <button @click="searchOnNaver" 
                    id="네이버검색버튼"
                    class="naver-search-btn"
                    title="네이버 쇼핑에서 검색">N</button>
          </div>

          <!-- 기본 정보 영역 -->
          <p v-if="isContentVisible('price')" class="card-text" style="color: rgb(108 117 125); font-size: 12px;" id="기본정보">
            <span v-if="uiFlags.showPrice" id="가격" data-field="price">가격: {{ price }} | </span>상품번호: 
            <span @click="copycopy" style="cursor: pointer;" id="상품번호" data-field="id">{{ id }}</span>
          </p>
          
          <!-- 셀러/카탈로그 정보 -->
          <p v-if="uiFlags.showPartner && isContentVisible('partner')" class="card-text" style="color: rgb(180 180 180); font-size: 10px;" id="셀러정보">
          <p v-if="uiFlags.showPartner && isContentVisible('partner')" class="card-text" style="color: rgb(180 180 180); font-size: 10px;" id="셀러정보">
            <span id="셀러" data-field="partner">셀러: {{ partner }}</span>
            <span v-if="ctlg_brand_nm && uiFlags.showCatalog" style="display: none !important;"> | 카탈로그번호: 
              <span @click="openCatalogLink" 
                    style="cursor: pointer; color: rgb(221, 224, 226); text-decoration: underline;"
                    id="카탈로그번호"
                    data-field="ctlg_brand_nm">{{ ctlg_brand_nm }}</span>
            </span>
            <!-- 브랜드 정보 이동 (카탈로그 옆) -->
            <span v-if="uiFlags.showBrand && isContentVisible('brand') && (brand_eng_nm || brand_nm)"> | 
                <span v-if="brand_eng_nm" id="브랜드영문" data-field="brand_eng_nm">브랜드: {{ brand_eng_nm }}</span>
                <span v-if="brand_nm && brand_eng_nm"> / </span>
                <span v-if="brand_nm" id="브랜드" data-field="brand_nm">{{ brand_nm }}</span>
            </span>

            <!-- 상품유형 이동 (브랜드 옆) -->
            <span v-if="std_prd_yn && uiFlags.showStdProduct && isContentVisible('std_prd')"> | 
                <span :style="getProductTypeStyle()"
                      id="단일상품여부"
                      data-field="std_prd_yn">상품유형: {{ std_prd_yn }}</span>
            </span>
          </p>
    

          
          <!-- 단일상품여부 독립 표시 (브랜드 정보가 없어도 표시) -->


          <!-- 검색 카테고리 -->
          <p v-if="uiFlags.showSearchCategory && isContentVisible('search_category')" class="card-text"
             style="color: rgb(0 123 255);"
             v-html="highlightedSearchCategoryForCategory"
             id="검색카테고리"
             data-field="categories.search"></p>
             
          <!-- 수정 카테고리 입력 영역 -->
          <div v-if="uiFlags.showCorrectedCategoryInput && isContentVisible('input')" class="card-text" style="margin-bottom: 10px; position: relative;" id="카테고리입력영역">
            <input type="text" 
                   v-model="corrected_category" 
                   @input="updateCorrectedCategory"
                   @focus="isInputFocused = true"
                   @blur="handleInputBlur"
                   class="form-control" 
                   :style="getCategoryInputStyle()"
                   :placeholder="isCategoryValid ? '-' : categoryValidationMessage"
                   id="수정카테고리입력"
                   data-field="categories.corrected"
                   autocomplete="off"
                   style="padding-right: 30px;">
            <span v-if="corrected_category && isInputFocused" 
                  @mousedown.prevent="clearCorrectedCategory"
                  style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #999; font-weight: bold; font-size: 18px; z-index: 5;"
                  title="지우기">×</span>
          </div>
          
          <!-- 수정카테고리 하이라이트 미리보기 (별도 영역) -->
          <div v-if="uiFlags.showCorrectedCategoryPreview && corrected_category && highlightedCorrectedCategory" 
               v-html="highlightedCorrectedCategory"
               class="card-text"
               style="font-size: 12px; font-weight: bold; padding: 5px; margin-bottom: 10px; background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 3px; color: #495057; line-height: 1.4;"
               id="수정카테고리미리보기"></div>

          
          <!-- 비고/경고 메시지 -->
          <p v-if="remarks && isContentVisible('remarks')" 
             class="card-text" 
             style="color: rgb(220 53 69); font-size: 12px; background-color: rgb(248 215 218); padding: 5px; border-radius: 3px; margin-top: 5px;"
             id="비고"
             data-field="remarks">
            {{remarks}}
          </p>
          
          <!-- 표시 카테고리 -->
          <p v-if="uiFlags.showDisplayCategory && isContentVisible('display_category')" 
             class="card-text" 
             style="color: rgb(108 117 125); font-size: 0.9em; cursor: pointer;" 
             @click="categoryClick" 
             v-html="highlightedDisplayCategoryForCategory"
             id="전시카테고리"
             data-field="categories.display"></p> 

          <!-- 수정 이력 -->
          <div v-if="refind_category && uiFlags.showModificationHistory && isContentVisible('history')" id="수정이력">
            <button @click="toggleMoreInfo" 
                    class="card-text" 
                    style="color: rgb(108 117 125); background: none; border: none; text-decoration: underline; cursor: pointer; padding: 0; font-size: inherit;"
                    id="수정이력토글버튼">
              {{ showMoreInfo ? '수정이력 숨기기' : '수정이력 보기' }}
            </button>
            <p v-if="showMoreInfo" 
               class="card-text" 
               style="color: rgb(243 52 102);"
               id="수정이력상세"
               data-field="refind_category">{{refind_category}}({{usernName}}{{createdDate}})</p>
          </div> 

          <div id="디버그영역">
            <!-- <button type="button" class="card-text" @click="get_InnerKeyword">get_InnerKeyword</button> -->
          </div>
          
        </div>
      </div>
      
    </div>  
  `,
  data() {
    return {
      id: this.message,
      price: "",
      dealname: "",
      img_url: "",
      partner: "",
      remarks: "",
      showModal: false,

      // 통합된 카테고리 관련 변수들
      categories: {
        full: "",
        display: "",
        search: "",
        corrected: ""
      },
      refind_category: "",
      isCategoryValid: true,
      categoryValidationMessage: "",
      multiKeywordRecommendations: [],

      // 브랜드/카탈로그 정보
      brand_eng_nm: "",
      brand_nm: "",
      ctlg_nm: "",
      ctlg_brand_nm: "",
      rep_ctlg_no: "",

      // 상품 상태
      std_prd_yn: "",

      // UI 상태
      showMoreInfo: false,
      showTextarea: false,
      showCategoryTooltip: false,
      hasModificationHistory: false,
      isInputFocused: false, // 입력창 포커스 상태

      // 통합된 하이라이트 관련 변수들
      highlighted: {
        dealname: "",
        searchCategory: "",
        displayCategory: "",
        correctedCategory: ""
      },

      // 툴팁 관련
      tooltipCloseTimer: null,
      tooltipStyle: {},
      recommendedCategories: [],
      extractedKeywords: [],
      activeFilters: [],
      categorySearchFilter: "",
      categorySearchInput: "",

      // 기타
      대카: "",
      usernName: "",
      createdDate: "",
      isdeleteprdNo: "",
      iscatalog: "",

      // 툴팁 디바운스용
      _tooltipTick: 0,

      // 다중 선택 관련
      isSelected: false,
      activeCategoryFilter: "",
      isMoreFiltersExpanded: false  // 더보기 펼침 상태
    };
  },
  computed: {
    cardColorClass() {
      return this.hasModificationHistory ? 'card-modified' : 'card-normal';
    },

    uiFlags() {
      const parent = this.$parent || {};
      return {
        showMultiSelect: !!parent.showMultiSelect,
        showHighlight: parent.showHighlight !== undefined ? parent.showHighlight : true,
        showPrice: parent.showPrice !== undefined ? parent.showPrice : true,
        showPartner: !!parent.showPartner,
        showCatalog: !!parent.showCatalog,
        showBrand: parent.showBrand !== undefined ? parent.showBrand : true,
        showStdProduct: parent.showStdProduct !== undefined ? parent.showStdProduct : true,
        showCorrectedCategoryInput: parent.showCorrectedCategoryInput !== undefined ? parent.showCorrectedCategoryInput : true,
        showCorrectedCategoryPreview: parent.showCorrectedCategoryPreview !== undefined ? parent.showCorrectedCategoryPreview : true,
        showDisplayCategory: parent.showDisplayCategory !== undefined ? parent.showDisplayCategory : true,
        showModificationHistory: !!parent.showModificationHistory,
        showCategoryRecommendation: !!parent.showCategoryRecommendation,
        showModificationHistory: !!parent.showModificationHistory,
        showCategoryRecommendation: !!parent.showCategoryRecommendation,
        showSearchCategory: parent.showSearchCategory !== undefined ? parent.showSearchCategory : true,
        showImageOnly: !!parent.showImageOnly,
        viewMode: parent.viewMode || 'default'
      };
    },

    // API 오류 메시지 목록
    errorMessages() {
      return [
        "API 호출 실패",
        "상품 정보를 찾을 수 없습니다",
        "백엔드 서버에 연결할 수 없습니다",
        "오류 발생"
      ];
    },

    // API 요청 실패 여부 확인
    isApiFailure() {
      // 상품명이 없거나 오류 메시지인 경우
      if (!this.dealname) return true;
      return this.errorMessages.includes(this.dealname);
    },

    // 카드가 보여져야 하는지 여부 (정상 카드만)
    isVisible() {
      // API 실패 카드는 별도로 표시되므로 여기서는 true 반환
      // (isApiFailure가 true면 실패 카드 UI가 표시됨)
      if (this.isApiFailure) return false;
      return true;
    },

    // F7~F9 보기 모드인지 확인 (카드 본문 스타일 조정용)
    // 이 모드들에서는 필요한 정보만 간결하게 보여줌
    isCompactView() {
      const mode = this.uiFlags.viewMode;
      return mode === 'nameSearchCorrected' || mode === 'searchCorrected' || mode === 'nameCorrected';
    },

    shouldShowCategoryRecommendation() {
      return this.uiFlags.showCategoryRecommendation;
    },

    filteredCategoriesForDisplay() {
      // activeFilters가 있으면 필터링된 결과만 표시
      if (this.activeFilters.length > 0) {
        const filteredByKeywords = KeywordProcessor.findCategoriesByMultipleKeywords(this.activeFilters);

        // 추가로 categorySearchFilter가 있으면 더 필터링
        if (!this.categorySearchFilter.trim()) {
          return filteredByKeywords;
        }

        const searchTerm = this.categorySearchFilter.toLowerCase().trim();
        return filteredByKeywords.filter(category => category.toLowerCase().includes(searchTerm));
      }

      // activeFilters가 없으면 기존 로직 사용
      if (!this.categorySearchFilter.trim()) {
        return this.recommendedCategories;
      }

      const searchTerm = this.categorySearchFilter.toLowerCase().trim();
      return this.recommendedCategories.filter(category => category.toLowerCase().includes(searchTerm));
    },

    // 검색 카테고리 하이라이트 (상품명과 중복된 키워드만 초록색)
    highlightedSearchCategoryForCategory() {
      return this.highlightText(this.categories.search, [], { isCategoryDisplay: true });
    },

    // 표시 카테고리 하이라이트 (상품명과 중복된 키워드만 초록색)
    highlightedDisplayCategoryForCategory() {
      return this.highlightText(this.categories.display, [], { isCategoryDisplay: true });
    },

    // 하위 호환성을 위한 computed properties
    fullcategory: {
      get() { return this.categories.full; },
      set(value) { this.categories.full = value; }
    },
    display_category: {
      get() { return this.categories.display; },
      set(value) { this.categories.display = value; }
    },
    search_category: {
      get() { return this.categories.search; },
      set(value) { this.categories.search = value; }
    },
    corrected_category: {
      get() { return this.categories.corrected; },
      set(value) { this.categories.corrected = value; }
    },
    highlightedDealname: {
      get() { return this.highlighted.dealname; },
      set(value) { this.highlighted.dealname = value; }
    },
    highlightedSearchCategory: {
      get() { return this.highlighted.searchCategory; },
      set(value) { this.highlighted.searchCategory = value; }
    },
    highlightedDisplayCategory: {
      get() { return this.highlighted.displayCategory; },
      set(value) { this.highlighted.displayCategory = value; }
    },
    highlightedCorrectedCategory: {
      get() { return this.highlighted.correctedCategory; },
      set(value) { this.highlighted.correctedCategory = value; }
    },
  },
  methods: {
    // 뷰 모드에 따라 콘텐츠 표시 여부 결정
    isContentVisible(type) {
      const mode = this.uiFlags.viewMode;
      if (!mode || mode === 'default') return true;
      if (mode === 'imageOnly') return false;

      // F7 (상품명 + 검색카테고리 + 수정카테고리)
      if (mode === 'nameSearchCorrected') {
        return type === 'dealname' || type === 'search_category' || type === 'input';
      }

      // F8 (검색카테고리 + 수정카테고리)
      if (mode === 'searchCorrected') {
        return type === 'search_category' || type === 'input';
      }

      // F9 (상품명 + 수정카테고리)
      if (mode === 'nameCorrected') {
        return type === 'dealname' || type === 'input';
      }

      return false;
    },

    closeCard() {
      this.$emit("remove", this.message);
    },

    copycopy(event) {
      copycopy(event, this.copyToClipboard);
    },

    // 카테고리 전용 클릭 핸들러 (툴팁 없이 복사만)
    categoryClick(event) {
      // 이벤트 전파 중단으로 키워드 클릭 이벤트와 충돌 방지
      event.preventDefault();
      event.stopPropagation();

      // 기존 툴팁이 있으면 모두 제거
      this.hideKeywordTooltip();

      // 툴팁 표시 없이 단순히 텍스트 복사만 수행
      const text = event.target.textContent || event.target.innerText;
      if (text) {
        this.copyToClipboard(text);
      }
    },

    async copyToClipboard(text) {
      return await copyToClipboard(text);
    },

    openCatalogLink() {
      openCatalogLink(this.rep_ctlg_no);
    },

    // 이미지 모달 관련 메서드 (BigImageModule 사용)
    showImageModal() {
      if (!this.img_url) return;

      const localUrl = `http://10.240.129.13/img/${this.id}/${this.id}.jpg`;

      const img = new Image();
      img.onload = () => {
        BigImageModule.showImageModal(localUrl);
      };
      img.onerror = () => {
        BigImageModule.showImageModal(this.img_url); // CDN 폴백
      };
      img.src = localUrl;
    },

    updateCorrectedCategory() {
      // 단축 입력 변환: '[' → '수정불필요', ']' → '오처리'
      if (this.corrected_category === '[') {
        this.corrected_category = '수정불필요';
      } else if (this.corrected_category === ']') {
        this.corrected_category = '오처리';
      }

      // 카테고리 검증 및 다중 추천 업데이트
      this.validateCategory();

      // 성별/연령대 일치 검증
      this.checkGenderMatch();

      // 부모 컴포넌트에 카테고리 매핑 업데이트 알림
      if (this.$parent && this.$parent.updateCategoryMapping) {
        this.$parent.updateCategoryMapping(this.message, this.corrected_category);
      }

      // 하이라이트 업데이트
      // 하이라이트 업데이트
      this.updateHighlightsIfSearchCategoryValid();
    },

    handleInputBlur() {
      // blur 시 바로 false로 하면 클릭 이벤트가 씹힐 수 있으므로 setTimeout 사용 (mousedown.prevent를 사용했으므로 사실 필요 없을 수도 있지만 안전하게)
      setTimeout(() => {
        this.isInputFocused = false;
      }, 150);
    },

    clearCorrectedCategory() {
      this.corrected_category = '';
      this.updateCorrectedCategory();
      // 지운 후에도 포커스 유지
      this.$nextTick(() => {
        const input = this.$el.querySelector('#수정카테고리입력');
        if (input) input.focus();
      });
    },


    // 다중 선택 변경 처리
    handleSelectionChange() {
      // 부모 컴포넌트의 selectedProducts 업데이트
      if (this.$parent && this.$parent.selectedProducts) {
        if (this.isSelected) {
          this.$parent.selectedProducts.add(this.message);
        } else {
          this.$parent.selectedProducts.delete(this.message);
        }
        //  console.log(`상품 ${this.message} 선택 상태:`, this.isSelected);
        //  console.log('현재 선택된 상품들:', Array.from(this.$parent.selectedProducts));
      }
    },

    validateCategory() {
      const rawInputCategory = this.corrected_category || "";
      const inputCategory = rawInputCategory.trim();

      if (!inputCategory) {
        // 수정카테고리가 비어있으면 검색카테고리로 성별 검증
        this.multiKeywordRecommendations = [];
        this.hideMultiKeywordTooltip(); // 툴팁 숨김 추가
        const genderResult = checkGenderMismatch(this.dealname, "", this.search_category);
        if (!genderResult.isValid) {
          this.isCategoryValid = false;
          this.categoryValidationMessage = genderResult.message;
        } else {
          this.isCategoryValid = true;
          this.categoryValidationMessage = "";
        }
        return;
      }

      // 기존 검색카테고리와 동일한 입력 방지
      const normalizedSearchCategory = (this.search_category || "").trim();
      if (inputCategory === normalizedSearchCategory) {
        this.isCategoryValid = false;
        this.categoryValidationMessage = "기존 검색카테고리와 동일합니다";
        //@@@  alert("기존 검색카테고리와 동일합니다")
        this.multiKeywordRecommendations = [];
        this.hideMultiKeywordTooltip(); // 툴팁 숨김 추가
        return;
      }

      // validCategories에 있는 카테고리만 허용 (완전 일치만)
      const isExactMatch = validCategories.includes(inputCategory);

      if (isExactMatch) {
        this.isCategoryValid = true;
        this.categoryValidationMessage = "";
        this.multiKeywordRecommendations = [];
        this.hideMultiKeywordTooltip(); // 툴팁 숨김 추가
        return;
      }

      // 유효하지 않은 카테고리인 경우 추천 목록 표시
      const multiKeywordCategories = KeywordProcessor.findCategoriesByMultipleInputKeywords(inputCategory);
      this.isCategoryValid = false;
      this.categoryValidationMessage = CATEGORY_VALIDATION.MESSAGES.INVALID_FORMAT;
      this.multiKeywordRecommendations = multiKeywordCategories;
      this.activeCategoryFilter = ""; // 새로운 검색 결과가 나오면 필터 초기화

      // 추천 목록이 있으면 툴팁 표시
      if (this.multiKeywordRecommendations.length > 0) {
        this.$nextTick(() => {
          this.renderMultiKeywordTooltip();
        });
      } else {
        this.hideMultiKeywordTooltip();
      }
    },

    // 다중 키워드 추천 툴팁 렌더링 (Portal)
    renderMultiKeywordTooltip() {
      // 기존 툴팁 제거
      this.hideMultiKeywordTooltip();

      const inputElement = this.$el.querySelector('input[data-field="categories.corrected"]');
      if (!inputElement) return;

      const rect = inputElement.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      // 위치 계산 (입력창 바로 아래)
      const top = rect.bottom + scrollTop + 4;
      const left = rect.left + scrollLeft;
      const width = rect.width;

      const tooltipStyle = {
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        width: 'auto',
        minWidth: `${width}px`,
        maxHeight: '500px',
        overflowY: 'auto',
        backgroundColor: 'white',
        border: '1px solid #ced4da', // Bootstrap form border color
        borderRadius: '0.25rem', // Bootstrap standard radius
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        zIndex: '2000000000', // z-index 대폭 상향
        padding: '0'
      };

      const tooltip = document.createElement('div');
      tooltip.id = `multi-keyword-tooltip-${this.id}`;
      tooltip.className = 'multi-keyword-tooltip';
      Object.assign(tooltip.style, tooltipStyle);

      // 필터 옵션 동적 생성 (2뎁스 기준)
      const depth2Counts = {};
      this.multiKeywordRecommendations.forEach(cat => {
        const parts = cat.split('>');
        if (parts.length >= 2) {
          const d2 = parts[1].trim();
          depth2Counts[d2] = (depth2Counts[d2] || 0) + 1;
        }
      });
      console.log('추천 카테고리:', this.multiKeywordRecommendations);
      console.log('2뎁스 빈도:', depth2Counts);

      // 빈도수 순으로 정렬
      const sortedDepth2 = Object.keys(depth2Counts).sort((a, b) => depth2Counts[b] - depth2Counts[a]);

      // 처음 8개와 나머지 분리
      const first8 = sortedDepth2.slice(0, 8);
      const rest = sortedDepth2.slice(8);
      const hasMore = rest.length > 0;

      // 필터 영역 HTML 생성
      let filterHtml = '<div style="padding: 8px; border-bottom: 1px solid #eee; background: #f8f9fa; display: flex; gap: 4px; flex-wrap: wrap;">';

      // 전체 버튼
      const isAllActive = !this.activeCategoryFilter;
      filterHtml += `
        <button type="button" class="filter-chip" data-filter="전체"
                style="font-size: 11px; padding: 2px 8px; border: 1px solid; border-radius: 12px; cursor: pointer; outline: none; 
                       ${isAllActive ? 'background-color: #007bff; color: white; border-color: #007bff;' : 'background-color: white; color: #495057; border-color: #ced4da;'}">
          전체
        </button>
      `;

      // 처음 8개 필터
      first8.forEach(option => {
        const isActive = this.activeCategoryFilter === option;
        const activeStyle = isActive
          ? 'background-color: #007bff; color: white; border-color: #007bff;'
          : 'background-color: white; color: #495057; border-color: #ced4da;';

        filterHtml += `
          <button type="button" class="filter-chip" data-filter="${option}"
                  style="font-size: 11px; padding: 2px 8px; border: 1px solid; border-radius: 12px; cursor: pointer; outline: none; ${activeStyle}">
            ${option}
          </button>
        `;
      });

      // 더보기 버튼 (나머지가 있을 경우)
      if (hasMore) {
        const moreBtnStyle = this.isMoreFiltersExpanded
          ? 'border-color: #007bff; color: #007bff;'
          : 'border-color: #6c757d; color: #6c757d;';
        const moreBtnText = this.isMoreFiltersExpanded ? '접기' : `+${rest.length}개 더보기`;
        filterHtml += `
          <button type="button" class="more-filters-btn" 
                  style="font-size: 11px; padding: 2px 8px; border: 1px dashed; border-radius: 12px; cursor: pointer; outline: none; background-color: #f8f9fa; ${moreBtnStyle}">
            ${moreBtnText}
          </button>
        `;
      }

      filterHtml += '</div>';

      // 숨겨진 나머지 필터 (펼침 상태에 따라 표시)
      if (hasMore) {
        const displayStyle = this.isMoreFiltersExpanded ? 'display: flex;' : 'display: none;';
        filterHtml += `<div class="more-filters-container" style="${displayStyle} padding: 8px; border-bottom: 1px solid #eee; background: #fff; gap: 4px; flex-wrap: wrap;">`;
        rest.forEach(option => {
          const isActive = this.activeCategoryFilter === option;
          const activeStyle = isActive
            ? 'background-color: #007bff; color: white; border-color: #007bff;'
            : 'background-color: white; color: #495057; border-color: #ced4da;';

          filterHtml += `
            <button type="button" class="filter-chip" data-filter="${option}"
                    style="font-size: 11px; padding: 2px 8px; border: 1px solid; border-radius: 12px; cursor: pointer; outline: none; ${activeStyle}">
              ${option}
            </button>
          `;
        });
        filterHtml += '</div>';
      }

      // 필터링된 목록 생성
      let filteredCategories = this.multiKeywordRecommendations;
      if (this.activeCategoryFilter && this.activeCategoryFilter !== '전체') {
        filteredCategories = filteredCategories.filter(cat => {
          const parts = cat.split('>');
          return parts.length >= 2 && parts[1].trim() === this.activeCategoryFilter;
        });
      }

      // 목록 HTML 생성
      let listHtml = '<div class="list-group list-group-flush">';
      if (filteredCategories.length === 0) {
        listHtml += '<div style="padding: 12px; text-align: center; color: #999; font-size: 12px;">선택한 필터에 해당하는 카테고리가 없습니다.</div>';
      } else {
        filteredCategories.forEach((category, index) => {
          const displayHtml = this.getMultiKeywordCategoryDisplay(category);
          listHtml += `
            <div class="list-group-item list-group-item-action" 
                 style="cursor: pointer; font-size: 13px; padding: 4px 12px; border: none; border-bottom: 1px solid #f8f9fa; white-space: nowrap;"
                 data-category="${category}">
              ${displayHtml}
            </div>
          `;
        });
      }
      listHtml += '</div>';

      tooltip.innerHTML = filterHtml + listHtml;

      // 필터 클릭 이벤트 연결
      tooltip.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const filter = chip.getAttribute('data-filter');
          if (filter === '전체') {
            this.activeCategoryFilter = "";
          } else {
            // 이미 선택된 필터 클릭 시 해제 (토글)
            if (this.activeCategoryFilter === filter) {
              this.activeCategoryFilter = "";
            } else {
              this.activeCategoryFilter = filter;
            }
          }
          // 툴팁 다시 렌더링 (상태 업데이트 반영을 위해)
          this.renderMultiKeywordTooltip();

          // 포커스 유지
          if (inputElement) inputElement.focus();
        });
      });

      // 더보기 버튼 클릭 이벤트
      const moreBtn = tooltip.querySelector('.more-filters-btn');
      const moreContainer = tooltip.querySelector('.more-filters-container');
      if (moreBtn && moreContainer) {
        moreBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          // 상태 토글 및 저장
          this.isMoreFiltersExpanded = !this.isMoreFiltersExpanded;

          // UI 업데이트
          if (this.isMoreFiltersExpanded) {
            moreContainer.style.display = 'flex';
            moreBtn.textContent = '접기';
            moreBtn.style.borderColor = '#007bff';
            moreBtn.style.color = '#007bff';
          } else {
            moreContainer.style.display = 'none';
            moreBtn.textContent = `+${moreContainer.querySelectorAll('.filter-chip').length}개 더보기`;
            moreBtn.style.borderColor = '#6c757d';
            moreBtn.style.color = '#6c757d';
          }
        });
      }

      // 리스트 항목 클릭 이벤트 연결
      tooltip.querySelectorAll('.list-group-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const category = item.getAttribute('data-category');
          this.applyCategoryRecommendation(category, false);
          this.hideMultiKeywordTooltip();
        });

        // 호버 효과
        item.addEventListener('mouseenter', () => {
          item.style.backgroundColor = '#e3f2fd'; // 더 명확한 파란색 계열로 변경
        });
        item.addEventListener('mouseleave', () => {
          item.style.backgroundColor = 'white';
        });
      });

      // 바깥 클릭 시 닫기 위한 이벤트 핸들러
      setTimeout(() => {
        const outsideClickHandler = (e) => {
          if (!tooltip.contains(e.target) && e.target !== inputElement) {
            this.hideMultiKeywordTooltip();
            document.removeEventListener('click', outsideClickHandler);
          }
        };
        document.addEventListener('click', outsideClickHandler);
        tooltip._outsideClickHandler = outsideClickHandler; // 나중에 제거하기 위해 저장
      }, 0);

      document.body.appendChild(tooltip);
      this._multiKeywordTooltip = tooltip;
    },

    // 다중 키워드 툴팁 숨기기
    hideMultiKeywordTooltip() {
      if (this._multiKeywordTooltip) {
        if (this._multiKeywordTooltip._outsideClickHandler) {
          document.removeEventListener('click', this._multiKeywordTooltip._outsideClickHandler);
        }
        if (this._multiKeywordTooltip.parentNode) {
          this._multiKeywordTooltip.parentNode.removeChild(this._multiKeywordTooltip);
        }
        this._multiKeywordTooltip = null;
      }

      // ID로 검색해서 혹시 남아있는 툴팁 제거 (안전장치)
      const existingTooltip = document.getElementById(`multi-keyword-tooltip-${this.id}`);
      if (existingTooltip) {
        existingTooltip.remove();
      }
    },

    // 상품명과 카테고리 간의 성별/연령대 일치 검증
    // 수정카테고리가 있으면 수정카테고리로, 없으면 검색카테고리로 비교
    checkGenderMatch() {
      const result = checkGenderMismatch(this.dealname, this.corrected_category, this.search_category);
      if (!result.isValid) {
        this.isCategoryValid = false;
        this.categoryValidationMessage = result.message;
      }
      return result;
    },

    getCategoryInputStyle() {
      return getCategoryInputStyle(this.isCategoryValid);
    },

    findCategoriesByKeyword(keyword) {
      if (!keyword) return [];
      const productKeywords = KeywordProcessor.extractProductKeywords(this.dealname);
      const recommendations = KeywordProcessor.findCategoriesByMultipleKeywords(productKeywords);
      this.originalRecommendations = [...recommendations];
      this.filteredRecommendations = [...recommendations];
      this.initializeAvailableKeywords();
      return recommendations;
    },

    initializeKeywordState() {
      try {
        this.extractedKeywords = KeywordProcessor.extractProductKeywords(this.dealname);
        this.availableKeywords = [...this.extractedKeywords];
        this.activeFilters = [];

        // 초기 추천 카테고리 설정 (상품명의 모든 키워드 기반)
        this.recommendedCategories = KeywordProcessor.findCategoriesByMultipleKeywords(this.extractedKeywords);
        this.filteredRecommendations = this.recommendedCategories;
        this.categorySearchFilter = "";
      } catch (error) {
        console.error('키워드 상태 초기화 오류:', error);
        this.extractedKeywords = [];
        this.availableKeywords = [];
        this.activeFilters = [];
        this.recommendedCategories = [];
        this.filteredRecommendations = [];
      }
    },

    handleKeywordClick(event, keyword) {
      event.preventDefault();
      event.stopPropagation();

      // 스페셜 키워드가 검색카테고리에 없으면 클릭 방지
      const specialKeywords = ['남성', '남자', '여성', '여자', '아동', '키즈', '여아', '남아', '공용', '유아', '어린이'];
      const isSpecialKeyword = specialKeywords.includes(keyword);

      if (isSpecialKeyword) {
        const isSpecialInCategory = this.search_category &&
          KeywordProcessor.categoryContainsKeyword(this.search_category, keyword);
      }

      // 기존 툴팁이 있으면 모두 제거
      this.hideKeywordTooltip();

      // 토글 방식: 같은 키워드 클릭 시 비움, 다른 키워드 클릭 시 교체
      if (this.corrected_category === keyword) {
        // 같은 키워드 다시 클릭 → 비움
        this.corrected_category = '';
      } else {
        // 다른 키워드 클릭 → 교체
        this.corrected_category = keyword;
      }

      // 카테고리 검증 및 추천 목록 업데이트 트리거
      this.updateCorrectedCategory();
    },

    isRecommendationEnabled() {
      return this.shouldShowCategoryRecommendation;
    },

    toggleKeywordFilter(keyword) {
      const isActive = this.activeFilters.includes(keyword);
      if (isActive) {
        this.removeFilter(keyword);
      } else {
        this.addKeywordFilter(keyword);
      }
    },

    addKeywordFilter(keyword) {
      if (this.activeFilters.length === 0) {
        this.addFilter(keyword);
      } else if (this.availableKeywords.includes(keyword)) {
        this.addFilter(keyword);
      }
    },

    showTooltipWithDelay(event, keyword) {
      this.showKeywordSpecificTooltip(event, keyword);
    },

    showKeywordSpecificTooltip(event, clickedKeyword) {
      // 디바운스: 120ms 내 연속 호출 방지
      const now = Date.now();
      if (now - this._tooltipTick < 120) return;
      this._tooltipTick = now;

      if (this.activeFilters.length === 0) {
        this.hideKeywordTooltip();
        return;
      }

      const recommendationsToShow = KeywordProcessor.findCategoriesByMultipleKeywords(this.activeFilters);
      this.recommendedCategories = recommendationsToShow;
      this.extractedKeywords = [...this.activeFilters];

      this.cancelCloseTimer();
      this.showCategoryTooltip = true;

      const clickedElement = this.findKeywordElement(clickedKeyword);
      if (clickedElement) {
        const rect = clickedElement.getBoundingClientRect();
        const syntheticEvent = {
          target: clickedElement,
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2
        };
        this.positionAndShowTooltip(syntheticEvent, this.recommendedCategories);
      } else {
        this.positionAndShowTooltip(event, this.recommendedCategories);
      }
    },

    findKeywordElement(keyword) {
      try {
        const keywordElements = this.$el.querySelectorAll('.keyword-highlight');
        for (const element of keywordElements) {
          const elementKeyword = element.getAttribute('data-keyword');
          if (elementKeyword === keyword) {
            return element;
          }
        }
        return null;
      } catch (error) {
        console.error('키워드 요소 찾기 오류:', error);
        return null;
      }
    },

    positionAndShowTooltip(event, recommendations) {
      try {
        const position = calculateTooltipPosition(event, recommendations);
        this.tooltipStyle = {
          ...createTooltipStyle(position),
          pointerEvents: "auto"
        };
        this.categorySearchInput = this.categorySearchFilter;
        this.showCategoryTooltip = true;
        this.cancelCloseTimer();
        this.renderTooltip();
      } catch (error) {
        console.error("툴팁 위치 계산 오류:", error);
        this.showCategoryTooltip = true;
      }
    },

    renderTooltip() {
      if (!this.shouldShowCategoryRecommendation || !this.showCategoryTooltip) return;
      if (!this.tooltipStyle) return;

      removeAllTooltips();
      const bodyTooltip = this.createBodyTooltip();
      document.body.appendChild(bodyTooltip);
    },

    createBodyTooltip() {
      const tooltip = document.createElement('div');
      tooltip.className = 'category-tooltip category-tooltip-body';
      Object.assign(tooltip.style, this.tooltipStyle);
      tooltip.innerHTML = generateTooltipHTML(
        this.filteredCategoriesForDisplay,
        this.activeFilters,
        this.extractedKeywords,
        this.categorySearchFilter,
        this.recommendedCategories
      );
      this.attachTooltipEvents(tooltip);
      return tooltip;
    },

    attachTooltipEvents(tooltip) {
      this.attachTooltipButtonEvents(tooltip);
      this.attachTooltipCategoryEvents(tooltip);
      this.attachSearchInputEvents(tooltip);
      this.attachTooltipMouseEvents(tooltip);
      this.attachDepth2FilterEvents(tooltip);
    },

    // 2뎁스 필터 칩 이벤트
    attachDepth2FilterEvents(tooltip) {
      tooltip.querySelectorAll('.depth2-filter-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          const filterValue = chip.getAttribute('data-depth2-filter');

          // 모든 칩 스타일 초기화
          tooltip.querySelectorAll('.depth2-filter-chip').forEach(c => {
            c.style.backgroundColor = 'white';
            c.style.color = '#495057';
          });

          // 클릭된 칩 활성화 스타일
          chip.style.backgroundColor = '#007bff';
          chip.style.color = 'white';

          // 필터링 적용
          this.applyDepth2Filter(tooltip, filterValue);
        });
      });
    },

    applyDepth2Filter(tooltip, filterValue) {
      const listContainer = tooltip.querySelector('.category-tooltip__list');
      if (!listContainer) return;

      const categoryItems = listContainer.querySelectorAll('[data-category]');
      categoryItems.forEach(item => {
        const category = item.getAttribute('data-category');
        const parts = category.split('>');
        const depth2 = parts.length >= 2 ? parts[1].trim() : '';

        if (filterValue === '전체' || depth2 === filterValue) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    },

    attachTooltipButtonEvents(tooltip) {
      const closeBtn = tooltip.querySelector('.close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.hideKeywordTooltip();
        });
      }

      const resetBtn = tooltip.querySelector('.reset-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.resetFiltersAndHideTooltip();
        });
      }
    },

    attachTooltipCategoryEvents(tooltip) {
      tooltip.querySelectorAll('[data-category]').forEach(item => {
        const category = item.getAttribute('data-category');
        item.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.applyCategoryRecommendation(category);
        });
        item.addEventListener('mouseover', () => {
          item.style.backgroundColor = '#e3f2fd';
          item.style.borderColor = '#1976d2';
        });
        item.addEventListener('mouseout', () => {
          item.style.backgroundColor = '#f8f9fa';
          item.style.borderColor = '#dee2e6';
        });
      });
    },

    attachSearchInputEvents(tooltip) {
      const searchInput = tooltip.querySelector('input[type="text"]');
      if (!searchInput) return;

      searchInput.value = this.categorySearchInput;

      // 디바운스 타이머
      let searchDebounceTimer = null;

      searchInput.addEventListener('input', (e) => {
        this.categorySearchInput = e.target.value;

        // 디바운스: 150ms 후 실시간 필터링 적용
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
          this.applyRealtimeSearchFilter(tooltip, e.target.value);
        }, 150);
      });

      searchInput.addEventListener('focus', () => {
        this.cancelCloseTimer();
      });
    },

    // 실시간 검색 필터링 (복합 키워드 지원: 쉼표로 구분)
    applyRealtimeSearchFilter(tooltip, searchTerm) {
      const listContainer = tooltip.querySelector('.category-tooltip__list');
      if (!listContainer) return;

      const categoryItems = listContainer.querySelectorAll('[data-category]');
      const trimmedTerm = searchTerm.trim();

      // 쉼표로 구분된 키워드 배열 생성
      const keywords = trimmedTerm
        .split(',')
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 0);

      categoryItems.forEach(item => {
        const category = item.getAttribute('data-category').toLowerCase();

        if (keywords.length === 0) {
          // 검색어가 없으면 모두 표시
          item.style.display = 'flex';
        } else {
          // 모든 키워드가 카테고리에 포함되어야 표시 (AND 조건)
          const allMatch = keywords.every(keyword => category.includes(keyword));
          item.style.display = allMatch ? 'flex' : 'none';
        }
      });

      // 검색 결과 개수 업데이트
      const visibleCount = Array.from(categoryItems).filter(
        item => item.style.display !== 'none'
      ).length;

      const metaSpan = tooltip.querySelector('span:last-of-type');
      if (metaSpan && metaSpan.textContent.includes('결과')) {
        metaSpan.textContent = `${visibleCount}개 결과`;
      }
    },

    attachTooltipMouseEvents(tooltip) {
      const mouseHandlers = {
        mouseenter: (e) => {
          e.stopPropagation();
          this.cancelCloseTimer();
        },
        mouseleave: (e) => {
          e.stopPropagation();
          this.startCloseTimer(2000);
        },
        click: (e) => {
          e.stopPropagation();
          this.cancelCloseTimer();
        }
      };

      Object.entries(mouseHandlers).forEach(([event, handler]) => {
        tooltip.addEventListener(event, handler);
      });
    },

    applyCategorySearch() {
      this.categorySearchFilter = this.categorySearchInput.trim();
      if (this.showCategoryTooltip) {
        this.renderTooltip();
      }
    },

    // 툴팁 숨기기
    hideKeywordTooltip() {
      this.showCategoryTooltip = false;
      this.recommendedCategories = [];
      this.extractedKeywords = [];
      this.topCategoriesCount = 0;
      this.categorySearchInput = this.categorySearchFilter;
      removeAllTooltips();
      // 키워드 하이라이트 상태 업데이트 (색상 복원)
      this.updateKeywordHighlights();
    },

    // 툴팁 닫기 타이머
    startCloseTimer(delay = 500) {
      this.cancelCloseTimer();
      this.tooltipCloseTimer = setTimeout(() => {
        if (this.showCategoryTooltip) this.hideKeywordTooltip();
      }, delay);
    },

    cancelCloseTimer() {
      if (this.tooltipCloseTimer) {
        clearTimeout(this.tooltipCloseTimer);
        this.tooltipCloseTimer = null;
      }
    },

    // 추천 카테고리 적용 (통합된 함수)
    applyCategoryRecommendation(category, shouldResetFilters = true) {
      if (!category) return;

      // 수정카테고리에 적용
      this.corrected_category = category;

      // 카테고리 검증
      this.validateCategory();

      // 성별/연령대 일치 검증
      this.checkGenderMatch();

      // 부모 컴포넌트에 업데이트 알림
      if (this.$parent && this.$parent.updateCategoryMapping) {
        this.$parent.updateCategoryMapping(this.message, this.corrected_category);
      }

      if (shouldResetFilters) {
        this.resetFiltersAndHideTooltip();  // 툴팁에서 선택 시
      } else {
        this.updateHighlightsIfSearchCategoryValid();  // 다중 키워드에서 선택 시
      }

      // 추천 목록 초기화 (적용 후 숨김)
      this.multiKeywordRecommendations = [];

      //console.log(`카테고리 적용: ${category}`);
    },
    // 네이버 쇼핑 검색
    searchOnNaver() {
      if (!this.dealname || this.dealname.trim() === '') {
        alert('상품명이 없습니다.');
        return;
      }
      let cleanProductName = this.dealname
        .replace(/\[.*?\]/g, '')
        .replace(/\(.*?\)/g, '')
        .replace(/【.*?】/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (cleanProductName === '') {
        alert('검색할 수 있는 상품명이 없습니다.');
        return;
      }
      const encodedQuery = encodeURIComponent(cleanProductName);
      const naverShoppingUrl = `https://search.shopping.naver.com/search/all?query=${encodedQuery}`;
      window.open(naverShoppingUrl, '_blank');
    },

    // 키워드 이벤트 연결
    attachKeywordEvents() {
      if (!this.shouldShowCategoryRecommendation || !this.$el?.querySelectorAll) return;
      const keywordHighlights = this.$el.querySelectorAll('.keyword-highlight');
      if (keywordHighlights.length === 0) return;

      this.detachKeywordEvents();

      keywordHighlights.forEach(element => {
        const keyword = element.getAttribute('data-keyword');
        if (!keyword) return;

        const clickHandler = (event) => {
          this.handleKeywordClick(event, keyword);
        };
        const mouseEnterHandler = () => {
          if (element.style.cursor === 'pointer') {
            element.style.transform = 'translateY(-1px)';
          }
        };
        const mouseLeaveHandler = () => {
          element.style.transform = 'translateY(0)';
        };

        element.addEventListener('click', clickHandler);
        element.addEventListener('mouseenter', mouseEnterHandler);
        element.addEventListener('mouseleave', mouseLeaveHandler);

        element._clickHandler = clickHandler;
        element._mouseEnterHandler = mouseEnterHandler;
        element._mouseLeaveHandler = mouseLeaveHandler;
      });
    },

    detachKeywordEvents() {
      if (!this.$el?.querySelectorAll) return;
      const keywordHighlights = this.$el.querySelectorAll('.keyword-highlight');
      keywordHighlights.forEach(element => {
        if (element._clickHandler) {
          element.removeEventListener('click', element._clickHandler);
          delete element._clickHandler;
        }
        if (element._mouseEnterHandler) {
          element.removeEventListener('mouseenter', element._mouseEnterHandler);
          delete element._mouseEnterHandler;
        }
        if (element._mouseLeaveHandler) {
          element.removeEventListener('mouseleave', element._mouseLeaveHandler);
          delete element._mouseLeaveHandler;
        }
      });
    },

    // 필터 추가/제거
    addFilter(keyword) {
      if (!this.activeFilters.includes(keyword)) {
        this.activeFilters.push(keyword);
      }
    },
    removeFilter(keyword) {
      const index = this.activeFilters.indexOf(keyword);
      if (index > -1) this.activeFilters.splice(index, 1);
    },

    // 키워드 필터링 적용
    applyKeywordFiltering() {
      if (this.activeFilters.length === 0) {
        // 필터가 없으면 원래 추천 카테고리로 복원
        const productKeywords = KeywordProcessor.extractProductKeywords(this.dealname);
        this.recommendedCategories = KeywordProcessor.findCategoriesByMultipleKeywords(productKeywords);
        this.filteredRecommendations = this.recommendedCategories;
        this.updateAvailableKeywords();
        return;
      }

      // 선택된 키워드로 필터링된 카테고리만 표시
      const filteredCategories = KeywordProcessor.findCategoriesByMultipleKeywords(this.activeFilters);
      this.recommendedCategories = filteredCategories;
      this.filteredRecommendations = filteredCategories;
      this.updateAvailableKeywords();
      if (this.showCategoryTooltip) {
        this.renderTooltip();
      }
    },

    // 카테고리에 키워드 포함 여부
    // 현재 필터링된 추천 카테고리 반환
    getFilteredRecommendations() {
      return this.filteredRecommendations;
    },

    // 사용 가능한 키워드 업데이트
    updateAvailableKeywords() {
      const productKeywords = KeywordProcessor.extractProductKeywords(this.dealname);
      // console.log('updateAvailableKeywords 호출:', {
      //   activeFilters: this.activeFilters,
      //   productKeywords: productKeywords
      // });

      if (this.activeFilters.length === 0) {
        this.availableKeywords = [...productKeywords];
        //  console.log('필터 없음, 모든 상품 키워드 사용 가능:', this.availableKeywords);
        return;
      }

      // 현재 활성 필터들은 항상 사용 가능
      this.availableKeywords = [...this.activeFilters];

      // 현재 필터로 걸러진 카테고리들
      const currentFilteredCategories = validCategories.filter(category => {
        return this.activeFilters.every(filter => KeywordProcessor.categoryContainsKeyword(category, filter));
      });

      // console.log('현재 필터로 걸러진 카테고리 수:', currentFilteredCategories.length);

      // 상품 키워드 중에서 추가로 필터링 가능한 키워드들 찾기
      productKeywords.forEach(keyword => {
        if (this.activeFilters.includes(keyword)) return;

        // 이 키워드를 추가했을 때 결과가 있는지 확인
        const testFilters = [...this.activeFilters, keyword];
        const testResults = validCategories.filter(category => {
          return testFilters.every(filter => KeywordProcessor.categoryContainsKeyword(category, filter));
        });

        // console.log(`키워드 "${keyword}" 테스트:`, {
        //   testFilters: testFilters,
        //   testResults: testResults.length
        // });

        // 결과가 있으면 사용 가능한 키워드로 추가
        if (testResults.length > 0) {
          this.availableKeywords.push(keyword);
        }
      });

      // console.log('최종 사용 가능한 키워드:', this.availableKeywords);
    },
    // 키워드 하이라이트 상태 업데이트
    updateKeywordHighlights() {
      const keywordElements = this.$el?.querySelectorAll('.keyword-highlight');
      if (!keywordElements || keywordElements.length === 0) return;
      keywordElements.forEach(element => {
        const keyword = element.getAttribute('data-keyword');
        if (!keyword) return;
        const isActive = this.activeFilters.includes(keyword);
        const isAvailable = this.availableKeywords.includes(keyword);
        this.applyKeywordStyle(element, isActive, isAvailable);
      });
    },

    // 카테고리에서 키워드 색상 표시
    getCategoryDisplayWithKeywordColors(category, keywordSource = 'active') {
      if (!category) return category;
      const keywords = keywordSource === 'active'
        ? this.activeFilters
        : this.corrected_category.split(',').map(k => k.trim()).filter(k => k.length >= 2);
      if (keywords.length === 0) return category;
      let displayText = category;
      keywords.forEach((keyword, index) => {
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const keywordRegex = new RegExp(`(${escapedKeyword})`, 'gi');
        const color = index === 0 ? '#1976d2' : '#d32f2f';
        displayText = displayText.replace(keywordRegex, `<span style="color: ${color};">$1</span>`);
      });
      return displayText;
    },

    // 다중 키워드 추천 카테고리 표시
    getMultiKeywordCategoryDisplay(category) {
      return this.getCategoryDisplayWithKeywordColors(category, 'corrected');
    },

    // 키워드 스타일 적용
    applyKeywordStyle(element, isActive, isAvailable) {
      element.style.fontWeight = '';
      element.style.padding = '';
      element.style.borderRadius = '';
      element.style.border = '';
      element.style.boxShadow = '';
      element.style.opacity = '';
      element.style.transition = '';
      element.style.transform = '';
      element.style.backgroundColor = '';

      // 스페셜 키워드 체크
      const keyword = element.getAttribute('data-keyword');
      const specialKeywords = ['남성', '남자', '여성', '여자', '아동', '키즈', '여아', '남아', '공용', '유아', '어린이'];
      const isSpecialKeyword = specialKeywords.includes(keyword);

      // 스페셜 키워드가 검색카테고리에 실제로 존재하는지 확인
      let isSpecialInCategory = false;
      if (isSpecialKeyword && this.search_category) {
        isSpecialInCategory = KeywordProcessor.categoryContainsKeyword(this.search_category, keyword);
      }

      if (isActive) {
        element.style.color = '#ff1744';
        element.style.cursor = 'pointer';
      } else if (isAvailable || this.activeFilters.length === 0) {
        element.style.color = '#1976d2';
        element.style.cursor = 'pointer';
      } else if (isSpecialKeyword && !isSpecialInCategory) {
        // 스페셜 키워드가 검색카테고리에 없으면 클릭 불가
        element.style.color = '#333';
        element.style.cursor = 'default';
      } else {
        element.style.color = '#9e9e9e';
        element.style.cursor = 'not-allowed';
      }
    },

    // 필터 초기화 및 툴팁 숨기기
    resetFiltersAndHideTooltip() {
      this.activeFilters = [];
      this.categorySearchFilter = "";
      this.categorySearchInput = "";

      // 원래 추천 카테고리로 복원
      const productKeywords = KeywordProcessor.extractProductKeywords(this.dealname);
      this.recommendedCategories = KeywordProcessor.findCategoriesByMultipleKeywords(productKeywords);
      this.filteredRecommendations = this.recommendedCategories;
      this.extractedKeywords = [];
      this.availableKeywords = [...productKeywords];

      this.updateKeywordHighlights();
      this.hideKeywordTooltip();
    },

    toggleMoreInfo() {
      this.showMoreInfo = toggleMoreInfo(this.showMoreInfo);
    },
    /**
     * 통합 하이라이트 함수
     * @param {string} text - 하이라이트할 텍스트
     * @param {string[]} compareWords - 비교어 배열(부분문자열 등)
     * @param {Object} options - 하이라이트 옵션
     * @param {boolean} options.isProductName - 상품명 여부 (activeFilters, 카테고리 키워드 포함)
     * @param {boolean} options.isCategoryDisplay - 카테고리 표시용 여부 (초록색 하이라이트)
     * @param {string[]} options.leafKeywords - 2단 키워드 (빨간색)
     * @param {string} options.primaryColor - 1단 키워드 색상 (기본: #1976d2)
     * @param {string} options.secondaryColor - 2단 키워드 색상 (기본: #dc3545)
     * @param {string} options.categoryColor - 카테고리 중복 키워드 색상 (기본: #28a745)
     */
    highlightText(text, compareWords = [], options = {}) {
      const {
        isProductName = false,
        isCategoryDisplay = false,
        isCorrectedCategory = false,
        leafKeywords = [],
        primaryColor = '#1976d2',
        secondaryColor = '#dc3545',
        categoryColor = '#fa002aff'  //상품명과 검카리프 중복
      } = options;

      // 특별 키워드 정의
      const specialKeywords = ['남성', '남자', '여성', '여자', '아동', '키즈', '여아', '남아', '공용', '유아', '어린이'];

      // console.log('highlightText 호출됨:', { text: text?.substring(0, 50), isProductName, options });

      if (!text) return text;

      // 수정카테고리와 상품명 간 중복 키워드 하이라이트 (빨간색) - 우선 처리
      if (isCorrectedCategory && this.dealname) {
        const productSubstrings = KeywordProcessor.extractKoreanSubstrings(this.dealname);
        const correctedCategorySubstrings = KeywordProcessor.extractKoreanSubstrings(text);
        const duplicateKeywords = this.findCommonWords(
          correctedCategorySubstrings,
          productSubstrings
        );

        // 2글자 이상의 중복 키워드만 필터링
        const meaningfulDuplicates = duplicateKeywords.filter(keyword => keyword.length >= 2);

        // 중복되는 키워드 제거 (긴 키워드가 있으면 짧은 키워드 제외)
        const filteredDuplicates = meaningfulDuplicates.filter((keyword, index) => {
          return !meaningfulDuplicates.some((otherKeyword, otherIndex) =>
            otherIndex !== index &&
            otherKeyword.length > keyword.length &&
            otherKeyword.includes(keyword)
          );
        });

        if (filteredDuplicates.length > 0) {
          return this.applyComplexHighlight(text, filteredDuplicates, specialKeywords, {
            baseColor: secondaryColor,
            isProductName,
            isCorrectedCategory: true
          });
        }
      }

      let highlightedText = KeywordProcessor.removeExcludedContent(text);
      const textWords = KeywordProcessor.extractKoreanSubstrings(text);

      // 카테고리 표시용 특별 처리
      if (isCategoryDisplay) {
        if (!this.dealname) return text;

        const productSubstrings = KeywordProcessor.extractKoreanSubstrings(this.dealname);
        const categorySubstrings = KeywordProcessor.extractKoreanSubstrings(text);
        const duplicateKeywords = this.findCommonWords(categorySubstrings, productSubstrings);

        if (duplicateKeywords.length === 0) return text;

        return this.applyComplexHighlight(text, duplicateKeywords, specialKeywords, {
          baseColor: categoryColor,
          isProductName: false,
          isCategoryDisplay: true
        });
      }

      // 일반 하이라이트 처리 - 모든 키워드를 분석하고 복합 스타일 적용

      // 모든 키워드 수집
      const allKeywords = new Map(); // keyword -> {types: Set, priority: number}

      // 카테고리 중복 키워드 (최고 우선순위)
      if (isProductName && this.search_category) {
        const productSubstrings = KeywordProcessor.extractKoreanSubstrings(text);
        const categorySubstrings = KeywordProcessor.extractKoreanSubstrings(this.search_category);
        const duplicateKeywords = this.findCommonWords(productSubstrings, categorySubstrings);

        duplicateKeywords.forEach(keyword => {
          if (!allKeywords.has(keyword)) {
            allKeywords.set(keyword, { types: new Set(), priority: 0 });
          }
          allKeywords.get(keyword).types.add('categoryDuplicate');
          allKeywords.get(keyword).priority = Math.max(allKeywords.get(keyword).priority, 4);
        });
      }

      // 1단 키워드 (공통 단어)
      let commonWords = this.findCommonWords(textWords, compareWords);

      // activeFilters 추가
      if (isProductName && this.activeFilters?.length > 0) {
        this.activeFilters.forEach(filter => {
          const filterFound = this.isEnglishKeyword(filter)
            ? highlightedText.toLowerCase().includes(filter.toLowerCase())
            : highlightedText.includes(filter);

          if (filterFound && !commonWords.includes(filter)) {
            commonWords.push(filter);
          }
        });
      }

      // 카테고리 기반 키워드 추가
      if (isProductName) {
        const mainCategory = KeywordProcessor.extractMainCategory(this.search_category);
        const categoryKeywords = KeywordProcessor.getCategoryKeywords(mainCategory);
        categoryKeywords.forEach(keyword => {
          const keywordFound = this.isEnglishKeyword(keyword)
            ? highlightedText.toLowerCase().includes(keyword.toLowerCase())
            : highlightedText.includes(keyword);

          if (keywordFound && keyword.length >= 2 && !commonWords.includes(keyword)) {
            commonWords.push(keyword);
          }
        });
      }

      commonWords.forEach(keyword => {
        if (!allKeywords.has(keyword)) {
          allKeywords.set(keyword, { types: new Set(), priority: 0 });
        }
        allKeywords.get(keyword).types.add('primary');
        allKeywords.get(keyword).priority = Math.max(allKeywords.get(keyword).priority, 2);
      });

      // 2단 키워드 (leafKeywords)
      const secondary = [];
      if (leafKeywords?.length > 0) {
        leafKeywords.forEach(keyword => {
          const keywordFound = this.isEnglishKeyword(keyword)
            ? highlightedText.toLowerCase().includes(keyword.toLowerCase())
            : highlightedText.includes(keyword);

          if (keywordFound && keyword.length >= 2) {
            secondary.push(keyword);
          }
        });
      }
      const filteredSecondary = secondary.filter(word => !commonWords.includes(word));

      filteredSecondary.forEach(keyword => {
        if (!allKeywords.has(keyword)) {
          allKeywords.set(keyword, { types: new Set(), priority: 0 });
        }
        allKeywords.get(keyword).types.add('secondary');
        allKeywords.get(keyword).priority = Math.max(allKeywords.get(keyword).priority, 3);
      });

      // 특별 키워드 추가
      if (isProductName) {
        specialKeywords.forEach(specialWord => {
          const keywordFound = this.isEnglishKeyword(specialWord)
            ? highlightedText.toLowerCase().includes(specialWord.toLowerCase())
            : highlightedText.includes(specialWord);

          if (keywordFound) {
            if (!allKeywords.has(specialWord)) {
              allKeywords.set(specialWord, { types: new Set(), priority: 0 });
            }
            allKeywords.get(specialWord).types.add('special');
            allKeywords.get(specialWord).priority = Math.max(allKeywords.get(specialWord).priority, 1);
          }
        });
      }

      // 복합 스타일 적용
      return this.applyComplexHighlightToAll(text, allKeywords, {
        primaryColor,
        secondaryColor,
        categoryColor,
        isProductName
      });
    },

    // 복합 스타일 적용 (단순 버전 - 수정카테고리, 카테고리 표시용)
    applyComplexHighlight(text, keywords, specialKeywords, options) {
      const { baseColor, isProductName, isCorrectedCategory, isCategoryDisplay } = options;
      let result = text;

      // 포함 관계에 있는 키워드 중 짧은 것 제거 (완력기가 있으면 력기 제거)
      const filteredKeywords = keywords.filter(shortKeyword => {
        const hasLongerKeyword = keywords.some(longKeyword =>
          longKeyword.length > shortKeyword.length && longKeyword.includes(shortKeyword)
        );
        return !hasLongerKeyword;
      });

      // 긴 키워드 먼저 처리 (완력기 > 력기)
      const sortedKeywords = [...filteredKeywords].sort((a, b) => b.length - a.length);

      sortedKeywords.forEach(keyword => {
        const isSpecial = specialKeywords.includes(keyword);
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`(?![^<]*>)(${escaped})(?![^<]*</)`, 'gi');

        let style = `color: ${baseColor}; cursor: pointer;`;

        // 특별 키워드이고 상품명인 경우 굵은 테두리 추가
        if (isSpecial && isProductName) {
          style += ' border: 2px solid #000; font-weight: bold; padding: 1px 2px;';
        }

        // 카테고리 표시용은 클릭 불가
        if (isCategoryDisplay) {
          style = style.replace('cursor: pointer;', '');
        }

        const spanClass = (isProductName || isCorrectedCategory) ? 'class="keyword-highlight" ' : '';
        const dataAttr = (isProductName || isCorrectedCategory) ? `data-keyword="${keyword}" ` : '';

        result = result.replace(re, `<span ${spanClass}${dataAttr}style="${style}">$1</span>`);
      });

      return result;
    },

    // 복합 스타일 적용 (전체 버전 - 모든 키워드 타입 처리)
    applyComplexHighlightToAll(text, allKeywords, colors) {
      const { primaryColor, secondaryColor, categoryColor, isProductName } = colors;
      let result = text;

      // 포함 관계에 있는 키워드 중 짧은 것 제거 (완력기가 있으면 력기 제거)
      const allKeywordsList = Array.from(allKeywords.keys());
      const filteredKeywords = new Map(allKeywords);
      allKeywordsList.forEach(shortKeyword => {
        // 더 긴 키워드가 이 키워드를 포함하는지 확인
        const hasLongerKeyword = allKeywordsList.some(longKeyword =>
          longKeyword.length > shortKeyword.length && longKeyword.includes(shortKeyword)
        );
        if (hasLongerKeyword) {
          filteredKeywords.delete(shortKeyword); // 짧은 키워드 제거
        }
      });

      // 우선순위 순으로 정렬 (높은 우선순위부터), 같은 우선순위면 긴 키워드 먼저
      const sortedKeywords = Array.from(filteredKeywords.entries())
        .sort(([keyA, a], [keyB, b]) => {
          if (b.priority !== a.priority) return b.priority - a.priority;
          return keyB.length - keyA.length; // 긴 키워드 먼저 (완력기 > 력기)
        });

      sortedKeywords.forEach(([keyword, info]) => {
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`(?![^<]*>)(${escaped})(?![^<]*</)`, 'gi');

        // 복합 스타일 결정
        const style = this.buildComplexStyle(info.types, {
          primaryColor,
          secondaryColor,
          categoryColor,
          isProductName
        });

        result = result.replace(re, `<span class="keyword-highlight" data-keyword="${keyword}" style="${style}">$1</span>`);
      });

      return result;
    },

    // 복합 스타일 빌드
    buildComplexStyle(types, colors) {
      const { primaryColor, secondaryColor, categoryColor, isProductName } = colors;
      let style = 'cursor: pointer;';

      // 색상 우선순위: categoryDuplicate > secondary > primary
      if (types.has('categoryDuplicate')) {
        style += ` color: ${categoryColor};`;
      } else if (types.has('secondary')) {
        style += ` color: ${secondaryColor};`;
      } else if (types.has('primary')) {
        style += ` color: ${primaryColor};`;
      } else {
        style += ' color: #333;'; // 기본 색상
      }

      // 특별 키워드 스타일 (상품명에서만)
      if (types.has('special') && isProductName) {
        style += ' border: 2px solid #000; font-weight: bold; padding: 1px 2px;';
      }

      return style;
    },

    // 영문 키워드 여부 확인
    isEnglishKeyword(keyword) {
      if (!keyword) return false;
      return /^[a-zA-Z0-9-]+$/.test(keyword);
    },

    // 공통 단어 찾기
    findCommonWords(textWords, compareWords) {
      if (!compareWords?.length) return [];
      const commonWords = [];
      textWords.forEach(textWord => {
        compareWords.forEach(compareWord => {
          // 영문 키워드의 경우 대소문자 구분 없이 비교
          if (this.isEnglishKeyword(textWord) && this.isEnglishKeyword(compareWord)) {
            if (textWord.toLowerCase() === compareWord.toLowerCase()) {
              commonWords.push(textWord); // 원본 텍스트의 대소문자 유지
            }
          } else if (textWord === compareWord) {
            commonWords.push(textWord);
          }
        });
      });
      return [...new Set(commonWords)].sort((a, b) => b.length - a.length);
    },

    // 리프(최종) 카테고리명 추출
    extractLeafCategory() {
      if (!this.search_category) return '';
      const categories = this.search_category.split('>').map(cat => cat.trim());
      return categories[categories.length - 1] || '';
    },

    // 모든 카테고리에서 리프 키워드 추출 (중복 제거 버전)
    getLeafKeywordsForAllCategories() {
      const leafKeywords = [];

      const pushLeaf = (leafText) => {
        if (!leafText) return;
        const arr = KeywordProcessor.extractKoreanSubstrings(leafText);
        leafKeywords.push(...arr);
      };

      // 검색
      pushLeaf(this.extractLeafCategory());

      // 수정
      if (this.corrected_category) {
        const parts = this.corrected_category.split('>').map(cat => cat.trim());
        pushLeaf(parts[parts.length - 1] || '');
      }

      // 전시
      if (this.display_category) {
        const parts = this.display_category.split('>').map(cat => cat.trim());
        pushLeaf(parts[parts.length - 1] || '');
      }

      return [...new Set(leafKeywords)].filter(k => k.length >= 2);
    },

    // 모든 하이라이트 업데이트(단일 진입점)
    updateHighlights() {
      if (!this.isValidSearchCategory()) {
        this.clearHighlights();
        return;
      }

      const productSubstrings = KeywordProcessor.extractKoreanSubstrings(this.dealname);
      const allCategoryText = [this.search_category, this.corrected_category, this.display_category].join(' ');
      const categorySubstrings = KeywordProcessor.extractKoreanSubstrings(allCategoryText);
      const leafKeywords = this.getLeafKeywordsForAllCategories();

      try {
        // 하이라이트 설정 정의
        const highlightConfigs = [
          { target: 'highlightedSearchCategory', text: this.search_category, compareWords: productSubstrings, options: { isProductName: false, leafKeywords } },
          { target: 'highlightedCorrectedCategory', text: this.corrected_category, compareWords: productSubstrings, options: { isProductName: false, leafKeywords, isCorrectedCategory: true } },
          { target: 'highlightedDisplayCategory', text: this.display_category, compareWords: productSubstrings, options: { isProductName: false, leafKeywords } }
        ];

        // 카테고리 텍스트 하이라이트 일괄 처리
        highlightConfigs.forEach(config => {
          this[config.target] = this.highlightText(config.text, config.compareWords, config.options);
        });

        // 상품명 하이라이트: activeFilters를 비교어에 추가
        const enhancedCategorySubs = [...categorySubstrings];
        if (this.activeFilters?.length) {
          this.activeFilters.forEach(f => { if (!enhancedCategorySubs.includes(f)) enhancedCategorySubs.push(f); });
        }
        // console.log('상품명 하이라이트 호출:', { dealname: this.dealname, enhancedCategorySubs, leafKeywords });
        this.highlightedDealname = this.highlightText(this.dealname, enhancedCategorySubs, { isProductName: true, leafKeywords });
      } catch (error) {
        console.error('하이라이트 적용 오류:', error);
        // 문제가 생겨도 최소한의 하이라이트 유지
        const fallbackConfigs = [
          { target: 'highlightedSearchCategory', text: this.search_category, compareWords: productSubstrings },
          { target: 'highlightedCorrectedCategory', text: this.corrected_category, compareWords: productSubstrings },
          { target: 'highlightedDisplayCategory', text: this.display_category, compareWords: productSubstrings },
          { target: 'highlightedDealname', text: this.dealname, compareWords: categorySubstrings, options: { isProductName: true } }
        ];

        fallbackConfigs.forEach(config => {
          this[config.target] = this.highlightText(config.text, config.compareWords, config.options || {});
        });
      }
    },

    // 유효한 검색 카테고리인지 확인
    isValidSearchCategory() {
      return this.search_category && this.search_category !== "" && this.search_category !== "정보 없음" && this.search_category !== "오류 발생";
    },

    // 하이라이트 초기화
    clearHighlights() {
      this.highlightedSearchCategory = "";
      this.highlightedCorrectedCategory = "";
      this.highlightedDisplayCategory = "";
      this.highlightedDealname = "";
    },





    // API 데이터 로드
    async get_InnerKeyword() {
      this.id = this.message;
      this.clearData();

      try {
        const response = await this.fetchProductData();
        this.handleApiResponse(response);
      } catch (error) {
        this.handleApiError(error);
      }
    },

    // 상품 데이터 가져오기
    async fetchProductData() {
      const apiUrl = `/1stapi/api/product/${this.message}`;
      return await axios.get(apiUrl);
    },

    // API 응답 처리
    handleApiResponse(response) {
      if (response.data?.success && response.data?.data) {
        this.populateDataFromBackendApi(response.data.data);
        // console.log("백엔드 API로 데이터 로드 성공");
      } else {
        console.error("백엔드 API 응답에 데이터가 없습니다:", response.data);
        this.handleNoData();
      }
    },

    clearData() {
      const clearedData = clearData();
      Object.assign(this, clearedData);
    },

    populateDataFromBackendApi(productData) {
      this.price = productData.final_dsc_prc || "";
      this.dealname = productData.prd_nm || "";
      this.prd_nm = productData.prd_nm || "";
      this.partner = productData.srch_mall_nm || "";

      // 이미지 URL 설정 (로컬 우선, CDN 폴백)
      const localImgUrl = `http://10.240.129.13/img/${this.id}/${this.id}.jpg`;
      const imgCheck = new Image();
      imgCheck.onload = () => {
        this.img_url = localImgUrl;
      };
      imgCheck.onerror = () => {
        this.img_url = productData.full_image_url || "";
      };
      imgCheck.src = localImgUrl;

      this.search_category = productData.search_category_path || "";
      this.display_category = productData.display_category_path || "";

      if (productData.ctlg_match_no_list && productData.ctlg_match_no_list !== "0") {
        this.rep_ctlg_no = productData.ctlg_match_no_list;
        this.iscatalog = "iscatalog";
        this.ctlg_brand_nm = productData.ctlg_match_no_list || "";
        this.ctlg_nm = "카탈로그 상품";
      }

      this.brand_nm = productData.srch_brand_nm || "";
      this.std_prd_yn = productData.opt_yn === "Y" ? PRODUCT_STATUS.MULTIPLE : PRODUCT_STATUS.SINGLE;

      // 디버깅: std_prd_yn 값 확인
      //  console.log('상품번호:', this.id, 'opt_yn:', productData.opt_yn, 'std_prd_yn:', this.std_prd_yn);

      this.$nextTick(() => {
        this.updateHighlights();
        this.initializeKeywordState();
        this.updateKeywordHighlights();
        // 상품 로드 후 성별 검증 (검색카테고리 vs 상품명)
        this.checkGenderMatch();
      });
    },

    handleNoData() {
      this.dealname = "상품 정보를 찾을 수 없습니다";
      this.search_category = "정보 없음";
      this.display_category = "정보 없음";
      this.partner = "정보 없음";
      this.price = "정보 없음";
      this.isdeleteprdNo = "deleted-product";
    },

    handleApiError(error) {
      console.error("API 호출 실패:", error);
      this.dealname = "API 호출 실패";
      this.search_category = "오류 발생";
      this.display_category = "오류 발생";
      this.partner = "오류 발생";
      this.price = "오류 발생";

      if (error.code === 'ECONNREFUSED' || (error.message && error.message.includes('Network Error'))) {
        this.dealname = "백엔드 서버에 연결할 수 없습니다";
        console.error("백엔드 서버가 실행되지 않았거나 포트 3100에서 접근할 수 없습니다.");
      }
    },

    getSubstring: function (a, b, c, d) {
      return getSubstring(a, b, c, d);
    },

    getProductTypeStyle() {
      return getProductTypeStyle(this.std_prd_yn);
    },

    fetch_tid: function () {
      this.refind_category = "";
      this.iscatalog = "";
      this.isdeleteprdNo = "";

      if (this.$parent.categoryMapping && this.$parent.categoryMapping[this.message]) {
        this.corrected_category = this.$parent.categoryMapping[this.message];
      } else {
        this.corrected_category = "";
      }

      if (this.$parent.remarksMapping && this.$parent.remarksMapping[this.message]) {
        this.remarks = this.$parent.remarksMapping[this.message];
      } else {
        this.remarks = "";
      }

      this.get_InnerKeyword();
    },

    // 통합된 하이라이트 업데이트 트리거
    updateHighlightsIfSearchCategoryValid() {
      if (this.search_category && this.search_category !== "" && this.search_category !== "정보 없음" && this.search_category !== "오류 발생") {
        this.$nextTick(() => this.updateHighlights());
      }
    },
  },
  mounted() {
    if (this.message != "") {
      this.fetch_tid();
    }
    this.initializeKeywordState();
    this.updateKeywordHighlights();
    this.attachKeywordEvents();
  },
  updated() {
    this.attachKeywordEvents();
  },
  beforeDestroy() {
    this.detachKeywordEvents();
    this.hideMultiKeywordTooltip(); // 컴포넌트 파괴 시 툴팁 제거
    removeAllTooltips();
  },
  watch: {
    message: function () {
      this.fetch_tid();
    },
    '$parent.categoryMapping': {
      handler: function (newVal) {
        if (newVal && newVal[this.message]) {
          this.corrected_category = newVal[this.message];
          this.validateCategory();
          this.checkGenderMatch();
        } else {
          this.corrected_category = "";
          // 수정카테고리가 없으면 검색카테고리로 성별 검증
          const genderResult = checkGenderMismatch(this.dealname, "", this.search_category);
          if (!genderResult.isValid) {
            this.isCategoryValid = false;
            this.categoryValidationMessage = genderResult.message;
          } else {
            this.isCategoryValid = true;
            this.categoryValidationMessage = "";
          }
        }
      },
      deep: true
    },
    '$parent.remarksMapping': {
      handler: function (newVal) {
        if (newVal && newVal[this.message]) {
          this.remarks = newVal[this.message];
        } else {
          this.remarks = "";
        }
      },
      deep: true
    },
    search_category: function (newVal) {
      if (newVal && newVal !== "" && newVal !== "정보 없음" && newVal !== "오류 발생") {
        this.$nextTick(() => this.updateHighlights());
      }
    },
    corrected_category: 'updateHighlightsIfSearchCategoryValid',
    display_category: 'updateHighlightsIfSearchCategoryValid',
    dealname: 'updateHighlightsIfSearchCategoryValid',
    'shouldShowCategoryRecommendation': function (newVal) {
      this.$nextTick(() => {
        if (newVal) {
          this.attachKeywordEvents();
        } else {
          this.detachKeywordEvents();
          this.hideKeywordTooltip();
        }
      });
    }
  },
});

export default ann;
