const API_KEY = '776c0c29180b30353b2234dff24837d9';
const API_URL = `https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&api_key=${API_KEY}`;
const IMG_PATH = 'https://image.tmdb.org/t/p/w1280';
const SEARCH_API = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=`;

const main = document.getElementById('main');
const form = document.getElementById('form');
const search = document.getElementById('search');
const pagination = document.getElementById('pagination');
let currentPage = 1;
let totalPages = 1;
let lastUrl = API_URL;

// Modal elements
let modal = document.getElementById('movie-modal');
if (!modal) {
  modal = document.createElement('div');
  modal.id = 'movie-modal';
  modal.style.display = 'none';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.background = 'rgba(30,32,48,0.85)';
  modal.style.zIndex = '1000';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
  modal.innerHTML = `<div id="modal-content" style="background:#232526;color:#fff;padding:2rem 1.5rem;border-radius:1.2rem;max-width:400px;width:90vw;box-shadow:0 8px 32px rgba(0,0,0,0.25);position:relative;">
    <span id="modal-close" style="position:absolute;top:1rem;right:1.5rem;font-size:2rem;cursor:pointer;">&times;</span>
    <div id="modal-body"></div>
  </div>`;
  document.body.appendChild(modal);
}
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

const searchSuggestions = document.getElementById('search-suggestions');
let suggestionResults = [];
let suggestionIndex = -1;

const favoritesBtn = document.getElementById('favorites-btn');
const favoritesCount = document.getElementById('favorites-count');
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
let viewingFavorites = false;

const watchlistBtn = document.getElementById('watchlist-btn');
const watchlistCount = document.getElementById('watchlist-count');
let watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
let viewingWatchlist = false;

const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeToggleIcon = document.getElementById('theme-toggle-icon');

// Filter bar elements
const sortSelect = document.getElementById('sort-select');
const langSelect = document.getElementById('lang-select');
const yearInput = document.getElementById('year-input');
const minRatingSelect = document.getElementById('min-rating-select');

// Fetch and populate genres
const genreSelect = document.getElementById('genre-select');
let genreMap = {};
async function loadGenres() {
  if (!genreSelect) {
    console.error('genreSelect not found');
    return;
  }
  const lang = langSelect ? langSelect.value : 'en';
  const url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}&language=${lang}`;
  console.log('Fetching genres from:', url);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Genre API error:', errorText);
      genreSelect.innerHTML = '<option disabled>Error loading genres</option>';
      return;
    }
    const data = await res.json();
    genreSelect.innerHTML = '';
    genreMap = {};
    (data.genres || []).forEach(g => {
      genreMap[g.id] = g.name;
      const opt = document.createElement('option');
      opt.value = g.id;
      opt.textContent = g.name;
      genreSelect.appendChild(opt);
    });
    if (!data.genres || data.genres.length === 0) {
      genreSelect.innerHTML = '<option disabled>No genres found</option>';
    }
  } catch (e) {
    console.error('Failed to fetch genres:', e);
    genreSelect.innerHTML = '<option disabled>Error loading genres</option>';
  }
}
if (genreSelect) {
  document.addEventListener('DOMContentLoaded', () => {
    loadGenres();
    // Reload genres if language changes
    if (langSelect) langSelect.addEventListener('change', loadGenres);
  });
}

// Search suggestions logic
search.addEventListener('input', async function() {
  const query = search.value.trim();
  if (!query) {
    searchSuggestions.style.display = 'none';
    return;
  }
  try {
    const res = await fetch(`${SEARCH_API}${encodeURIComponent(query)}`);
    const data = await res.json();
    suggestionResults = (data.results || []).slice(0, 5);
    if (suggestionResults.length === 0) {
      searchSuggestions.style.display = 'none';
      return;
    }
    searchSuggestions.innerHTML = suggestionResults.map((movie, i) =>
      `<div class="suggestion-item${i === suggestionIndex ? ' active' : ''}" data-index="${i}">
        ${movie.title} <span style="color:#b0b3c6;font-size:0.95em;">(${movie.release_date ? movie.release_date.slice(0,4) : ''})</span>
      </div>`
    ).join('');
    searchSuggestions.style.display = 'block';
  } catch {
    searchSuggestions.style.display = 'none';
  }
});

searchSuggestions.addEventListener('mousedown', function(e) {
  const item = e.target.closest('.suggestion-item');
  if (item) {
    const idx = parseInt(item.getAttribute('data-index'));
    if (suggestionResults[idx]) {
      openMovieModal(suggestionResults[idx]);
      searchSuggestions.style.display = 'none';
      search.value = '';
    }
  }
});

search.addEventListener('keydown', function(e) {
  if (searchSuggestions.style.display !== 'block') return;
  if (e.key === 'ArrowDown') {
    suggestionIndex = (suggestionIndex + 1) % suggestionResults.length;
    updateSuggestionHighlight();
    e.preventDefault();
  } else if (e.key === 'ArrowUp') {
    suggestionIndex = (suggestionIndex - 1 + suggestionResults.length) % suggestionResults.length;
    updateSuggestionHighlight();
    e.preventDefault();
  } else if (e.key === 'Enter') {
    if (suggestionIndex >= 0 && suggestionResults[suggestionIndex]) {
      openMovieModal(suggestionResults[suggestionIndex]);
      searchSuggestions.style.display = 'none';
      search.value = '';
      e.preventDefault();
    }
  } else if (e.key === 'Escape') {
    searchSuggestions.style.display = 'none';
    suggestionIndex = -1;
  }
});

function updateSuggestionHighlight() {
  Array.from(searchSuggestions.children).forEach((el, i) => {
    el.classList.toggle('active', i === suggestionIndex);
  });
}

document.addEventListener('click', function(e) {
  if (!searchSuggestions.contains(e.target) && e.target !== search) {
    searchSuggestions.style.display = 'none';
    suggestionIndex = -1;
  }
});

// Favorites logic
function updateFavoritesCount() {
  favoritesCount.textContent = favorites.length;
  favoritesBtn.classList.toggle('active', viewingFavorites);
}

function isFavorite(movieId) {
  return favorites.includes(movieId);
}

function toggleFavorite(movieId) {
  if (isFavorite(movieId)) {
    favorites = favorites.filter(id => id !== movieId);
  } else {
    favorites.push(movieId);
  }
  saveUserData();
  updateFavoritesCount();
  if (viewingFavorites) showFavoriteMovies();
}

favoritesBtn.addEventListener('click', () => {
  viewingFavorites = !viewingFavorites;
  if (viewingFavorites) {
    showFavoriteMovies();
  } else {
    getMovies(API_URL, 1);
  }
  updateFavoritesCount();
});

function showFavoriteMovies() {
  if (favorites.length === 0) {
    main.innerHTML = '<div style="color: white; text-align: center; margin-top: 2rem; font-size: 1.5rem;">No favorites yet.</div>';
    pagination.innerHTML = '';
    return;
  }
  Promise.all(favorites.map(id => fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&language=en-US`).then(r => r.json())))
    .then(movies => {
      showMovies(movies);
      pagination.innerHTML = '';
    });
}

// Watchlist logic
function updateWatchlistCount() {
  watchlistCount.textContent = watchlist.length;
  watchlistBtn.classList.toggle('active', viewingWatchlist);
}

function isInWatchlist(movieId) {
  return watchlist.includes(movieId);
}

function toggleWatchlist(movieId) {
  if (isInWatchlist(movieId)) {
    watchlist = watchlist.filter(id => id !== movieId);
  } else {
    watchlist.push(movieId);
  }
  saveUserData();
  updateWatchlistCount();
  if (viewingWatchlist) showWatchlistMovies();
}

watchlistBtn.addEventListener('click', () => {
  viewingWatchlist = !viewingWatchlist;
  viewingFavorites = false;
  favoritesBtn.classList.remove('active');
  if (viewingWatchlist) {
    showWatchlistMovies();
  } else {
    getMovies(buildApiUrl(1), 1, true);
  }
  updateWatchlistCount();
});

function showWatchlistMovies() {
  if (watchlist.length === 0) {
    main.innerHTML = '<div style="color: white; text-align: center; margin-top: 2rem; font-size: 1.5rem;">No movies in your watchlist yet.</div>';
    pagination.innerHTML = '';
    return;
  }
  Promise.all(watchlist.map(id => fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&language=${langSelect ? langSelect.value : 'en-US'}`).then(r => r.json())))
    .then(movies => {
      showMovies(movies);
      pagination.innerHTML = '';
    });
}

// Dark mode logic
function setTheme(mode) {
  if (mode === 'light') {
    document.body.classList.add('light-mode');
    themeToggleIcon.textContent = '☀️';
  } else {
    document.body.classList.remove('light-mode');
    themeToggleIcon.textContent = '🌙';
  }
  localStorage.setItem('theme', mode);
}

function toggleTheme() {
  const isLight = document.body.classList.contains('light-mode');
  setTheme(isLight ? 'dark' : 'light');
}

themeToggleBtn.addEventListener('click', toggleTheme);
(function() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    setTheme(saved);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    setTheme('light');
  } else {
    setTheme('dark');
  }
})();

// Helper to build API URL with filters
function buildApiUrl(page = 1) {
  let url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}`;
  url += `&sort_by=${sortSelect.value}`;
  url += `&language=${langSelect.value}`;
  if (yearInput.value) url += `&primary_release_year=${yearInput.value}`;
  if (minRatingSelect.value && minRatingSelect.value !== '0') url += `&vote_average.gte=${minRatingSelect.value}`;
  // Add genres
  if (genreSelect && genreSelect.selectedOptions.length > 0) {
    const genreIds = Array.from(genreSelect.selectedOptions).map(opt => opt.value).join(',');
    if (genreIds) url += `&with_genres=${genreIds}`;
  }
  url += `&page=${page}`;
  return url;
}

// Listen for filter changes
[sortSelect, langSelect, yearInput, minRatingSelect].forEach(el => {
  el && el.addEventListener('change', () => {
    currentPage = 1;
    getMovies(buildApiUrl(1), 1, true);
  });
});
if (yearInput) {
  yearInput.addEventListener('input', () => {
    currentPage = 1;
    getMovies(buildApiUrl(1), 1, true);
  });
}

// Listen for genre changes
if (genreSelect) {
  genreSelect.addEventListener('change', () => {
    currentPage = 1;
    getMovies(buildApiUrl(1), 1, true);
  });
}

// Update getMovies to support filter mode
async function getMovies(url, page = 1, isFilter = false) {
  try {
    lastUrl = url;
    showLoading();
    console.log('Fetching movies from:', url); // Debug log
    const res = await fetch(url);
    if (!res.ok) {
      const errorText = await res.text();
      console.error('API error response:', errorText); // Debug log
      throw new Error('Network response was not ok');
    }
    const data = await res.json();
    if (!data.results || data.results.length === 0) {
      showError('No movies found.');
      return;
    }
    totalPages = data.total_pages;
    showMovies(data.results);
    renderPagination(page, totalPages);
  } catch (error) {
    showError('Failed to load movies. Please try again later.');
    console.error('Fetch error:', error); // Debug log
  }
}

// On page load, use filter bar if present, else default
if (sortSelect && langSelect && yearInput && minRatingSelect) {
  getMovies(buildApiUrl(1), 1, true);
} else {
  getMovies(API_URL, currentPage);
}

function showLoading() {
    main.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:320px;"><div class="spinner" style="width:48px;height:48px;border:5px solid #eee;border-top:5px solid #3a7bd5;border-radius:50%;animation:spin 1s linear infinite;"></div></div>';
    if (!document.getElementById('spinner-style')) {
      const style = document.createElement('style');
      style.id = 'spinner-style';
      style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`;
      document.head.appendChild(style);
    }
}

// 1. Animate fav/watchlist btns on click
function animateBtn(btn) {
  btn.classList.remove('clicked');
  void btn.offsetWidth; // trigger reflow
  btn.classList.add('clicked');
  setTimeout(() => btn.classList.remove('clicked'), 400);
}

// 2. Scroll-to-top button logic
const scrollTopBtn = document.getElementById('scroll-top-btn');
window.addEventListener('scroll', () => {
  if (window.scrollY > 300) {
    scrollTopBtn.classList.add('show');
    scrollTopBtn.style.display = 'flex';
  } else {
    scrollTopBtn.classList.remove('show');
    scrollTopBtn.style.display = 'none';
  }
});
scrollTopBtn.onclick = () => window.scrollTo({top:0,behavior:'smooth'});

// 3. Filter bar collapse on mobile
const filterBar = document.getElementById('filter-bar');
const filterToggleBtn = document.getElementById('filter-toggle-btn');
function updateFilterToggle() {
  if (window.innerWidth <= 600) {
    filterToggleBtn.style.display = 'block';
    filterBar.classList.remove('open');
  } else {
    filterToggleBtn.style.display = 'none';
    filterBar.classList.remove('open');
  }
}
window.addEventListener('resize', updateFilterToggle);
document.addEventListener('DOMContentLoaded', updateFilterToggle);
filterToggleBtn.onclick = () => {
  filterBar.classList.toggle('open');
};

// 4. Animate movie cards on load (staggered)
function showMovies(movies) {
  main.innerHTML = '';
  movies.forEach((movie, idx) => {
    const { title, poster_path, vote_average, overview, release_date, id } = movie;
    const movieEl = document.createElement('div');
    movieEl.classList.add('movie');
    movieEl.style.cursor = 'pointer';
    movieEl.style.animationDelay = (idx * 0.07) + 's';
    const fav = isFavorite(id);
    const inWatchlist = isInWatchlist(id);
    // Remove light reflection and peek overlay
    movieEl.innerHTML = `
      <img src="${IMG_PATH + poster_path}" alt="${title}">
      <div class="movie-actions">
        <button class="fav-btn" data-id="${id}" title="${fav ? 'Remove from favorites' : 'Add to favorites'}" style="color:${fav ? '#f953c6' : '#b0b3c6'};">${fav ? '❤️' : '🤍'}</button>
        <button class="watchlist-btn" data-id="${id}" title="${inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}" style="color:${inWatchlist ? '#ffd200' : '#b0b3c6'};">${inWatchlist ? '🔖' : '📑'}</button>
      </div>
      <div class="movie-info">
        <h3>${title}</h3>
        <span class="${getClassByRate(vote_average)}">${vote_average}</span>
      </div>
      <div class="overview">
        <h3>Overview</h3>
        ${overview}
      </div>
    `;
    // Remove parallax tilt effect
    movieEl.onclick = (e) => {
      if (e.target.classList.contains('fav-btn') || e.target.classList.contains('watchlist-btn')) return;
      openMovieModal(movie);
    };
    main.appendChild(movieEl);
  });
  // Add event listeners for favorite buttons
  document.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.getAttribute('data-id'));
      toggleFavorite(id);
      btn.innerHTML = isFavorite(id) ? '❤️' : '🤍';
      btn.style.color = isFavorite(id) ? '#f953c6' : '#b0b3c6';
      btn.title = isFavorite(id) ? 'Remove from favorites' : 'Add to favorites';
      animateBtn(btn);
    });
  });
  // Add event listeners for watchlist buttons
  document.querySelectorAll('.watchlist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.getAttribute('data-id'));
      toggleWatchlist(id);
      btn.innerHTML = isInWatchlist(id) ? '🔖' : '📑';
      btn.style.color = isInWatchlist(id) ? '#ffd200' : '#b0b3c6';
      btn.title = isInWatchlist(id) ? 'Remove from watchlist' : 'Add to watchlist';
      animateBtn(btn);
    });
  });
}

function getClassByRate(vote) {
    if (vote >= 8) {
        return 'green';
    } else if (vote >= 5) {
        return 'orange';
    } else {
        return 'red';
    }
}

function showError(message) {
    main.innerHTML = `<div style="color: white; text-align: center; margin-top: 2rem; font-size: 1.5rem;">${message}</div>`;
}

function renderPagination(page, total) {
    pagination.innerHTML = '';
    if (total <= 1) return;
    const maxBtns = 5;
    let start = Math.max(1, page - Math.floor(maxBtns / 2));
    let end = Math.min(total, start + maxBtns - 1);
    if (end - start < maxBtns - 1) start = Math.max(1, end - maxBtns + 1);

    // Prev button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Prev';
    prevBtn.className = 'pagination-btn';
    prevBtn.disabled = page === 1;
    prevBtn.onclick = () => changePage(page - 1);
    pagination.appendChild(prevBtn);

    // Page buttons
    for (let i = start; i <= end; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = 'pagination-btn' + (i === page ? ' active' : '');
        btn.disabled = i === page;
        btn.onclick = () => changePage(i);
        pagination.appendChild(btn);
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.className = 'pagination-btn';
    nextBtn.disabled = page === total;
    nextBtn.onclick = () => changePage(page + 1);
    pagination.appendChild(nextBtn);
}

function changePage(page) {
    currentPage = page;
    // Always build the correct URL for the new page
    if (sortSelect && langSelect && yearInput && minRatingSelect) {
        getMovies(buildApiUrl(page), page, true);
    } else {
        getMovies(API_URL + `&page=${page}`, page);
    }
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const searchTerm = search.value;
    if (searchTerm && searchTerm !== '') {
        getMovies(SEARCH_API + encodeURIComponent(searchTerm), 1);
        currentPage = 1;
        search.value = '';
    } else {
        window.location.reload();
    }
});

// Modal open/close animation
function showModal() {
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('open'), 10);
  setTimeout(() => document.getElementById('modal-content').style.opacity = '1', 50);
  document.body.style.overflow = 'hidden';
}
function hideModal() {
  modal.classList.remove('open');
  setTimeout(() => { modal.style.display = 'none'; document.body.style.overflow = ''; }, 380);
}
modalClose.onclick = () => { modal.style.display = 'none'; document.body.style.overflow = ''; };
window.addEventListener('click', (e) => { if (e.target === modal) { modal.style.display = 'none'; document.body.style.overflow = ''; } });
document.addEventListener('keydown', (e) => { if (modal.style.display === 'flex' && e.key === 'Escape') { modal.style.display = 'none'; document.body.style.overflow = ''; } });

async function openMovieModal(movie) {
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  const posterUrl = movie.poster_path ? IMG_PATH + movie.poster_path : '';
  document.getElementById('modal-poster').src = posterUrl;
  document.getElementById('modal-poster').alt = movie.title;
  document.getElementById('modal-poster').style.display = posterUrl ? 'block' : 'none';
  modalBody.innerHTML = `
    <h2 style="margin-top:0;">${movie.title}</h2>
    <div style="margin:1rem 0 0.5rem 0;">Loading details...</div>
    <div style="display:flex;justify-content:center;align-items:center;height:80px;">
      <div class="spinner" style="width:48px;height:48px;"></div>
    </div>
  `;
  let details, videos, reviews, recommendations, credits, collection;
  try {
    [details, videos, reviews, recommendations, credits] = await Promise.all([
      fetch(tmdbUrl(`movie/${movie.id}`)).then(r => r.json()),
      fetch(tmdbUrl(`movie/${movie.id}/videos`)).then(r => r.json()),
      fetch(tmdbUrl(`movie/${movie.id}/reviews`)).then(r => r.json()),
      fetch(tmdbUrl(`movie/${movie.id}/recommendations`)).then(r => r.json()),
      fetch(tmdbUrl(`movie/${movie.id}/credits`)).then(r => r.json()),
    ]);
  } catch (e) {
    modalBody.innerHTML = `<h2 style='margin-top:0;'>${movie.title}</h2><div style='color:#ffd200;'>Failed to load movie details. Please try again later.</div>`;
    return;
  }
  let collectionHtml = '';
  if (details && details.belongs_to_collection && details.belongs_to_collection.id) {
    try {
      const collectionRes = await fetch(tmdbUrl(`collection/${details.belongs_to_collection.id}`));
      if (collectionRes.ok) {
        collection = await collectionRes.json();
        if (collection.parts && collection.parts.length > 1) {
          collectionHtml = `
            <h3 style='margin-top:1.5rem;'>Part of the <span style="color:#ffd200;">${collection.name}</span> Collection</h3>
            <div class="rec-movies" style="margin-bottom:1rem;">
              ${collection.parts.sort((a,b)=>(a.release_date||'').localeCompare(b.release_date||'')).map(part => `
                <div class="rec-movie collection-movie" data-movie-id="${part.id}">
                  <img src="${part.poster_path ? IMG_PATH + part.poster_path : ''}" alt="${part.title}">
                  <div class="rec-movie-title">${part.title}</div>
                </div>
              `).join('')}
            </div>
          `;
        }
      }
    } catch (e) { /* fail silently */ }
  }
  const trailer = (videos.results || []).find(v => v.site === 'YouTube' && v.type === 'Trailer');
  const director = (credits.crew || []).find(c => c.job === 'Director');
  const writers = (credits.crew || []).filter(c => c.job === 'Writer' || c.job === 'Screenplay');
  const mainCast = (credits.cast || []).slice(0, 8);
  modalBody.innerHTML = `
    <h2 style="margin-top:0;">${details.title}</h2>
    <div style="margin-bottom:0.7rem;">
      <strong>Release Date:</strong> ${details.release_date || 'N/A'}<br>
      <strong>Rating:</strong> ${details.vote_average || 'N/A'}<br>
      <strong>Runtime:</strong> ${details.runtime ? details.runtime + ' min' : 'N/A'}
    </div>
    <div style="margin-bottom:0.7rem;">
      <strong>Director:</strong> ${director ? `<span class=\"crew-member\">${director.name}</span>` : 'N/A'}<br>
      <strong>Writers:</strong> ${writers.length ? writers.map(w => `<span class=\"crew-member\">${w.name}</span>`).join(', ') : 'N/A'}
    </div>
    <div style="margin-bottom:0.7rem;">
      <strong>Main Cast:</strong>
      <div class="cast-grid">
        ${mainCast.map(c => `<span class=\"cast-member\" data-person-id=\"${c.id}\">${c.name}</span>`).join('')}
      </div>
    </div>
    <p style="margin:1rem 0 0.5rem 0;">${details.overview || 'No overview available.'}</p>
    ${trailer ? `<button class=\"trailer-btn\" id=\"watch-trailer-btn\">🎬 Watch Trailer</button>` : ''}
    <div id=\"trailer-embed\" style=\"margin-top:1rem;display:none;\"></div>
    ${collectionHtml}
    <h3 style=\"margin-top:1.5rem;\">User Reviews</h3>
    <div style=\"max-height:120px;overflow-y:auto;\">
      ${(reviews.results && reviews.results.length) ? reviews.results.slice(0,3).map(r => `<div style='margin-bottom:1rem;'><strong>${r.author}</strong>: <span style='font-size:0.98em;'>${r.content.length > 300 ? r.content.slice(0,300)+'...' : r.content}</span></div>`).join('') : '<span style=\"color:#b0b3c6;\">No reviews yet.</span>'}
    </div>
    <h3 style=\"margin-top:1.5rem;\">Recommended Movies</h3>
    <div class=\"rec-movies\">
      ${(recommendations.results && recommendations.results.length) ? recommendations.results.slice(0,8).map(rec => `
        <div class=\"rec-movie\" data-movie-id=\"${rec.id}\">\n          <img src=\"${rec.poster_path ? IMG_PATH + rec.poster_path : ''}\" alt=\"${rec.title}\">\n          <div class=\"rec-movie-title\">${rec.title}</div>\n        </div>\n      `).join('') : '<span style=\"color:#b0b3c6;\">No recommendations.</span>'}
    </div>
  `;
  // Trailer button logic (fix: always re-query after modalBody update)
  setTimeout(() => {
    const trailerBtn = document.getElementById('watch-trailer-btn');
    if (trailerBtn) {
      trailerBtn.onclick = function() {
        const embed = document.getElementById('trailer-embed');
        if (embed.style.display === 'none') {
          embed.innerHTML = `<iframe width=\"100%\" height=\"260\" src=\"https://www.youtube.com/embed/${trailer.key}\" frameborder=\"0\" allowfullscreen></iframe>`;
          embed.style.display = 'block';
          this.textContent = 'Hide Trailer';
        } else {
          embed.innerHTML = '';
          embed.style.display = 'none';
          this.textContent = '🎬 Watch Trailer';
        }
      };
    }
  }, 0);
  document.querySelectorAll('.rec-movie').forEach(el => {
    el.onclick = function() {
      openMovieModal({id: this.getAttribute('data-movie-id')*1});
    };
  });
  document.querySelectorAll('.cast-member').forEach(el => {
    el.onclick = function(e) {
      e.stopPropagation();
      const personId = this.getAttribute('data-person-id');
      if (personId) openActorModal(personId);
    };
  });
  setTimeout(() => {
    document.querySelectorAll('.collection-movie').forEach(el => {
      el.onclick = function() {
        openMovieModal({id: this.getAttribute('data-movie-id')*1});
      };
    });
  }, 0);

  // Build share URL
  const shareUrl = `${window.location.origin}${window.location.pathname}?movie=${details.id}`;
  // Social share buttons HTML
  const shareHtml = `
    <div class='share-buttons'>
      <button class='share-btn' id='share-fb' title='Share on Facebook' aria-label='Share on Facebook'>📘</button>
      <button class='share-btn' id='share-tw' title='Share on Twitter' aria-label='Share on Twitter'>🐦</button>
      <button class='share-btn' id='share-wa' title='Share on WhatsApp' aria-label='Share on WhatsApp'>🟢</button>
      <button class='share-btn' id='share-copy' title='Copy Link' aria-label='Copy Link'>🔗</button>
    </div>
  `;
  // Insert shareHtml just after the title
  modalBody.innerHTML = modalBody.innerHTML.replace(/(<h2[^>]*>.*?<\/h2>)/, `$1${shareHtml}`);

  // Share button logic
  document.getElementById('share-fb').onclick = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,'_blank');
  };
  document.getElementById('share-tw').onclick = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(details.title)}`,'_blank');
  };
  document.getElementById('share-wa').onclick = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(details.title + ' ' + shareUrl)}`,'_blank');
  };
  document.getElementById('share-copy').onclick = function() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      this.classList.add('copied');
      setTimeout(() => this.classList.remove('copied'), 1200);
    });
  };
}

// Actor modal logic
async function openActorModal(personId) {
  const [person, credits] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/person/${personId}?api_key=${API_KEY}&language=en-US`).then(r => r.json()),
    fetch(`https://api.themoviedb.org/3/person/${personId}/movie_credits?api_key=${API_KEY}&language=en-US`).then(r => r.json()),
  ]);
  const actorModal = document.getElementById('actor-modal');
  const actorBody = document.getElementById('actor-modal-body');
  actorBody.innerHTML = `
    <h2>${person.name}</h2>
    <p><strong>Born:</strong> ${person.birthday || 'N/A'}${person.place_of_birth ? ' in ' + person.place_of_birth : ''}</p>
    <p style="margin-bottom:0.7rem;"><strong>Bio:</strong> ${person.biography ? person.biography.slice(0,400) + (person.biography.length > 400 ? '...' : '') : 'No biography available.'}</p>
    <h3 style="margin-top:1.2rem;">Known For</h3>
    <div class="rec-movies">
      ${(credits.cast && credits.cast.length) ? credits.cast.sort((a,b)=>b.popularity-a.popularity).slice(0,8).map(m => `
        <div class="rec-movie" data-movie-id="${m.id}">
          <img src="${m.poster_path ? IMG_PATH + m.poster_path : ''}" alt="${m.title}">
          <div class="rec-movie-title">${m.title}</div>
        </div>
      `).join('') : '<span style="color:#b0b3c6;">No movies found.</span>'}
    </div>
  `;
  actorModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  // Recommended movies in actor modal
  actorBody.querySelectorAll('.rec-movie').forEach(el => {
    el.onclick = function() {
      actorModal.style.display = 'none';
      openMovieModal({id: this.getAttribute('data-movie-id')*1});
    };
  });
}

document.getElementById('actor-modal-close').onclick = function() {
  document.getElementById('actor-modal').style.display = 'none';
  document.body.style.overflow = 'hidden';
};
window.addEventListener('click', (e) => {
  if (e.target === document.getElementById('actor-modal')) {
    document.getElementById('actor-modal').style.display = 'none';
    document.body.style.overflow = 'hidden';
  }
});
document.addEventListener('keydown', (e) => {
  if (document.getElementById('actor-modal').style.display === 'flex' && e.key === 'Escape') {
    document.getElementById('actor-modal').style.display = 'none';
    document.body.style.overflow = 'hidden';
  }
});

// Update counts on load
updateFavoritesCount();
updateWatchlistCount();

// --- API helpers ---
function tmdbUrl(path, params = {}) {
  const url = new URL(`https://api.themoviedb.org/3/${path}`);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('language', langSelect ? langSelect.value : 'en-US');
  for (const k in params) url.searchParams.set(k, params[k]);
  return url.toString();
}

// --- Auth UI logic ---
function updateAuthUI() {
  const user = JSON.parse(localStorage.getItem('mb_loggedin') || 'null');
  const loginBtn = document.getElementById('login-btn');
  const registerBtn = document.getElementById('register-btn');
  let userGreet = document.getElementById('user-greet');
  let logoutBtn = document.getElementById('logout-btn');
  if (!userGreet) {
    userGreet = document.createElement('span');
    userGreet.id = 'user-greet';
    userGreet.style.marginLeft = '1.2rem';
    userGreet.style.fontWeight = '600';
    userGreet.style.color = '#ffd200';
    document.querySelector('header').appendChild(userGreet);
  }
  if (!logoutBtn) {
    logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout-btn';
    logoutBtn.textContent = 'Logout';
    logoutBtn.style.marginLeft = '0.7rem';
    logoutBtn.style.fontSize = '1.1rem';
    logoutBtn.style.fontWeight = '600';
    logoutBtn.style.color = '#fff';
    logoutBtn.style.background = 'linear-gradient(90deg,#f953c6,#ffd200)';
    logoutBtn.style.border = 'none';
    logoutBtn.style.borderRadius = '1.2rem';
    logoutBtn.style.padding = '0.5rem 1.2rem';
    logoutBtn.style.cursor = 'pointer';
    logoutBtn.style.transition = 'background 0.2s, color 0.2s';
    logoutBtn.onclick = function() {
      localStorage.removeItem('mb_loggedin');
      updateAuthUI();
    };
    document.querySelector('header').appendChild(logoutBtn);
  }
  if (user) {
    loginBtn && (loginBtn.style.display = 'none');
    registerBtn && (registerBtn.style.display = 'none');
    userGreet.textContent = `Hi, ${user.username}`;
    userGreet.style.display = 'inline-block';
    logoutBtn.style.display = 'inline-block';
  } else {
    loginBtn && (loginBtn.style.display = 'inline-block');
    registerBtn && (registerBtn.style.display = 'inline-block');
    userGreet.style.display = 'none';
    logoutBtn.style.display = 'none';
  }
}
document.addEventListener('DOMContentLoaded', updateAuthUI);

// --- User-specific favorites and watchlist ---
function getCurrentUserKey() {
  const user = JSON.parse(localStorage.getItem('mb_loggedin') || 'null');
  return user ? user.username || user.email : null;
}
function loadUserData() {
  const key = getCurrentUserKey();
  if (key) {
    favorites = JSON.parse(localStorage.getItem('mb_favorites_' + key) || '[]');
    watchlist = JSON.parse(localStorage.getItem('mb_watchlist_' + key) || '[]');
  } else {
    favorites = [];
    watchlist = [];
  }
  updateFavoritesCount();
  updateWatchlistCount();
}
function saveUserData() {
  const key = getCurrentUserKey();
  if (key) {
    localStorage.setItem('mb_favorites_' + key, JSON.stringify(favorites));
    localStorage.setItem('mb_watchlist_' + key, JSON.stringify(watchlist));
  }
}
// On login/logout, load correct data
function onAuthChange() {
  loadUserData();
  if (!getCurrentUserKey()) {
    viewingFavorites = false;
    viewingWatchlist = false;
    getMovies(buildApiUrl(1), 1, true);
  } else {
    updateFavoritesCount();
    updateWatchlistCount();
  }
}
document.addEventListener('DOMContentLoaded', onAuthChange);
window.addEventListener('storage', onAuthChange);
// Patch updateAuthUI to call onAuthChange after login/logout
const origUpdateAuthUI = updateAuthUI;
updateAuthUI = function() { origUpdateAuthUI(); onAuthChange(); };