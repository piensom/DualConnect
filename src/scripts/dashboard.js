// Dashboard functionality
document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  if (!api.isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  const user = api.getUser();

  // Initialize dashboard
  initializeUserProfile(user);
  initializeSidebar();
  await loadDashboardData();

  // Set up event listeners
  setupEventListeners();
});

// Initialize user profile section
function initializeUserProfile(user) {
  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  document.getElementById('userInitials').textContent = initials;
  document.getElementById('userName').textContent = `${user.first_name} ${user.last_name}`;
  document.getElementById('userEmail').textContent = user.email;
}

// Initialize sidebar navigation
function initializeSidebar() {
  const menuItems = document.querySelectorAll('.menu-item');
  const sections = document.querySelectorAll('.content-section');

  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = item.dataset.section;

      // Update active states
      menuItems.forEach(mi => mi.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      item.classList.add('active');
      document.getElementById(sectionId).classList.add('active');

      // Load section data if needed
      loadSectionData(sectionId);
    });
  });
}

// Load dashboard data
async function loadDashboardData() {
  try {
    // Load dashboard stats
    const stats = await api.getDashboardStats();
    updateDashboardStats(stats.stats);

    // Load initial sections
    await Promise.all([
      loadApplications(),
      loadBookmarks(),
      loadNotifications()
    ]);
  } catch (error) {
    console.error('Error loading dashboard:', error);
    showError('Failed to load dashboard data');
  }
}

// Update dashboard statistics
function updateDashboardStats(stats) {
  document.getElementById('totalApplications').textContent = stats.applications.total || 0;
  document.getElementById('pendingApplications').textContent = stats.applications.submitted || 0;
  document.getElementById('totalBookmarks').textContent = stats.bookmarks || 0;
  document.getElementById('acceptedApplications').textContent = stats.applications.accepted || 0;

  // Update badges
  document.getElementById('applicationsBadge').textContent = stats.applications.total || 0;
  document.getElementById('bookmarksBadge').textContent = stats.bookmarks || 0;
  document.getElementById('notificationsBadge').textContent = stats.unread_notifications || 0;
}

// Load section data
async function loadSectionData(sectionId) {
  switch (sectionId) {
    case 'applications':
      await loadApplications();
      break;
    case 'bookmarks':
      await loadBookmarks();
      break;
    case 'notifications':
      await loadNotifications();
      break;
    case 'checklists':
      await loadChecklists();
      break;
    case 'profile':
      await loadProfile();
      break;
  }
}

// Load applications
async function loadApplications() {
  try {
    const data = await api.getMyApplications();
    displayApplications(data.applications);
  } catch (error) {
    console.error('Error loading applications:', error);
    showError('Failed to load applications');
  }
}

// Display applications
function displayApplications(applications) {
  const container = document.getElementById('applicationsList');

  if (!applications || applications.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Sie haben noch keine Bewerbungen erstellt.</p>
        <a href="search.html" class="btn btn-primary">Programme suchen</a>
      </div>
    `;
    return;
  }

  container.innerHTML = applications.map(app => `
    <div class="application-card" data-status="${app.status}">
      <div class="application-header">
        <div>
          <h3>${app.program_name}</h3>
          <p class="company">${app.company_name}</p>
        </div>
        <span class="status-badge status-${app.status}">${getStatusText(app.status)}</span>
      </div>
      <div class="application-meta">
        <span>📅 Erstellt: ${formatDate(app.created_at)}</span>
        ${app.submitted_at ? `<span>✅ Eingereicht: ${formatDate(app.submitted_at)}</span>` : ''}
      </div>
      <div class="application-actions">
        <button class="btn btn-secondary" onclick="viewApplication('${app.application_id}')">Details</button>
        ${app.status === 'draft' ? `<button class="btn btn-primary" onclick="editApplication('${app.application_id}')">Bearbeiten</button>` : ''}
        <button class="btn btn-text btn-danger" onclick="deleteApplication('${app.application_id}')">Löschen</button>
      </div>
    </div>
  `).join('');

  // Setup filters
  setupApplicationFilters(applications);
}

// Setup application filters
function setupApplicationFilters(applications) {
  const filterBtns = document.querySelectorAll('.filter-btn');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Update active button
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Filter applications
      const filtered = filter === 'all'
        ? applications
        : applications.filter(app => app.status === filter);

      displayApplications(filtered);
    });
  });
}

// Load bookmarks
async function loadBookmarks() {
  try {
    const data = await api.getBookmarks();
    displayBookmarks(data.bookmarks);
  } catch (error) {
    console.error('Error loading bookmarks:', error);
    showError('Failed to load bookmarks');
  }
}

// Display bookmarks
function displayBookmarks(bookmarks) {
  const container = document.getElementById('bookmarksList');

  if (!bookmarks || bookmarks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Sie haben noch keine Favoriten gespeichert.</p>
        <a href="search.html" class="btn btn-primary">Programme durchsuchen</a>
      </div>
    `;
    return;
  }

  container.innerHTML = bookmarks.map(bookmark => `
    <div class="bookmark-card">
      <div class="bookmark-header">
        <h3>${bookmark.program_name}</h3>
        <button class="btn-icon" onclick="removeBookmark(${bookmark.program_id})" title="Entfernen">
          ❌
        </button>
      </div>
      <p class="company">${bookmark.company_name} • ${bookmark.city}</p>
      <p class="bookmark-notes">${bookmark.notes || 'Keine Notizen'}</p>
      <div class="bookmark-meta">
        <span>${bookmark.program_type}</span>
        <span>${bookmark.field_of_study}</span>
        <span>${bookmark.duration_months} Monate</span>
      </div>
      <div class="bookmark-actions">
        <a href="program-detail.html?id=${bookmark.program_id}" class="btn btn-primary">Details ansehen</a>
        <button class="btn btn-secondary" onclick="applyToProgram(${bookmark.program_id})">Bewerben</button>
      </div>
    </div>
  `).join('');
}

// Load notifications
async function loadNotifications() {
  try {
    const data = await api.getNotifications();
    displayNotifications(data.notifications);
  } catch (error) {
    console.error('Error loading notifications:', error);
    showError('Failed to load notifications');
  }
}

// Display notifications
function displayNotifications(notifications) {
  const container = document.getElementById('notificationsList');

  if (!notifications || notifications.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Keine Benachrichtigungen vorhanden.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = notifications.map(notif => `
    <div class="notification-item ${notif.is_read ? 'read' : 'unread'}">
      <div class="notification-content">
        <h4>${notif.title}</h4>
        <p>${notif.message}</p>
        <span class="notification-time">${formatRelativeTime(notif.created_at)}</span>
      </div>
      <div class="notification-actions">
        ${!notif.is_read ? `<button class="btn btn-text" onclick="markAsRead('${notif.notification_id}')">Als gelesen markieren</button>` : ''}
        <button class="btn btn-text btn-danger" onclick="deleteNotification('${notif.notification_id}')">Löschen</button>
      </div>
    </div>
  `).join('');
}

// Load checklists
async function loadChecklists() {
  try {
    const user = api.getUser();
    const data = await api.getChecklists({ language: user.preferred_language || 'de' });
    displayChecklists(data.checklists);
  } catch (error) {
    console.error('Error loading checklists:', error);
    showError('Failed to load checklists');
  }
}

// Display checklists
function displayChecklists(checklists) {
  const container = document.getElementById('checklistsList');

  if (!checklists || checklists.length === 0) {
    container.innerHTML = '<p>Keine Checklisten verfügbar.</p>';
    return;
  }

  container.innerHTML = checklists.map(checklist => `
    <div class="checklist-card">
      <h3>${checklist.title}</h3>
      <p>${checklist.description}</p>
      <div class="checklist-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: 0%"></div>
        </div>
        <span class="progress-text">0% abgeschlossen</span>
      </div>
      <button class="btn btn-primary" onclick="openChecklist(${checklist.checklist_id})">Öffnen</button>
    </div>
  `).join('');
}

// Load profile
async function loadProfile() {
  try {
    const data = await api.getCurrentUser();
    populateProfileForm(data.user);
  } catch (error) {
    console.error('Error loading profile:', error);
    showError('Failed to load profile');
  }
}

// Populate profile form
function populateProfileForm(user) {
  document.getElementById('profileFirstName').value = user.first_name || '';
  document.getElementById('profileLastName').value = user.last_name || '';
  document.getElementById('profileEmail').value = user.email || '';
  document.getElementById('profilePhone').value = user.phone || '';
  document.getElementById('profileCountry').value = user.country_of_origin || '';
  document.getElementById('profileLanguage').value = user.preferred_language || 'de';
}

// Setup event listeners
function setupEventListeners() {
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await api.logout();
      window.location.href = 'index.html';
    });
  }

  // Profile form
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await updateProfile();
    });
  }

  // Password form
  const passwordForm = document.getElementById('passwordForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await changePassword();
    });
  }

  // Mark all notifications as read
  const markAllReadBtn = document.getElementById('markAllRead');
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', async () => {
      try {
        await api.markAllNotificationsRead();
        await loadNotifications();
        showSuccess('Alle Benachrichtigungen als gelesen markiert');
      } catch (error) {
        showError('Fehler beim Markieren der Benachrichtigungen');
      }
    });
  }
}

// Update profile
async function updateProfile() {
  try {
    const formData = {
      first_name: document.getElementById('profileFirstName').value,
      last_name: document.getElementById('profileLastName').value,
      phone: document.getElementById('profilePhone').value,
      country_of_origin: document.getElementById('profileCountry').value,
      preferred_language: document.getElementById('profileLanguage').value
    };

    await api.updateProfile(formData);

    // Update local user data
    const updatedUser = api.getUser();
    Object.assign(updatedUser, formData);
    localStorage.setItem('user', JSON.stringify(updatedUser));

    showSuccess('Profil erfolgreich aktualisiert');
  } catch (error) {
    console.error('Error updating profile:', error);
    showError('Fehler beim Aktualisieren des Profils');
  }
}

// Change password
async function changePassword() {
  try {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;

    if (newPassword !== confirmPassword) {
      showError('Die neuen Passwörter stimmen nicht überein');
      return;
    }

    if (newPassword.length < 8) {
      showError('Das Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    await api.changePassword({
      current_password: currentPassword,
      new_password: newPassword
    });

    // Clear form
    document.getElementById('passwordForm').reset();
    showSuccess('Passwort erfolgreich geändert');
  } catch (error) {
    console.error('Error changing password:', error);
    showError(error.message || 'Fehler beim Ändern des Passworts');
  }
}

// Action functions
async function viewApplication(id) {
  window.location.href = `application-detail.html?id=${id}`;
}

async function editApplication(id) {
  window.location.href = `application-edit.html?id=${id}`;
}

async function deleteApplication(id) {
  if (!confirm('Möchten Sie diese Bewerbung wirklich löschen?')) {
    return;
  }

  try {
    await api.deleteApplication(id);
    await loadApplications();
    showSuccess('Bewerbung gelöscht');
  } catch (error) {
    showError('Fehler beim Löschen der Bewerbung');
  }
}

async function removeBookmark(programId) {
  if (!confirm('Möchten Sie dieses Programm aus Ihren Favoriten entfernen?')) {
    return;
  }

  try {
    await api.removeBookmark(programId);
    await loadBookmarks();
    showSuccess('Favorit entfernt');
  } catch (error) {
    showError('Fehler beim Entfernen des Favoriten');
  }
}

async function applyToProgram(programId) {
  window.location.href = `application-create.html?program_id=${programId}`;
}

async function markAsRead(notificationId) {
  try {
    await api.markNotificationRead(notificationId);
    await loadNotifications();
  } catch (error) {
    showError('Fehler beim Markieren der Benachrichtigung');
  }
}

async function deleteNotification(notificationId) {
  try {
    await api.deleteNotification(notificationId);
    await loadNotifications();
  } catch (error) {
    showError('Fehler beim Löschen der Benachrichtigung');
  }
}

function openChecklist(checklistId) {
  window.location.href = `checklist.html?id=${checklistId}`;
}

// Utility functions
function getStatusText(status) {
  const statusMap = {
    'draft': 'Entwurf',
    'submitted': 'Eingereicht',
    'under_review': 'In Prüfung',
    'accepted': 'Angenommen',
    'rejected': 'Abgelehnt'
  };
  return statusMap[status] || status;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Gerade eben';
  if (diffMins < 60) return `vor ${diffMins} Minute${diffMins > 1 ? 'n' : ''}`;
  if (diffHours < 24) return `vor ${diffHours} Stunde${diffHours > 1 ? 'n' : ''}`;
  if (diffDays < 7) return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
  return formatDate(dateString);
}

function showSuccess(message) {
  showToast(message, 'success');
}

function showError(message) {
  showToast(message, 'error');
}

function showToast(message, type = 'info') {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  // Add to document
  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => toast.classList.add('show'), 100);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
