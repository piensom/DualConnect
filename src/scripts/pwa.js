/**
 * PWA Utilities
 * Service worker registration, install prompts, and update notifications
 */

class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.swRegistration = null;
    this.isOnline = navigator.onLine;

    this.init();
  }

  /**
   * Initialize PWA features
   */
  async init() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await this.registerServiceWorker();
        console.log('✓ Service worker registered');
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    }

    // Setup install prompt
    this.setupInstallPrompt();

    // Setup update notifications
    this.setupUpdateNotifications();

    // Setup online/offline detection
    this.setupConnectionMonitoring();

    // Setup push notifications
    if ('PushManager' in window) {
      this.setupPushNotifications();
    }
  }

  /**
   * Register service worker
   */
  async registerServiceWorker() {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });

    // Check for updates every hour
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);

    return registration;
  }

  /**
   * Setup install prompt
   */
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent default prompt
      e.preventDefault();

      // Store the event
      this.deferredPrompt = e;

      // Show custom install button
      this.showInstallButton();
    });

    // Track successful install
    window.addEventListener('appinstalled', () => {
      console.log('✓ App installed');
      this.deferredPrompt = null;
      this.hideInstallButton();

      // Track installation
      if (window.gtag) {
        gtag('event', 'app_installed', {
          event_category: 'PWA'
        });
      }
    });
  }

  /**
   * Show install button
   */
  showInstallButton() {
    // Create install banner if it doesn't exist
    if (document.getElementById('pwa-install-banner')) {
      return;
    }

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'pwa-install-banner';
    banner.innerHTML = `
      <div class="pwa-install-content">
        <div class="pwa-install-icon">📱</div>
        <div class="pwa-install-text">
          <strong>Install Dual Connect</strong>
          <p>Access programs offline and get faster performance</p>
        </div>
        <button class="btn btn-primary" id="pwa-install-btn">Install</button>
        <button class="btn-close" id="pwa-install-close">×</button>
      </div>
    `;

    document.body.appendChild(banner);

    // Add styles
    this.addInstallBannerStyles();

    // Handle install button click
    document.getElementById('pwa-install-btn').addEventListener('click', () => {
      this.promptInstall();
    });

    // Handle close button
    document.getElementById('pwa-install-close').addEventListener('click', () => {
      this.hideInstallButton();
      localStorage.setItem('pwa-install-dismissed', Date.now());
    });

    // Don't show if recently dismissed (within 7 days)
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      banner.style.display = 'none';
    }

    // Show with animation
    setTimeout(() => {
      banner.classList.add('show');
    }, 100);
  }

  /**
   * Hide install button
   */
  hideInstallButton() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.classList.remove('show');
      setTimeout(() => {
        banner.remove();
      }, 300);
    }
  }

  /**
   * Prompt app installation
   */
  async promptInstall() {
    if (!this.deferredPrompt) {
      return;
    }

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await this.deferredPrompt.userChoice;

    console.log(`Install prompt ${outcome}`);

    // Track choice
    if (window.gtag) {
      gtag('event', 'install_prompt_result', {
        event_category: 'PWA',
        event_label: outcome
      });
    }

    // Clear the prompt
    this.deferredPrompt = null;
    this.hideInstallButton();
  }

  /**
   * Setup service worker update notifications
   */
  setupUpdateNotifications() {
    if (!this.swRegistration) return;

    this.swRegistration.addEventListener('updatefound', () => {
      const newWorker = this.swRegistration.installing;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker available
          this.showUpdateNotification();
        }
      });
    });

    // Listen for controller change
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }

  /**
   * Show update notification
   */
  showUpdateNotification() {
    if (window.toast) {
      const toastId = toast.info('A new version is available', {
        title: 'Update Available',
        duration: 0,
        closable: true
      });

      // Add update button to toast
      const toastEl = document.querySelector(`[data-toast-id="${toastId}"]`);
      if (toastEl) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-primary btn-sm';
        btn.textContent = 'Update Now';
        btn.style.marginTop = '12px';
        btn.onclick = () => {
          this.applyUpdate();
        };
        toastEl.querySelector('.toast-content').appendChild(btn);
      }
    }
  }

  /**
   * Apply service worker update
   */
  applyUpdate() {
    if (!this.swRegistration || !this.swRegistration.waiting) return;

    // Tell the service worker to skip waiting
    this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  /**
   * Setup connection monitoring
   */
  setupConnectionMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('✓ Back online');

      if (window.toast) {
        toast.success('Connection restored');
      }

      // Sync pending data
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('⚠ Gone offline');

      if (window.toast) {
        toast.warning('You are offline. Some features may be limited.');
      }
    });
  }

  /**
   * Sync pending data when back online
   */
  async syncPendingData() {
    if ('serviceWorker' in navigator && 'sync' in navigator.serviceWorker) {
      const registration = await navigator.serviceWorker.ready;

      try {
        await registration.sync.register('sync-applications');
        await registration.sync.register('sync-bookmarks');
        console.log('Background sync registered');
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  }

  /**
   * Setup push notifications
   */
  async setupPushNotifications() {
    if (!this.swRegistration) return;

    // Request permission on user interaction
    // Don't request automatically
  }

  /**
   * Request push notification permission
   */
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return false;
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('✓ Notification permission granted');
      await this.subscribeToPush();
      return true;
    } else {
      console.log('⚠ Notification permission denied');
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush() {
    if (!this.swRegistration) return;

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.VAPID_PUBLIC_KEY || ''
        )
      });

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(subscription)
      });

      console.log('✓ Push subscription sent to server');
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
  }

  /**
   * Helper to convert VAPID key
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Add install banner styles
   */
  addInstallBannerStyles() {
    if (document.getElementById('pwa-install-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'pwa-install-styles';
    style.textContent = `
      .pwa-install-banner {
        position: fixed;
        bottom: -200px;
        left: 0;
        right: 0;
        background: white;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
        padding: 20px;
        z-index: 9999;
        transition: bottom 0.3s ease;
      }

      .pwa-install-banner.show {
        bottom: 0;
      }

      .pwa-install-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .pwa-install-icon {
        font-size: 40px;
        flex-shrink: 0;
      }

      .pwa-install-text {
        flex: 1;
      }

      .pwa-install-text strong {
        display: block;
        font-size: 16px;
        margin-bottom: 4px;
      }

      .pwa-install-text p {
        margin: 0;
        font-size: 14px;
        color: #666;
      }

      .pwa-install-banner .btn {
        flex-shrink: 0;
      }

      .pwa-install-banner .btn-close {
        background: none;
        border: none;
        font-size: 28px;
        color: #999;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        flex-shrink: 0;
      }

      @media (max-width: 768px) {
        .pwa-install-content {
          flex-wrap: wrap;
        }

        .pwa-install-text {
          order: 1;
          flex-basis: 100%;
        }

        .pwa-install-icon {
          order: 0;
        }

        .pwa-install-banner .btn {
          order: 2;
          flex: 1;
        }

        .pwa-install-banner .btn-close {
          order: 3;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize PWA manager
const pwaManager = new PWAManager();

// Make it globally available
window.pwaManager = pwaManager;
