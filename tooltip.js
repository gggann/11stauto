// 툴팁 관련 유틸리티 함수들
export const TOOLTIP_CONFIG = {
  WIDTH: 500,
  HEIGHT: 500,
  MARGIN: 20,
  PADDING: 10,
  OFFSET: 8
};

// 툴팁 위치 계산
export function calculateTooltipPosition(event, recommendations) {
  const rect = event.target.getBoundingClientRect();
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const tooltip = {
    width: TOOLTIP_CONFIG.WIDTH,
    height: Math.min(recommendations.length * 28 + 100, TOOLTIP_CONFIG.HEIGHT)
  };

  let position = {
    left: rect.left,
    top: rect.bottom + TOOLTIP_CONFIG.OFFSET
  };

  position = adjustTooltipBounds(position, tooltip, viewport, rect);
  return { ...position, ...tooltip };
}

// 툴팁 경계 조정
export function adjustTooltipBounds(position, tooltip, viewport, rect) {
  const margin = TOOLTIP_CONFIG.MARGIN;
  const padding = TOOLTIP_CONFIG.PADDING;

  if (position.left + tooltip.width > viewport.width - margin) {
    position.left = Math.max(padding, rect.right - tooltip.width);
    if (position.left < padding) {
      position.left = Math.max(padding, (viewport.width - tooltip.width) / 2);
    }
  }

  if (position.top + tooltip.height > viewport.height - margin) {
    position.top = rect.top - tooltip.height - TOOLTIP_CONFIG.OFFSET;
    if (position.top < padding) {
      position.top = Math.max(padding, Math.min(rect.bottom + TOOLTIP_CONFIG.OFFSET, viewport.height - tooltip.height - margin));
    }
  }

  position.left = Math.max(padding, Math.min(position.left, viewport.width - tooltip.width - padding));
  position.top = Math.max(padding, Math.min(position.top, viewport.height - tooltip.height - padding));

  return position;
}

// 툴팁 스타일 생성
export function createTooltipStyle({ left, top, width, height }) {
  return {
    position: 'fixed',
    left: left + 'px',
    top: top + 'px',
    backgroundColor: 'white',
    border: '2px solid #1976d2',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
    zIndex: '999999999',
    width: width + 'px',
    height: '500px',
    overflowY: 'auto',
    fontSize: '12px',
    lineHeight: '1.4',
    pointerEvents: 'auto',
    transform: 'translateZ(0)',
    isolation: 'isolate',
    willChange: 'transform',
    display: 'block',
    visibility: 'visible',
    opacity: '1',
    minWidth: width + 'px',
    minHeight: '500px',
    boxSizing: 'border-box'
  };
}

// 툴팁 HTML 생성
export function generateTooltipHTML(filteredCategories, activeFilters, extractedKeywords, categorySearchFilter, recommendedCategories = []) {
  // 2뎁스 기준 필터 옵션 생성
  const depth2Counts = {};
  filteredCategories.forEach(cat => {
    const parts = cat.split('>');
    if (parts.length >= 2) {
      const d2 = parts[1].trim();
      depth2Counts[d2] = (depth2Counts[d2] || 0) + 1;
    }
  });

  // 빈도수 순으로 정렬 (제한 없이 모두 표시)
  const sortedDepth2 = Object.keys(depth2Counts).sort((a, b) => depth2Counts[b] - depth2Counts[a]);
  const filterOptions = ['전체', ...sortedDepth2];

  // 필터 칩 HTML 생성
  const filterChipsHtml = filterOptions.map(option =>
    `<button type="button" class="depth2-filter-chip" data-depth2-filter="${option}" 
            style="font-size: 10px; padding: 2px 8px; border: 1px solid #ced4da; border-radius: 12px; 
                   cursor: pointer; outline: none; background-color: ${option === '전체' ? '#007bff' : 'white'}; 
                   color: ${option === '전체' ? 'white' : '#495057'}; margin: 2px;">
      ${option}${option !== '전체' ? ` (${depth2Counts[option]})` : ''}
    </button>`
  ).join('');

  return `
    <div class="category-tooltip__search" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid #eee;">
      <span class="icon">🔎</span>
      <input
        type="text"
        value="${categorySearchFilter}"
        placeholder="검색 (쉼표로 복합검색)"
        class="category-tooltip__input"
        style="flex: 1;"
      />
      <button class="reset-btn" type="button" style="padding: 4px 10px; font-size: 14px; border: 1px solid #dc3545; background: white; color: #dc3545; border-radius: 4px; cursor: pointer;" title="닫기">x</button>
    </div>
    <div style="padding: 6px 12px; border-bottom: 1px solid #eee; display: flex; flex-wrap: wrap; gap: 4px;">
      ${filterChipsHtml}
    </div>
    <div class="category-tooltip__list">
      ${generateCategoryListHTML(filteredCategories, categorySearchFilter, recommendedCategories, activeFilters, extractedKeywords)}
    </div>
  `;
}

// 카테고리 목록 HTML 생성
export function generateCategoryListHTML(filteredCategories, categorySearchFilter, recommendedCategories = [], activeFilters = [], extractedKeywords = []) {
  if (filteredCategories.length > 0) {
    return filteredCategories.map((category, index) => {
      const highlightedCategory = applyKeywordHighlightToCategory(category, activeFilters, extractedKeywords, categorySearchFilter);
      return `
        <button type="button" class="category-chip" data-category="${category}" data-index="${index}">
          <span class="category-chip__label">${highlightedCategory}</span>
        </button>
      `;
    }).join('');
  } else if (recommendedCategories.length > 0) {
    return `
      <div class="category-tooltip__empty">
        <div class="category-tooltip__empty-icon">🧐</div>
        <div class="category-tooltip__empty-text">
          <p>"${categorySearchFilter}" 검색 결과가 없습니다.</p>
          <small>다른 키워드를 시도하거나 필터를 초기화해 보세요.</small>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="category-tooltip__empty">
        <div class="category-tooltip__empty-icon">🤔</div>
        <div class="category-tooltip__empty-text">
          <p>${activeFilters.join(' + ') || '현재'} 조합으로는 추천할 카테고리가 없습니다.</p>
          <small>다른 키워드나 조합을 시도해 보세요.</small>
        </div>
      </div>
    `;
  }
}

// 툴팁 제거
export function removeAllTooltips() {
  document.querySelectorAll('.category-tooltip-body').forEach(el => el.remove());
}

// 키워드 하이라이트 적용
export function applyKeywordHighlightToCategory(category, activeFilters, extractedKeywords, categorySearchFilter) {
  if (!category) return category;

  let result = category;

  // 모든 키워드를 우선순위별로 정리
  const primaryKeywords = (activeFilters || []).filter(k => k && k.length > 0); // 1단 키워드 (파란색)
  const secondaryKeywords = (extractedKeywords || []).filter(k => k && k.length > 0); // 2단 키워드 (빨간색)

  // 검색 필터에서 추가 키워드 추출
  if (categorySearchFilter && categorySearchFilter.trim()) {
    const searchKeywords = categorySearchFilter.trim().split(/\s+/);
    searchKeywords.forEach(keyword => {
      if (keyword && keyword.length > 0 && !primaryKeywords.includes(keyword) && !secondaryKeywords.includes(keyword)) {
        secondaryKeywords.push(keyword);
      }
    });
  }

  // 길이 순으로 정렬 (긴 키워드부터 처리하여 부분 매칭 문제 방지)
  const sortedPrimaryKeywords = primaryKeywords.sort((a, b) => b.length - a.length);
  const sortedSecondaryKeywords = secondaryKeywords.filter(k => !primaryKeywords.includes(k)).sort((a, b) => b.length - a.length);

  // 모든 키워드를 임시 플레이스홀더로 치환
  const placeholders = new Map();
  let placeholderIndex = 0;

  // 1단 키워드 (파란색)
  sortedPrimaryKeywords.forEach(word => {
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedWord})`, 'gi');
    result = result.replace(regex, (match) => {
      const placeholder = `__PLACEHOLDER_${placeholderIndex}__`;
      placeholders.set(placeholder, `<span style="color: #1976d2; font-weight: bold;">${match}</span>`);
      placeholderIndex++;
      return placeholder;
    });
  });

  // 2단 키워드 (빨간색)
  sortedSecondaryKeywords.forEach(word => {
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedWord})`, 'gi');
    result = result.replace(regex, (match) => {
      const placeholder = `__PLACEHOLDER_${placeholderIndex}__`;
      placeholders.set(placeholder, `<span style="color: #dc3545; font-weight: bold;">${match}</span>`);
      placeholderIndex++;
      return placeholder;
    });
  });

  // 플레이스홀더를 실제 HTML로 치환
  placeholders.forEach((html, placeholder) => {
    result = result.replace(placeholder, html);
  });

  return result;
}
