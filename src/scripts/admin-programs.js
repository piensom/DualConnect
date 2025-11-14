// Admin Programs Management JavaScript

// Check authentication
if (!localStorage.getItem('admin_token')) {
  window.location.href = 'login.html';
}

// State
let allPrograms = [];
let filteredPrograms = [];
let currentPage = 1;
const itemsPerPage = 10;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadAdminInfo();
  loadPrograms();
  loadCompaniesForSelect();
  setupFormHandler();
});

// Load admin user info
function loadAdminInfo() {
  const adminData = JSON.parse(localStorage.getItem('admin_user') || '{}');
  document.getElementById('adminName').textContent = adminData.name || 'Admin';
}

// Load all programs
async function loadPrograms() {
  const tableBody = document.getElementById('programsTableBody');

  try {
    const response = await fetch('/api/programs', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      }
    });

    if (!response.ok) throw new Error('Failed to load programs');

    const data = await response.json();
    allPrograms = data.programs || data;
    filteredPrograms = [...allPrograms];

    displayPrograms();
  } catch (error) {
    console.error('Error loading programs:', error);

    // Use placeholder data for demo
    allPrograms = generatePlaceholderPrograms();
    filteredPrograms = [...allPrograms];
    displayPrograms();
  }
}

// Generate placeholder data
function generatePlaceholderPrograms() {
  return [
    {
      program_id: 1,
      title: 'Software Developer',
      type: 'ausbildung',
      company_name: 'TechCorp GmbH',
      city: 'Berlin',
      state: 'Berlin',
      applications_count: 23,
      status: 'published'
    },
    {
      program_id: 2,
      title: 'Data Science',
      type: 'duales_studium',
      company_name: 'DataHub AG',
      city: 'Munich',
      state: 'Bavaria',
      applications_count: 15,
      status: 'published'
    },
    {
      program_id: 3,
      title: 'Mechanical Engineering',
      type: 'duales_studium',
      company_name: 'BMW Group',
      city: 'Stuttgart',
      state: 'Baden-Württemberg',
      applications_count: 31,
      status: 'published'
    },
    {
      program_id: 4,
      title: 'Business Administration',
      type: 'ausbildung',
      company_name: 'Siemens AG',
      city: 'Hamburg',
      state: 'Hamburg',
      applications_count: 8,
      status: 'draft'
    },
    {
      program_id: 5,
      title: 'Nursing',
      type: 'ausbildung',
      company_name: 'Charité Hospital',
      city: 'Berlin',
      state: 'Berlin',
      applications_count: 42,
      status: 'published'
    }
  ];
}

// Display programs in table
function displayPrograms() {
  const tableBody = document.getElementById('programsTableBody');

  if (!filteredPrograms || filteredPrograms.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 3rem; color: #6b7280;">
          No programs found. Click "Add New Program" to create one.
        </td>
      </tr>
    `;
    updatePaginationInfo(0);
    return;
  }

  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPrograms = filteredPrograms.slice(startIndex, endIndex);

  // Display programs
  tableBody.innerHTML = paginatedPrograms.map(program => `
    <tr>
      <td>${program.program_id}</td>
      <td><strong>${program.title}</strong></td>
      <td>${program.type === 'ausbildung' ? 'Ausbildung' : 'Duales Studium'}</td>
      <td>${program.company_name || 'N/A'}</td>
      <td>${program.city}, ${program.state || ''}</td>
      <td>${program.applications_count || 0}</td>
      <td>
        <span class="table-badge ${getStatusBadgeClass(program.status)}">
          ${getStatusText(program.status)}
        </span>
      </td>
      <td>
        <div class="table-actions-cell">
          <button class="btn-icon edit" onclick="editProgram(${program.program_id})" title="Edit">
            ✏️
          </button>
          <button class="btn-icon" onclick="viewProgram(${program.program_id})" title="View">
            👁️
          </button>
          <button class="btn-icon delete" onclick="deleteProgram(${program.program_id})" title="Delete">
            🗑️
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  updatePaginationInfo(filteredPrograms.length);
  updatePaginationControls(filteredPrograms.length);
}

// Get status badge class
function getStatusBadgeClass(status) {
  const classes = {
    'published': 'success',
    'draft': 'warning',
    'archived': 'info'
  };
  return classes[status] || 'info';
}

// Get status text
function getStatusText(status) {
  const texts = {
    'published': 'Published',
    'draft': 'Draft',
    'archived': 'Archived'
  };
  return texts[status] || status;
}

// Update pagination info
function updatePaginationInfo(total) {
  const startIndex = Math.min((currentPage - 1) * itemsPerPage + 1, total);
  const endIndex = Math.min(currentPage * itemsPerPage, total);

  document.getElementById('paginationInfo').textContent =
    `Showing ${startIndex}-${endIndex} of ${total} programs`;
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
  const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage);
  if (page < 1 || page > totalPages) return;

  currentPage = page;
  displayPrograms();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Filter programs
function filterPrograms() {
  const typeFilter = document.getElementById('filterType').value;
  const fieldFilter = document.getElementById('filterField').value;
  const statusFilter = document.getElementById('filterStatus').value;
  const cityFilter = document.getElementById('filterCity').value.toLowerCase();

  filteredPrograms = allPrograms.filter(program => {
    if (typeFilter && program.type !== typeFilter) return false;
    if (fieldFilter && program.field !== fieldFilter) return false;
    if (statusFilter && program.status !== statusFilter) return false;
    if (cityFilter && !program.city.toLowerCase().includes(cityFilter)) return false;
    return true;
  });

  currentPage = 1;
  displayPrograms();
}

// Search programs
let searchTimeout;
function searchPrograms() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const searchTerm = document.getElementById('searchPrograms').value.toLowerCase();

    if (!searchTerm) {
      filteredPrograms = [...allPrograms];
    } else {
      filteredPrograms = allPrograms.filter(program =>
        program.title.toLowerCase().includes(searchTerm) ||
        (program.company_name && program.company_name.toLowerCase().includes(searchTerm)) ||
        program.city.toLowerCase().includes(searchTerm)
      );
    }

    currentPage = 1;
    displayPrograms();
  }, 300);
}

// Show create modal
function showCreateModal() {
  document.getElementById('modalTitle').textContent = 'Add New Program';
  document.getElementById('programForm').reset();
  document.getElementById('programId').value = '';
  document.getElementById('programModal').style.display = 'flex';
  setTimeout(() => {
    document.getElementById('programModal').classList.add('show');
  }, 10);
}

// Edit program
async function editProgram(programId) {
  const program = allPrograms.find(p => p.program_id === programId);
  if (!program) return;

  // Populate form
  document.getElementById('modalTitle').textContent = 'Edit Program';
  document.getElementById('programId').value = program.program_id;
  document.getElementById('programTitle').value = program.title;
  document.getElementById('programType').value = program.type;
  document.getElementById('programField').value = program.field || '';
  document.getElementById('programCompany').value = program.company_id || '';
  document.getElementById('programCity').value = program.city;
  document.getElementById('programState').value = program.state || '';
  document.getElementById('programDuration').value = program.duration_months || '';
  document.getElementById('programLanguage').value = program.language_requirement || '';
  document.getElementById('programDescription').value = program.description || '';
  document.getElementById('programRequirements').value = program.requirements || '';
  document.getElementById('programBenefits').value = program.benefits || '';
  document.getElementById('programSalary').value = program.salary_range || '';
  document.getElementById('programStartDate').value = program.start_date || '';
  document.getElementById('programDeadline').value = program.application_deadline || '';
  document.getElementById('programStatus').value = program.status;

  // Show modal
  document.getElementById('programModal').style.display = 'flex';
  setTimeout(() => {
    document.getElementById('programModal').classList.add('show');
  }, 10);
}

// View program
function viewProgram(programId) {
  window.open(`../program-details.html?id=${programId}`, '_blank');
}

// Delete program
async function deleteProgram(programId) {
  if (!confirm('Are you sure you want to delete this program? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch(`/api/programs/${programId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      }
    });

    if (!response.ok) throw new Error('Failed to delete program');

    showToast('Program deleted successfully', 'success');
    await loadPrograms();
  } catch (error) {
    console.error('Error deleting program:', error);
    showToast('Failed to delete program', 'error');

    // Demo deletion (remove from array)
    allPrograms = allPrograms.filter(p => p.program_id !== programId);
    filteredPrograms = filteredPrograms.filter(p => p.program_id !== programId);
    displayPrograms();
    showToast('Program deleted successfully (demo mode)', 'success');
  }
}

// Close modal
function closeModal() {
  const modal = document.getElementById('programModal');
  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
}

// Setup form handler
function setupFormHandler() {
  document.getElementById('programForm').addEventListener('submit', handleSubmit);
}

// Handle form submit
async function handleSubmit(e) {
  e.preventDefault();

  const saveBtn = document.getElementById('saveBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  const formData = new FormData(e.target);
  const programId = formData.get('program_id');
  const programData = Object.fromEntries(formData);

  try {
    const url = programId ? `/api/programs/${programId}` : '/api/programs';
    const method = programId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      },
      body: JSON.stringify(programData)
    });

    if (!response.ok) throw new Error('Failed to save program');

    const result = await response.json();

    showToast(`Program ${programId ? 'updated' : 'created'} successfully`, 'success');
    closeModal();
    await loadPrograms();
  } catch (error) {
    console.error('Error saving program:', error);
    showToast('Failed to save program', 'error');

    // Demo mode - add/update in array
    if (programId) {
      const index = allPrograms.findIndex(p => p.program_id === parseInt(programId));
      if (index !== -1) {
        allPrograms[index] = { ...allPrograms[index], ...programData };
      }
    } else {
      const newProgram = {
        program_id: Math.max(...allPrograms.map(p => p.program_id)) + 1,
        ...programData,
        applications_count: 0
      };
      allPrograms.unshift(newProgram);
    }

    filteredPrograms = [...allPrograms];
    displayPrograms();
    closeModal();
    showToast(`Program ${programId ? 'updated' : 'created'} successfully (demo mode)`, 'success');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Program';
  }
}

// Load companies for select
async function loadCompaniesForSelect() {
  try {
    const response = await fetch('/api/companies');
    if (!response.ok) throw new Error('Failed to load companies');

    const companies = await response.json();
    const select = document.getElementById('programCompany');

    select.innerHTML = '<option value="">Select Company</option>' +
      companies.map(c => `<option value="${c.company_id}">${c.company_name}</option>`).join('');
  } catch (error) {
    console.error('Error loading companies:', error);

    // Placeholder companies
    const select = document.getElementById('programCompany');
    select.innerHTML = `
      <option value="">Select Company</option>
      <option value="1">TechCorp GmbH</option>
      <option value="2">DataHub AG</option>
      <option value="3">BMW Group</option>
      <option value="4">Siemens AG</option>
      <option value="5">Charité Hospital</option>
    `;
  }
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
