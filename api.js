const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3100;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 11번가 상품 정보 조회 함수
async function fetchProductInfo(prdNo) {
    try {
        // 11번가 검색 API URL 구성
        const apiUrl = `http://search-b.11stcorp.com/kr11st/1.0/search/rgoods?filter=prd_no,,${prdNo}&n=1`;
        
        console.log(`[API 요청] ${apiUrl}`);
        
        const response = await axios.get(apiUrl);
        const data = response.data;
        
        // 응답 데이터 확인
        if (data.response && data.response.rgoods && data.response.rgoods.documents) {
            const products = data.response.rgoods.documents;
            
            if (products.length > 0) {
                const product = products[0];
                
                // 검색카테고리 정보를 하나의 문자열로 합치는 함수
                const buildSearchCategoryPath = (product) => {
                    const categories = [
                        product.search_lctgr_nm,    // 대분류
                        product.search_mctgr_nm,    // 중분류  
                        product.search_sctgr_nm,    // 소분류
                        product.search_dctgr_nm     // 세분류
                    ].filter(cat => cat && cat.trim() !== ''); // 빈 값 제거
                    
                    return categories.length > 0 ? categories.join(' > ') : '';
                };
                
                // 전시카테고리 정보를 하나의 문자열로 합치는 함수
                const buildDisplayCategoryPath = (product) => {
                    const categories = [
                        product.matched_disp_ctgr1_nm,    // 전시 1분류
                        product.matched_disp_ctgr2_nm,    // 전시 2분류  
                        product.matched_disp_ctgr3_nm,    // 전시 3분류
                        product.matched_disp_ctgr4_nm     // 전시 4분류
                    ].filter(cat => cat && cat.trim() !== ''); // 빈 값 제거
                    
                    return categories.length > 0 ? categories.join(' > ') : '';
                };
                
                // 이미지 URL을 완전한 주소로 변환하는 함수
                const buildFullImageUrl = (product) => {
                    const imageUrl = product.base_img_url;
                    if (!imageUrl) return '';
                    
                    // 이미 완전한 URL인 경우 그대로 반환
                    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                        return imageUrl;
                    }
                    
                    // 상대 경로인 경우 11번가 이미지 도메인 추가
                    const baseImageDomain = 'https://cdn.011st.com';
                    return imageUrl.startsWith('/') ? baseImageDomain + imageUrl : baseImageDomain + '/' + imageUrl;
                };
                
                // 주요 정보만 추출하여 반환
                const extractedInfo = {
                    // === 기본 상품 정보 ===
                    prd_no: product.prd_no,                    // 상품번호
                    prd_nm: product.prd_nm,                    // 상품명
                    final_dsc_prc: product.final_dsc_prc,      // 최종할인가격
                    srch_mall_nm: product.srch_mall_nm,        // 셀러명
                    ctlg_match_no_list: product.ctlg_match_no_list, // 카탈로그번호
                    srch_brand_nm: product.srch_brand_nm,      // 브랜드명
                    opt_yn: product.opt_yn,                    // 옵션여부 (Y/N)
                    
                    // === 카테고리 정보 ===
                    search_category_path: buildSearchCategoryPath(product), // 검색 카테고리 경로
                    display_category_path: buildDisplayCategoryPath(product), // 전시 카테고리 경로
                    
                    // === 이미지 정보 ===
                    full_image_url: buildFullImageUrl(product), // 완전한 이미지 URL
                    original_image_url: product.base_img_url, // 원본 이미지 URL
                    
                    // === 검색 카테고리 상세 ===
                    search_lctgr_nm: product.search_lctgr_nm,
                    search_mctgr_nm: product.search_mctgr_nm,
                    search_sctgr_nm: product.search_sctgr_nm,
                    search_dctgr_nm: product.search_dctgr_nm,
                    
                    // === 전시 카테고리 상세 ===
                    matched_disp_ctgr1_nm: product.matched_disp_ctgr1_nm,
                    matched_disp_ctgr2_nm: product.matched_disp_ctgr2_nm,
                    matched_disp_ctgr3_nm: product.matched_disp_ctgr3_nm,
                    matched_disp_ctgr4_nm: product.matched_disp_ctgr4_nm,
                    
                    // === 기타 정보 ===
                    skpay_pnt_buy_cnfrm_json: product.skpay_pnt_buy_cnfrm_json,
                    search_dctgr_no: product.search_dctgr_no,
                    svc_cd_list: product.svc_cd_list,
                    rank_info_json: product.rank_info_json,
                    prmt_info_json: product.prmt_info_json,
                    bnft_info_list: product.bnft_info_list,
                    sel_mnbd_no: product.sel_mnbd_no
                };
                
                return extractedInfo;
            } else {
                return null;
            }
        } else {
            throw new Error('API 응답 형식이 예상과 다릅니다.');
        }
        
    } catch (error) {
        console.error(`[오류] 상품번호 ${prdNo} 정보 조회 실패:`, error.message);
        throw error;
    }
}

// 여러 상품번호를 한 번에 조회하는 함수 (배치 처리)
async function fetchMultipleProducts(prdNos) {
    try {
        // 상품번호들을 필터 파라미터로 변환
        const filterParam = prdNos.map(prdNo => `,,${prdNo}`).join('');
        const apiUrl = `http://search-b.11stcorp.com/kr11st/1.0/search/rgoods?filter=prd_no${filterParam}&n=${prdNos.length}`;
        
        console.log(`[배치 API 요청] ${prdNos.length}개 상품 조회`);
        console.log(`[URL] ${apiUrl}`);
        
        const response = await axios.get(apiUrl);
        const data = response.data;
        
        if (data.response && data.response.rgoods && data.response.rgoods.documents) {
            const products = data.response.rgoods.documents;
            
            // 요청한 상품번호와 응답받은 상품번호 비교
            const receivedPrdNos = products.map(p => p.prd_no);
            const missingPrdNos = prdNos.filter(prdNo => !receivedPrdNos.includes(prdNo));
            
            return {
                products: products,
                found: receivedPrdNos,
                missing: missingPrdNos,
                total_requested: prdNos.length,
                total_found: products.length
            };
        } else {
            throw new Error('API 응답 형식이 예상과 다릅니다.');
        }
        
    } catch (error) {
        console.error('[오류] 배치 상품 정보 조회 실패:', error.message);
        throw error;
    }
}

// API 라우트 정의

// 1. 단일 상품 조회 API
app.get('/api/product/:prdNo', async (req, res) => {
    try {
        const { prdNo } = req.params;
        
        // 상품번호 유효성 검사
        if (!prdNo || prdNo.trim() === '') {
            return res.status(400).json({
                success: false,
                error: '상품번호가 필요합니다.',
                code: 'MISSING_PRODUCT_NUMBER'
            });
        }
        
        console.log(`[API 요청] 상품번호 ${prdNo} 조회`);
        
        const productInfo = await fetchProductInfo(prdNo);
        
        if (productInfo) {
            res.json({
                success: true,
                data: productInfo,
                message: `상품번호 ${prdNo}의 정보를 성공적으로 조회했습니다.`
            });
        } else {
            res.status(404).json({
                success: false,
                error: `상품번호 ${prdNo}에 대한 정보를 찾을 수 없습니다.`,
                code: 'PRODUCT_NOT_FOUND'
            });
        }
        
    } catch (error) {
        console.error('[API 오류]', error);
        res.status(500).json({
            success: false,
            error: '상품 정보 조회 중 오류가 발생했습니다.',
            code: 'INTERNAL_SERVER_ERROR',
            details: error.message
        });
    }
});

// 2. 여러 상품 배치 조회 API
app.post('/api/products/batch', async (req, res) => {
    try {
        const { prdNos } = req.body;
        
        // 상품번호 배열 유효성 검사
        if (!prdNos || !Array.isArray(prdNos) || prdNos.length === 0) {
            return res.status(400).json({
                success: false,
                error: '상품번호 배열이 필요합니다.',
                code: 'MISSING_PRODUCT_NUMBERS'
            });
        }
        
        // 최대 조회 개수 제한 (성능상 이유로)
        if (prdNos.length > 100) {
            return res.status(400).json({
                success: false,
                error: '한 번에 최대 100개까지만 조회할 수 있습니다.',
                code: 'TOO_MANY_PRODUCTS'
            });
        }
        
        console.log(`[배치 API 요청] ${prdNos.length}개 상품 조회`);
        
        const result = await fetchMultipleProducts(prdNos);
        
        res.json({
            success: true,
            data: result,
            message: `${result.total_found}개 상품 정보를 성공적으로 조회했습니다.`
        });
        
    } catch (error) {
        console.error('[배치 API 오류]', error);
        res.status(500).json({
            success: false,
            error: '배치 상품 정보 조회 중 오류가 발생했습니다.',
            code: 'INTERNAL_SERVER_ERROR',
            details: error.message
        });
    }
});

// 3. 헬스체크 API
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '11번가 상품 API 서버가 정상 작동 중입니다.',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// 4. API 문서 (간단한 사용법 안내)
app.get('/api/docs', (req, res) => {
    res.json({
        title: '11번가 상품 정보 조회 API',
        version: '1.0.0',
        endpoints: {
            'GET /api/health': {
                description: '서버 상태 확인',
                example: 'GET /api/health'
            },
            'GET /api/product/:prdNo': {
                description: '단일 상품 정보 조회',
                parameters: {
                    prdNo: '상품번호 (필수)'
                },
                example: 'GET /api/product/6384365385'
            },
            'POST /api/products/batch': {
                description: '여러 상품 정보 배치 조회',
                body: {
                    prdNos: ['상품번호1', '상품번호2', '...']
                },
                example: 'POST /api/products/batch\n{ "prdNos": ["6384365385", "1234567890"] }'
            }
        },
        response_format: {
            success: 'boolean - 성공 여부',
            data: 'object - 응답 데이터',
            message: 'string - 응답 메시지',
            error: 'string - 오류 메시지 (실패시)',
            code: 'string - 오류 코드 (실패시)'
        }
    });
});

// 404 핸들러
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: '요청한 API 엔드포인트를 찾을 수 없습니다.',
        code: 'ENDPOINT_NOT_FOUND',
        available_endpoints: [
            'GET /api/health',
            'GET /api/docs',
            'GET /api/product/:prdNo',
            'POST /api/products/batch'
        ]
    });
});

// 에러 핸들러
app.use((error, req, res, next) => {
    console.error('[서버 오류]', error);
    res.status(500).json({
        success: false,
        error: '서버 내부 오류가 발생했습니다.',
        code: 'INTERNAL_SERVER_ERROR'
    });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`=== 11번가 상품 정보 조회 API 서버 ===`);
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`API 문서: http://localhost:${PORT}/api/docs`);
    console.log(`헬스체크: http://localhost:${PORT}/api/health`);
    console.log(`단일 상품 조회 예시: http://localhost:${PORT}/api/product/6384365385`);
    console.log('='.repeat(50));
});

module.exports = app;