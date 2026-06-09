/**
 * 이미지 확대 모듈 (bigimage.js)
 * 상품 이미지를 모달로 확대하여 보여주는 기능을 제공합니다.
 */

export const BigImageModule = {
  /**
   * 이미지 확대 모달을 표시합니다
   * @param {string} imageUrl - 확대할 이미지 URL
   * @param {Function} onClose - 모달 닫기 콜백 함수 (선택사항)
   */
  showImageModal(imageUrl, onClose = null) {
    if (!imageUrl) {
      console.warn('이미지 URL이 제공되지 않았습니다.');
      return;
    }

    // 기존 모달이 있으면 제거
    this.hideImageModal();

    // 모달 생성
    const modal = this.createImageModal(imageUrl, onClose);
    document.body.appendChild(modal);

    // 스크롤 방지
    document.body.style.overflow = 'hidden';

    // ESC 키로 닫기 이벤트 추가
    this.addEscapeKeyListener();
  },

  /**
   * 이미지 확대 모달을 숨깁니다
   */
  hideImageModal() {
    const existingModal = document.querySelector('.big-image-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // 스크롤 복원
    document.body.style.overflow = 'auto';

    // ESC 키 이벤트 제거
    this.removeEscapeKeyListener();
  },

  /**
   * 이미지 모달 DOM 요소를 생성합니다
   * @param {string} imageUrl - 이미지 URL
   * @param {Function} onClose - 닫기 콜백 함수
   * @returns {HTMLElement} 모달 DOM 요소
   */
  createImageModal(imageUrl, onClose) {
    const modal = document.createElement('div');
    modal.className = 'big-image-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.36);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    `;

    // 이미지 컨테이너
    const imageContainer = document.createElement('div');
    imageContainer.style.cssText = `
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // 이미지 요소
    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt = '확대된 상품 이미지';
    image.style.cssText = `
      max-width: 90vw;
      max-height: 90vh;
      width: auto;
      height: auto;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(175, 241, 209, 0.43);
    `;

    // 닫기 버튼
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
      position: absolute;
      top: -40px;
      right: 0;
      background: rgba(255, 255, 255, 0.9);
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      cursor: pointer;
      font-size: 18px;
      font-weight: bold;
      color: #333;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    `;

    // 닫기 버튼 호버 효과
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.background = 'rgba(255, 255, 255, 1)';
      closeButton.style.transform = 'scale(1.1)';
    });

    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.background = 'rgba(255, 255, 255, 0.9)';
      closeButton.style.transform = 'scale(1)';
    });

    // 이벤트 리스너 추가
    this.addModalEventListeners(modal, image, closeButton, onClose);

    // DOM 구조 조립
    imageContainer.appendChild(image);
    imageContainer.appendChild(closeButton);
    modal.appendChild(imageContainer);

    return modal;
  },

  /**
   * 모달 이벤트 리스너를 추가합니다
   * @param {HTMLElement} modal - 모달 요소
   * @param {HTMLElement} image - 이미지 요소
   * @param {HTMLElement} closeButton - 닫기 버튼
   * @param {Function} onClose - 닫기 콜백 함수
   */
  addModalEventListeners(modal, image, closeButton, onClose) {
    // 모달 배경 클릭 시 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(onClose);
      }
    });

    // 이미지 클릭 시 이벤트 전파 중단 (모달이 닫히지 않도록)
    image.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // 닫기 버튼 클릭
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeModal(onClose);
    });

    // 이미지 로드 에러 처리
    image.addEventListener('error', () => {
      console.error('이미지를 로드할 수 없습니다:', image.src);
      image.alt = '이미지를 로드할 수 없습니다';
      image.style.background = '#f8f9fa';
      image.style.color = '#6c757d';
      image.style.display = 'flex';
      image.style.alignItems = 'center';
      image.style.justifyContent = 'center';
      image.style.minHeight = '200px';
      image.style.fontSize = '16px';
    });
  },

  /**
   * 모달을 닫습니다
   * @param {Function} onClose - 닫기 콜백 함수
   */
  closeModal(onClose) {
    this.hideImageModal();
    if (typeof onClose === 'function') {
      onClose();
    }
  },

  /**
   * ESC 키 이벤트 리스너를 추가합니다
   */
  addEscapeKeyListener() {
    this.escapeKeyHandler = (e) => {
      if (e.key === 'Escape') {
        this.hideImageModal();
      }
    };
    document.addEventListener('keydown', this.escapeKeyHandler);
  },

  /**
   * ESC 키 이벤트 리스너를 제거합니다
   */
  removeEscapeKeyListener() {
    if (this.escapeKeyHandler) {
      document.removeEventListener('keydown', this.escapeKeyHandler);
      this.escapeKeyHandler = null;
    }
  },

  /**
   * 이미지 확대 버튼을 생성합니다
   * @param {string} imageUrl - 이미지 URL
   * @param {Object} options - 버튼 옵션
   * @param {string} options.position - 버튼 위치 ('bottom-right', 'top-right', 'bottom-left', 'top-left')
   * @param {string} options.icon - 버튼 아이콘 (기본: '🔍')
   * @param {string} options.title - 버튼 툴팁 (기본: '이미지 확대')
   * @returns {HTMLElement} 확대 버튼 요소
   */
  createZoomButton(imageUrl, options = {}) {
    const {
      position = 'bottom-right',
      icon = '🔍',
      title = '이미지 확대'
    } = options;

    const button = document.createElement('button');
    button.innerHTML = icon;
    button.title = title;
    button.className = 'image-zoom-btn';

    // 위치별 스타일 설정
    const positionStyles = {
      'bottom-right': 'bottom: 8px; right: 8px;',
      'top-right': 'top: 8px; right: 8px;',
      'bottom-left': 'bottom: 8px; left: 8px;',
      'top-left': 'top: 8px; left: 8px;'
    };

    button.style.cssText = `
      position: absolute;
      ${positionStyles[position] || positionStyles['bottom-right']}
      background: rgba(0, 0, 0, 0.6);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 6px 8px;
      cursor: pointer;
      font-size: 12px;
      z-index: 10;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    // 클릭 이벤트
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showImageModal(imageUrl);
    });

    return button;
  },

  /**
   * Vue 컴포넌트용 믹스인을 반환합니다
   * @returns {Object} Vue 믹스인 객체
   */
  getVueMixin() {
    return {
      data() {
        return {
          showImageModalFlag: false
        };
      },
      methods: {
        showImageModal() {
          if (this.img_url) {
            BigImageModule.showImageModal(this.img_url, () => {
              this.showImageModalFlag = false;
            });
            this.showImageModalFlag = true;
          }
        },
        hideImageModal() {
          BigImageModule.hideImageModal();
          this.showImageModalFlag = false;
        }
      }
    };
  }
};

// 기본 내보내기
export default BigImageModule;