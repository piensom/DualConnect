// City Comparison page functionality
let allCities = [];
let selectedCities = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadCities();
  setupEventListeners();
  updateBudgetCalculator();
});

// Load all cities
async function loadCities() {
  try {
    const data = await api.getCities();
    allCities = data.cities;
    displayCitySelector();
  } catch (error) {
    console.error('Error loading cities:', error);
    showError('Fehler beim Laden der Städte');
  }
}

// Display city selector
function displayCitySelector() {
  const container = document.getElementById('citySelector');

  if (!allCities || allCities.length === 0) {
    container.innerHTML = '<p>Keine Städte verfügbar.</p>';
    return;
  }

  container.innerHTML = allCities.map(city => `
    <div class="city-checkbox">
      <input type="checkbox" id="city-${city.city_id}" value="${city.city_id}" onchange="toggleCity(${city.city_id})">
      <label for="city-${city.city_id}">
        <strong>${city.city_name}</strong>
        <span class="city-state">${city.state}</span>
      </label>
    </div>
  `).join('');
}

// Toggle city selection
function toggleCity(cityId) {
  const checkbox = document.getElementById(`city-${cityId}`);

  if (checkbox.checked) {
    // Max 4 cities
    if (selectedCities.length >= 4) {
      showToast('Maximal 4 Städte können verglichen werden', 'warning');
      checkbox.checked = false;
      return;
    }

    const city = allCities.find(c => c.city_id === cityId);
    if (city) {
      selectedCities.push(city);
    }
  } else {
    selectedCities = selectedCities.filter(c => c.city_id !== cityId);
  }

  updateComparison();
}

// Update comparison display
async function updateComparison() {
  const container = document.getElementById('comparisonResult');

  if (selectedCities.length < 2) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Wählen Sie mindestens 2 Städte zum Vergleichen aus.</p>
      </div>
    `;
    return;
  }

  // Display comparison table
  container.innerHTML = `
    <h2>Städtevergleich</h2>
    <div class="comparison-scroll">
      <table class="city-comparison-table">
        <thead>
          <tr>
            <th class="row-header">Kriterium</th>
            ${selectedCities.map(city => `
              <th>
                <div class="city-header">
                  <h3>${city.city_name}</h3>
                  <p>${city.state}</p>
                </div>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="row-header">Einwohner</td>
            ${selectedCities.map(c => `<td>${formatNumber(c.population)}</td>`).join('')}
          </tr>
          <tr>
            <td class="row-header">Lebenshaltungskosten-Index</td>
            ${selectedCities.map(c => `<td>${c.cost_of_living_index || 'k.A.'}</td>`).join('')}
          </tr>
          <tr class="highlight-row">
            <td class="row-header">1-Zimmer Miete (Ø)</td>
            ${selectedCities.map(c => `<td class="${getBestValue(selectedCities, c, 'average_rent_1br', 'min')}">${c.average_rent_1br} EUR</td>`).join('')}
          </tr>
          <tr class="highlight-row">
            <td class="row-header">2-Zimmer Miete (Ø)</td>
            ${selectedCities.map(c => `<td class="${getBestValue(selectedCities, c, 'average_rent_2br', 'min')}">${c.average_rent_2br} EUR</td>`).join('')}
          </tr>
          <tr>
            <td class="row-header">ÖPNV-Ticket (monatlich)</td>
            ${selectedCities.map(c => `<td class="${getBestValue(selectedCities, c, 'public_transport_monthly', 'min')}">${c.public_transport_monthly} EUR</td>`).join('')}
          </tr>
          <tr>
            <td class="row-header">Beschreibung</td>
            ${selectedCities.map(c => `<td>${c.description || 'Keine Beschreibung verfügbar'}</td>`).join('')}
          </tr>
          <tr>
            <td class="row-header">Programme ansehen</td>
            ${selectedCities.map(c => `
              <td>
                <a href="search.html?city=${encodeURIComponent(c.city_name)}" class="btn btn-secondary btn-sm">
                  Programme in ${c.city_name}
                </a>
              </td>
            `).join('')}
          </tr>
        </tbody>
      </table>
    </div>

    <div class="comparison-legend">
      <p><span class="best-value-indicator"></span> = Bester Wert</p>
    </div>
  `;

  // Update budget calculator
  updateBudgetCalculator();
}

// Setup event listeners
function setupEventListeners() {
  // Budget calculator inputs
  const housingType = document.getElementById('housingType');
  const publicTransport = document.getElementById('publicTransport');
  const mealsOut = document.getElementById('mealsOut');

  if (housingType) housingType.addEventListener('change', updateBudgetCalculator);
  if (publicTransport) publicTransport.addEventListener('change', updateBudgetCalculator);
  if (mealsOut) mealsOut.addEventListener('input', updateBudgetCalculator);
}

// Update budget calculator
function updateBudgetCalculator() {
  if (selectedCities.length === 0) {
    document.getElementById('calcResult').innerHTML = `
      <strong>Geschätzte monatliche Kosten:</strong>
      <div class="cost-amount">Wählen Sie eine Stadt aus</div>
    `;
    return;
  }

  const housingType = document.getElementById('housingType')?.value || 'shared';
  const hasPublicTransport = document.getElementById('publicTransport')?.checked || false;
  const mealsOut = parseInt(document.getElementById('mealsOut')?.value) || 3;

  // Calculate for each selected city
  const calculations = selectedCities.map(city => {
    let total = 0;

    // Housing
    if (housingType === 'shared') {
      total += city.average_rent_1br * 0.5; // Assuming WG is half of 1BR
    } else if (housingType === '1br') {
      total += city.average_rent_1br;
    } else if (housingType === '2br') {
      total += city.average_rent_2br;
    }

    // Public transport
    if (hasPublicTransport) {
      total += city.public_transport_monthly;
    }

    // Food (base)
    total += 250; // Base grocery cost

    // Eating out (assume 12 EUR per meal)
    total += mealsOut * 4 * 12; // per week * 4 weeks * 12 EUR

    // Utilities
    total += 150;

    // Misc
    total += 100;

    return {
      city: city.city_name,
      total: Math.round(total)
    };
  });

  // Display results
  const resultContainer = document.getElementById('calcResult');
  resultContainer.innerHTML = `
    <strong>Geschätzte monatliche Kosten:</strong>
    ${calculations.map(calc => `
      <div class="cost-city">
        <span class="city-name">${calc.city}:</span>
        <span class="cost-amount">€ ${calc.total}</span>
      </div>
    `).join('')}
  `;
}

// Utility functions
function formatNumber(num) {
  if (!num) return 'k.A.';
  return num.toLocaleString('de-DE');
}

function getBestValue(cities, currentCity, field, type = 'min') {
  const values = cities.map(c => c[field]).filter(v => v != null);
  const bestValue = type === 'min' ? Math.min(...values) : Math.max(...values);
  return currentCity[field] === bestValue ? 'best-value' : '';
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
  const container = document.getElementById('citySelector');
  container.innerHTML = `
    <div class="error-message">
      <p>${message}</p>
      <button onclick="loadCities()" class="btn btn-primary">Erneut versuchen</button>
    </div>
  `;
}

// Make functions available globally
window.toggleCity = toggleCity;
window.loadCities = loadCities;
