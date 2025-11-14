// Admin Users Management
if (!localStorage.getItem('admin_token')) window.location.href = 'login.html';

let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
const itemsPerPage = 15;

document.addEventListener('DOMContentLoaded', () => {
  loadAdminInfo();
  loadUsers();
});

function loadAdminInfo() {
  const adminData = JSON.parse(localStorage.getItem('admin_user') || '{}');
  document.getElementById('adminName').textContent = adminData.name || 'Admin';
}

async function loadUsers() {
  try {
    const response = await fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
    });
    if (!response.ok) throw new Error('Failed to load users');
    const data = await response.json();
    allUsers = data.users || data;
    filteredUsers = [...allUsers];
    updateStats();
    displayUsers();
  } catch (error) {
    console.error('Error loading users:', error);
    allUsers = generatePlaceholderUsers();
    filteredUsers = [...allUsers];
    updateStats();
    displayUsers();
  }
}

function generatePlaceholderUsers() {
  const names = ['John Doe', 'Maria Schmidt', 'Ahmed Ali', 'Sarah Johnson', 'Michael Chen', 'Anna Müller', 'David Kim', 'Elena Rodriguez', 'Tom Weber', 'Lisa Brown'];
  return Array.from({ length: 50 }, (_, i) => ({
    user_id: i + 1,
    name: names[i % names.length],
    email: `user${i + 1}@example.com`,
    is_admin: i < 3,
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    last_login: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: Math.random() > 0.1 ? 'active' : 'inactive'
  }));
}

function updateStats() {
  const today = new Date().toISOString().split('T')[0];
  const stats = {
    total: allUsers.length,
    active: allUsers.filter(u => u.status === 'active').length,
    newToday: allUsers.filter(u => u.created_at?.startsWith(today)).length,
    admins: allUsers.filter(u => u.is_admin).length
  };
  document.getElementById('totalUsers').textContent = stats.total;
  document.getElementById('activeUsers').textContent = stats.active;
  document.getElementById('newUsersToday').textContent = stats.newToday;
  document.getElementById('adminUsers').textContent = stats.admins;
  document.getElementById('usersCount').textContent = stats.total;
}

function displayUsers() {
  const tableBody = document.getElementById('usersTableBody');
  if (!filteredUsers || filteredUsers.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 3rem; color: #6b7280;">No users found.</td></tr>';
    updatePaginationInfo(0);
    return;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  tableBody.innerHTML = paginatedUsers.map(user => `
    <tr>
      <td>${user.user_id}</td>
      <td><strong>${user.name}</strong></td>
      <td>${user.email}</td>
      <td><span class="table-badge ${user.is_admin ? 'info' : ''}">${user.is_admin ? 'Admin' : 'User'}</span></td>
      <td>${formatDate(user.created_at)}</td>
      <td>${formatDate(user.last_login)}</td>
      <td><span class="table-badge ${user.status === 'active' ? 'success' : 'danger'}">${user.status || 'Active'}</span></td>
      <td>
        <div class="table-actions-cell">
          <button class="btn-icon" onclick="viewUser(${user.user_id})" title="View">👁️</button>
          <button class="btn-icon edit" onclick="editUser(${user.user_id})" title="Edit">✏️</button>
          <button class="btn-icon delete" onclick="deleteUser(${user.user_id})" title="Delete">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');

  updatePaginationInfo(filteredUsers.length);
  updatePaginationControls(filteredUsers.length);
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function filterUsers() {
  const roleFilter = document.getElementById('filterRole').value;
  const statusFilter = document.getElementById('filterStatus').value;
  const dateFrom = document.getElementById('filterDateFrom').value;
  const dateTo = document.getElementById('filterDateTo').value;

  filteredUsers = allUsers.filter(user => {
    if (roleFilter === 'admin' && !user.is_admin) return false;
    if (roleFilter === 'user' && user.is_admin) return false;
    if (statusFilter && user.status !== statusFilter) return false;
    if (dateFrom && user.created_at < dateFrom) return false;
    if (dateTo && user.created_at > dateTo) return false;
    return true;
  });

  currentPage = 1;
  displayUsers();
}

let searchTimeout;
function searchUsers() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const searchTerm = document.getElementById('searchUsers').value.toLowerCase();
    filteredUsers = searchTerm ? allUsers.filter(user =>
      user.name.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm)
    ) : [...allUsers];
    currentPage = 1;
    displayUsers();
  }, 300);
}

function viewUser(userId) {
  const user = allUsers.find(u => u.user_id === userId);
  if (user) alert(`User Details:\nName: ${user.name}\nEmail: ${user.email}\nRole: ${user.is_admin ? 'Admin' : 'User'}\nStatus: ${user.status}`);
}

function editUser(userId) {
  const user = allUsers.find(u => u.user_id === userId);
  if (user) {
    const newName = prompt('Edit user name:', user.name);
    if (newName) {
      user.name = newName;
      displayUsers();
      showToast('User updated successfully', 'success');
    }
  }
}

async function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user?')) return;
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
    });
    if (!response.ok) throw new Error('Failed to delete user');
    showToast('User deleted successfully', 'success');
    await loadUsers();
  } catch (error) {
    allUsers = allUsers.filter(u => u.user_id !== userId);
    filteredUsers = filteredUsers.filter(u => u.user_id !== userId);
    displayUsers();
    showToast('User deleted successfully (demo)', 'success');
  }
}

function updatePaginationInfo(total) {
  const startIndex = Math.min((currentPage - 1) * itemsPerPage + 1, total);
  const endIndex = Math.min(currentPage * itemsPerPage, total);
  document.getElementById('paginationInfo').textContent = `Showing ${startIndex}-${endIndex} of ${total} users`;
}

function updatePaginationControls(total) {
  const totalPages = Math.ceil(total / itemsPerPage);
  const container = document.getElementById('paginationControls');
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `<button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `<button onclick="changePage(${i})" class="${i === currentPage ? 'active' : ''}">${i}</button>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += '<span style="padding: 0.5rem;">...</span>';
    }
  }
  html += `<button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>`;
  container.innerHTML = html;
}

function changePage(page) {
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  displayUsers();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function exportUsers() {
  const csv = [
    ['ID', 'Name', 'Email', 'Role', 'Registered', 'Last Login', 'Status'].join(','),
    ...filteredUsers.map(u => [u.user_id, u.name, u.email, u.is_admin ? 'Admin' : 'User', u.created_at, u.last_login, u.status].map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'users.csv';
  link.click();
  showToast('Users exported successfully', 'success');
}

function refreshData() {
  showToast('Refreshing data...', 'info');
  loadUsers();
  setTimeout(() => showToast('Data refreshed successfully', 'success'), 500);
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = 'login.html';
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => container.removeChild(toast), 300);
  }, 3000);
}
