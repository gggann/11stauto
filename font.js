// font.js - 이미지 크기와 글씨 크기 조절 기능

export function initializeFontSizeControl() {
  // 기본 설정값
  const defaultSettings = {
    imageSize: 220, // 기본 이미지 높이 (px)
    fontSize: 16,   // 기본 상품명 글씨 크기 (px)
    categoryFontSize: 14 // 기본 검색카테고리 글씨 크기 (px)
  };

  // 로컬 스토리지에서 설정 불러오기
  function loadSettings() {
    const saved = localStorage.getItem('fontSizeSettings');
    if (saved) {
      const parsedSettings = JSON.parse(saved);
      // 기존 설정에 새로운 속성이 없는 경우 기본값으로 설정
      return {
        ...defaultSettings,
        ...parsedSettings
      };
    }
    return defaultSettings;
  }

  // 설정을 로컬 스토리지에 저장
  function saveSettings(settings) {
    localStorage.setItem('fontSizeSettings', JSON.stringify(settings));
  }

  // 현재 설정 불러오기
  let currentSettings = loadSettings();

  // 이미지 크기 적용
  function applyImageSize(size) {
    const style = document.getElementById('dynamic-image-style') || document.createElement('style');
    style.id = 'dynamic-image-style';
    style.textContent = `
      .card-img-top {
        height: ${size}px !important;
      }
    `;
    if (!document.head.contains(style)) {
      document.head.appendChild(style);
    }
  }

  // 글씨 크기 적용
  function applyFontSize(size) {
    const style = document.getElementById('dynamic-font-style') || document.createElement('style');
    style.id = 'dynamic-font-style';
    style.textContent = `
      #상품명 {
        font-size: ${size}px !important;
      }
      #상품명입력 {
        font-size: ${size + 2}px !important;
      }
    `;
    if (!document.head.contains(style)) {
      document.head.appendChild(style);
    }
  }

  // 검색카테고리 글씨 크기 적용
  function applyCategoryFontSize(size) {
    const style = document.getElementById('dynamic-category-font-style') || document.createElement('style');
    style.id = 'dynamic-category-font-style';
    style.textContent = `
      #검색카테고리 {
        font-size: ${size}px !important;
      }
    `;
    if (!document.head.contains(style)) {
      document.head.appendChild(style);
    }
  }


  // 설정 패널 HTML 생성
  function createSettingsPanel() {
    return `
      <div id="settings-panel" style="
        position: fixed;
        bottom: 80px;
        right: 20px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        min-width: 250px;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.3s ease;
        pointer-events: none;
      ">
        <div style="font-size: 14px; font-weight: bold; margin-bottom: 15px; color: #333;">
          ⚙️ 표시 설정
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; font-size: 12px; color: #666; margin-bottom: 5px;">
            📷 이미지 크기
          </label>
          <input type="range" 
                 id="image-size-slider" 
                 min="150" 
                 max="400" 
                 step="10" 
                 value="${currentSettings.imageSize}"
                 style="width: 100%; margin-bottom: 5px;">
          <div style="font-size: 11px; color: #999; text-align: center;">
            <span id="image-size-value">${currentSettings.imageSize}</span>px
          </div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; font-size: 12px; color: #666; margin-bottom: 5px;">
            📝 상품명 글씨 크기
          </label>
          <input type="range" 
                 id="font-size-slider" 
                 min="12" 
                 max="40" 
                 step="1" 
                 value="${currentSettings.fontSize}"
                 style="width: 100%; margin-bottom: 5px;">
          <div style="font-size: 11px; color: #999; text-align: center;">
            <span id="font-size-value">${currentSettings.fontSize}</span>px
          </div>
        </div>
        
        <div style="margin-bottom: 10px;">
          <label style="display: block; font-size: 12px; color: #666; margin-bottom: 5px;">
            🏷️ 검색카테고리 글씨 크기
          </label>
          <input type="range" 
                 id="category-font-size-slider" 
                 min="10" 
                 max="40" 
                 step="1" 
                 value="${currentSettings.categoryFontSize}"
                 style="width: 100%; margin-bottom: 5px;">
          <div style="font-size: 11px; color: #999; text-align: center;">
            <span id="category-font-size-value">${currentSettings.categoryFontSize}</span>px
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 15px;">
          <button id="reset-settings" style="
            background: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 5px 10px;
            font-size: 11px;
            cursor: pointer;
            color: #666;
          ">초기화</button>
        </div>
      </div>
    `;
  }

  // 톱니바퀴 버튼 HTML 생성
  function createSettingsButton() {
    return `
      <div id="settings-button" style="
        position: fixed;
        bottom: 10px;
        right: 10px;
        width: 25px;
        height: 25px;
        background: rgba(128, 128, 128, 0.3);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 9999;
        transition: all 0.3s ease;
        color: rgba(255, 255, 255, 0.6);
        font-size: 12px;
        opacity: 0.2;
      " title="표시 설정">
        ⚙️
      </div>
    `;
  }

  // 이벤트 리스너 설정
  function setupEventListeners() {
    const settingsButton = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    const imageSizeSlider = document.getElementById('image-size-slider');
    const fontSizeSlider = document.getElementById('font-size-slider');
    const categoryFontSizeSlider = document.getElementById('category-font-size-slider');
    const imageSizeValue = document.getElementById('image-size-value');
    const fontSizeValue = document.getElementById('font-size-value');
    const categoryFontSizeValue = document.getElementById('category-font-size-value');
    const resetButton = document.getElementById('reset-settings');

    let hoverTimeout;
    let showButtonTimeout;
    let panelVisible = false;

    // 우측 하단 영역에 마우스 호버 감지
    const hoverArea = document.createElement('div');
    hoverArea.style.cssText = `
      position: fixed;
      bottom: 0;
      right: 0;
      width: 60px;
      height: 60px;
      z-index: 9998;
      pointer-events: auto;
    `;
    document.body.appendChild(hoverArea);

    // 마우스 호버로 버튼 표시 (1초 후)
    hoverArea.addEventListener('mouseenter', () => {
      showButtonTimeout = setTimeout(() => {
        settingsButton.style.opacity = '1';
        settingsButton.style.background = 'rgba(128, 128, 128, 0.7)';
        settingsButton.style.color = 'white';
      }, 1000);
    });

    hoverArea.addEventListener('mouseleave', () => {
      clearTimeout(showButtonTimeout);
      if (!panelVisible) {
        settingsButton.style.opacity = '0';
        settingsButton.style.background = 'rgba(128, 128, 128, 0.3)';
        settingsButton.style.color = 'rgba(255, 255, 255, 0.6)';
      }
    });

    // 버튼 클릭으로 패널 토글
    settingsButton.addEventListener('click', (e) => {
      e.stopPropagation();
      panelVisible = !panelVisible;
      
      if (panelVisible) {
        settingsPanel.style.opacity = '1';
        settingsPanel.style.transform = 'translateY(0)';
        settingsPanel.style.pointerEvents = 'auto';
        settingsButton.style.transform = 'scale(1.1)';
      } else {
        settingsPanel.style.opacity = '0';
        settingsPanel.style.transform = 'translateY(10px)';
        settingsPanel.style.pointerEvents = 'none';
        settingsButton.style.transform = 'scale(1)';
      }
    });

    // 패널 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
      if (!settingsPanel.contains(e.target) && !settingsButton.contains(e.target)) {
        panelVisible = false;
        settingsPanel.style.opacity = '0';
        settingsPanel.style.transform = 'translateY(10px)';
        settingsPanel.style.pointerEvents = 'none';
        settingsButton.style.transform = 'scale(1)';
      }
    });

    // 이미지 크기 슬라이더
    imageSizeSlider.addEventListener('input', (e) => {
      const size = parseInt(e.target.value);
      imageSizeValue.textContent = size;
      currentSettings.imageSize = size;
      applyImageSize(size);
      saveSettings(currentSettings);
    });

    // 글씨 크기 슬라이더
    fontSizeSlider.addEventListener('input', (e) => {
      const size = parseInt(e.target.value);
      fontSizeValue.textContent = size;
      currentSettings.fontSize = size;
      applyFontSize(size);
      saveSettings(currentSettings);
    });

    // 검색카테고리 폰트 크기 슬라이더 이벤트
    categoryFontSizeSlider.addEventListener('input', (e) => {
      const size = parseInt(e.target.value);
      categoryFontSizeValue.textContent = size;
      currentSettings.categoryFontSize = size;
      applyCategoryFontSize(size);
      saveSettings(currentSettings);
    });

    // 초기화 버튼
    resetButton.addEventListener('click', () => {
      currentSettings = { ...defaultSettings };
      imageSizeSlider.value = defaultSettings.imageSize;
      fontSizeSlider.value = defaultSettings.fontSize;
      categoryFontSizeSlider.value = defaultSettings.categoryFontSize;
      imageSizeValue.textContent = defaultSettings.imageSize;
      fontSizeValue.textContent = defaultSettings.fontSize;
      categoryFontSizeValue.textContent = defaultSettings.categoryFontSize;
      applyImageSize(defaultSettings.imageSize);
      applyFontSize(defaultSettings.fontSize);
      applyCategoryFontSize(defaultSettings.categoryFontSize);
      saveSettings(currentSettings);
    });
  }

  // 초기화 함수
  function initialize() {
    // 기존 요소들 제거 (중복 방지)
    const existingButton = document.getElementById('settings-button');
    const existingPanel = document.getElementById('settings-panel');
    if (existingButton) existingButton.remove();
    if (existingPanel) existingPanel.remove();

    // HTML 요소 추가
    document.body.insertAdjacentHTML('beforeend', createSettingsButton());
    document.body.insertAdjacentHTML('beforeend', createSettingsPanel());

    // 이벤트 리스너 설정
    setupEventListeners();

    // 저장된 설정 적용
    applyImageSize(currentSettings.imageSize);
    applyFontSize(currentSettings.fontSize);
    applyCategoryFontSize(currentSettings.categoryFontSize);
  }

  // DOM이 준비되면 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // 외부에서 사용할 수 있는 함수들
  return {
    applyImageSize,
    applyFontSize,
    applyCategoryFontSize,
    getCurrentSettings: () => currentSettings,
    resetSettings: () => {
      currentSettings = { ...defaultSettings };
      applyImageSize(defaultSettings.imageSize);
      applyFontSize(defaultSettings.fontSize);
      applyCategoryFontSize(defaultSettings.categoryFontSize);
      saveSettings(currentSettings);
    }
  };
}

// 자동 초기화
export const fontSizeControl = initializeFontSizeControl();