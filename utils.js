// utils.js - 通用工具函数库
// 提取所有重复的逻辑到这里，提高代码复用性

/**
 * 解析输入字符串为数组
 * @param {string} input - 输入字符串
 * @param {RegExp|string} separator - 分隔符
 * @returns {Array} 解析后的数组
 */
export function parseInput(input, separator = /[\s\n,/]+/) {
  if (!input) return [];
  return input
    .split(separator)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * 格式化分类路径
 * @param {string} path - 原始路径
 * @returns {string} 格式化后的路径
 */
export function formatCategoryPath(path) {
  if (!path) return '';
  return path
    .split(' > ')
    .map(s => s.trim())
    .filter(s => s)
    .join(' > ');
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>} 复制是否成功
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 降级方案
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      document.body.appendChild(textarea);
      textarea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textarea);
      return result;
    }
  } catch (error) {
    console.error('复制失败:', error);
    return false;
  }
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间(ms)
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间限制(ms)
 */
export function throttle(func, limit = 100) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 高亮文本中的关键词
 * @param {string} text - 原始文本
 * @param {string} keyword - 要高亮的关键词
 * @param {string} className - CSS类名
 * @returns {string} 带高亮标记的HTML
 */
export function highlightKeyword(text, keyword, className = 'highlight') {
  if (!text || !keyword) return text;

  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedKeyword})`, 'gi');

  return text.replace(regex, `<span class="${className}">$1</span>`);
}

/**
 * 验证分类路径格式
 * @param {string} category - 分类路径
 * @returns {boolean} 是否有效
 */
export function isValidCategory(category) {
  if (!category || typeof category !== 'string') return false;

  // 检查基本格式：至少包含一个 ' > '
  if (!category.includes(' > ')) return false;

  // 检查各级分类是否为空
  const parts = category.split(' > ');
  return parts.every(part => part.trim().length > 0);
}

/**
 * 获取分类深度
 * @param {string} category - 分类路径
 * @returns {number} 分类深度
 */
export function getCategoryDepth(category) {
  if (!category) return 0;
  return category.split(' > ').length;
}

/**
 * 提取分类的最后一级
 * @param {string} category - 分类路径
 * @returns {string} 最后一级分类
 */
export function getLastCategoryLevel(category) {
  if (!category) return '';
  const parts = category.split(' > ');
  return parts[parts.length - 1].trim();
}

/**
 * 比较两个分类是否相同（忽略空格）
 * @param {string} cat1 - 分类1
 * @param {string} cat2 - 分类2
 * @returns {boolean} 是否相同
 */
export function isSameCategory(cat1, cat2) {
  return formatCategoryPath(cat1) === formatCategoryPath(cat2);
}

/**
 * 批量更新元素样式
 * @param {HTMLElement} element - DOM元素
 * @param {Object} styles - 样式对象
 */
export function setStyles(element, styles) {
  if (!element || !styles) return;
  Object.assign(element.style, styles);
}

/**
 * 安全获取嵌套对象属性
 * @param {Object} obj - 对象
 * @param {string} path - 属性路径
 * @param {*} defaultValue - 默认值
 */
export function getNestedProperty(obj, path, defaultValue = null) {
  return path.split('.').reduce((acc, part) => {
    return acc && acc[part] !== undefined ? acc[part] : defaultValue;
  }, obj);
}

/**
 * 格式化数字（添加千位分隔符）
 * @param {number} num - 数字
 * @returns {string} 格式化后的字符串
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 获取今天的日期字符串
 * @returns {string} YYYY-MM-DD格式
 */
export function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 延迟执行
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise} Promise
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 检查是否为移动设备
 * @returns {boolean}
 */
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 默认导出常用函数
export default {
  parseInput,
  formatCategoryPath,
  copyToClipboard,
  debounce,
  throttle,
  highlightKeyword,
  isValidCategory,
  getCategoryDepth,
  getLastCategoryLevel,
  isSameCategory,
  setStyles,
  getNestedProperty,
  formatNumber,
  getTodayDate,
  delay,
  isMobileDevice
};