// Enhanced API Client for Dual Connect Platform
// Features: Loading states, retry logic, offline detection, request cancellation, caching

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : '/api';

/**
 * Enhanced API Client with modern features
 */
class EnhancedAPIClient {
  constructor() {
    this.token = localStorage.getItem('auth_token');
    this.requestCache = new Map();
    this.pendingRequests = new Map();
    this.retryDelays = [1000, 2000, 4000]; // Exponential backoff
    this.isOnline = navigator.onLine;
    this.listeners = new Map();
    this.csrfToken = null;

    // Monitor online/offline status
    this.initOnlineDetection();

    // Fetch CSRF token on init
    this.fetchCSRFToken();
  }

  /**
   * Initialize online/offline detection
   */
  initOnlineDetection() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('online');
      this.showToast('Connection restored', 'success');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('offline');
      this.showToast('No internet connection', 'error');
    });
  }

  /**
   * Fetch CSRF token
   */
  async fetchCSRFToken() {
    try {
      const response = await fetch(`${API_BASE_URL}/csrf-token`);
      const data = await response.json();
      this.csrfToken = data.csrfToken;
    } catch (error) {
      console.warn('Failed to fetch CSRF token:', error);
    }
  }

  /**
   * Event emitter pattern
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  /**
   * Make HTTP request with advanced features
   */
  async request(endpoint, options = {}) {
    const {
      retry = true,
      cache = false,
      cacheTTL = 300000, // 5 minutes
      timeout = 30000,
      onProgress = null,
      signal = null
    } = options;

    // Check if offline
    if (!this.isOnline && !options.offlineOk) {
      throw new Error('No internet connection');
    }

    // Generate cache key
    const cacheKey = this.getCacheKey(endpoint, options);

    // Check cache
    if (cache && this.requestCache.has(cacheKey)) {
      const cached = this.requestCache.get(cacheKey);
      if (Date.now() - cached.timestamp < cacheTTL) {
        this.emit('request:cached', { endpoint, data: cached.data });
        return cached.data;
      } else {
        this.requestCache.delete(cacheKey);
      }
    }

    // Emit loading event
    this.emit('request:start', { endpoint });

    // Setup headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Add CSRF token for state-changing operations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method) && this.csrfToken) {
      headers['X-CSRF-Token'] = this.csrfToken;
      headers['X-Session-Id'] = this.getSessionId();
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Use provided signal or create new one
    const requestSignal = signal || controller.signal;

    let lastError;
    const maxRetries = retry ? this.retryDelays.length : 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
          signal: requestSignal
        });

        clearTimeout(timeoutId);

        // Handle different response types
        const contentType = response.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        if (!response.ok) {
          // Handle specific error codes
          if (response.status === 401) {
            this.handleUnauthorized();
          }
          throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
        }

        // Cache successful GET requests
        if (cache && options.method === 'GET') {
          this.requestCache.set(cacheKey, {
            data,
            timestamp: Date.now()
          });
        }

        // Emit success event
        this.emit('request:success', { endpoint, data });

        return data;

      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error;

        // Don't retry if request was cancelled
        if (error.name === 'AbortError') {
          this.emit('request:cancelled', { endpoint });
          throw new Error('Request cancelled');
        }

        // Don't retry on client errors (4xx)
        if (error.message.includes('status 4')) {
          this.emit('request:error', { endpoint, error });
          throw error;
        }

        // Retry on network errors and 5xx errors
        if (attempt < maxRetries) {
          const delay = this.retryDelays[attempt];
          this.emit('request:retry', { endpoint, attempt: attempt + 1, delay });
          await this.sleep(delay);
          continue;
        }

        this.emit('request:error', { endpoint, error });
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Request with loading indicator
   */
  async requestWithLoading(endpoint, options = {}, loadingElement = null) {
    if (loadingElement) {
      loadingElement.classList.add('loading');
    }

    try {
      const result = await this.request(endpoint, options);
      return result;
    } finally {
      if (loadingElement) {
        loadingElement.classList.remove('loading');
      }
    }
  }

  /**
   * Batch requests
   */
  async batchRequest(requests) {
    this.emit('batch:start', { count: requests.length });

    const results = await Promise.allSettled(
      requests.map(({ endpoint, options }) => this.request(endpoint, options))
    );

    const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const failed = results.filter(r => r.status === 'rejected').map(r => r.reason);

    this.emit('batch:complete', { successful: successful.length, failed: failed.length });

    return { successful, failed };
  }

  /**
   * Helper methods
   */
  getCacheKey(endpoint, options) {
    return `${options.method || 'GET'}:${endpoint}:${JSON.stringify(options.body || {})}`;
  }

  getSessionId() {
    let sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = this.generateUUID();
      localStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  handleUnauthorized() {
    this.logout();
    this.emit('unauthorized');
    this.showToast('Session expired. Please login again.', 'error');
    setTimeout(() => {
      window.location.href = '/src/pages/login.html';
    }, 1500);
  }

  showToast(message, type = 'info') {
    // Emit toast event for UI to handle
    this.emit('toast', { message, type });

    // Fallback to console if no toast handler
    if (!this.listeners.has('toast')) {
      console.log(`[${type.toUpperCase()}]`, message);
    }
  }

  clearCache() {
    this.requestCache.clear();
  }

  // ============= Auth Methods =============
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    this.token = data.token;
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    this.emit('auth:login', data.user);

    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    this.token = data.token;
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    this.emit('auth:register', data.user);

    return data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    this.clearCache();
    this.emit('auth:logout');
  }

  async getCurrentUser() {
    return await this.request('/auth/me', { cache: true, cacheTTL: 60000 });
  }

  async updateProfile(userData) {
    const result = await this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
    localStorage.setItem('user', JSON.stringify(result.user));
    return result;
  }

  async changePassword(passwords) {
    return await this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwords)
    });
  }

  // ============= Programs Methods =============
  async getPrograms(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return await this.request(`/programs?${queryString}`, {
      cache: true,
      cacheTTL: 180000 // 3 minutes
    });
  }

  async getProgram(id) {
    return await this.request(`/programs/${id}`, {
      cache: true,
      cacheTTL: 300000 // 5 minutes
    });
  }

  async comparePrograms(programIds) {
    return await this.request('/programs/compare', {
      method: 'POST',
      body: JSON.stringify({ program_ids: programIds })
    });
  }

  async getProgramRecommendations(id) {
    return await this.request(`/programs/${id}/recommendations`, {
      cache: true,
      cacheTTL: 300000
    });
  }

  // ============= Applications Methods =============
  async getMyApplications() {
    return await this.request('/applications/my-applications');
  }

  async getApplication(id) {
    return await this.request(`/applications/${id}`);
  }

  async createApplication(applicationData) {
    const result = await this.request('/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData)
    });
    this.clearCache(); // Clear cache after creating
    return result;
  }

  async updateApplication(id, applicationData) {
    const result = await this.request(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(applicationData)
    });
    this.clearCache();
    return result;
  }

  async deleteApplication(id) {
    const result = await this.request(`/applications/${id}`, {
      method: 'DELETE'
    });
    this.clearCache();
    return result;
  }

  async getApplicationStats() {
    return await this.request('/applications/stats/overview', {
      cache: true,
      cacheTTL: 60000
    });
  }

  // ============= Bookmarks Methods =============
  async getBookmarks() {
    return await this.request('/bookmarks');
  }

  async addBookmark(programId, notes = '') {
    return await this.request('/bookmarks', {
      method: 'POST',
      body: JSON.stringify({ program_id: programId, notes })
    });
  }

  async removeBookmark(programId) {
    return await this.request(`/bookmarks/${programId}`, {
      method: 'DELETE'
    });
  }

  // ============= Helper Methods =============
  isAuthenticated() {
    return !!this.token;
  }

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFile(endpoint, file, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', `${API_BASE_URL}${endpoint}`);

      if (this.token) {
        xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
      }

      xhr.send(formData);
    });
  }
}

// Create global instance
const apiEnhanced = new EnhancedAPIClient();

// Backward compatibility - expose as 'api' as well
if (!window.api) {
  window.api = apiEnhanced;
}
