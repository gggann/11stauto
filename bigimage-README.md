# 🔍 BigImage 모듈

이미지 확대 기능을 제공하는 독립적인 JavaScript 모듈입니다. 상품 이미지를 모달로 확대하여 보여주는 기능을 간단하게 구현할 수 있습니다.

## ✨ 주요 기능

- 🖼️ 이미지 확대 모달 표시/숨기기
- ⌨️ ESC 키로 모달 닫기
- 🖱️ 모달 배경 클릭으로 닫기
- 🔘 확대 버튼 자동 생성
- 🎯 Vue.js 믹스인 제공
- 📱 반응형 디자인 (모바일 지원)
- ⚠️ 이미지 로드 에러 처리
- 🚫 스크롤 방지/복원

## 📦 설치 및 사용

### 1. 모듈 import

```javascript
import { BigImageModule } from './bigimage.js';
```

### 2. 기본 사용법

```javascript
// 이미지 확대 모달 표시
BigImageModule.showImageModal('https://example.com/image.jpg');

// 모달 닫기
BigImageModule.hideImageModal();
```

### 3. 확대 버튼 생성

```javascript
// 확대 버튼 생성
const zoomButton = BigImageModule.createZoomButton('이미지URL', {
    position: 'bottom-right', // 'top-right', 'bottom-left', 'top-left'
    icon: '🔍',
    title: '이미지 확대'
});

// 이미지 컨테이너에 버튼 추가
imageContainer.appendChild(zoomButton);
```

### 4. Vue.js에서 사용

```javascript
// Vue 컴포넌트에서 믹스인 사용
import { BigImageModule } from './bigimage.js';

const MyComponent = {
    mixins: [BigImageModule.getVueMixin()],
    template: `
        <div>
            <img :src="imageUrl" @click="showImageModal">
            <button @click="showImageModal">이미지 확대</button>
        </div>
    `,
    data() {
        return {
            imageUrl: 'https://example.com/image.jpg'
        };
    }
};
```

### 5. 기존 tt.js 파일 수정 예시

```javascript
// 기존 코드에서 이미지 확대 관련 부분을 모듈로 대체

// Before (기존 코드)
showImageModal() {
    this.showImageModalFlag = true;
    document.body.style.overflow = 'hidden';
},

hideImageModal() {
    this.showImageModalFlag = false;
    document.body.style.overflow = 'auto';
},

// After (모듈 사용)
import { BigImageModule } from './bigimage.js';

showImageModal() {
    if (this.img_url) {
        BigImageModule.showImageModal(this.img_url);
    }
},
```

## 🎛️ API 참조

### BigImageModule.showImageModal(imageUrl, onClose)

이미지 확대 모달을 표시합니다.

**매개변수:**
- `imageUrl` (string): 확대할 이미지 URL
- `onClose` (function, 선택사항): 모달 닫기 콜백 함수

### BigImageModule.hideImageModal()

이미지 확대 모달을 숨깁니다.

### BigImageModule.createZoomButton(imageUrl, options)

이미지 확대 버튼을 생성합니다.

**매개변수:**
- `imageUrl` (string): 이미지 URL
- `options` (object, 선택사항):
  - `position` (string): 버튼 위치 ('bottom-right', 'top-right', 'bottom-left', 'top-left')
  - `icon` (string): 버튼 아이콘 (기본: '🔍')
  - `title` (string): 버튼 툴팁 (기본: '이미지 확대')

**반환값:** HTMLElement (버튼 요소)

### BigImageModule.getVueMixin()

Vue.js 컴포넌트용 믹스인을 반환합니다.

**반환값:** Object (Vue 믹스인 객체)

## 🎨 스타일 커스터마이징

모달과 버튼의 스타일은 CSS로 커스터마이징할 수 있습니다:

```css
/* 모달 배경 */
.big-image-modal {
    background: rgba(0, 0, 0, 0.9) !important;
}

/* 확대 버튼 */
.image-zoom-btn {
    background: rgba(255, 255, 255, 0.8) !important;
    color: #333 !important;
}

/* 이미지 컨테이너 호버 시 버튼 표시 */
.image-container:hover .image-zoom-btn {
    opacity: 1 !important;
}
```

## 📱 반응형 지원

모듈은 자동으로 반응형 디자인을 지원합니다:
- 이미지는 화면 크기의 90%를 넘지 않습니다
- 모바일에서도 터치로 모달을 닫을 수 있습니다
- 이미지 비율을 유지하면서 최적화된 크기로 표시됩니다

## 🔧 기존 프로젝트 마이그레이션

기존 tt.js 파일에서 이미지 확대 기능을 분리하는 방법:

1. **bigimage.js 모듈 추가**
2. **tt.js에서 import 추가:**
   ```javascript
   import { BigImageModule } from "./bigimage.js";
   ```
3. **기존 이미지 모달 관련 코드 제거:**
   - `showImageModalFlag` 데이터 속성
   - 이미지 모달 템플릿 HTML
   - `showImageModal()`, `hideImageModal()` 메서드
4. **새로운 메서드로 교체:**
   ```javascript
   showImageModal() {
       if (this.img_url) {
           BigImageModule.showImageModal(this.img_url);
       }
   }
   ```

## 🚀 예시 파일

`bigimage-example.html` 파일을 참조하여 실제 동작을 확인할 수 있습니다.

## 📄 라이선스

이 모듈은 기존 프로젝트의 일부로 동일한 라이선스를 따릅니다.