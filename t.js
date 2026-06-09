import ann from './tt.js';
import modal from './ttmodal.js';
import { validCategories } from './검카체크.js';

const CATEGORY_STORAGE_KEY = 'ID_REVIEW_CATEGORY_MAP';

// 任务分配 API 设置
const ASSIGN_API_URL = 'http://10.240.129.13:3933';
const ASSIGN_USERS = [
    '张三', '李四', '王五', '赵六', '钱七',
    '孙八', '周九', '吴十', '郑十一', '王十二',
    '冯十三', '陈十四', '褚十五', '卫十六', '蒋十七',
    '沈十八', '韩十九', '杨二十'
];

// Supabase 설정
const SUPABASE_URL = 'https://oldxppwiuayzfdrfghrf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sZHhwcHdpdWF5emZkcmZnaHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzEyNTksImV4cCI6MjA4NjE0NzI1OX0.QLlHv9dso02L9XpSkIEX6TsqWOmFlLo4k6VocQQOb7M';

const app = new Vue({
    el: '#app',
    components: {
        ann,
        modal
    },
    data: {
        test: "",
        input: ``,
        // 任务分配相关
        currentUser: '',
        isAssigning: false,
        assignError: '',
        assignedCount: 0,
        assignUsers: ASSIGN_USERS,
        userNameInput: '', // 用户输入的名字
        canAssignNew: true, // 是否可以分配新任务
        isSubmitting: false, // 是否正在提交
        submitError: '', // 提交错误信息
        todaySubmittedCount: 0, // 今天已提交的数量
        remainingFreeCount: 0, // 剩余空闲商品数
        assignCount: parseInt(localStorage.getItem('ID_REVIEW_ASSIGN_COUNT')) || 50, // 배분 개수 (조절 가능)
        // 작업 타이머
        taskStartTime: null,
        taskElapsed: '00:00:00',
        taskTimerInterval: null,
        // 임시 저장
        autoSaveInterval: null,
        lastAutoSaveTime: '',
        // 일일 통계
        showDailyStats: false,
        dailyStats: [],
        correctedCategoriesInput: '', // 수정된 카테고리 입력
        remarksInput: '', // 비고 입력
        showModal: false,
        showSettingsModal: false, // 설정 모달 표시 여부
        closeTimer: null, // 모달 닫기 타이머
        deal_html: `<p> 로그인 </p>`, // 你的 HTML 内容
        // 표시 옵션들
        showDisplayCategory: false, // 전시카테고리 표시 옵션
        showModificationHistory: true, // 수정이력 표시 옵션
        showPrice: true, // 가격 표시 옵션
        showPartner: true, // 셀러 표시 옵션
        showCatalog: true, // 카탈로그 표시 옵션
        showBrand: true, // 브랜드 표시 옵션
        showStdProduct: true, // 단일상품여부 표시 옵션
        showHighlight: true, // 하이라이트 표시 옵션
        showCategoryRecommendation: true, // 추천카테고리 드롭메뉴 표시 옵션
        showSearchCategory: true, // 검색카테고리 표시 옵션
        showMultiSelect: false, // 다중 선택 모드 표시 옵션
        showImageOnly: false, // 이미지만 보기 (레거시, viewMode 'imageOnly'와 동기화)
        viewMode: 'default', // 'default', 'imageOnly', 'imageAndDisplay', 'imageAndSearch', 'imageAndAll' (레거시, viewMode로 대체)
        showCorrectedCategoryInput: true, // 수정카테고리 입력 표시 옵션
        showCorrectedCategoryPreview: false, // 수정카테고리 미리보기 표시 옵션
        selectedProducts: new Set(), // 선택된 상품들
        bulkCategory: '', // 일괄 적용할 카테고리
        processedFilter: 'showUnprocessed', // 처리된 상품 필터: 'all', 'showUnprocessed', 'showOnlyProcessed'
        processedProducts: new Set(), // 처리 완료된 상품들
        keywordFilter: 'all', // 키워드 선택 필터: 'all', 'selectedOnly'
        persistedCategories: {},

        // 일괄 적용용 자동완성 관련
        showBulkAutocomplete: false,
        bulkAutocompleteResults: [],
        selectedBulkAutocompleteIndex: -1,
        bulkAutocompleteTimer: null
    },
    computed: {
        inputAsArray() {
            // 把 textarea 里的内容拆成数组
            return this.input
                .replace(/\//g, ' ')
                .split(/[\s\n]+/)
                .filter(s => s);
        },
        correctedCategoriesArray() {
            // 수정된 카테고리를 배열로 변환 (공백 라인도 유지)
            return this.correctedCategoriesInput
                .split(/\n/)
                .map(s => s.trim());
        },
        remarksArray() {
            // 비고를 배열로 변환 (공백 라인도 유지)
            return this.remarksInput
                .split(/\n/)
                .map(s => s.trim());
        },
        categoryMapping() {
            // 상품번호와 수정된 카테고리를 1대1 매핑 (공백 항목 고려)
            const mapping = {};
            const products = this.inputAsArray;
            const categories = this.correctedCategoriesArray;

            for (let i = 0; i < products.length; i++) {
                if (i < categories.length) {
                    // 공백이 아닌 경우에만 매핑에 추가
                    if (categories[i] && categories[i].trim() !== '') {
                        mapping[products[i]] = categories[i].trim();
                    }
                }
            }
            return mapping;
        },
        remarksMapping() {
            // 상품번호와 비고를 1대1 매핑 (공백 항목 고려)
            const mapping = {};
            const products = this.inputAsArray;
            const remarks = this.remarksArray;

            for (let i = 0; i < products.length; i++) {
                if (i < remarks.length) {
                    // 공백이 아닌 경우에만 매핑에 추가
                    if (remarks[i] && remarks[i].trim() !== '') {
                        mapping[products[i]] = remarks[i].trim();
                    }
                }
            }
            return mapping;
        },

        // 필터링된 상품 목록
        filteredInputAsArray() {
            let products = this.inputAsArray;
            console.log('filteredInputAsArray 호출됨 66');
            console.log('전체 상품:', products.length);
            console.log('keywordFilter:', this.keywordFilter);
            console.log('processedFilter:', this.processedFilter);
            console.log('selectedProducts:', Array.from(this.selectedProducts));

            // 키워드 선택 필터링 적용 (새로운 독립적인 필터)
            if (this.keywordFilter === 'selectedOnly' && this.selectedProducts.size > 0) {
                const beforeKeywordFilter = products.length;
                products = products.filter(productId => this.selectedProducts.has(productId));
                console.log(`키워드 선택 필터링: ${beforeKeywordFilter} → ${products.length}`);
            }

            // 처리된 상품 필터링 적용
            if (this.processedFilter === 'showOnlyProcessed') {
                products = products.filter(productId => this.processedProducts.has(productId));
                console.log('처리된 상품만 보기 필터링 적용');
            } else if (this.processedFilter === 'showUnprocessed') {
                const beforeFilter = products.length;
                products = products.filter(productId => {
                    const isProcessed = this.processedProducts.has(productId);
                    if (isProcessed) {
                        console.log(`상품 ${productId}는 처리됨 - 필터링됨`);
                    }
                    return !isProcessed;
                });
                console.log(`처리 안된 상품 필터링: ${beforeFilter} → ${products.length}`);
            }
            // processedFilter === 'all'인 경우 필터링 없음

            console.log('최종 필터링된 상품 개수:', products.length);
            return products;
        }
    },
    methods: {
        handleRemove(id) {
            // 제거하기 전에 해당 상품의 인덱스를 먼저 찾기
            const productIndex = this.inputAsArray.indexOf(id);

            // 상품번호 배열에서 해당 ID 제거
            const filtered = this.inputAsArray.filter(item => item !== id);
            this.input = filtered.join('\n');

            // 수정된 카테고리에서도 해당 인덱스의 항목 제거
            const correctedCategoriesArray = [...this.correctedCategoriesArray];
            if (productIndex !== -1 && productIndex < correctedCategoriesArray.length) {
                correctedCategoriesArray.splice(productIndex, 1);
                this.correctedCategoriesInput = correctedCategoriesArray.join('\n');
            }

            // 비고에서도 해당 인덱스의 항목 제거
            const remarksArray = [...this.remarksArray];
            if (productIndex !== -1 && productIndex < remarksArray.length) {
                remarksArray.splice(productIndex, 1);
                this.remarksInput = remarksArray.join('\n');
            }
        },
        executeScripts: function (html) {
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            var scripts = tempDiv.getElementsByTagName('script');
            console.log(scripts)
            eval(scripts[4].innerText);

        },
        updateDealHtml(newDealHtml) {
            this.deal_html = newDealHtml;
            this.showModal = true
            // this.executeScripts(this.deal_html)
        },
        openModal: function () {
            this.showModal = true;
            console.log(this.deal_html)
        },
        closeModal: function () {
            this.showModal = false;
        },
        openSettingsModal: function () {
            this.showSettingsModal = true;
        },
        closeSettingsModal: function () {
            this.showSettingsModal = false;
            this.cancelCloseTimer();
        },
        startCloseTimer: function () {
            // 1초 후에 모달 닫기
            this.closeTimer = setTimeout(() => {
                this.closeSettingsModal();
            }, 1000);
        },
        cancelCloseTimer: function () {
            if (this.closeTimer) {
                clearTimeout(this.closeTimer);
                this.closeTimer = null;
            }
        },
        applySettings: function () {
            // 설정 적용 후 모달 닫기
            this.updateAllCardCategories();
            this.closeSettingsModal();
        },
        toggleHighlight: function () {
            // 하이라이트 기능 토글
            this.showHighlight = !this.showHighlight;
            console.log('하이라이트 기능:', this.showHighlight ? '켜짐' : '꺼짐');
        },
        resetInputs: function () {
            // 상품번호와 수정카테고리, 비고 초기화
            this.input = '';
            this.correctedCategoriesInput = '';
            this.remarksInput = '';
            this.clearPersistedCategories();

            console.log('입력 필드가 초기화되었습니다.');
        },
        printid: function () {
            console.log(this.inputAsArray)
        },
        updateAllCardCategories: function () {
            // 모든 ann 컴포넌트의 corrected_category와 remarks 업데이트
            this.$nextTick(() => {
                this.$children.forEach(child => {
                    if (child.$options.name === 'ann' || child.message) {
                        const productId = child.message;
                        if (this.categoryMapping[productId]) {
                            child.corrected_category = this.categoryMapping[productId];
                        } else {
                            child.corrected_category = "";
                        }
                        if (this.remarksMapping[productId]) {
                            child.remarks = this.remarksMapping[productId];
                        } else {
                            child.remarks = "";
                        }
                    }
                });
            });
        },
        updateCategoryMapping: function (productId, correctedCategory) {
            // 개별 상품의 수정카테고리 업데이트
            const productIndex = this.inputAsArray.indexOf(productId);
            if (productIndex !== -1) {
                const correctedCategoriesArray = [...this.correctedCategoriesArray];

                // 배열 크기를 상품 개수에 맞춰 조정
                while (correctedCategoriesArray.length < this.inputAsArray.length) {
                    correctedCategoriesArray.push('');
                }

                // 해당 인덱스에 수정카테고리 설정
                correctedCategoriesArray[productIndex] = correctedCategory || '';

                // correctedCategoriesInput 업데이트
                this.correctedCategoriesInput = correctedCategoriesArray.join('\n');
            }
        },
        loadPersistedCategories: function () {
            if (typeof localStorage === 'undefined') {
                return;
            }
            try {
                const saved = localStorage.getItem(CATEGORY_STORAGE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed && typeof parsed === 'object') {
                        this.persistedCategories = parsed;
                        this.syncCorrectedCategoriesWithPersisted(true);
                    }
                }
            } catch (error) {
                console.error('카테고리 저장 데이터 불러오기 실패:', error);
            }
        },
        syncCorrectedCategoriesWithPersisted: function (force = false) {
            if (!this.inputAsArray.length || !this.persistedCategories) {
                return;
            }
            const categoriesArray = [...this.correctedCategoriesArray];
            const originalLength = categoriesArray.length;
            if (categoriesArray.length > this.inputAsArray.length) {
                categoriesArray.length = this.inputAsArray.length;
            }
            while (categoriesArray.length < this.inputAsArray.length) {
                categoriesArray.push('');
            }
            let shouldUpdate = categoriesArray.length !== originalLength;
            this.inputAsArray.forEach((productId, index) => {
                const savedCategory = this.persistedCategories[productId];
                if (!savedCategory) {
                    return;
                }
                const currentValue = categoriesArray[index];
                if (force || !currentValue || currentValue.trim() === '') {
                    categoriesArray[index] = savedCategory;
                    shouldUpdate = true;
                }
            });
            if (shouldUpdate) {
                this.correctedCategoriesInput = categoriesArray.join('\n');
            }
        },
        persistCategoryMapping: function () {
            const mapping = this.categoryMapping;
            const newMapping = {};
            Object.keys(mapping).forEach(productId => {
                const category = mapping[productId];
                if (category && category.trim() !== '') {
                    newMapping[productId] = category.trim();
                }
            });
            this.persistedCategories = newMapping;
            this.savePersistedCategories();
        },
        savePersistedCategories: function () {
            if (typeof localStorage === 'undefined') {
                return;
            }
            try {
                const keys = Object.keys(this.persistedCategories);
                if (keys.length === 0) {
                    localStorage.removeItem(CATEGORY_STORAGE_KEY);
                } else {
                    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(this.persistedCategories));
                }
            } catch (error) {
                console.error('카테고리 저장 실패:', error);
            }
        },
        clearPersistedCategories: function () {
            this.persistedCategories = {};
            if (typeof localStorage === 'undefined') {
                return;
            }
            try {
                localStorage.removeItem(CATEGORY_STORAGE_KEY);
            } catch (error) {
                console.error('카테고리 저장 데이터 삭제 실패:', error);
            }
        },
        copyAllCorrectedCategories: function () {
            // 모든 수정카테고리를 탭으로 구분하여 복사 (엑셀 붙여넣기용)
            // 주의: 원본 inputAsArray 순서를 유지하여 복사 (필터링 무시)
            const invalidProducts = this.$children
                .filter(child => {
                    const isAnnComponent = child && ((child.$options && child.$options.name === 'ann') || child.message);
                    if (!isAnnComponent) {
                        return false;
                    }
                    const category = child.corrected_category;
                    if (!category || category.trim() === '') {
                        return false;
                    }
                    return !child.isCategoryValid;
                })
                .map(child => child.message || child.id)
                .filter(Boolean);

            // if (invalidProducts.length > 0) {
            //     const previewList = invalidProducts.slice(0, 5).join(', ');
            //     const moreText = invalidProducts.length > 5 ? ` 외 ${invalidProducts.length - 5}건` : '';
            //     alert(`카테고리 양식이 올바르지 않은 상품이 있습니다.\n상품번호: ${previewList}${moreText}\n수정 후 다시 시도해주세요.`);
            //     return;
            // }

            if (invalidProducts.length > 0) {
                const previewList = invalidProducts.slice(0, 5).join(', ');
                const moreText = invalidProducts.length > 5 ? ` 외 ${invalidProducts.length - 5}건` : '';

                // 使用 Toastify 替代 alert
                Toastify({
                    text: `⛔ 카테고리 오류: ${previewList}${moreText}\n수정 후 다시 시도해주세요.`,
                    duration: 4000,             // 4秒后自动消失 (自动动画离场)
                    gravity: "top",             // 通知出现在顶部
                    position: "right",          // 出现在右侧 (滑入/滑出效果)
                    stopOnFocus: true,          // 鼠标悬停时暂停计时
                    style: {
                        background: "linear-gradient(to right, #ff5f6d, #ffc371)", // 渐变红色背景
                        borderRadius: "10px",
                        boxShadow: "0px 4px 15px rgba(0,0,0,0.2)"
                    },
                    // 动画是 Toastify 内建的，不需要额外的配置
                }).showToast(); // 调用 showToast() 来显示通知

                return; // 阻止后续代码执行
            }


            const categories = this.inputAsArray.map(productId => {
                return this.categoryMapping[productId] || '';
            });

            const textToCopy = categories.join('\n'); // 탭으로 구분

            if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
                navigator.clipboard.writeText(textToCopy)
                    .then(() => {
                        console.log("모든 수정카테고리 복사 성공");
                        this.sendToSupabase();
                        alert("수정카테고리가 클립보드에 복사되었습니다. 엑셀에 붙여넣으세요.");
                    })
                    .catch((err) => {
                        console.error("복사 실패:", err);
                        this.fallbackCopyAll(textToCopy);
                    });
            } else {
                this.fallbackCopyAll(textToCopy);
            }
        },
        fallbackCopyAll: function (text) {
            try {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.left = '-999999px';
                textarea.style.top = '-999999px';
                document.body.appendChild(textarea);

                textarea.focus();
                textarea.select();

                const successful = document.execCommand('copy');
                document.body.removeChild(textarea);

                if (successful) {
                    console.log("Fallback 복사 성공");

                    // Supabase에 첫 번째 상품 데이터 전송 테스트
                    this.sendToSupabase();
                    alert("수정카테고리가 클립보드에 복사되었습니다. 엑셀에 붙여넣으세요.");
                } else {
                    console.error("Fallback 복사 실패");
                    alert("복사에 실패했습니다. 수동으로 복사해주세요.");
                }
            } catch (err) {
                console.error("Fallback 복사 오류:", err);
                alert("복사에 실패했습니다. 수동으로 복사해주세요.");
            }
        },

        // Supabase에 첫 번째 상품 데이터 전송
        sendToSupabase: async function () {
            try {
                // 상품 개수가 50개 초과일 때만 전송
                const totalCount = this.inputAsArray.length;
                if (totalCount <= 50) {
                    console.log(`상품 개수가 ${totalCount}개로 50개 이하이므로 전송하지 않습니다.`);
                    return;
                }

                // 수정카테고리가 있는 첫 번째 상품 찾기
                let targetProductId = null;
                let targetCategory = null;

                for (const productId of this.inputAsArray) {
                    const category = this.categoryMapping[productId];
                    if (category && category.trim() !== '') {
                        targetProductId = productId;
                        targetCategory = category;
                        break;  // 첫 번째로 발견된 것을 사용
                    }
                }

                // 수정카테고리가 하나도 없으면 첫 번째 상품 + 빈 카테고리 전송
                if (!targetProductId) {
                    targetProductId = this.inputAsArray[0];
                    targetCategory = '';
                    console.log('수정카테고리가 없어 첫 번째 상품을 빈 카테고리로 전송합니다.');
                }

                // 오늘 날짜 (YYYY-MM-DD 형식)
                const today = new Date().toISOString().split('T')[0];

                const data = {
                    date: today,
                    prd_no: targetProductId,
                    category: targetCategory,
                    updated_at: new Date().toISOString()
                };

                console.log(`상품 개수: ${totalCount}개 (50개 초과) - Supabase 전송 데이터:`, data);

                // UPSERT: 같은 prd_no가 있으면 업데이트, 없으면 삽입
                const response = await axios.post(
                    `${SUPABASE_URL}/rest/v1/product_categories`,
                    data,
                    {
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation,resolution=merge-duplicates'
                        }
                    }
                );

                console.log('Supabase 전송 성공 (UPSERT):', response.data);

            } catch (error) {
                console.error('Supabase 전송 실패:', error);
            }
        },

        loginButton: async function () {
            let username = 'PP30316'
            let password = "1!asdfgh"
            try {
                const response = await axios.post(
                    "https://k.11st.co.kr/seann/login",
                    {
                        username,
                        password,
                    },
                    { withCredentials: true }
                );
                if (response.status === 200) {
                    console.log("로그인 성공");
                }
            } catch (error) {
                console.error("로그인 실패", error);
            }

        },

        // 다중 선택 관련 메서드들은 tt.js의 handleSelectionChange에서 직접 처리

        toggleMultiSelectMode: function () {
            this.showMultiSelect = !this.showMultiSelect;
            if (!this.showMultiSelect) {
                // 다중 선택 모드를 끄면 모든 선택 해제 및 키워드 필터 해제
                this.selectedProducts.clear();
                this.updateAllSelectionStates();
                this.keywordFilter = 'all';
            }
        },

        selectAllProducts: function () {
            this.selectedProducts.clear();
            this.inputAsArray.forEach(productId => {
                this.selectedProducts.add(productId);
            });
            this.updateAllSelectionStates();

            // 다중 선택 모드 자동 활성화
            this.showMultiSelect = true;
        },

        clearAllSelections: function () {
            this.selectedProducts.clear();
            this.updateAllSelectionStates();

            // 키워드 필터만 해제 (다중 선택 모드는 유지)
            this.keywordFilter = 'all';
        },

        selectByProductKeywords: function (keywordsInput) {
            if (!keywordsInput || !keywordsInput.trim()) {
                alert('키워드를 입력해주세요.');
                return;
            }

            // 쉼표로 구분된 키워드를 배열로 변환
            const rawKeywords = keywordsInput
                .split(',')
                .map(k => k.trim())
                .filter(k => k.length > 0);

            if (rawKeywords.length === 0) {
                alert('유효한 키워드를 입력해주세요.');
                return;
            }

            // ✅ 分离正向关键词（include）和负向关键词（exclude）
            const includeKeywords = [];
            const excludeKeywords = [];

            rawKeywords.forEach(k => {
                if (k.startsWith('-')) {
                    excludeKeywords.push(k.substring(1).toLowerCase());
                } else {
                    includeKeywords.push(k.toLowerCase());
                }
            });

            this.selectedProducts.clear();
            let matchedCount = 0;

            this.inputAsArray.forEach(productId => {
                const component = this.getProductComponent(productId);
                const productName = (component && component.dealname ? component.dealname : '').toLowerCase();
                const idLower = productId.toLowerCase();

                // ✅ 检查正向关键词：必须全部匹配（如果有）
                const includeMatch = includeKeywords.length === 0 ||
                    includeKeywords.every(keyword =>
                        productName.includes(keyword) || idLower.includes(keyword)
                    );

                // ✅ 检查负向关键词：不能匹配任何一个
                const excludeMatch = excludeKeywords.length > 0 &&
                    excludeKeywords.some(keyword =>
                        productName.includes(keyword) || idLower.includes(keyword)
                    );

                // ✅ 最终条件：包含全部正向关键词 && 不包含任何负向关键词
                if (includeMatch && !excludeMatch) {
                    this.selectedProducts.add(productId);
                    matchedCount++;
                }
            });

            this.updateAllSelectionStates();

            // ✅ 结果提示
            let conditionText = '';
            if (includeKeywords.length > 0) {
                conditionText += `"${includeKeywords.join('", "')}" 포함`;
            }
            if (excludeKeywords.length > 0) {
                if (conditionText) conditionText += ' 및 ';
                conditionText += `"${excludeKeywords.join('", "')}" 미포함`;
            }

            if (!conditionText) conditionText = '조건에 맞는';

            if (matchedCount > 0) {
                // 다중 선택 모드와 키워드 필터 자동 활성화
                this.showMultiSelect = true;
                this.keywordFilter = 'selectedOnly';

                // Vue 반응성 강제 업데이트
                this.$nextTick(() => {
                    console.log('키워드 선택 후 filteredInputAsArray:', this.filteredInputAsArray);
                    console.log('keywordFilter:', this.keywordFilter);
                    console.log('selectedProducts size:', this.selectedProducts.size);
                    this.$forceUpdate();
                });

                alert(`${conditionText} 상품 ${matchedCount}개가 선택되었습니다. 선택된 상품만 화면에 표시됩니다.`);
            } else {
                alert(`${conditionText} 상품이 없습니다.`);
            }
        },


        getProductComponent: function (productId) {
            return this.$children.find(child => child.message === productId);
        },

        updateAllSelectionStates: function () {
            this.$nextTick(() => {
                this.$children.forEach(child => {
                    if (child.message) {
                        child.isSelected = this.selectedProducts.has(child.message);
                    }
                });
            });
        },

        applyBulkCategory: function () {
            if (!this.bulkCategory.trim()) {
                alert('적용할 카테고리를 입력해주세요.');
                return;
            }

            if (this.selectedProducts.size === 0) {
                alert('카테고리를 적용할 상품을 선택해주세요.');
                return;
            }

            // 선택된 상품들에 카테고리 일괄 적용
            this.selectedProducts.forEach(productId => {
                this.updateCategoryMapping(productId, this.bulkCategory.trim());
            });

            // 컴포넌트들의 카테고리 업데이트
            this.$nextTick(() => {
                this.$children.forEach(child => {
                    if (child.message && this.selectedProducts.has(child.message)) {
                        child.corrected_category = this.bulkCategory.trim();
                        child.validateCategory();
                        child.updateHighlightsIfSearchCategoryValid();
                    }
                });
            });

            alert(`${this.selectedProducts.size}개 상품에 카테고리가 적용되었습니다.`);
            this.bulkCategory = '';
        },

        getSelectedProductsInfo: function () {
            return {
                count: this.selectedProducts.size,
                products: Array.from(this.selectedProducts)
            };
        },

        // 일괄 적용용 자동완성 메서드들
        updateBulkAutocomplete: function () {
            if (this.bulkAutocompleteTimer) {
                clearTimeout(this.bulkAutocompleteTimer);
            }

            this.bulkAutocompleteTimer = setTimeout(() => {
                const query = this.bulkCategory.trim();
                if (query.length < 2) {
                    this.bulkAutocompleteResults = [];
                    return;
                }

                this.bulkAutocompleteResults = this.searchBulkCategories(query);
                this.selectedBulkAutocompleteIndex = -1;
            }, 150); // 150ms 디바운스
        },

        searchBulkCategories: function (query) {
            if (!query) return [];

            // 쉼표로 구분된 키워드들을 처리
            const inputKeywords = query
                .split(/[,\s\/]+/)
                .map(k => k.trim())
                .filter(k => k.length >= 1);

            if (inputKeywords.length === 0) return [];

            const results = [];

            // 단일 키워드인 경우 기존 로직 사용
            if (inputKeywords.length === 1) {
                const queryLower = inputKeywords[0].toLowerCase();

                // 정확히 일치하는 카테고리 우선
                const exactMatches = validCategories.filter(category =>
                    category.toLowerCase() === queryLower
                );

                // 시작하는 카테고리
                const startMatches = validCategories.filter(category =>
                    category.toLowerCase().startsWith(queryLower) &&
                    !exactMatches.includes(category)
                );

                // 포함하는 카테고리
                const containsMatches = validCategories.filter(category =>
                    category.toLowerCase().includes(queryLower) &&
                    !exactMatches.includes(category) &&
                    !startMatches.includes(category)
                );

                results.push(...exactMatches.slice(0, 2));
                results.push(...startMatches.slice(0, 5));
                results.push(...containsMatches.slice(0, 8));
            } else {
                // 다중 키워드인 경우: 모든 키워드가 포함된 카테고리만 반환
                const multiKeywordMatches = validCategories.filter(category => {
                    const categoryLower = category.toLowerCase();
                    return inputKeywords.every(keyword =>
                        categoryLower.includes(keyword.toLowerCase())
                    );
                });

                // 알파벳 순으로 정렬
                const sortedCategories = multiKeywordMatches.sort();

                results.push(...sortedCategories);
            }

            return results.slice(0, 15); // 최대 15개 결과
        },

        highlightBulkAutocompleteMatch: function (category) {
            if (!this.bulkCategory.trim()) return category;

            const query = this.bulkCategory.trim();

            // 쉼표로 구분된 키워드들을 처리
            const inputKeywords = query
                .split(',')
                .map(k => k.trim())
                .filter(k => k.length > 0);

            if (inputKeywords.length === 0) return category;

            let highlighted = category;

            // 각 키워드를 다른 색상으로 하이라이트
            inputKeywords.forEach((keyword, index) => {
                const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`(${escapedKeyword})`, 'gi');

                // 키워드별로 다른 색상 적용 (최대 3가지 색상 순환)
                const colors = [
                    { bg: '#fff3cd', color: '#856404' }, // 노란색
                    { bg: '#d1ecf1', color: '#0c5460' }, // 파란색
                    { bg: '#d4edda', color: '#155724' }  // 초록색
                ];
                const colorIndex = index % colors.length;
                const color = colors[colorIndex];

                highlighted = highlighted.replace(regex,
                    `<strong style="background-color: ${color.bg}; color: ${color.color};">$1</strong>`
                );
            });

            return highlighted;
        },

        handleBulkAutocompleteKeydown: function (event) {
            if (!this.showBulkAutocomplete || this.bulkAutocompleteResults.length === 0) return;

            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    this.selectedBulkAutocompleteIndex = Math.min(
                        this.selectedBulkAutocompleteIndex + 1,
                        this.bulkAutocompleteResults.length - 1
                    );
                    break;

                case 'ArrowUp':
                    event.preventDefault();
                    this.selectedBulkAutocompleteIndex = Math.max(this.selectedBulkAutocompleteIndex - 1, -1);
                    break;

                case 'Enter':
                    event.preventDefault();
                    if (this.selectedBulkAutocompleteIndex >= 0) {
                        this.selectBulkAutocompleteItem(this.bulkAutocompleteResults[this.selectedBulkAutocompleteIndex]);
                    } else {
                        this.applyBulkCategory();
                    }
                    break;

                case 'Escape':
                    this.hideBulkAutocomplete();
                    break;
            }
        },

        selectBulkAutocompleteItem: function (category) {
            this.bulkCategory = category;
            this.hideBulkAutocomplete();
        },

        hideBulkAutocompleteWithDelay: function () {
            setTimeout(() => {
                this.hideBulkAutocomplete();
            }, 150);
        },

        hideBulkAutocomplete: function () {
            this.showBulkAutocomplete = false;
            this.bulkAutocompleteResults = [];
            this.selectedBulkAutocompleteIndex = -1;
        },

        // 처리된 상품 필터 설정
        setProcessedFilter: function (filterType) {
            if (filterType === 'showOnlyProcessed' && this.processedProducts.size === 0) {
                alert('처리된 상품이 없습니다. 먼저 상품을 처리해주세요.');
                return;
            }

            this.processedFilter = filterType;

            // 상태 변경 알림
            if (filterType === 'all') {
                console.log('전체 상품을 표시합니다.');
            } else if (filterType === 'showUnprocessed') {
                console.log('처리 안된 상품만 표시합니다.');
            } else if (filterType === 'showOnlyProcessed') {
                console.log(`처리된 ${this.processedProducts.size}개 상품만 표시합니다.`);
            }
        },


        // 선택된 상품들을 처리로 표시 (카테고리 입력 없이도 가능)
        markSelectedAsProcessed: function () {
            if (this.selectedProducts.size === 0) {
                alert('처리할 상품을 선택해주세요.');
                return;
            }

            const selectedCount = this.selectedProducts.size;
            console.log('처리 전 selectedProducts:', Array.from(this.selectedProducts));
            console.log('처리 전 processedProducts:', Array.from(this.processedProducts));

            // 선택된 상품들을 처리 목록에 추가
            const newProcessedProducts = new Set(this.processedProducts);
            this.selectedProducts.forEach(productId => {
                newProcessedProducts.add(productId);
            });
            this.processedProducts = newProcessedProducts;

            console.log('처리 후 processedProducts:', Array.from(this.processedProducts));

            // 선택 해제
            this.clearAllSelections();

            // 처리된 상품은 바로 숨김 - 강제로 다시 설정
            this.processedFilter = 'showUnprocessed';

            // Vue의 반응성을 위해 nextTick 사용
            this.$nextTick(() => {
                console.log('hideProcessedProducts:', this.hideProcessedProducts);
                console.log('filteredInputAsArray 길이:', this.filteredInputAsArray.length);
                console.log('filteredInputAsArray 호출 후:', this.filteredInputAsArray);
                // 강제로 다시 렌더링 트리거
                this.$forceUpdate();
            });

            alert(`${selectedCount}개 상품이 처리되었습니다.`);
        },

        // 처리된 상품들 초기화
        clearProcessedProducts: function () {
            if (this.processedProducts.size === 0) {
                alert('처리된 상품이 없습니다.');
                return;
            }

            if (confirm(`처리된 ${this.processedProducts.size}개 상품을 초기화하시겠습니까?`)) {
                this.processedProducts.clear();
                alert('처리된 상품이 초기화되었습니다.');
            }
        },

        // 任务分配：为指定用户从API获取商品
        assignTasks: async function (userName) {
            if (!userName || userName.trim() === '') {
                this.assignError = '사용자 이름을 입력하세요';
                return;
            }

            if (!this.canAssignNew) {
                this.assignError = '현재 작업을 먼저 제출한 후 새 작업을 배분받으세요';
                return;
            }

            this.isAssigning = true;
            this.assignError = '';
            this.assignedCount = 0;

            try {
                const response = await axios.post(`${ASSIGN_API_URL}/rpc/assign_tasks`, {
                    p_user_name: userName.trim(),
                    p_count: this.assignCount
                });

                const result = response.data;
                console.log('API 반환 데이터:', result);

                // 提取 o_prd_no 字段
                let productIds = [];
                if (Array.isArray(result)) {
                    productIds = result.map(item => item.o_prd_no).filter(id => id);
                } else if (result && result.o_prd_no) {
                    // 如果返回的是单个对象
                    productIds = [result.o_prd_no];
                }

                if (productIds.length > 0) {
                    // 将返回的商品编号填入 input
                    this.input = productIds.join('\n');
                    this.assignedCount = productIds.length;
                    this.currentUser = userName.trim();
                    localStorage.setItem('ID_REVIEW_USER_NAME', this.currentUser);
                    this.canAssignNew = false; // 分配后不能再分配，需要先提交
                    this.startTaskTimer(); // 작업 타이머 시작
                    this.startAutoSave(); // 임시 저장 시작
                    console.log(`${userName} 배분받은 상품:`, productIds);

                    // 获取统计数据
                    await this.getTodayStats();
                    await this.getRemainingFreeCount();
                } else {
                    this.assignError = '배분 가능한 상품이 없습니다';
                }
            } catch (error) {
                this.assignError = `배분 실패: ${error.message}`;
                console.error('작업 배분 실패:', error);
            } finally {
                this.isAssigning = false;
            }
        },

        // 提交任务：将修改的分类提交到服务器
        submitTasks: async function () {
            if (!this.currentUser) {
                alert('먼저 작업을 배분받으세요');
                return;
            }

            if (this.inputAsArray.length === 0) {
                alert('제출할 상품이 없습니다');
                return;
            }

            // 检查是否所有商品都有修改的分类
            const productsWithoutCategory = this.inputAsArray.filter(productId => {
                const category = this.categoryMapping[productId];
                return !category || category.trim() === '';
            });

            if (productsWithoutCategory.length > 0) {
                const confirmSubmit = confirm(`${productsWithoutCategory.length}개 상품에 수정 카테고리가 없습니다. 계속 제출하시겠습니까?`);
                if (!confirmSubmit) {
                    return;
                }
            }

            this.isSubmitting = true;
            this.submitError = '';

            try {

                // 准备提交数据
                const submissions = this.inputAsArray.map(productId => ({
                    prd_no: productId,
                    category: this.categoryMapping[productId] || ''
                }));

                console.log('제출 데이터:', submissions);
                console.log('남은 상품 수:', this.remainingFreeCount);
                console.log('현재 작업 수:', this.inputAsArray.length);
                console.log('오늘 총 작업 수:', this.todaySubmittedCount + this.inputAsArray.length);

                // 使用RPC函数提交
                const response = await axios.post(
                    `${ASSIGN_API_URL}/rpc/submit_tasks`,
                    {
                        p_user_name: this.currentUser,
                        p_submissions: submissions
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                console.log('제출 성공:', response.data);

                const submittedCount = this.inputAsArray.length;

                // 清空当前数据
                this.input = '';
                this.correctedCategoriesInput = '';
                this.remarksInput = '';
                this.assignedCount = 0;

                // 提交成功后，允许分配新任务
                this.canAssignNew = true;

                // 清除处理状态
                this.processedProducts = new Set();
                this.selectedProducts = new Set();
                this.stopTaskTimer(); // 타이머 정지
                this.clearAutoSave(); // 임시 저장 삭제

                // 强制更新统计数据（延迟100ms确保数据库已更新）
                setTimeout(async () => {
                    await this.getTodayStats();
                    await this.getRemainingFreeCount();
                    this.$forceUpdate();
                    console.log('통계 업데이트 완료');
                }, 100);

                // 토스트 알림
                Toastify({
                    text: `✅ ${submittedCount}개 제출 완료! 새 작업 배분 중...`,
                    duration: 3000,
                    gravity: "top",
                    position: "center",
                    style: {
                        background: "linear-gradient(to right, #00b09b, #96c93d)",
                        borderRadius: "20px",
                        fontSize: "14px",
                        padding: "8px 20px"
                    }
                }).showToast();

                // 자동 재배분: 제출 후 바로 새 작업 배분 (딜레이 300ms)
                setTimeout(() => {
                    this.assignTasks(this.currentUser);
                }, 300);

            } catch (error) {
                this.submitError = `제출 실패: ${error.message}`;
                console.error('제출 실패:', error);
                alert(`제출 실패: ${error.message}`);
            } finally {
                this.isSubmitting = false;
            }
        },

        // 获取今天的统计数据（使用RPC函数）
        getTodayStats: async function () {
            if (!this.currentUser) {
                return;
            }

            try {
                const response = await axios.post(
                    `${ASSIGN_API_URL}/rpc/get_today_submitted_count`,
                    { p_user_name: this.currentUser },
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                this.todaySubmittedCount = response.data || 0;
                console.log(`${this.currentUser} 오늘 제출: ${this.todaySubmittedCount}개`);

            } catch (error) {
                console.error('오늘 통계 가져오기 실패:', error);
                this.todaySubmittedCount = 0;
            }
        },

        // 获取剩余空闲商品数量
        getRemainingFreeCount: async function () {
            try {
                const response = await axios.post(
                    `${ASSIGN_API_URL}/rpc/get_free_count`,
                    {},
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                this.remainingFreeCount = response.data || 0;
                console.log(`남은 상품: ${this.remainingFreeCount}개`);

            } catch (error) {
                console.error('남은 상품 수 가져오기 실패:', error);
                this.remainingFreeCount = 0;
            }
        },

        // 显示详细统计信息
        showStatistics: async function () {
            try {
                const response = await axios.post(
                    `${ASSIGN_API_URL}/rpc/get_statistics`,
                    {},
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                const stats = response.data[0];
                const message = `
📊 데이터베이스 통계

전체 상품: ${stats.total_products.toLocaleString()}개
남은 상품 (미배분+미제출): ${stats.free_products.toLocaleString()}개
제출된 상품: ${stats.submitted_products.toLocaleString()}개
배분됨 (미제출): ${stats.assigned_products.toLocaleString()}개

계산 검증:
${stats.free_products} + ${stats.submitted_products} + ${stats.assigned_products} = ${stats.free_products + stats.submitted_products + stats.assigned_products}
전체: ${stats.total_products}
                `.trim();

                alert(message);
                console.log('통계:', stats);

            } catch (error) {
                console.error('통계 가져오기 실패:', error);
                alert('통계 가져오기 실패: ' + error.message);
            }
        },

        // ========== 작업 타이머 ==========
        startTaskTimer: function () {
            this.stopTaskTimer();
            this.taskStartTime = Date.now();
            this.taskElapsed = '00:00:00';
            this.taskTimerInterval = setInterval(() => {
                const elapsed = Date.now() - this.taskStartTime;
                const h = String(Math.floor(elapsed / 3600000)).padStart(2, '0');
                const m = String(Math.floor((elapsed % 3600000) / 60000)).padStart(2, '0');
                const s = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
                this.taskElapsed = `${h}:${m}:${s}`;
            }, 1000);
        },
        stopTaskTimer: function () {
            if (this.taskTimerInterval) {
                clearInterval(this.taskTimerInterval);
                this.taskTimerInterval = null;
            }
        },

        // ========== 임시 저장 (30초마다) ==========
        startAutoSave: function () {
            this.stopAutoSave();
            // 기존 임시저장 불러오기
            this.loadAutoSave();
            this.autoSaveInterval = setInterval(() => {
                this.saveToLocalStorage();
            }, 30000); // 30초
        },
        stopAutoSave: function () {
            if (this.autoSaveInterval) {
                clearInterval(this.autoSaveInterval);
                this.autoSaveInterval = null;
            }
        },
        saveToLocalStorage: function () {
            const data = {
                input: this.input,
                correctedCategoriesInput: this.correctedCategoriesInput,
                remarksInput: this.remarksInput,
                currentUser: this.currentUser,
                assignedCount: this.assignedCount,
                savedAt: new Date().toLocaleTimeString('ko-KR')
            };
            localStorage.setItem('ID_REVIEW_AUTOSAVE', JSON.stringify(data));
            this.lastAutoSaveTime = data.savedAt;
            console.log('임시 저장 완료:', data.savedAt);
        },
        loadAutoSave: function () {
            try {
                const saved = localStorage.getItem('ID_REVIEW_AUTOSAVE');
                if (!saved) return;
                const data = JSON.parse(saved);
                // 같은 사용자의 데이터만 복원
                if (data.currentUser === this.currentUser && data.input) {
                    // 이미 새 배분을 받았으면 input은 덮어쓰지 않음
                    if (this.input && this.assignedCount > 0) {
                        // 새 배분 받은 상태 → 카테고리/비고만 복원 (같은 상품일 경우)
                        if (data.assignedCount === this.assignedCount) {
                            this.correctedCategoriesInput = data.correctedCategoriesInput || '';
                            this.remarksInput = data.remarksInput || '';
                            this.lastAutoSaveTime = data.savedAt;
                            console.log('임시 저장 복원 (카테고리/비고만):', data.savedAt);
                        }
                    }
                }
            } catch (e) {
                console.error('임시 저장 복원 실패:', e);
            }
        },
        clearAutoSave: function () {
            localStorage.removeItem('ID_REVIEW_AUTOSAVE');
            this.lastAutoSaveTime = '';
        },

        // ========== 배분 개수 조절 ==========
        updateAssignCount: function (count) {
            this.assignCount = parseInt(count) || 50;
            localStorage.setItem('ID_REVIEW_ASSIGN_COUNT', this.assignCount);
        },

        // ========== 일일 통계 ==========
        fetchDailyStats: async function () {
            try {
                const response = await axios.post(`${ASSIGN_API_URL}/rpc/get_daily_stats`, {});
                this.dailyStats = response.data || [];
                this.showDailyStats = true;
                console.log('일일 통계:', this.dailyStats);
            } catch (error) {
                console.error('일일 통계 가져오기 실패:', error);
                alert('일일 통계 가져오기 실패: ' + error.message);
            }
        },

        // 切换用户：返回用户选择界面
        switchUser: function () {
            this.stopTaskTimer();
            this.stopAutoSave();
            this.saveToLocalStorage(); // 전환 전 마지막 저장
            localStorage.removeItem('ID_REVIEW_USER_NAME');
            this.currentUser = '';
            this.userNameInput = '';
            this.input = '';
            this.correctedCategoriesInput = '';
            this.remarksInput = '';
            this.assignedCount = 0;
            this.assignError = '';
            this.canAssignNew = true;
            this.todaySubmittedCount = 0;
            this.taskElapsed = '00:00:00';
            this.clearPersistedCategories();
        }
    },
    mounted() {
        const queryString = window.location.search;
        if (queryString) {
            const id = queryString.substring(1);
            this.input = id;
        }
        // else {
        //   this.input = '默认ID';
        // }
        this.loadPersistedCategories();

        // 初始化统计数据
        this.getRemainingFreeCount();

        // localStorage에서 작업자명 복원 → 자동 배분
        const savedUser = localStorage.getItem('ID_REVIEW_USER_NAME');
        if (savedUser) {
            this.userNameInput = savedUser;
            this.assignTasks(savedUser);
        }

        // 滚动监听：向下滚动隐藏，向上滚动显示
        let lastScrollTop = 0;
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    const switchUserBar = document.querySelector('.switch-user-bar');

                    if (switchUserBar) {
                        if (currentScrollTop > lastScrollTop && currentScrollTop > 100) {
                            switchUserBar.classList.add('hidden');
                        } else if (currentScrollTop < lastScrollTop) {
                            switchUserBar.classList.remove('hidden');
                        }
                    }

                    lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
                    ticking = false;
                });
                ticking = true;
            }
        });

        // F6, F7, F8, F9 키로 뷰 모드 전환
        window.addEventListener('keydown', (e) => {
            let mode = '';
            let modeName = '';

            if (e.key === 'F6') {
                e.preventDefault();
                mode = this.viewMode === 'imageOnly' ? 'default' : 'imageOnly';
                modeName = '이미지만 보기';
            } else if (e.key === 'F7') { // 상품명 + 검색카테고리 + 수정카테고리
                e.preventDefault();
                mode = this.viewMode === 'nameSearchCorrected' ? 'default' : 'nameSearchCorrected';
                modeName = '상품명 + 검색/수정카테고리';
            } else if (e.key === 'F8') { // 검색카테고리 + 수정카테고리
                e.preventDefault();
                mode = this.viewMode === 'searchCorrected' ? 'default' : 'searchCorrected';
                modeName = '검색카테고리 + 수정카테고리';
            } else if (e.key === 'F9') { // 상품명 + 수정카테고리
                e.preventDefault();
                mode = this.viewMode === 'nameCorrected' ? 'default' : 'nameCorrected';
                modeName = '상품명 + 수정카테고리';
            }

            if (mode) {
                this.viewMode = mode;
                this.showImageOnly = (mode === 'imageOnly');

                const status = mode === 'default' ? '꺼짐 (기본모드)' : '켜짐';
                Toastify({
                    text: `${modeName} ${status}`,
                    duration: 2000,
                    gravity: "top",
                    position: "center",
                    style: {
                        background: mode !== 'default' ? "linear-gradient(to right, #00b09b, #96c93d)" : "#333",
                        borderRadius: "20px",
                        fontSize: "14px",
                        padding: "8px 20px"
                    }
                }).showToast();
            }
        });
    },
    watch: {
        // deal_html(newVal, oldVal) {
        //     console.log('deal_html changed: ', newVal);
        // }
        correctedCategoriesInput() {
            // 수정된 카테고리가 변경될 때마다 모든 카드 업데이트
            this.updateAllCardCategories();
            this.persistCategoryMapping();
        },
        remarksInput() {
            // 비고가 변경될 때마다 모든 카드 업데이트
            this.updateAllCardCategories();
        },
        input() {
            // 상품번호가 변경될 때도 카테고리 매핑 업데이트
            this.$nextTick(() => {
                // 상품 개수가 200개를 초과하면 경고 표시 및 초기화
                if (this.inputAsArray.length > 200) {
                    alert('상품 개수가 2000개를 초과했습니다. 입력을 초기화합니다.');
                    this.input = '';
                    return;
                }
                this.updateAllCardCategories();
                this.syncCorrectedCategoriesWithPersisted();
            });
        }
    }
});

// 전역에서 Vue 앱에 접근할 수 있도록 설정
window.vueApp = app;
