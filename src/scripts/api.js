// API Client for Dual Connect Platform
const API_BASE_URL = 'http://localhost:3000/api';

class APIClient {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  // Helper method to make requests
  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    this.token = data.token;
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

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

    return data;
  }

  async logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }

  async getCurrentUser() {
    return await this.request('/auth/me');
  }

  async updateProfile(userData) {
    return await this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async changePassword(passwords) {
    return await this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwords)
    });
  }

  // Programs methods
  async getPrograms(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return await this.request(`/programs?${queryString}`);
  }

  async getProgram(id) {
    return await this.request(`/programs/${id}`);
  }

  async comparePrograms(programIds) {
    return await this.request('/programs/compare', {
      method: 'POST',
      body: JSON.stringify({ program_ids: programIds })
    });
  }

  async getProgramRecommendations(id) {
    return await this.request(`/programs/${id}/recommendations`);
  }

  // Applications methods
  async getMyApplications() {
    return await this.request('/applications/my-applications');
  }

  async getApplication(id) {
    return await this.request(`/applications/${id}`);
  }

  async createApplication(applicationData) {
    return await this.request('/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData)
    });
  }

  async updateApplication(id, applicationData) {
    return await this.request(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(applicationData)
    });
  }

  async deleteApplication(id) {
    return await this.request(`/applications/${id}`, {
      method: 'DELETE'
    });
  }

  async getApplicationStats() {
    return await this.request('/applications/stats/overview');
  }

  // Bookmarks methods
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

  // Companies methods
  async getCompanies(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return await this.request(`/companies?${queryString}`);
  }

  async getCompany(id) {
    return await this.request(`/companies/${id}`);
  }

  // Contact methods
  async getAdvisors(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return await this.request(`/contact/advisors?${queryString}`);
  }

  async sendContactMessage(messageData) {
    return await this.request('/contact/send-message', {
      method: 'POST',
      body: JSON.stringify(messageData)
    });
  }

  // Funding methods
  async getFundingOptions(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return await this.request(`/funding?${queryString}`);
  }

  async getFundingOption(id) {
    return await this.request(`/funding/${id}`);
  }

  // Blog methods
  async getBlogPosts(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return await this.request(`/blog?${queryString}`);
  }

  async getBlogPost(slug) {
    return await this.request(`/blog/${slug}`);
  }

  async getBlogCategories() {
    return await this.request('/blog/categories/all');
  }

  // Success stories methods
  async getSuccessStories(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return await this.request(`/stories?${queryString}`);
  }

  async submitSuccessStory(storyData) {
    return await this.request('/stories', {
      method: 'POST',
      body: JSON.stringify(storyData)
    });
  }

  // FAQ methods
  async getFAQs(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return await this.request(`/faq?${queryString}`);
  }

  async getFAQCategories(language = 'de') {
    return await this.request(`/faq/categories?language=${language}`);
  }

  // Glossary methods
  async getGlossaryTerms(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return await this.request(`/glossary?${queryString}`);
  }

  async searchGlossary(query, language = 'de') {
    return await this.request(`/glossary/search?q=${query}&language=${language}`);
  }

  // Cities methods
  async getCities(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return await this.request(`/cities?${queryString}`);
  }

  async getCity(id) {
    return await this.request(`/cities/${id}`);
  }

  async compareCities(cityIds) {
    return await this.request('/cities/compare', {
      method: 'POST',
      body: JSON.stringify({ city_ids: cityIds })
    });
  }

  // Checklists methods
  async getChecklists(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return await this.request(`/checklists?${queryString}`);
  }

  async getChecklist(id) {
    return await this.request(`/checklists/${id}`);
  }

  async updateChecklistProgress(id, completedItems) {
    return await this.request(`/checklists/${id}/progress`, {
      method: 'POST',
      body: JSON.stringify({ completed_items: completedItems })
    });
  }

  // Notifications methods
  async getNotifications(unreadOnly = false) {
    return await this.request(`/notifications?unread_only=${unreadOnly}`);
  }

  async markNotificationRead(id) {
    return await this.request(`/notifications/${id}/read`, {
      method: 'PUT'
    });
  }

  async markAllNotificationsRead() {
    return await this.request('/notifications/read-all', {
      method: 'PUT'
    });
  }

  async deleteNotification(id) {
    return await this.request(`/notifications/${id}`, {
      method: 'DELETE'
    });
  }

  // Dashboard methods
  async getDashboardStats() {
    return await this.request('/users/dashboard');
  }

  // Analytics methods
  async getPlatformStats() {
    return await this.request('/analytics/stats');
  }

  // Helper methods
  isAuthenticated() {
    return !!this.token;
  }

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

// Create global instance
const api = new APIClient();
