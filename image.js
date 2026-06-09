/**
 * 图片缩略图功能模块
 * 从 11image.js 中提取的核心功能：
 * 1. 创建缩略图容器
 * 2. 点击缩略图跳转到具体商品
 */

// 缩略图容器管理
class ThumbnailManager {
  constructor() {
    this.thumbnailContainer = null;
    this.images = [];
    this.keyHandlerBound = false; // 防止重复绑定键盘事件
    
    // 썸네일 설정 기본값
    this.thumbnailSize = 160; // 기본 크기
    this.thumbnailGap = 8;    // 기본 간격
    this.displayMode = 'category'; // 'category': 검색카테고리, 'productName': 상품명, 'modifiedCategory': 수정카테고리, 'none': 표시 안함
  }

  /**
   * 初始化缩略图功能
   */
  init() {
    this.bindEvents();
    console.log('ThumbnailManager 初始化完成');
  }

  /**
   * 绑定事件监听器
   */
  bindEvents() {
    // 防止重复绑定键盘事件
    if (this.keyHandlerBound) return;
    
    // 监听键盘事件 - 按 ` 키触发缩略图
    this.keyHandler = (event) => {
      // 입력 필드에서는 키보드 이벤트 무시
      const target = event.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      // 백틱 키 확인 - 더 넓은 범위로 체크
      const isBacktickKey = event.key === '`' || 
                           event.key === '~' || 
                           event.code === 'Backquote' ||
                           event.keyCode === 192 ||
                           event.which === 192;
      
      console.log('키보드 이벤트 감지:', {
        key: event.key,
        code: event.code,
        keyCode: event.keyCode,
        which: event.which,
        isBacktickKey: isBacktickKey,
        target: target.tagName
      });
      
      if (isBacktickKey) {
        event.preventDefault();
        event.stopPropagation();
        console.log('백틱 키로 썸네일 토글 실행');
        this.toggleThumbnailContainer();
      }
    };
    
    // keydown 이벤트만 등록 (keyup 제거로 중복 실행 방지)
    document.addEventListener('keydown', this.keyHandler, true);
    
    this.keyHandlerBound = true;
    console.log('키보드 이벤트 리스너 등록 완료');

    // 监听点击 #image1 元素（如果存在）
    if (typeof $ !== 'undefined') {
      $(document).on('click', '#image1', (event) => {
        event.preventDefault();
        this.showThumbnailContainer();
      });
    }
    
    // 추가 테스트용 - 전역 함수로 수동 실행 가능하게 함
    window.testThumbnail = () => {
      console.log('수동으로 썸네일 테스트 실행');
      this.toggleThumbnailContainer();
    };
  }

  /**
   * 切换缩略图容器显示/隐藏
   * 스크롤 위치 보존을 위해 display none/block만 토글
   */
  toggleThumbnailContainer() {
    if (this.thumbnailContainer && this.thumbnailContainer.style.display === 'block') {
      // 숨기기만 함 (스크롤 위치 보존)
      this.thumbnailContainer.style.display = 'none';
    } else if (this.thumbnailContainer && this.thumbnailContainer.innerHTML !== '') {
      // 이미 생성된 컨테이너가 있으면 보이기만 함 (스크롤 위치 보존)
      this.thumbnailContainer.style.display = 'block';
      this.thumbnailContainer.style.visibility = 'visible';
      this.thumbnailContainer.style.opacity = '1';
    } else {
      // 처음 열 때만 새로 생성
      this.showThumbnailContainer();
    }
  }

  /**
   * 显示缩略图容器
   */
  showThumbnailContainer() {
    console.log('显示缩略图容器');
    
    // 설정에서 썸네일 크기와 간격 가져오기
    this.getSettingsFromVue();
    
    // 移除现有容器
    this.removeThumbnailContainer();
    
    // 创建新容器
    this.createThumbnailContainer();
    
    // 收集图片
    this.collectImages();
    
    // 渲染缩略图
    this.renderThumbnails();
    
    // 显示容器
    this.thumbnailContainer.style.display = 'block';
    console.log('썸네일 컨테이너 표시됨');
    console.log('컨테이너 스타일:', {
      display: this.thumbnailContainer.style.display,
      position: this.thumbnailContainer.style.position,
      zIndex: this.thumbnailContainer.style.zIndex,
      background: this.thumbnailContainer.style.background
    });
    
    // 강제로 컨테이너가 보이도록 추가 스타일 적용
    this.thumbnailContainer.style.visibility = 'visible';
    this.thumbnailContainer.style.opacity = '1';
  }

  /**
   * 隐藏缩略图容器
   * 스크롤 위치 보존을 위해 innerHTML은 유지
   */
  hideThumbnailContainer() {
    if (this.thumbnailContainer) {
      this.thumbnailContainer.style.display = 'none';
      // innerHTML을 지우지 않아 스크롤 위치 보존
    }
  }

  /**
   * 移除缩略图容器
   */
  removeThumbnailContainer() {
    const existingContainer = document.getElementById('thumbnailContainer');
    if (existingContainer) {
      existingContainer.remove();
    }
    this.thumbnailContainer = null;
  }

  /**
   * 创建缩略图容器
   */
  createThumbnailContainer() {
    this.thumbnailContainer = document.createElement('div');
    this.thumbnailContainer.id = 'thumbnailContainer';
    
    // 设置容器样式
    Object.assign(this.thumbnailContainer.style, {
      display: 'none',
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.8)',
      zIndex: '1000',
      overflow: 'auto',
      padding: '20px',
      boxSizing: 'border-box'
    });

    // 添加点击背景关闭功能
    this.thumbnailContainer.addEventListener('click', (event) => {
      if (event.target === this.thumbnailContainer) {
        this.hideThumbnailContainer();
      }
    });

    // 添加到页面
    document.body.appendChild(this.thumbnailContainer);
  }

  /**
   * 收集页面中的图片
   */
  collectImages() {
    this.images = [];
    console.log('이미지 수집 시작...');
    
    // 从商品卡片中收集图片 - 使用实际的DOM结构
    const productCards = document.querySelectorAll('.card.card-normal');
    console.log('찾은 .card.card-normal 요소:', productCards.length);
    
    productCards.forEach((card, index) => {
      console.log(`카드 ${index + 1} 처리 중...`);
      const img = card.querySelector('#상품이미지');
      const link = card.querySelector('#상품링크');
      const productNumber = card.querySelector('#상품번호');
      const productName = card.querySelector('#상품명');
      
      console.log(`카드 ${index + 1}:`, {
        img: !!img,
        imgSrc: img?.src,
        link: !!link,
        linkHref: link?.href,
        productNumber: productNumber?.textContent?.trim(),
        productName: productName?.textContent?.trim()
      });
      
      if (img && link && img.src) {
        // 获取商品信息
        const productInfo = {
          number: productNumber ? productNumber.textContent.trim() : `상품${index + 1}`,
          name: productName ? productName.textContent.trim() : '상품명 없음'
        };
        
        this.images.push({
          src: img.src,
          href: link.href,
          alt: img.alt || '상품 이미지',
          card: card,
          productInfo: productInfo,
          index: index
        });
        console.log(`카드 ${index + 1} 이미지 추가됨`);
      } else {
        console.log(`카드 ${index + 1} 스킵됨 - 필수 요소 누락`);
      }
    });

    // 如果没有找到商品卡片图片，尝试使用ID选择器（处理重复ID问题）
    if (this.images.length === 0) {
      console.log('첫 번째 방법 실패, ID 선택자로 시도...');
      const cardElements = document.querySelectorAll('[id="상품카드"]');
      console.log('찾은 [id="상품카드"] 요소:', cardElements.length);
      
      cardElements.forEach((card, index) => {
        console.log(`ID 기반 카드 ${index + 1} 처리 중...`);
        const img = card.querySelector('[id="상품이미지"]');
        const link = card.querySelector('[id="상품링크"]');
        const productNumber = card.querySelector('[id="상품번호"]');
        const productName = card.querySelector('[id="상품명"]');
        
        console.log(`ID 기반 카드 ${index + 1}:`, {
          img: !!img,
          imgSrc: img?.src,
          link: !!link,
          linkHref: link?.href
        });
        
        if (img && link && img.src) {
          const productInfo = {
            number: productNumber ? productNumber.textContent.trim() : `상품${index + 1}`,
            name: productName ? productName.textContent.trim() : '상품명 없음'
          };
          
          this.images.push({
            src: img.src,
            href: link.href,
            alt: img.alt || '상품 이미지',
            card: card,
            productInfo: productInfo,
            index: index
          });
          console.log(`ID 기반 카드 ${index + 1} 이미지 추가됨`);
        }
      });
    }

    // 更灵活的搜索方式 - 查找包含商品图片的链接
    if (this.images.length === 0) {
      console.log('ID 방법도 실패, 유연한 검색 시도...');
      const productLinks = document.querySelectorAll('a[href*="11st.co.kr/products/"]');
      console.log('찾은 상품 링크:', productLinks.length);
      
      productLinks.forEach((link, index) => {
        const img = link.querySelector('img');
        if (img && img.src && img.offsetWidth > 50 && img.offsetHeight > 50) {
          const card = link.closest('.card') || link.closest('[id="상품카드"]');
          
          this.images.push({
            src: img.src,
            href: link.href,
            alt: img.alt || '상품 이미지',
            card: card,
            productInfo: {
              number: `상품${index + 1}`,
              name: img.alt || '상품명 없음'
            },
            index: index
          });
          console.log(`유연한 검색으로 이미지 ${index + 1} 추가됨`);
        }
      });
    }

    // 最后的备选方案：收集页面中的所有图片
    if (this.images.length === 0) {
      const allImages = document.querySelectorAll('img');
      allImages.forEach((img, index) => {
        if (img.src && img.offsetWidth > 50 && img.offsetHeight > 50) {
          // 查找最近的链接
          let link = img.closest('a');
          
          this.images.push({
            src: img.src,
            href: link ? link.href : null,
            alt: img.alt || '图片',
            card: null,
            productInfo: {
              number: `이미지${index + 1}`,
              name: img.alt || '图片'
            },
            index: index
          });
        }
      });
    }

    console.log(`수집된 이미지: ${this.images.length}개`);
  }

  /**
   * 渲染缩略图
   */
  renderThumbnails() {
    console.log('renderThumbnails 호출됨, images.length:', this.images.length);
    console.log('thumbnailContainer 존재:', !!this.thumbnailContainer);
    
    if (!this.thumbnailContainer) {
      console.error('thumbnailContainer가 존재하지 않음');
      return;
    }
    
    if (this.images.length === 0) {
      console.warn('수집된 이미지가 없음');
      this.thumbnailContainer.innerHTML = `
        <div style="color: white; text-align: center; padding: 50px; font-size: 18px; background: rgba(255,0,0,0.3); border: 2px solid white; margin: 20px;">
          <h2>디버그 모드</h2>
          <p>수집된 이미지가 없습니다.</p>
          <p>상품 카드가 로드될 때까지 잠시 기다려주세요.</p>
          <button onclick="location.reload()" style="background: white; color: black; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">
            페이지 새로고침
          </button>
          <br><br>
          <small>이 메시지가 보인다면 컨테이너는 정상 작동 중입니다.</small>
        </div>
      `;
      return;
    }

    // 创建标题 - 极简版本
    const title = document.createElement('div');
    title.textContent = `${this.images.length}개`;
    title.style.cssText = `
      color: rgba(255, 255, 255, 0.5);
      text-align: center;
      margin-bottom: 5px;
      font-size: 10px;
      font-weight: normal;
    `;
    this.thumbnailContainer.appendChild(title);

    // 创建关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 20px;
      right: 30px;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      font-size: 24px;
      cursor: pointer;
      z-index: 1001;
    `;
    closeBtn.addEventListener('click', () => this.hideThumbnailContainer());
    this.thumbnailContainer.appendChild(closeBtn);

    // 创建새로고침 버튼 (톱니바퀴 옆에 별도로)
    const refreshButton = this.createRefreshButton();
    this.thumbnailContainer.appendChild(refreshButton);

    // 创建设置按钮
    const settingsButton = this.createSettingsButton();
    this.thumbnailContainer.appendChild(settingsButton);

    // 创建控制面板 (초기에는 숨김)
    const controlPanel = this.createControlPanel();
    controlPanel.style.display = 'none';
    controlPanel.id = 'thumbnailControlPanel';
    this.thumbnailContainer.appendChild(controlPanel);

    // 创建图片网격容器
    const gridContainer = document.createElement('div');
    gridContainer.id = 'thumbnailGrid';
    gridContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(${this.thumbnailSize}px, 1fr));
      gap: ${this.thumbnailGap}px;
      margin-top: 80px;
      padding: 0 20px 20px;
    `;

    // 渲染每张缩略图
    this.images.forEach((imageData, index) => {
      const thumbnailItem = this.createThumbnailItem(imageData, index);
      gridContainer.appendChild(thumbnailItem);
    });

    this.thumbnailContainer.appendChild(gridContainer);
  }

  /**
   * 새로고침 버튼 생성 (톱니바퀴 옆에 별도 버튼)
   */
  createRefreshButton() {
    const refreshButton = document.createElement('button');
    refreshButton.innerHTML = '🔄';
    refreshButton.title = '썸네일 새로고침';
    refreshButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 105px;
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 50%;
      background: rgba(76, 175, 80, 0.9);
      color: white;
      font-size: 14px;
      cursor: pointer;
      z-index: 1002;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // 호버 효과
    refreshButton.addEventListener('mouseenter', () => {
      refreshButton.style.background = 'rgba(76, 175, 80, 1)';
      refreshButton.style.transform = 'scale(1.1)';
      refreshButton.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.4)';
    });

    refreshButton.addEventListener('mouseleave', () => {
      refreshButton.style.background = 'rgba(76, 175, 80, 0.9)';
      refreshButton.style.transform = 'scale(1)';
      refreshButton.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    });

    // 클릭 이벤트 - 썸네일 새로고침
    refreshButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.refreshThumbnails();
    });

    return refreshButton;
  }

  /**
   * 创建设置按钮
   */
  createSettingsButton() {
    const settingsButton = document.createElement('button');
    settingsButton.innerHTML = '⚙️';
    settingsButton.title = '썸네일 크기 설정';
    settingsButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 70px;
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      color: #333;
      font-size: 14px;
      cursor: pointer;
      z-index: 1002;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // 호버 효과
    settingsButton.addEventListener('mouseenter', () => {
      settingsButton.style.background = 'rgba(255, 255, 255, 1)';
      settingsButton.style.transform = 'scale(1.1)';
      settingsButton.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
    });

    settingsButton.addEventListener('mouseleave', () => {
      settingsButton.style.background = 'rgba(255, 255, 255, 0.9)';
      settingsButton.style.transform = 'scale(1)';
      settingsButton.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    });

    // 클릭 이벤트 - 컨트롤 패널 토글
    settingsButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleControlPanel();
    });

    return settingsButton;
  }

  /**
   * 컨트롤 패널 토글
   */
  toggleControlPanel() {
    const controlPanel = document.getElementById('thumbnailControlPanel');
    if (controlPanel) {
      const isVisible = controlPanel.style.display !== 'none';
      controlPanel.style.display = isVisible ? 'none' : 'flex';
      
      // 패널이 나타날 때 애니메이션 효과
      if (!isVisible) {
        controlPanel.style.opacity = '0';
        controlPanel.style.transform = 'translateX(-50%) translateY(-10px)';
        
        setTimeout(() => {
          controlPanel.style.transition = 'all 0.3s ease';
          controlPanel.style.opacity = '1';
          controlPanel.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);
      }
    }
  }

  /**
   * 创建控制面板
   */
  createControlPanel() {
    const controlPanel = document.createElement('div');
    controlPanel.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 255, 255, 0.95);
      border-radius: 10px;
      padding: 15px 25px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      z-index: 1002;
      display: flex;
      align-items: center;
      gap: 20px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    `;

    // 크기 조절 슬라이더
    const sizeControl = document.createElement('div');
    sizeControl.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
    `;

    const sizeLabel = document.createElement('span');
    sizeLabel.textContent = '크기:';
    sizeLabel.style.cssText = `
      font-size: 14px;
      font-weight: 500;
      color: #333;
      min-width: 35px;
    `;

    const sizeSlider = document.createElement('input');
    sizeSlider.type = 'range';
    sizeSlider.min = '80';
    sizeSlider.max = '300';
    sizeSlider.step = '20';
    sizeSlider.value = this.thumbnailSize;
    sizeSlider.style.cssText = `
      width: 120px;
      height: 4px;
      border-radius: 2px;
      background: #ddd;
      outline: none;
      cursor: pointer;
    `;

    const sizeValue = document.createElement('span');
    sizeValue.textContent = `${this.thumbnailSize}px`;
    sizeValue.style.cssText = `
      font-size: 12px;
      color: #666;
      min-width: 40px;
      text-align: center;
    `;

    // 간격 조절 슬라이더
    const gapControl = document.createElement('div');
    gapControl.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
    `;

    const gapLabel = document.createElement('span');
    gapLabel.textContent = '간격:';
    gapLabel.style.cssText = `
      font-size: 14px;
      font-weight: 500;
      color: #333;
      min-width: 35px;
    `;

    const gapSlider = document.createElement('input');
    gapSlider.type = 'range';
    gapSlider.min = '2';
    gapSlider.max = '30';
    gapSlider.step = '2';
    gapSlider.value = this.thumbnailGap;
    gapSlider.style.cssText = `
      width: 100px;
      height: 4px;
      border-radius: 2px;
      background: #ddd;
      outline: none;
      cursor: pointer;
    `;

    const gapValue = document.createElement('span');
    gapValue.textContent = `${this.thumbnailGap}px`;
    gapValue.style.cssText = `
      font-size: 12px;
      color: #666;
      min-width: 35px;
      text-align: center;
    `;

    // 이벤트 리스너 추가
    sizeSlider.addEventListener('input', (e) => {
      this.thumbnailSize = parseInt(e.target.value);
      sizeValue.textContent = `${this.thumbnailSize}px`;
      this.updateThumbnailGrid();
    });

    gapSlider.addEventListener('input', (e) => {
      this.thumbnailGap = parseInt(e.target.value);
      gapValue.textContent = `${this.thumbnailGap}px`;
      this.updateThumbnailGrid();
    });

    // 표시 모드 선택 (검색카테고리/상품명)
    const displayControl = document.createElement('div');
    displayControl.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
    `;

    const displayLabel = document.createElement('span');
    displayLabel.textContent = '표시:';
    displayLabel.style.cssText = `
      font-size: 14px;
      font-weight: 500;
      color: #333;
      min-width: 35px;
    `;

    const displaySelect = document.createElement('select');
    displaySelect.style.cssText = `
      padding: 4px 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      font-size: 12px;
      color: #333;
      cursor: pointer;
    `;

    displaySelect.innerHTML = `
      <option value="category">검색카테고리</option>
      <option value="productName">상품명</option>
      <option value="modifiedCategory">수정카테고리</option>
      <option value="none">표시 안함</option>
    `;
    displaySelect.value = this.displayMode;

    displaySelect.addEventListener('change', (e) => {
      const value = e.target.value;
      this.displayMode = value;
      this.updateThumbnailLabels();
    });

    // 요소들 조립
    sizeControl.appendChild(sizeLabel);
    sizeControl.appendChild(sizeSlider);
    sizeControl.appendChild(sizeValue);

    gapControl.appendChild(gapLabel);
    gapControl.appendChild(gapSlider);
    gapControl.appendChild(gapValue);

    displayControl.appendChild(displayLabel);
    displayControl.appendChild(displaySelect);

    controlPanel.appendChild(sizeControl);
    controlPanel.appendChild(gapControl);
    controlPanel.appendChild(displayControl);

    return controlPanel;
  }

  /**
   * 썸네일 새로고침 (이미지 새로 수집 및 렌더링)
   */
  refreshThumbnails() {
    console.log('썸네일 새로고침 시작...');

    // 그리드 컨테이너만 비우고 다시 렌더링
    const gridContainer = document.getElementById('thumbnailGrid');
    if (gridContainer) {
      gridContainer.innerHTML = '';
    }

    // 이미지 새로 수집
    this.collectImages();

    // 그리드 다시 렌더링
    if (gridContainer && this.images.length > 0) {
      this.images.forEach((imageData, index) => {
        const thumbnailItem = this.createThumbnailItem(imageData, index);
        gridContainer.appendChild(thumbnailItem);
      });

      // 타이틀 업데이트
      const title = this.thumbnailContainer.querySelector('div:first-child');
      if (title && title.style.fontSize === '10px') {
        title.textContent = `${this.images.length}개`;
      }
    }

    console.log('썸네일 새로고침 완료:', this.images.length + '개');
  }

  /**
   * 썸네일 라벨 업데이트 (검색카테고리/상품명 전환)
   */
  updateThumbnailLabels() {
    const gridContainer = document.getElementById('thumbnailGrid');
    if (gridContainer) {
      const thumbnailItems = gridContainer.querySelectorAll('div[style*="position: relative"]');
      thumbnailItems.forEach((item, index) => {
        if (index < this.images.length) {
          const imageData = this.images[index];
          const labelElement = item.querySelector('div:last-child');
          
          if (labelElement && !labelElement.style.position) { // 상품 정보 라벨만 선택
            if (this.displayMode === 'none') {
              // 아무것도 표시 안함 - 라벨 숨기기
              labelElement.style.display = 'none';
            } else {
              // 라벨 보이기
              labelElement.style.display = 'block';
              
              if (this.displayMode === 'productName' && imageData.productInfo) {
                // 상품명 표시
                const productName = imageData.productInfo.name.length > 40 
                  ? imageData.productInfo.name.substring(0, 40) + '...' 
                  : imageData.productInfo.name;
                labelElement.textContent = productName;
              } else if (this.displayMode === 'modifiedCategory') {
                // 수정카테고리 표시 (각 카드별로)
                const modifiedCategory = this.getModifiedCategoryForCard(imageData.card);
                labelElement.textContent = modifiedCategory || '';
              } else {
                // 검색카테고리 표시 (기본값) - 각 카드별로 개별적으로 가져오기
                const searchCategory = this.getSearchCategoryForCard(imageData.card);
                labelElement.textContent = searchCategory || '카테고리 없음';
              }
            }
          }
        }
      });
    }
  }

  /**
   * 현재 검색카테고리 가져오기 (전역)
   */
  getSearchCategory() {
    try {
      // DOM에서 id="검색카테고리" 요소 찾기
      const categoryElement = document.querySelector('#검색카테고리');
      if (categoryElement && categoryElement.textContent) {
        return categoryElement.textContent.trim();
      }
      
      // Vue 앱에서 검색카테고리 가져오기
      if (window.vueApp && window.vueApp.search_category) {
        return window.vueApp.search_category;
      }
      
      // tt.js의 ann 컴포넌트에서 가져오기
      if (window.ann && window.ann.search_category) {
        return window.ann.search_category;
      }
      
      return '검색카테고리 없음';
    } catch (error) {
      console.log('검색카테고리 가져오기 실패:', error);
      return '검색카테고리 없음';
    }
  }

  /**
   * 특정 카드의 검색카테고리 가져오기
   */
  getSearchCategoryForCard(card) {
    if (!card) return '검색카테고리 없음';

    try {
      // 해당 카드 내부에서 검색카테고리 찾기
      const categoryElement = card.querySelector('[id="검색카테고리"]');
      if (categoryElement && categoryElement.textContent) {
        return categoryElement.textContent.trim();
      }

      // 카드 내부의 다른 카테고리 관련 요소 찾기
      const categorySpan = card.querySelector('.category, [data-category], .search-category');
      if (categorySpan && categorySpan.textContent) {
        return categorySpan.textContent.trim();
      }

      // 전역 검색카테고리로 폴백
      return this.getSearchCategory();
    } catch (error) {
      console.log('카드의 검색카테고리 가져오기 실패:', error);
      return '검색카테고리 없음';
    }
  }

  /**
   * 현재 수정카테고리 가져오기 (전역)
   */
  getModifiedCategory() {
    try {
      // DOM에서 id="수정카테고리입력" input 요소 찾기
      const modifiedCategoryInput = document.querySelector('#수정카테고리입력');
      if (modifiedCategoryInput && modifiedCategoryInput.value) {
        return modifiedCategoryInput.value.trim();
      }

      // 대체: id="수정카테고리" 요소에서 찾기
      const modifiedCategoryElement = document.querySelector('#수정카테고리');
      if (modifiedCategoryElement && modifiedCategoryElement.textContent) {
        return modifiedCategoryElement.textContent.trim();
      }

      // Vue 앱에서 수정카테고리 가져오기
      if (window.vueApp && window.vueApp.modified_category) {
        return window.vueApp.modified_category;
      }

      // tt.js의 ann 컴포넌트에서 가져오기
      if (window.ann && window.ann.modified_category) {
        return window.ann.modified_category;
      }

      return '';
    } catch (error) {
      console.log('수정카테고리 가져오기 실패:', error);
      return '';
    }
  }

  /**
   * 특정 카드의 수정카테고리 가져오기
   */
  getModifiedCategoryForCard(card) {
    if (!card) return '';

    try {
      // 해당 카드 내부에서 수정카테고리입력 찾기
      const modifiedCategoryInput = card.querySelector('[id="수정카테고리입력"]');
      if (modifiedCategoryInput && modifiedCategoryInput.value) {
        return modifiedCategoryInput.value.trim();
      }

      // 대체: 카드 내부의 id="수정카테고리" 요소에서 찾기
      const modifiedCategoryElement = card.querySelector('[id="수정카테고리"]');
      if (modifiedCategoryElement && modifiedCategoryElement.textContent) {
        return modifiedCategoryElement.textContent.trim();
      }

      return '';
    } catch (error) {
      console.log('카드의 수정카테고리 가져오기 실패:', error);
      return '';
    }
  }

  /**
   * 썸네일 그리드 업데이트
   */
  updateThumbnailGrid() {
    const gridContainer = document.getElementById('thumbnailGrid');
    if (gridContainer) {
      gridContainer.style.gridTemplateColumns = `repeat(auto-fill, minmax(${this.thumbnailSize}px, 1fr))`;
      gridContainer.style.gap = `${this.thumbnailGap}px`;
      
      // 개별 썸네일 이미지 크기 업데이트 (이미지만)
      const thumbnailImages = gridContainer.querySelectorAll('img');
      thumbnailImages.forEach(img => {
        img.style.height = `${this.thumbnailSize}px`;
      });
      
      // 에러 메시지 영역의 높이만 업데이트 (이미지 로드 실패시)
      const thumbnailItems = gridContainer.querySelectorAll('div[style*="position: relative"]');
      thumbnailItems.forEach(item => {
        const errorMsg = item.querySelector('div[style*="이미지 로드 실패"]');
        if (errorMsg) {
          errorMsg.style.height = `${this.thumbnailSize}px`;
        }
        
        // 하단 텍스트 영역은 고정 높이 유지 (변경하지 않음)
        const infoLabel = item.querySelector('div:last-child');
        if (infoLabel && !infoLabel.style.position) { // position이 없는 것이 텍스트 라벨
          // 텍스트 영역의 높이는 고정값으로 유지
          if (!infoLabel.style.height || infoLabel.style.height.includes(this.thumbnailSize.toString())) {
            infoLabel.style.height = 'auto'; // 내용에 맞게 자동 조절
            infoLabel.style.minHeight = '20px'; // 최소 높이만 설정
          }
        }
      });
    }
  }

  /**
   * 创建单个缩略图项
   */
  createThumbnailItem(imageData, index) {
    const thumbnailItem = document.createElement('div');
    thumbnailItem.style.cssText = `
      position: relative;
      cursor: pointer;
      transition: transform 0.3s ease;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid transparent;
    `;

    // 创建图片元素
    const thumbnail = document.createElement('img');
    thumbnail.src = imageData.src;
    thumbnail.alt = imageData.alt;
    thumbnail.style.cssText = `
      width: 100%;
      height: ${this.thumbnailSize}px;
      object-fit: cover;
      display: block;
    `;

    // 图片加载错误处理
    thumbnail.addEventListener('error', () => {
      thumbnail.style.display = 'none';
      const errorMsg = document.createElement('div');
      errorMsg.textContent = '이미지 로드 실패';
      errorMsg.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        height: ${this.thumbnailSize}px;
        color: white;
        font-size: 12px;
        background: rgba(255, 0, 0, 0.2);
      `;
      thumbnailItem.appendChild(errorMsg);
    });

    // 添加索引标签 - 更低调的样式
    const indexLabel = document.createElement('div');
    indexLabel.textContent = index + 1;
    indexLabel.style.cssText = `
      position: absolute;
      top: 3px;
      left: 3px;
      background: rgba(0, 0, 0, 0.3);
      color: rgba(255, 255, 255, 0.6);
      padding: 1px 3px;
      border-radius: 2px;
      font-size: 8px;
      font-weight: normal;
      z-index: 2;
      opacity: 0.5;
      transition: opacity 0.3s ease;
      pointer-events: none;
    `;
    

    // 이미지와 인덱스 라벨을 먼저 추가
    thumbnailItem.appendChild(thumbnail);
    thumbnailItem.appendChild(indexLabel);

    // 라벨을 이미지 아래에 추가 (검색카테고리, 상품명, 수정카테고리, 또는 숨김)
    const infoLabel = document.createElement('div');
    
    if (this.displayMode === 'none') {
      // 아무것도 표시 안함 - 라벨 숨기기
      infoLabel.style.display = 'none';
    } else if (this.displayMode === 'productName' && imageData.productInfo) {
      // 상품명 표시
      const productName = imageData.productInfo.name.length > 40 
        ? imageData.productInfo.name.substring(0, 40) + '...' 
        : imageData.productInfo.name;
      infoLabel.textContent = productName;
    } else if (this.displayMode === 'modifiedCategory') {
      // 수정카테고리 표시 (각 카드별로)
      const modifiedCategory = this.getModifiedCategoryForCard(imageData.card);
      infoLabel.textContent = modifiedCategory || '';
    } else {
      // 검색카테고리 표시 (기본값) - 각 카드별로 개별적으로 가져오기
      const searchCategory = this.getSearchCategoryForCard(imageData.card);
      infoLabel.textContent = searchCategory || '카테고리 없음';
    }
    
    infoLabel.style.cssText = `
      background: white;
      color: #333;
      padding: 8px;
      font-size: 12px;
      line-height: 1.3;
      border-top: 1px solid #eee;
      min-height: 20px;
      max-height: 50px;
      height: auto;
      word-wrap: break-word;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
    thumbnailItem.appendChild(infoLabel);

    // 合并鼠标悬停效果（包括索引标签和缩略图变化）
    const handleMouseEnter = () => {
      // 缩略图变化
      thumbnailItem.style.transform = 'scale(1.05)';
      thumbnailItem.style.borderColor = '#4caf50';
      thumbnailItem.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
      
      // 索引标签变化
      indexLabel.style.opacity = '0.9';
      indexLabel.style.background = 'rgba(0, 0, 0, 0.7)';
      indexLabel.style.color = 'white';
    };

    const handleMouseLeave = () => {
      // 缩略图恢复
      thumbnailItem.style.transform = 'scale(1)';
      thumbnailItem.style.borderColor = 'transparent';
      thumbnailItem.style.boxShadow = 'none';
      
      // 索引标签恢复
      indexLabel.style.opacity = '0.5';
      indexLabel.style.background = 'rgba(0, 0, 0, 0.3)';
      indexLabel.style.color = 'rgba(255, 255, 255, 0.6)';
    };

    thumbnailItem.addEventListener('mouseenter', handleMouseEnter);
    thumbnailItem.addEventListener('mouseleave', handleMouseLeave);

    // 添加点击事件
    thumbnailItem.addEventListener('click', (event) => {
      event.preventDefault();
      this.handleThumbnailClick(imageData, index);
    });

    return thumbnailItem;
  }

  /**
   * 处理缩略图点击事件
   */
  handleThumbnailClick(imageData, index) {
    console.log(`썸네일 클릭 ${index + 1}:`, imageData);

    // 优先滚动到对应的卡片位置
    if (imageData.card) {
      console.log('해당 상품 카드로 스크롤');

      // 바로 컨테이너 숨기기 (지연 없음)
      this.hideThumbnailContainer();

      // 滚动到卡片位置 (즉시 이동)
      imageData.card.scrollIntoView({
        behavior: 'instant',
        block: 'center',
        inline: 'nearest'
      });

      // 高亮显示目标卡片
      this.highlightTargetCard(imageData.card);

    } else if (imageData.href) {
      // 如果没有卡片但有链接，在新标签页打开
      console.log(`카드를 찾을 수 없어 새 탭에서 열기: ${imageData.href}`);
      this.hideThumbnailContainer();
      window.open(imageData.href, '_blank');

    } else {
      console.log('사용 가능한 이동 대상 없음');
      alert('해당 상품을 찾을 수 없습니다.');
    }
  }

  /**
   * 显示点击反馈效果
   */
  showClickFeedback(index) {
    const thumbnailItems = this.thumbnailContainer.querySelectorAll('div[style*="position: relative"]');
    const clickedItem = thumbnailItems[index];
    
    if (clickedItem) {
      // 添加点击效果
      clickedItem.style.transform = 'scale(0.95)';
      clickedItem.style.borderColor = '#2196f3';
      clickedItem.style.boxShadow = '0 0 20px rgba(33, 150, 243, 0.6)';
      
      setTimeout(() => {
        if (clickedItem.style) {
          clickedItem.style.transform = 'scale(1)';
        }
      }, 150);
    }
  }

  /**
   * 高亮显示目标卡片
   */
  highlightTargetCard(card) {
    if (!card) return;
    
    // 保存原始样式
    const originalBorder = card.style.border;
    const originalBoxShadow = card.style.boxShadow;
    const originalTransition = card.style.transition;
    
    // 添加高亮效果
    card.style.transition = 'all 0.3s ease';
    card.style.border = '3px solid #4caf50';
    card.style.boxShadow = '0 0 20px rgba(76, 175, 80, 0.5)';
    
    // 3秒后恢复原始样式
    setTimeout(() => {
      if (card.style) {
        card.style.border = originalBorder;
        card.style.boxShadow = originalBoxShadow;
        card.style.transition = originalTransition;
      }
    }, 3000);
  }

  /**
   * 업데이트 썸네일 크기
   */
  updateThumbnailSize(size) {
    this.thumbnailSize = parseInt(size);
    console.log('썸네일 크기 업데이트:', this.thumbnailSize);
  }

  /**
   * 업데이트 썸네일 간격
   */
  updateThumbnailGap(gap) {
    this.thumbnailGap = parseInt(gap);
    console.log('썸네일 간격 업데이트:', this.thumbnailGap);
  }

  /**
   * 설정에서 썸네일 설정 가져오기
   */
  getSettingsFromVue() {
    if (window.vueApp) {
      if (window.vueApp.thumbnailSize !== undefined) {
        this.thumbnailSize = window.vueApp.thumbnailSize;
      }
      if (window.vueApp.thumbnailGap !== undefined) {
        this.thumbnailGap = window.vueApp.thumbnailGap;
      }
    }
  }
}

// 全局实例
const thumbnailManager = new ThumbnailManager();

// 确保只初始化一次
let thumbnailManagerInitialized = false;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  if (!thumbnailManagerInitialized) {
    thumbnailManager.init();
    thumbnailManagerInitialized = true;
    console.log('ThumbnailManager 초기화 완료');
  }
});

// 如果jQuery可用，也监听jQuery的ready事件
if (typeof $ !== 'undefined') {
  $(document).ready(() => {
    if (!thumbnailManagerInitialized) {
      thumbnailManager.init();
      thumbnailManagerInitialized = true;
      console.log('ThumbnailManager 초기화 완료 (jQuery)');
    }
  });
}

// 전역 함수로 설정 업데이트 함수 노출
window.updateThumbnailSize = function(size) {
  if (window.thumbnailManager) {
    window.thumbnailManager.updateThumbnailSize(size);
  }
};

window.updateThumbnailGap = function(gap) {
  if (window.thumbnailManager) {
    window.thumbnailManager.updateThumbnailGap(gap);
  }
};

// 导出给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThumbnailManager;
} else if (typeof window !== 'undefined') {
  window.ThumbnailManager = ThumbnailManager;
  window.thumbnailManager = thumbnailManager;
}