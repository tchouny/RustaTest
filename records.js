// ============================================================
// records.js — partagé par records.html et imasters.html
// ============================================================

// --- VARIABLES GLOBALES ---
let allRecordsData = {};
const categorySelect  = document.getElementById('category-select');
const currentCategoryNameSpan = document.getElementById('current-category-name');
const currentCategoryTitle    = document.getElementById('current-category-title');
const searchInput    = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-button');
const tbody          = document.getElementById('records-tbody');
const emptyStateMsg  = document.getElementById('empty-state-msg');
const resultCountEl  = document.getElementById('result-count');

// --- UTILITAIRES ---

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

function highlightText(text, query) {
  if (!text || !query) return escapeHtml(text);
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return escapeHtml(String(text)).replace(regex, '<span class="highlight">$1</span>');
}

/** Debounce : attend `delay` ms d'inactivité avant d'appeler fn */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// --- 1. CHARGEMENT DES DONNÉES ---
async function loadRecords() {
  const dataSource = window.DATA_SOURCE || 'records.json';
  try {
    const res = await fetch(dataSource);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allRecordsData = await res.json();
    const initialCategory = window.location.hash || categorySelect.value;
    updateDisplay(initialCategory);
  } catch (e) {
    console.error('Erreur lors du chargement', e);
    const content = document.getElementById('content');
    if (content) content.innerHTML = `<p class="empty-state">⚠️ Erreur lors du chargement de ${dataSource}.</p>`;
  }
}

// --- 2. RENDU DYNAMIQUE PAR CATÉGORIE ---
function updateDisplay(categoryAnchor) {
  const categoryId = categoryAnchor.replace('#', '');
  const data = allRecordsData[categoryId];
  if (!data) return;

  // Textes
  const selectedOption = categorySelect.querySelector(`option[value="${categoryAnchor}"]`);
  const catName = selectedOption ? selectedOption.textContent : '';
  currentCategoryTitle.textContent = catName;
  currentCategoryNameSpan.textContent = catName;
  categorySelect.value = categoryAnchor;

  // Lignes du tableau
  const garcons = data.garcons || [];
  const filles  = data.filles  || [];
  const max = Math.max(garcons.length, filles.length);

  let rows = '';
  for (let i = 0; i < max; i++) {
    const g = garcons[i] || { epreuve: '', nom: '', resultat: '', annee: '' };
    const f = filles[i]  || { epreuve: '', nom: '', resultat: '', annee: '' };
    rows += `<tr>
      <td>${escapeHtml(g.epreuve)}</td><td>${escapeHtml(g.nom)}</td><td>${escapeHtml(g.resultat)}</td><td>${g.annee || ''}</td>
      <td>${escapeHtml(f.epreuve)}</td><td>${escapeHtml(f.nom)}</td><td>${escapeHtml(f.resultat)}</td><td>${f.annee || ''}</td>
    </tr>`;
  }
  tbody.innerHTML = rows;

  // Réinitialiser la recherche
  searchInput.value = '';
  filterRecords();
}

// --- 3. RECHERCHE ET FILTRAGE ---
function filterRecords() {
  const query = searchInput.value.toLowerCase().trim();
  const rows  = tbody.querySelectorAll('tr');
  let foundCount = 0;
  const totalRows = rows.length;

  clearSearchBtn.style.display = query.length > 0 ? 'block' : 'none';

  rows.forEach(row => {
    // Remet le texte brut avant de surligner (évite d'accumuler des balises)
    row.querySelectorAll('td').forEach(cell => {
      cell.textContent = cell.textContent;
    });

    const rowText = row.textContent.toLowerCase();
    if (query === '' || rowText.includes(query)) {
      row.style.display = '';
      foundCount++;
      if (query !== '') {
        row.querySelectorAll('td').forEach(cell => {
          if (cell.textContent.toLowerCase().includes(query)) {
            cell.innerHTML = highlightText(cell.textContent, query);
          }
        });
      }
    } else {
      row.style.display = 'none';
    }
  });

  // Badge de comptage
  if (resultCountEl) {
    if (query !== '' && totalRows > 0) {
      resultCountEl.textContent = `${foundCount} résultat${foundCount !== 1 ? 's' : ''}`;
      resultCountEl.style.display = 'inline-block';
      resultCountEl.className = 'result-count ' + (foundCount === 0 ? 'result-count--empty' : 'result-count--found');
    } else {
      resultCountEl.style.display = 'none';
    }
  }

  emptyStateMsg.style.display = (foundCount === 0 && totalRows > 0 && query !== '') ? 'block' : 'none';
}

const debouncedFilter = debounce(filterRecords, 180);

// --- 4. ÉVÉNEMENTS ---
categorySelect.addEventListener('change', (e) => updateDisplay(e.target.value));
searchInput.addEventListener('input', debouncedFilter);
clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  filterRecords();
  searchInput.focus();
});

// Raccourci "/" pour focaliser le champ de recherche
document.addEventListener('keydown', (e) => {
  const tag = document.activeElement.tagName;
  const modalOpen = modalRoot && modalRoot.style.display === 'flex';
  if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT' && !modalOpen) {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
  if (e.key === 'Escape') closeModal();
});

// --- 5. MODALE ---
const modalRoot      = document.getElementById('modal-root');
const form           = document.getElementById('report-form');
const successMessage = document.querySelector('.success-message');

function closeModal() {
  if (!modalRoot) return;
  modalRoot.style.display = 'none';
  form.reset();
  form.style.display = 'block';
  successMessage.style.display = 'none';
}

document.getElementById('btn-report-global').addEventListener('click', () => {
  const activeId = categorySelect.value.replace('#', '');
  document.getElementById('form-category').value = activeId;
  // Détecte indoor/outdoor depuis l'ID de catégorie
  document.getElementById('type').value = activeId.includes('outdoor') ? 'outdoor' : 'indoor';
  modalRoot.style.display = 'flex';
  document.getElementById('epreuve').focus();
});

document.getElementById('btn-cancel').addEventListener('click', closeModal);
document.getElementById('btn-success-close').addEventListener('click', closeModal);
modalRoot.addEventListener('click', (e) => { if (e.target === modalRoot) closeModal(); });

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const p = Object.fromEntries(new FormData(form).entries());
  const body = encodeURIComponent(
    `Catégorie: ${p.category}\nType: ${p.type}\nGenre: ${p.gender}\nÉpreuve: ${p.epreuve}\nNom: ${p.nom}\nRésultat: ${p.resultat}\nLieu: ${p.lieu}\nAnnée: ${p.annee}\nCommentaire: ${p.comment}`
  );
  window.location.href = `mailto:laurentduthoo@gmail.com?cc=secretariat.rusta@gmail.com&subject=Signalement%20record&body=${body}`;
  form.style.display = 'none';
  successMessage.style.display = 'block';
});

// Lancement
loadRecords();
