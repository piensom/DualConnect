// Blog page functionality
let allPosts = [];
let currentCategory = 'all';
let currentPage = 1;
const postsPerPage = 9;

document.addEventListener('DOMContentLoaded', async () => {
  await loadBlogPosts();
  await loadCategories();
  setupEventListeners();
});

// Load blog posts
async function loadBlogPosts(offset = 0) {
  try {
    showLoading();
    const data = await api.getBlogPosts({
      category: currentCategory !== 'all' ? currentCategory : undefined,
      limit: postsPerPage,
      offset: offset
    });

    allPosts = data.posts;
    displayBlogPosts(allPosts);
  } catch (error) {
    console.error('Error loading blog posts:', error);
    showError('Fehler beim Laden der Blog-Artikel');
  } finally {
    hideLoading();
  }
}

// Display blog posts
function displayBlogPosts(posts) {
  const featuredContainer = document.getElementById('featuredPost');
  const gridContainer = document.getElementById('blogGrid');

  if (!posts || posts.length === 0) {
    gridContainer.innerHTML = `
      <div class="empty-state">
        <p>Keine Artikel gefunden.</p>
      </div>
    `;
    featuredContainer.innerHTML = '';
    return;
  }

  // Featured post (first post)
  const featured = posts[0];
  featuredContainer.innerHTML = `
    <div class="featured-image" style="background-image: url('${featured.featured_image || '/assets/blog-placeholder.jpg'}')">
      <div class="featured-overlay">
        <span class="category-badge">${featured.category || 'Allgemein'}</span>
        <h2>${featured.title}</h2>
        <p class="featured-excerpt">${featured.excerpt || ''}</p>
        <div class="featured-meta">
          <span>👤 ${featured.first_name} ${featured.last_name}</span>
          <span>📅 ${formatDate(featured.published_at)}</span>
          <span>👁️ ${featured.views_count} Aufrufe</span>
        </div>
        <a href="blog-post.html?slug=${featured.slug}" class="btn btn-primary">Weiterlesen</a>
      </div>
    </div>
  `;

  // Regular posts (rest of the posts)
  const regularPosts = posts.slice(1);
  gridContainer.innerHTML = regularPosts.map(post => `
    <article class="blog-card">
      <div class="blog-image" style="background-image: url('${post.featured_image || '/assets/blog-placeholder.jpg'}')">
        <span class="category-badge">${post.category || 'Allgemein'}</span>
      </div>
      <div class="blog-content">
        <h3>${post.title}</h3>
        <p class="blog-excerpt">${post.excerpt || truncateText(post.content, 150)}</p>
        <div class="blog-meta">
          <span>👤 ${post.first_name} ${post.last_name}</span>
          <span>📅 ${formatDate(post.published_at)}</span>
        </div>
        <div class="blog-tags">
          ${(post.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <a href="blog-post.html?slug=${post.slug}" class="btn btn-secondary">Weiterlesen →</a>
      </div>
    </article>
  `).join('');
}

// Load categories
async function loadCategories() {
  try {
    const data = await api.getBlogCategories();
    displayCategories(data.categories);
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

// Display categories
function displayCategories(categories) {
  const container = document.querySelector('.category-list');

  if (!categories || categories.length === 0) {
    return;
  }

  const categoryLinks = categories.map(cat => `
    <li>
      <a href="#" data-category="${cat.category}">
        ${cat.category} <span class="count">(${cat.count})</span>
      </a>
    </li>
  `).join('');

  container.innerHTML = `
    <li><a href="#" class="active" data-category="all">Alle Artikel</a></li>
    ${categoryLinks}
  `;

  // Attach event listeners
  setupCategoryListeners();
}

// Setup event listeners
function setupEventListeners() {
  // Newsletter form
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', handleNewsletterSubmit);
  }

  // Category links
  setupCategoryListeners();
}

// Setup category listeners
function setupCategoryListeners() {
  const categoryLinks = document.querySelectorAll('.category-list a');
  categoryLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const category = link.dataset.category;

      // Update active state
      categoryLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Load posts for category
      currentCategory = category;
      currentPage = 1;
      await loadBlogPosts(0);
    });
  });
}

// Handle newsletter submit
async function handleNewsletterSubmit(e) {
  e.preventDefault();

  const email = e.target.querySelector('input[type="email"]').value;

  try {
    // This would call a newsletter API endpoint
    // For now, just show success message
    showSuccess('Erfolgreich für den Newsletter angemeldet!');
    e.target.reset();
  } catch (error) {
    showError('Fehler bei der Newsletter-Anmeldung');
  }
}

// Utility functions
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength).trim() + '...';
}

function showLoading() {
  const container = document.getElementById('blogGrid');
  container.innerHTML = '<div class="loading">Lade Artikel...</div>';
}

function hideLoading() {
  // Loading is replaced by actual content
}

function showError(message) {
  const container = document.getElementById('blogGrid');
  container.innerHTML = `
    <div class="error-message">
      <p>${message}</p>
      <button onclick="loadBlogPosts()" class="btn btn-primary">Erneut versuchen</button>
    </div>
  `;
}

function showSuccess(message) {
  // Create toast notification
  const toast = document.createElement('div');
  toast.className = 'toast toast-success';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
