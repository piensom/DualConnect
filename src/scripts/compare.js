// Program Comparison page functionality
let selectedPrograms = [];
let allPrograms = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadPrograms();
  setupEventListeners();

  // Check for programs in URL
  const urlParams = new URLSearchParams(window.location.search);
  const programIds = urlParams.get('ids');
  if (programIds) {
    const ids = programIds.split(',').map(id => parseInt(id));
    await loadComparisonFromIds(ids);
  }
});

// Load all programs for search
async function loadPrograms() {
  try {
    const data = await api.getPrograms({ limit: 100 });
    allPrograms = data.programs;
  } catch (error) {
    console.error('Error loading programs:', error);
  }
}

// Load comparison from URL IDs
async function loadComparisonFromIds(ids) {
  try {
    const data = await api.comparePrograms(ids);
    selectedPrograms = data.programs;
    displaySelectedPrograms();
    displayComparison();
  } catch (error) {
    console.error('Error loading comparison:', error);
    showError('Fehler beim Laden des Vergleichs');
  }
}

// Setup event listeners
function setupEventListeners() {
  // Search input
  const searchInput = document.getElementById('programSearch');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    searchInput.addEventListener('focus', () => {
      if (allPrograms.length > 0) {
        showSuggestions(allPrograms.slice(0, 10));
      }
    });
  }

  // Click outside to close suggestions
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.selector-content')) {
      document.getElementById('programSuggestions').innerHTML = '';
    }
  });

  // Clear all button
  const clearBtn = document.getElementById('clearAll');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearAllPrograms);
  }

  // Print button
  const printBtn = document.getElementById('printComparison');
  if (printBtn) {
    printBtn.addEventListener('click', printComparison);
  }
}

// Handle search
function handleSearch(e) {
  const query = e.target.value.toLowerCase().trim();

  if (query === '') {
    document.getElementById('programSuggestions').innerHTML = '';
    return;
  }

  // Filter programs
  const filtered = allPrograms.filter(program =>
    program.program_name.toLowerCase().includes(query) ||
    program.company_name.toLowerCase().includes(query) ||
    program.field_of_study.toLowerCase().includes(query)
  ).slice(0, 10);

  showSuggestions(filtered);
}

// Show suggestions dropdown
function showSuggestions(programs) {
  const container = document.getElementById('programSuggestions');

  if (programs.length === 0) {
    container.innerHTML = '<div class="suggestion-item">Keine Programme gefunden</div>';
    return;
  }

  container.innerHTML = programs.map(program => `
    <div class="suggestion-item" onclick="addProgram(${program.program_id})">
      <div class="suggestion-name">${program.program_name}</div>
      <div class="suggestion-meta">${program.company_name} • ${program.field_of_study}</div>
    </div>
  `).join('');
}

// Add program to comparison
function addProgram(programId) {
  // Check if already selected
  if (selectedPrograms.find(p => p.program_id === programId)) {
    showToast('Programm bereits ausgewählt', 'info');
    return;
  }

  // Max 5 programs
  if (selectedPrograms.length >= 5) {
    showToast('Maximal 5 Programme können verglichen werden', 'warning');
    return;
  }

  // Find and add program
  const program = allPrograms.find(p => p.program_id === programId);
  if (program) {
    selectedPrograms.push(program);
    displaySelectedPrograms();

    // Update comparison if we have at least 2 programs
    if (selectedPrograms.length >= 2) {
      displayComparison();
    }

    // Clear search
    document.getElementById('programSearch').value = '';
    document.getElementById('programSuggestions').innerHTML = '';
  }
}

// Display selected programs
function displaySelectedPrograms() {
  const container = document.getElementById('selectedPrograms');

  container.innerHTML = selectedPrograms.map(program => `
    <div class="program-chip">
      <span>${program.program_name}</span>
      <button onclick="removeProgram(${program.program_id})">&times;</button>
    </div>
  `).join('');

  // Show/hide action buttons
  const clearBtn = document.getElementById('clearAll');
  const printBtn = document.getElementById('printComparison');
  if (selectedPrograms.length > 0) {
    clearBtn.style.display = 'inline-block';
  } else {
    clearBtn.style.display = 'none';
  }

  if (selectedPrograms.length >= 2) {
    printBtn.style.display = 'inline-block';
  } else {
    printBtn.style.display = 'none';
  }
}

// Remove program from comparison
function removeProgram(programId) {
  selectedPrograms = selectedPrograms.filter(p => p.program_id !== programId);
  displaySelectedPrograms();

  if (selectedPrograms.length >= 2) {
    displayComparison();
  } else {
    showEmptyState();
  }
}

// Clear all programs
function clearAllPrograms() {
  if (!confirm('Alle Programme aus dem Vergleich entfernen?')) {
    return;
  }

  selectedPrograms = [];
  displaySelectedPrograms();
  showEmptyState();
}

// Display comparison table
function displayComparison() {
  const container = document.getElementById('comparisonTable');

  container.innerHTML = `
    <div class="comparison-scroll">
      <table class="comparison-table">
        <thead>
          <tr>
            <th class="row-header">Kriterium</th>
            ${selectedPrograms.map(program => `
              <th>
                <div class="program-header">
                  <h4>${program.program_name}</h4>
                  <p>${program.company_name}</p>
                </div>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="row-header">Typ</td>
            ${selectedPrograms.map(p => `<td>${p.program_type}</td>`).join('')}
          </tr>
          <tr>
            <td class="row-header">Fachbereich</td>
            ${selectedPrograms.map(p => `<td>${p.field_of_study}</td>`).join('')}
          </tr>
          <tr>
            <td class="row-header">Dauer</td>
            ${selectedPrograms.map(p => `<td>${p.duration_months} Monate</td>`).join('')}
          </tr>
          <tr>
            <td class="row-header">Sprachanforderung</td>
            ${selectedPrograms.map(p => `<td>${p.language_requirement}</td>`).join('')}
          </tr>
          <tr>
            <td class="row-header">Gehalt</td>
            ${selectedPrograms.map(p => `<td>${p.salary_range || 'k.A.'}</td>`).join('')}
          </tr>
          <tr>
            <td class="row-header">Stadt</td>
            ${selectedPrograms.map(p => `<td>${p.city}, ${p.state}</td>`).join('')}
          </tr>
          <tr>
            <td class="row-header">Beliebtheit</td>
            ${selectedPrograms.map(p => `<td>👁️ ${p.views_count} Aufrufe<br>📋 ${p.applications_count} Bewerbungen</td>`).join('')}
          </tr>
          <tr>
            <td class="row-header">Aktionen</td>
            ${selectedPrograms.map(p => `
              <td>
                <a href="program-detail.html?id=${p.program_id}" class="btn btn-secondary btn-sm">Details</a>
                ${api.isAuthenticated() ? `
                  <button class="btn btn-primary btn-sm" onclick="applyToProgram(${p.program_id})">Bewerben</button>
                ` : ''}
              </td>
            `).join('')}
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

// Show empty state
function showEmptyState() {
  const container = document.getElementById('comparisonTable');
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">📊</div>
      <h3>Wählen Sie mindestens 2 Programme zum Vergleichen</h3>
      <p>Suchen Sie oben nach Programmen und fügen Sie sie hinzu</p>
      <a href="search.html" class="btn btn-primary">Zur Programmsuche</a>
    </div>
  `;
}

// Print comparison
function printComparison() {
  window.print();
}

// Apply to program
function applyToProgram(programId) {
  window.location.href = `application-create.html?program_id=${programId}`;
}

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showError(message) {
  showToast(message, 'error');
}

// Make functions available globally
window.addProgram = addProgram;
window.removeProgram = removeProgram;
window.applyToProgram = applyToProgram;
