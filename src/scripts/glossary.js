// Glossary page functionality
let allTerms = [];
let currentLetter = 'all';
let currentLanguage = 'de';

document.addEventListener('DOMContentLoaded', async () => {
  // Get user's preferred language if logged in
  const user = api.getUser();
  if (user && user.preferred_language) {
    currentLanguage = user.preferred_language;
    document.getElementById('languageSelect').value = currentLanguage;
  }

  await loadGlossaryTerms();
  setupEventListeners();
});

// Load glossary terms
async function loadGlossaryTerms() {
  try {
    showLoading();
    const data = await api.getGlossaryTerms({
      language: currentLanguage,
      letter: currentLetter !== 'all' ? currentLetter : undefined
    });

    allTerms = data.terms;
    displayTerms(allTerms);
  } catch (error) {
    console.error('Error loading glossary:', error);
    showError('Fehler beim Laden des Glossars');
  } finally {
    hideLoading();
  }
}

// Display glossary terms
function displayTerms(terms) {
  const container = document.getElementById('glossaryList');

  if (!terms || terms.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Keine Begriffe gefunden.</p>
      </div>
    `;
    return;
  }

  // Group terms by first letter
  const grouped = groupByLetter(terms);

  container.innerHTML = Object.entries(grouped).map(([letter, items]) => `
    <div class="glossary-section" id="letter-${letter}">
      <h2 class="glossary-letter">${letter}</h2>
      <div class="glossary-terms">
        ${items.map(term => `
          <div class="glossary-term">
            <h3 class="term-title">${term.term}</h3>
            <p class="term-definition">${term.definition}</p>
            ${term.related_terms && term.related_terms.length > 0 ? `
              <div class="related-terms">
                <strong>Verwandte Begriffe:</strong>
                ${term.related_terms.map(rt => `<span class="related-tag">${rt}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// Group terms by first letter
function groupByLetter(terms) {
  return terms.reduce((groups, term) => {
    const letter = term.term.charAt(0).toUpperCase();
    if (!groups[letter]) {
      groups[letter] = [];
    }
    groups[letter].push(term);
    return groups;
  }, {});
}

// Setup event listeners
function setupEventListeners() {
  // Search
  const searchInput = document.getElementById('glossarySearch');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleSearch, 300));
  }

  // Language selector
  const languageSelect = document.getElementById('languageSelect');
  if (languageSelect) {
    languageSelect.addEventListener('change', handleLanguageChange);
  }

  // Letter navigation
  const letterLinks = document.querySelectorAll('.letter-link');
  letterLinks.forEach(link => {
    link.addEventListener('click', handleLetterClick);
  });
}

// Handle search
async function handleSearch(e) {
  const query = e.target.value.trim();

  if (query === '') {
    await loadGlossaryTerms();
    return;
  }

  try {
    showLoading();
    const data = await api.searchGlossary(query, currentLanguage);
    displayTerms(data.terms);

    // Update letter navigation
    const letterLinks = document.querySelectorAll('.letter-link');
    letterLinks.forEach(link => link.classList.remove('active'));
    document.querySelector('[data-letter="all"]').classList.add('active');
  } catch (error) {
    console.error('Error searching glossary:', error);
    showError('Fehler bei der Suche');
  } finally {
    hideLoading();
  }
}

// Handle language change
async function handleLanguageChange(e) {
  currentLanguage = e.target.value;
  currentLetter = 'all';

  // Reset letter navigation
  const letterLinks = document.querySelectorAll('.letter-link');
  letterLinks.forEach(link => link.classList.remove('active'));
  document.querySelector('[data-letter="all"]').classList.add('active');

  await loadGlossaryTerms();
}

// Handle letter click
async function handleLetterClick(e) {
  e.preventDefault();

  const letter = e.target.dataset.letter;

  // Update active state
  const letterLinks = document.querySelectorAll('.letter-link');
  letterLinks.forEach(link => link.classList.remove('active'));
  e.target.classList.add('active');

  // Load terms for letter
  currentLetter = letter;
  await loadGlossaryTerms();
}

// Utility functions
function showLoading() {
  const container = document.getElementById('glossaryList');
  container.innerHTML = '<div class="loading">Lade Begriffe...</div>';
}

function hideLoading() {
  // Loading is replaced by actual content
}

function showError(message) {
  const container = document.getElementById('glossaryList');
  container.innerHTML = `
    <div class="error-message">
      <p>${message}</p>
      <button onclick="loadGlossaryTerms()" class="btn btn-primary">Erneut versuchen</button>
    </div>
  `;
}

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

// Make function available globally
window.loadGlossaryTerms = loadGlossaryTerms;
