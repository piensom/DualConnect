// FAQ page functionality
let allFaqs = [];
let currentCategory = 'all';
let currentLanguage = 'de';

document.addEventListener('DOMContentLoaded', async () => {
  // Get user's preferred language if logged in
  const user = api.getUser();
  if (user && user.preferred_language) {
    currentLanguage = user.preferred_language;
    document.getElementById('languageSelect').value = currentLanguage;
  }

  // Load FAQs
  await loadFAQs();

  // Setup event listeners
  setupEventListeners();
});

// Load FAQs from API
async function loadFAQs() {
  try {
    showLoading();
    const data = await api.getFAQs({ language: currentLanguage });
    allFaqs = data.faqs;
    displayFAQs(allFaqs);
    await loadCategories();
  } catch (error) {
    console.error('Error loading FAQs:', error);
    showError('Fehler beim Laden der FAQs');
  } finally {
    hideLoading();
  }
}

// Display FAQs
function displayFAQs(faqs) {
  const container = document.getElementById('faqList');

  if (!faqs || faqs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Keine FAQs gefunden.</p>
      </div>
    `;
    return;
  }

  // Group FAQs by category
  const groupedFaqs = groupByCategory(faqs);

  container.innerHTML = Object.entries(groupedFaqs).map(([category, items]) => `
    <div class="faq-category-section">
      <h2 class="faq-category-title">${category}</h2>
      <div class="faq-items">
        ${items.map((faq, index) => `
          <div class="faq-item" data-faq-id="${faq.faq_id}">
            <button class="faq-question" onclick="toggleFaq(${faq.faq_id})">
              <span>${faq.question}</span>
              <span class="faq-icon">▼</span>
            </button>
            <div class="faq-answer" id="faq-answer-${faq.faq_id}">
              <p>${faq.answer}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// Group FAQs by category
function groupByCategory(faqs) {
  return faqs.reduce((groups, faq) => {
    const category = faq.category || 'Allgemein';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(faq);
    return groups;
  }, {});
}

// Toggle FAQ item
function toggleFaq(faqId) {
  const faqItem = document.querySelector(`[data-faq-id="${faqId}"]`);
  const answer = document.getElementById(`faq-answer-${faqId}`);
  const icon = faqItem.querySelector('.faq-icon');

  if (faqItem.classList.contains('active')) {
    faqItem.classList.remove('active');
    answer.style.maxHeight = null;
    icon.style.transform = 'rotate(0deg)';
  } else {
    // Close all other FAQs
    document.querySelectorAll('.faq-item.active').forEach(item => {
      item.classList.remove('active');
      item.querySelector('.faq-answer').style.maxHeight = null;
      item.querySelector('.faq-icon').style.transform = 'rotate(0deg)';
    });

    // Open this FAQ
    faqItem.classList.add('active');
    answer.style.maxHeight = answer.scrollHeight + 'px';
    icon.style.transform = 'rotate(180deg)';
  }
}

// Load categories
async function loadCategories() {
  try {
    const data = await api.getFAQCategories(currentLanguage);
    displayCategories(data.categories);
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

// Display categories
function displayCategories(categories) {
  const container = document.querySelector('.faq-categories ul');

  if (!categories || categories.length === 0) {
    return;
  }

  const categoryLinks = categories.map(cat => `
    <li>
      <a href="#" class="category-link" data-category="${cat.category}">
        ${cat.category} (${cat.count})
      </a>
    </li>
  `).join('');

  // Keep the "All" option and add categories
  container.innerHTML = `
    <li><a href="#" class="category-link active" data-category="all">Alle anzeigen</a></li>
    ${categoryLinks}
  `;

  // Re-attach event listeners
  setupCategoryListeners();
}

// Setup event listeners
function setupEventListeners() {
  // Search
  const searchInput = document.getElementById('faqSearch');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleSearch, 300));
  }

  // Language selector
  const languageSelect = document.getElementById('languageSelect');
  if (languageSelect) {
    languageSelect.addEventListener('change', handleLanguageChange);
  }

  // Category links
  setupCategoryListeners();
}

// Setup category listeners
function setupCategoryListeners() {
  const categoryLinks = document.querySelectorAll('.category-link');
  categoryLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const category = link.dataset.category;

      // Update active state
      categoryLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Filter FAQs
      currentCategory = category;
      filterFAQs();
    });
  });
}

// Handle search
function handleSearch(e) {
  const query = e.target.value.toLowerCase().trim();

  if (query === '') {
    filterFAQs();
    return;
  }

  // Search in questions and answers
  const filtered = allFaqs.filter(faq =>
    faq.question.toLowerCase().includes(query) ||
    faq.answer.toLowerCase().includes(query)
  );

  displayFAQs(filtered);
}

// Handle language change
async function handleLanguageChange(e) {
  currentLanguage = e.target.value;
  await loadFAQs();
}

// Filter FAQs by current category
function filterFAQs() {
  if (currentCategory === 'all') {
    displayFAQs(allFaqs);
  } else {
    const filtered = allFaqs.filter(faq => faq.category === currentCategory);
    displayFAQs(filtered);
  }
}

// Utility functions
function showLoading() {
  const container = document.getElementById('faqList');
  container.innerHTML = '<div class="loading">Lade FAQs...</div>';
}

function hideLoading() {
  // Loading is replaced by actual content
}

function showError(message) {
  const container = document.getElementById('faqList');
  container.innerHTML = `
    <div class="error-message">
      <p>${message}</p>
      <button onclick="loadFAQs()" class="btn btn-primary">Erneut versuchen</button>
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

// Make toggleFaq available globally
window.toggleFaq = toggleFaq;
