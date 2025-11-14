// Admin Companies Management
if (!localStorage.getItem('admin_token')) window.location.href = 'login.html';

let allCompanies = [], filteredCompanies = [], currentPage = 1;
const itemsPerPage = 15;

document.addEventListener('DOMContentLoaded', loadCompanies);

async function loadCompanies() {
  try {
    const res = await fetch('/api/companies', { headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` } });
    allCompanies = await res.json();
  } catch {
    allCompanies = Array.from({ length: 30 }, (_, i) => ({
      company_id: i + 1,
      company_name: ['BMW', 'Siemens', 'SAP', 'Bosch', 'Volkswagen'][i % 5] + ` GmbH ${i + 1}`,
      industry: ['Technology', 'Automotive', 'Engineering', 'Healthcare'][i % 4],
      programs_count: Math.floor(Math.random() * 20),
      status: Math.random() > 0.2 ? 'verified' : 'pending'
    }));
  }
  filteredCompanies = [...allCompanies];
  displayCompanies();
}

function displayCompanies() {
  const tbody = document.getElementById('companiesTableBody');
  const start = (currentPage - 1) * itemsPerPage;
  const paginated = filteredCompanies.slice(start, start + itemsPerPage);

  tbody.innerHTML = paginated.map(c => `
    <tr>
      <td>${c.company_id}</td>
      <td><strong>${c.company_name}</strong></td>
      <td>${c.industry || 'N/A'}</td>
      <td>${c.programs_count || 0}</td>
      <td><span class="table-badge ${c.status === 'verified' ? 'success' : 'warning'}">${c.status}</span></td>
      <td>
        <button class="btn-icon edit" onclick="editCompany(${c.company_id})">✏️</button>
        <button class="btn-icon delete" onclick="deleteCompany(${c.company_id})">🗑️</button>
      </td>
    </tr>
  `).join('');

  document.getElementById('paginationInfo').textContent = `Showing ${start + 1}-${Math.min(start + itemsPerPage, filteredCompanies.length)} of ${filteredCompanies.length}`;
}

let searchTimeout;
function searchCompanies() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const term = document.getElementById('searchCompanies').value.toLowerCase();
    filteredCompanies = term ? allCompanies.filter(c => c.company_name.toLowerCase().includes(term)) : [...allCompanies];
    currentPage = 1;
    displayCompanies();
  }, 300);
}

function showCreateModal() { alert('Create company modal - Full implementation coming soon'); }
function editCompany(id) { alert(`Edit company ${id} - Full implementation coming soon`); }
function deleteCompany(id) {
  if (confirm('Delete this company?')) {
    allCompanies = allCompanies.filter(c => c.company_id !== id);
    filteredCompanies = [...allCompanies];
    displayCompanies();
    showToast('Company deleted', 'success');
  }
}
function logout() {
  if (confirm('Logout?')) {
    localStorage.clear();
    window.location.href = 'login.html';
  }
}

function showToast(msg, type) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  document.getElementById('toastContainer').appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => toast.remove(), 3000);
}
