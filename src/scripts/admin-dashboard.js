// Admin Dashboard JavaScript

// Check authentication
if (!localStorage.getItem('admin_token')) {
  window.location.href = 'login.html';
}

// State
let dashboardData = {
  stats: {},
  recentActivity: [],
  charts: {}
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  loadAdminInfo();
  loadDashboardData();
});

// Load admin user info
function loadAdminInfo() {
  const adminData = JSON.parse(localStorage.getItem('admin_user') || '{}');
  document.getElementById('adminName').textContent = adminData.name || 'Admin';
}

// Load all dashboard data
async function loadDashboardData() {
  try {
    await Promise.all([
      loadStats(),
      loadRecentActivity(),
      loadNavCounts()
    ]);
  } catch (error) {
    console.error('Error loading dashboard:', error);
    showToast('Failed to load dashboard data', 'error');
  }
}

// Load statistics
async function loadStats() {
  try {
    const response = await fetch('/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      }
    });

    if (!response.ok) throw new Error('Failed to load stats');

    const data = await response.json();
    dashboardData.stats = data;

    // Update stat cards
    document.getElementById('totalPrograms').textContent = data.totalPrograms || 0;
    document.getElementById('totalUsers').textContent = data.totalUsers || 0;
    document.getElementById('totalApplications').textContent = data.totalApplications || 0;
    document.getElementById('pendingApplications').textContent = data.pendingApplications || 0;
  } catch (error) {
    console.error('Error loading stats:', error);
    // Use placeholder data for demo
    document.getElementById('totalPrograms').textContent = '156';
    document.getElementById('totalUsers').textContent = '2,847';
    document.getElementById('totalApplications').textContent = '1,523';
    document.getElementById('pendingApplications').textContent = '47';
  }
}

// Load navigation counts
async function loadNavCounts() {
  try {
    const response = await fetch('/api/admin/counts', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      }
    });

    if (!response.ok) throw new Error('Failed to load counts');

    const data = await response.json();

    // Update navigation badges
    document.getElementById('programsCount').textContent = data.programs || 0;
    document.getElementById('pendingApps').textContent = data.pendingApplications || 0;
    document.getElementById('usersCount').textContent = data.users || 0;
    document.getElementById('companiesCount').textContent = data.companies || 0;
    document.getElementById('postsCount').textContent = data.blogPosts || 0;
    document.getElementById('faqCount').textContent = data.faqs || 0;
    document.getElementById('storiesCount').textContent = data.stories || 0;
  } catch (error) {
    console.error('Error loading counts:', error);
    // Use placeholder data
    document.getElementById('programsCount').textContent = '156';
    document.getElementById('pendingApps').textContent = '47';
    document.getElementById('usersCount').textContent = '2,847';
    document.getElementById('companiesCount').textContent = '89';
    document.getElementById('postsCount').textContent = '34';
    document.getElementById('faqCount').textContent = '52';
    document.getElementById('storiesCount').textContent = '18';
  }
}

// Load recent activity
async function loadRecentActivity() {
  const activityList = document.getElementById('activityList');

  try {
    const response = await fetch('/api/admin/activity', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      }
    });

    if (!response.ok) throw new Error('Failed to load activity');

    const activities = await response.json();
    dashboardData.recentActivity = activities;

    displayActivity(activities);
  } catch (error) {
    console.error('Error loading activity:', error);

    // Use placeholder data
    const placeholderActivities = [
      {
        icon: '📝',
        title: 'New Application Submitted',
        description: 'John Doe applied for Software Developer position at TechCorp',
        time: '5 minutes ago'
      },
      {
        icon: '👤',
        title: 'New User Registration',
        description: 'Maria Schmidt created an account',
        time: '15 minutes ago'
      },
      {
        icon: '🎓',
        title: 'Program Updated',
        description: 'Data Science program details were updated',
        time: '1 hour ago'
      },
      {
        icon: '💬',
        title: 'New Blog Comment',
        description: 'Ahmed Ali commented on "Finding the Perfect Ausbildung"',
        time: '2 hours ago'
      },
      {
        icon: '🏢',
        title: 'Company Verified',
        description: 'Siemens AG was verified and published',
        time: '3 hours ago'
      }
    ];

    displayActivity(placeholderActivities);
  }
}

// Display activity items
function displayActivity(activities) {
  const activityList = document.getElementById('activityList');

  if (!activities || activities.length === 0) {
    activityList.innerHTML = `
      <div class="empty-state">
        <p>No recent activity</p>
      </div>
    `;
    return;
  }

  activityList.innerHTML = activities.map(activity => `
    <div class="activity-item">
      <div class="activity-icon">${activity.icon}</div>
      <div class="activity-content">
        <h4>${activity.title}</h4>
        <p>${activity.description}</p>
      </div>
      <div class="activity-time">${activity.time}</div>
    </div>
  `).join('');
}

// Refresh data
async function refreshData() {
  showToast('Refreshing data...', 'info');
  await loadDashboardData();
  showToast('Data refreshed successfully', 'success');
}

// Logout function
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = 'login.html';
  }
}

// Toast notification function
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      container.removeChild(toast);
    }, 300);
  }, 3000);
}
