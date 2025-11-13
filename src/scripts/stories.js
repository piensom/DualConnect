// Success Stories page functionality
let allStories = [];
let currentCountry = 'all';
let featuredOnly = false;

document.addEventListener('DOMContentLoaded', async () => {
  await loadStories();
  setupEventListeners();
});

// Load success stories
async function loadStories() {
  try {
    showLoading();
    const params = {
      country: currentCountry !== 'all' ? currentCountry : undefined,
      featured: featuredOnly ? 'true' : undefined
    };

    const data = await api.getSuccessStories(params);
    allStories = data.stories;
    displayStories(allStories);
  } catch (error) {
    console.error('Error loading stories:', error);
    showError('Fehler beim Laden der Erfolgsgeschichten');
  } finally {
    hideLoading();
  }
}

// Display stories
function displayStories(stories) {
  const container = document.getElementById('storiesGrid');

  if (!stories || stories.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Keine Erfolgsgeschichten gefunden.</p>
        ${api.isAuthenticated() ? `
          <a href="dashboard.html#stories" class="btn btn-primary">Ihre Geschichte teilen</a>
        ` : `
          <a href="register.html" class="btn btn-primary">Registrieren und Geschichte teilen</a>
        `}
      </div>
    `;
    return;
  }

  container.innerHTML = stories.map(story => `
    <article class="story-card ${story.is_featured ? 'featured' : ''}">
      ${story.is_featured ? '<span class="featured-badge">⭐ Hervorgehoben</span>' : ''}

      ${story.photo_url ? `
        <div class="story-image" style="background-image: url('${story.photo_url}')"></div>
      ` : ''}

      <div class="story-content">
        <h2 class="story-title">${story.title}</h2>

        <div class="story-meta">
          <span class="story-author">👤 ${story.first_name} ${story.last_name ? story.last_name.charAt(0) + '.' : ''}</span>
          <span class="story-country">🌍 aus ${story.country_of_origin}</span>
        </div>

        ${story.program_name ? `
          <div class="story-program">
            <strong>Programm:</strong> ${story.program_name}
            ${story.company_name ? `<br><strong>Unternehmen:</strong> ${story.company_name}` : ''}
          </div>
        ` : ''}

        <div class="story-text">
          ${truncateText(story.story, 250)}
        </div>

        <button class="btn btn-secondary" onclick="openStoryModal(${story.story_id})">
          Ganze Geschichte lesen →
        </button>

        ${story.video_url ? `
          <a href="${story.video_url}" target="_blank" class="btn btn-text">
            🎥 Video ansehen
          </a>
        ` : ''}
      </div>
    </article>
  `).join('');
}

// Open story modal
function openStoryModal(storyId) {
  const story = allStories.find(s => s.story_id === storyId);
  if (!story) return;

  // Create modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content story-modal">
      <button class="modal-close" onclick="closeStoryModal()">&times;</button>

      ${story.photo_url ? `
        <div class="modal-image" style="background-image: url('${story.photo_url}')"></div>
      ` : ''}

      <div class="modal-body">
        <h2>${story.title}</h2>

        <div class="story-meta">
          <span>👤 ${story.first_name} ${story.last_name || ''}</span>
          <span>🌍 ${story.country_of_origin}</span>
        </div>

        ${story.program_name ? `
          <div class="story-program-info">
            <h3>Programm-Details</h3>
            <p><strong>Programm:</strong> ${story.program_name}</p>
            ${story.company_name ? `<p><strong>Unternehmen:</strong> ${story.company_name}</p>` : ''}
          </div>
        ` : ''}

        <div class="story-full-text">
          ${story.story.replace(/\n/g, '<br>')}
        </div>

        ${story.video_url ? `
          <div class="story-video">
            <a href="${story.video_url}" target="_blank" class="btn btn-primary">
              🎥 Video ansehen
            </a>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('show'), 10);

  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeStoryModal();
    }
  });
}

// Close story modal
function closeStoryModal() {
  const modal = document.querySelector('.modal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Country filter
  const countryFilter = document.getElementById('countryFilter');
  if (countryFilter) {
    countryFilter.addEventListener('change', async (e) => {
      currentCountry = e.target.value;
      await loadStories();
    });
  }

  // Featured filter
  const featuredFilter = document.getElementById('featuredFilter');
  if (featuredFilter) {
    featuredFilter.addEventListener('change', async (e) => {
      featuredOnly = e.target.checked;
      await loadStories();
    });
  }
}

// Utility functions
function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength).trim() + '...';
}

function showLoading() {
  const container = document.getElementById('storiesGrid');
  container.innerHTML = '<div class="loading">Lade Erfolgsgeschichten...</div>';
}

function hideLoading() {
  // Loading is replaced by actual content
}

function showError(message) {
  const container = document.getElementById('storiesGrid');
  container.innerHTML = `
    <div class="error-message">
      <p>${message}</p>
      <button onclick="loadStories()" class="btn btn-primary">Erneut versuchen</button>
    </div>
  `;
}

// Make functions available globally
window.openStoryModal = openStoryModal;
window.closeStoryModal = closeStoryModal;
window.loadStories = loadStories;
