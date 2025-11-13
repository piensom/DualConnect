/**
 * Toast Notification System
 * Displays beautiful, accessible toast notifications
 */
class ToastManager {
  constructor() {
    this.container = null;
    this.toasts = new Map();
    this.defaultDuration = 5000;
    this.maxToasts = 5;
    this.init();
  }

  /**
   * Initialize toast container
   */
  init() {
    // Create container if it doesn't exist
    if (!document.getElementById('toast-container')) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById('toast-container');
    }

    // Add styles if not already added
    if (!document.getElementById('toast-styles')) {
      this.addStyles();
    }

    // Listen to API client events
    if (window.apiEnhanced) {
      window.apiEnhanced.on('toast', ({ message, type }) => {
        this.show(message, type);
      });
    }
  }

  /**
   * Add toast styles
   */
  addStyles() {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        pointer-events: none;
      }

      .toast {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 16px 20px;
        margin-bottom: 12px;
        min-width: 300px;
        max-width: 500px;
        display: flex;
        align-items: center;
        gap: 12px;
        pointer-events: auto;
        animation: slideIn 0.3s ease-out;
        transition: all 0.3s ease;
      }

      .toast.removing {
        animation: slideOut 0.3s ease-out;
      }

      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }

      .toast-icon {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      }

      .toast-content {
        flex: 1;
        font-size: 14px;
        line-height: 1.5;
        color: #1a1a1a;
      }

      .toast-content strong {
        display: block;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .toast-close {
        flex-shrink: 0;
        background: none;
        border: none;
        color: #666;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background 0.2s;
      }

      .toast-close:hover {
        background: rgba(0, 0, 0, 0.05);
      }

      .toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: currentColor;
        opacity: 0.3;
        animation: progress linear;
      }

      @keyframes progress {
        from {
          width: 100%;
        }
        to {
          width: 0%;
        }
      }

      /* Toast types */
      .toast.success {
        border-left: 4px solid #10b981;
      }

      .toast.success .toast-icon {
        background: #d1fae5;
        color: #10b981;
      }

      .toast.error {
        border-left: 4px solid #ef4444;
      }

      .toast.error .toast-icon {
        background: #fee2e2;
        color: #ef4444;
      }

      .toast.warning {
        border-left: 4px solid #f59e0b;
      }

      .toast.warning .toast-icon {
        background: #fef3c7;
        color: #f59e0b;
      }

      .toast.info {
        border-left: 4px solid #3b82f6;
      }

      .toast.info .toast-icon {
        background: #dbeafe;
        color: #3b82f6;
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        .toast-container {
          top: auto;
          bottom: 20px;
          right: 20px;
          left: 20px;
        }

        .toast {
          min-width: auto;
          max-width: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Show toast notification
   */
  show(message, type = 'info', options = {}) {
    const {
      title = null,
      duration = this.defaultDuration,
      closable = true,
      onClose = null
    } = options;

    // Limit number of toasts
    if (this.toasts.size >= this.maxToasts) {
      const firstToast = this.toasts.keys().next().value;
      this.remove(firstToast);
    }

    const id = this.generateId();
    const toast = this.createToastElement(id, message, type, { title, duration, closable });

    this.container.appendChild(toast);
    this.toasts.set(id, { element: toast, onClose });

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  /**
   * Create toast element
   */
  createToastElement(id, message, type, options) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('data-toast-id', id);

    const icon = this.getIcon(type);

    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        ${options.title ? `<strong>${this.escapeHtml(options.title)}</strong>` : ''}
        ${this.escapeHtml(message)}
      </div>
      ${options.closable ? '<button class="toast-close" aria-label="Close">×</button>' : ''}
      ${options.duration > 0 ? `<div class="toast-progress" style="animation-duration: ${options.duration}ms"></div>` : ''}
    `;

    // Add close button handler
    if (options.closable) {
      const closeBtn = toast.querySelector('.toast-close');
      closeBtn.addEventListener('click', () => this.remove(id));
    }

    return toast;
  }

  /**
   * Remove toast
   */
  remove(id) {
    const toastData = this.toasts.get(id);
    if (!toastData) return;

    const { element, onClose } = toastData;

    // Add removing animation
    element.classList.add('removing');

    // Remove after animation
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.toasts.delete(id);

      if (onClose) {
        onClose();
      }
    }, 300);
  }

  /**
   * Remove all toasts
   */
  removeAll() {
    this.toasts.forEach((_, id) => this.remove(id));
  }

  /**
   * Convenience methods
   */
  success(message, options = {}) {
    return this.show(message, 'success', options);
  }

  error(message, options = {}) {
    return this.show(message, 'error', { ...options, duration: options.duration || 7000 });
  }

  warning(message, options = {}) {
    return this.show(message, 'warning', options);
  }

  info(message, options = {}) {
    return this.show(message, 'info', options);
  }

  /**
   * Loading toast with promise
   */
  async loading(message, promise, options = {}) {
    const loadingId = this.show(message, 'info', {
      ...options,
      duration: 0,
      closable: false
    });

    try {
      const result = await promise;
      this.remove(loadingId);
      this.success(options.successMessage || 'Operation completed successfully');
      return result;
    } catch (error) {
      this.remove(loadingId);
      this.error(options.errorMessage || error.message || 'Operation failed');
      throw error;
    }
  }

  /**
   * Helper methods
   */
  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  generateId() {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Create global instance
const toast = new ToastManager();

// Make it globally available
window.toast = toast;
