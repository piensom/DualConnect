// Admin Applications Management JavaScript

// Check authentication
if (!localStorage.getItem('admin_token')) {
  window.location.href = 'login.html';
}

// State
let allApplications = [];
let filteredApplications = [];
let selectedApplications = new Set();
let currentPage = 1;
let currentApplication = null;
const itemsPerPage = 10;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadAdminInfo();
  loadApplications();
  loadProgramsForFilter();
});

// Load admin user info
function loadAdminInfo() {
  const adminData = JSON.parse(localStorage.getItem('admin_user') || '{}');
  document.getElementById('adminName').textContent = adminData.name || 'Admin';
}

// Load all applications
async function loadApplications() {
  const tableBody = document.getElementById('applicationsTableBody');

  try {
    const response = await fetch('/api/applications', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      }
    });

    if (!response.ok) throw new Error('Failed to load applications');

    const data = await response.json();
    allApplications = data.applications || data;
    filteredApplications = [...allApplications];

    updateStats();
    displayApplications();
  } catch (error) {
    console.error('Error loading applications:', error);

    // Use placeholder data for demo
    allApplications = generatePlaceholderApplications();
    filteredApplications = [...allApplications];
    updateStats();
    displayApplications();
  }
}

// Generate placeholder data
function generatePlaceholderApplications() {
  const statuses = ['pending', 'under_review', 'approved', 'rejected'];
  const names = ['John Doe', 'Maria Schmidt', 'Ahmed Ali', 'Sarah Johnson', 'Michael Chen', 'Anna Müller', 'David Kim', 'Elena Rodriguez'];
  const programs = ['Software Developer', 'Data Science', 'Mechanical Engineering', 'Business Administration', 'Nursing'];

  return Array.from({ length: 25 }, (_, i) => ({
    application_id: i + 1,
    user_id: i + 1,
    full_name: names[i % names.length],
    email: `user${i + 1}@example.com`,
    phone: '+49 123 456789',
    program_id: (i % 5) + 1,
    program_title: programs[i % programs.length],
    company_name: 'TechCorp GmbH',
    status: statuses[i % statuses.length],
    applied_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    cover_letter: 'I am very interested in this program...',
    education_level: 'Bachelor',
    german_level: 'B2',
    english_level: 'C1',
    nationality: 'USA',
    date_of_birth: '1998-05-15',
    city: 'Berlin',
    country: 'Germany'
  }));
}

// Update statistics
function updateStats() {
  const stats = {
    total: allApplications.length,
    pending: allApplications.filter(a => a.status === 'pending').length,
    approved: allApplications.filter(a => a.status === 'approved').length,
    rejected: allApplications.filter(a => a.status === 'rejected').length
  };

  document.getElementById('totalApplications').textContent = stats.total;
  document.getElementById('pendingCount').textContent = stats.pending;
  document.getElementById('approvedCount').textContent = stats.approved;
  document.getElementById('rejectedCount').textContent = stats.rejected;
  document.getElementById('pendingApps').textContent = stats.pending;
}

// Display applications in table
function displayApplications() {
  const tableBody = document.getElementById('applicationsTableBody');

  if (!filteredApplications || filteredApplications.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 3rem; color: #6b7280;">
          No applications found.
        </td>
      </tr>
    `;
    updatePaginationInfo(0);
    return;
  }

  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedApplications = filteredApplications.slice(startIndex, endIndex);

  // Display applications
  tableBody.innerHTML = paginatedApplications.map(app => `
    <tr>
      <td>
        <input type="checkbox"
               class="app-checkbox"
               data-id="${app.application_id}"
               ${selectedApplications.has(app.application_id) ? 'checked' : ''}
               onchange="toggleSelection(${app.application_id})">
      </td>
      <td>${app.application_id}</td>
      <td><strong>${app.full_name}</strong></td>
      <td>${app.email}</td>
      <td>${app.program_title || 'N/A'}</td>
      <td>${formatDate(app.applied_date)}</td>
      <td>
        <span class="table-badge ${getStatusBadgeClass(app.status)}">
          ${getStatusText(app.status)}
        </span>
      </td>
      <td>
        <div class="table-actions-cell">
          <button class="btn-icon" onclick="viewApplication(${app.application_id})" title="View">
            👁️
          </button>
          <button class="btn-icon edit" onclick="quickApprove(${app.application_id})" title="Approve">
            ✅
          </button>
          <button class="btn-icon delete" onclick="quickReject(${app.application_id})" title="Reject">
            ❌
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  updatePaginationInfo(filteredApplications.length);
  updatePaginationControls(filteredApplications.length);
  updateBulkActionsVisibility();
}

// Format date
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Get status badge class
function getStatusBadgeClass(status) {
  const classes = {
    'pending': 'warning',
    'under_review': 'info',
    'approved': 'success',
    'rejected': 'danger',
    'withdrawn': 'info'
  };
  return classes[status] || 'info';
}

// Get status text
function getStatusText(status) {
  const texts = {
    'pending': 'Pending',
    'under_review': 'Under Review',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'withdrawn': 'Withdrawn'
  };
  return texts[status] || status;
}

// Toggle selection
function toggleSelection(applicationId) {
  if (selectedApplications.has(applicationId)) {
    selectedApplications.delete(applicationId);
  } else {
    selectedApplications.add(applicationId);
  }
  updateBulkActionsVisibility();
  updateSelectAllCheckbox();
}

// Toggle select all
function toggleSelectAll() {
  const selectAll = document.getElementById('selectAll');
  const checkboxes = document.querySelectorAll('.app-checkbox');

  if (selectAll.checked) {
    checkboxes.forEach(cb => {
      const id = parseInt(cb.dataset.id);
      selectedApplications.add(id);
      cb.checked = true;
    });
  } else {
    selectedApplications.clear();
    checkboxes.forEach(cb => cb.checked = false);
  }

  updateBulkActionsVisibility();
}

// Update select all checkbox
function updateSelectAllCheckbox() {
  const selectAll = document.getElementById('selectAll');
  const checkboxes = document.querySelectorAll('.app-checkbox');
  const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;

  selectAll.checked = checkboxes.length > 0 && checkedCount === checkboxes.length;
  selectAll.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
}

// Update bulk actions visibility
function updateBulkActionsVisibility() {
  const bulkActions = document.getElementById('bulkActions');
  const selectedCount = document.getElementById('selectedCount');

  if (selectedApplications.size > 0) {
    bulkActions.style.display = 'flex';
    selectedCount.textContent = `${selectedApplications.size} selected`;
  } else {
    bulkActions.style.display = 'none';
  }
}

// Bulk update status
async function bulkUpdateStatus(newStatus) {
  if (selectedApplications.size === 0) return;

  const statusText = getStatusText(newStatus);
  if (!confirm(`Are you sure you want to ${statusText.toLowerCase()} ${selectedApplications.size} application(s)?`)) {
    return;
  }

  try {
    // In real implementation, this would be a batch API call
    for (const appId of selectedApplications) {
      await updateStatus(appId, newStatus);
    }

    showToast(`${selectedApplications.size} application(s) ${statusText.toLowerCase()} successfully`, 'success');
    selectedApplications.clear();
    await loadApplications();
  } catch (error) {
    console.error('Error updating applications:', error);
    showToast('Failed to update applications', 'error');
  }
}

// Update pagination info
function updatePaginationInfo(total) {
  const startIndex = Math.min((currentPage - 1) * itemsPerPage + 1, total);
  const endIndex = Math.min(currentPage * itemsPerPage, total);

  document.getElementById('paginationInfo').textContent =
    `Showing ${startIndex}-${endIndex} of ${total} applications`;
}

// Update pagination controls
function updatePaginationControls(total) {
  const totalPages = Math.ceil(total / itemsPerPage);
  const container = document.getElementById('paginationControls');

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `
    <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
      Previous
    </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `
        <button onclick="changePage(${i})" class="${i === currentPage ? 'active' : ''}">
          ${i}
        </button>
      `;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += '<span style="padding: 0.5rem;">...</span>';
    }
  }

  html += `
    <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
      Next
    </button>
  `;

  container.innerHTML = html;
}

// Change page
function changePage(page) {
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  if (page < 1 || page > totalPages) return;

  currentPage = page;
  displayApplications();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Filter applications
function filterApplications() {
  const statusFilter = document.getElementById('filterStatus').value;
  const programFilter = document.getElementById('filterProgram').value;
  const dateFrom = document.getElementById('filterDateFrom').value;
  const dateTo = document.getElementById('filterDateTo').value;

  filteredApplications = allApplications.filter(app => {
    if (statusFilter && app.status !== statusFilter) return false;
    if (programFilter && app.program_id !== parseInt(programFilter)) return false;
    if (dateFrom && app.applied_date < dateFrom) return false;
    if (dateTo && app.applied_date > dateTo) return false;
    return true;
  });

  currentPage = 1;
  displayApplications();
}

// Search applications
let searchTimeout;
function searchApplications() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const searchTerm = document.getElementById('searchApplications').value.toLowerCase();

    if (!searchTerm) {
      filteredApplications = [...allApplications];
    } else {
      filteredApplications = allApplications.filter(app =>
        app.full_name.toLowerCase().includes(searchTerm) ||
        app.email.toLowerCase().includes(searchTerm) ||
        (app.program_title && app.program_title.toLowerCase().includes(searchTerm))
      );
    }

    currentPage = 1;
    displayApplications();
  }, 300);
}

// View application details
function viewApplication(applicationId) {
  const app = allApplications.find(a => a.application_id === applicationId);
  if (!app) return;

  currentApplication = app;

  // Populate modal
  document.getElementById('detailName').textContent = app.full_name;
  document.getElementById('detailEmail').textContent = app.email;
  document.getElementById('detailPhone').textContent = app.phone || 'N/A';
  document.getElementById('detailDOB').textContent = app.date_of_birth || 'N/A';
  document.getElementById('detailNationality').textContent = app.nationality || 'N/A';
  document.getElementById('detailLocation').textContent = `${app.city || 'N/A'}, ${app.country || 'N/A'}`;

  document.getElementById('detailProgram').textContent = app.program_title || 'N/A';
  document.getElementById('detailCompany').textContent = app.company_name || 'N/A';
  document.getElementById('detailProgramLocation').textContent = app.program_city || 'N/A';
  document.getElementById('detailAppliedDate').textContent = formatDate(app.applied_date);

  document.getElementById('detailEducation').textContent = app.education_level || 'N/A';
  document.getElementById('detailField').textContent = app.field_of_study || 'N/A';
  document.getElementById('detailGerman').textContent = app.german_level || 'N/A';
  document.getElementById('detailEnglish').textContent = app.english_level || 'N/A';

  document.getElementById('detailCoverLetter').textContent = app.cover_letter || 'No cover letter provided';

  // Status
  const statusBadge = document.getElementById('detailStatus');
  statusBadge.className = `table-badge ${getStatusBadgeClass(app.status)}`;
  statusBadge.textContent = getStatusText(app.status);

  document.getElementById('statusSelect').value = app.status;
  document.getElementById('adminNotes').value = app.admin_notes || '';

  // Documents
  const documentsDiv = document.getElementById('detailDocuments');
  if (app.documents && app.documents.length > 0) {
    documentsDiv.innerHTML = app.documents.map(doc => `
      <div style="margin-bottom: 0.5rem;">
        <a href="${doc.url}" target="_blank" style="color: #3b82f6;">📎 ${doc.name}</a>
      </div>
    `).join('');
  } else {
    documentsDiv.innerHTML = '<p style="color: #6b7280;">No documents uploaded</p>';
  }

  // Show modal
  document.getElementById('applicationModal').style.display = 'flex';
  setTimeout(() => {
    document.getElementById('applicationModal').classList.add('show');
  }, 10);
}

// Quick approve
async function quickApprove(applicationId) {
  if (!confirm('Are you sure you want to approve this application?')) return;
  await updateStatus(applicationId, 'approved');
  showToast('Application approved successfully', 'success');
  await loadApplications();
}

// Quick reject
async function quickReject(applicationId) {
  if (!confirm('Are you sure you want to reject this application?')) return;
  await updateStatus(applicationId, 'rejected');
  showToast('Application rejected successfully', 'success');
  await loadApplications();
}

// Update application status
async function updateApplicationStatus() {
  if (!currentApplication) return;

  const newStatus = document.getElementById('statusSelect').value;

  try {
    await updateStatus(currentApplication.application_id, newStatus);
    showToast('Status updated successfully', 'success');
    closeModal();
    await loadApplications();
  } catch (error) {
    console.error('Error updating status:', error);
    showToast('Failed to update status', 'error');
  }
}

// Update status helper
async function updateStatus(applicationId, newStatus) {
  try {
    const response = await fetch(`/api/applications/${applicationId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) throw new Error('Failed to update status');
    return await response.json();
  } catch (error) {
    // Demo mode - update in array
    const app = allApplications.find(a => a.application_id === applicationId);
    if (app) {
      app.status = newStatus;
    }
  }
}

// Save admin notes
async function saveAdminNotes() {
  if (!currentApplication) return;

  const notes = document.getElementById('adminNotes').value;

  try {
    const response = await fetch(`/api/applications/${currentApplication.application_id}/notes`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      },
      body: JSON.stringify({ admin_notes: notes })
    });

    if (!response.ok) throw new Error('Failed to save notes');

    showToast('Notes saved successfully', 'success');
    currentApplication.admin_notes = notes;
  } catch (error) {
    console.error('Error saving notes:', error);

    // Demo mode
    currentApplication.admin_notes = notes;
    showToast('Notes saved successfully (demo)', 'success');
  }
}

// Delete application
async function deleteApplication() {
  if (!currentApplication) return;

  if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch(`/api/applications/${currentApplication.application_id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      }
    });

    if (!response.ok) throw new Error('Failed to delete application');

    showToast('Application deleted successfully', 'success');
    closeModal();
    await loadApplications();
  } catch (error) {
    console.error('Error deleting application:', error);

    // Demo mode
    allApplications = allApplications.filter(a => a.application_id !== currentApplication.application_id);
    filteredApplications = filteredApplications.filter(a => a.application_id !== currentApplication.application_id);
    displayApplications();
    closeModal();
    showToast('Application deleted successfully (demo)', 'success');
  }
}

// Download CV
function downloadCV() {
  if (!currentApplication) return;

  if (currentApplication.cv_url) {
    window.open(currentApplication.cv_url, '_blank');
  } else {
    showToast('No CV available for this application', 'warning');
  }
}

// Send email
function sendEmail() {
  if (!currentApplication) return;

  const subject = `Application Update - ${currentApplication.program_title}`;
  const mailtoLink = `mailto:${currentApplication.email}?subject=${encodeURIComponent(subject)}`;
  window.location.href = mailtoLink;
}

// Export applications
function exportApplications() {
  const csv = convertToCSV(filteredApplications);
  downloadCSV(csv, 'applications.csv');
  showToast('Applications exported successfully', 'success');
}

// Convert to CSV
function convertToCSV(applications) {
  const headers = ['ID', 'Name', 'Email', 'Phone', 'Program', 'Status', 'Applied Date'];
  const rows = applications.map(app => [
    app.application_id,
    app.full_name,
    app.email,
    app.phone || '',
    app.program_title || '',
    app.status,
    app.applied_date
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

// Download CSV
function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Load programs for filter
async function loadProgramsForFilter() {
  try {
    const response = await fetch('/api/programs');
    if (!response.ok) throw new Error('Failed to load programs');

    const programs = await response.json();
    const select = document.getElementById('filterProgram');

    select.innerHTML = '<option value="">All Programs</option>' +
      programs.map(p => `<option value="${p.program_id}">${p.title}</option>`).join('');
  } catch (error) {
    console.error('Error loading programs:', error);
  }
}

// Close modal
function closeModal() {
  const modal = document.getElementById('applicationModal');
  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
  currentApplication = null;
}

// Refresh data
async function refreshData() {
  showToast('Refreshing data...', 'info');
  await loadApplications();
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

// Toast notification
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
