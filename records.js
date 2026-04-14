// --- VARIABLES GLOBALES ---
let allRecordsData = {};
const categorySelect = document.getElementById('category-select');
const currentCategoryNameSpan = document.getElementById('current-category-name');
const currentCategoryTitle = document.getElementById('current-category-title');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-button');
const tbody = document.getElementById('records-tbody');
const emptyStateMsg = document.getElementById('empty-state-msg');
const resultCount = document.getElementById('result-count');

// --- 1. CHARGEMENT DES DONNÉES ---
async function loadRecords() {
  const dataSource = window.DATA_SOURCE || 'records.json';

  try {
    const res = await fetch(dataSource);
    allRecordsData = await res.json();

    const initialCategory = window.location.hash || categorySelect.value;
    updateDisplay(initialCategory);
  } catch (e) {
    console.error('Erreur lors du chargement', e);
    document.getElementById('content').innerHTML = `<p class="empty-state">⚠️ Erreur lors du chargement de ${dataSource}.</p>`;
  }
}

// --- 2. LOGIQUE DE RENDU DYNAMIQUE ---
function updateDisplay(categoryAnchor) {
  const categoryId = categoryAnchor.replace('#', '');
  const data = allRecordsData[categoryId];
  if (!data) return;

  // Mise à jour des textes
  const selectedOption = categorySelect.querySelector(`option[value="${categoryAnchor}"]`);
  const catName = selectedOption ? selectedOption.textContent : '';
  currentCategoryTitle.textContent = catName;
  currentCategoryNameSpan.textContent = catName;
  categorySelect.value = categoryAnchor;

  // Génération des lignes du tableau
  const garcons = data.garcons || [];
  const filles = data.filles || [];
  const max = Math.max(garcons.length, filles.length);

  let rows = '';
  for (let i = 0; i < max; i++) {
    const g = garcons[i] || { epreuve: '', nom: '', resultat: '', annee: '' };
    const f = filles[i] || { epreuve: '', nom: '', resultat: '', annee: '' };
    rows += `<tr>
      <td>${escapeHtml(g.epreuve)}</td><td>${escapeHtml(g.nom)}</td><td>${escapeHtml(g.resultat)}</td><td>${g.annee || ''}</td>
      <td>${escapeHtml(f.epreuve)}</td><td>${escapeHtml(f.nom)}</td><td>${escapeHtml(f.resultat)}</td><td>${f.annee || ''}</td>
    </tr>`;
  }
  tbody.innerHTML = rows;

  // Réinitialiser la recherche lors d'un changement de catégorie
  searchInput.value = '';
  filterRecords();
}

// --- 3. RECHERCHE ET FILTRAGE (avec debounce) ---

// Debounce : évite de filtrer à chaque frappe, attend 180ms d'inactivité
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function filterRecords() {
  const query = searchInput.value.toLowerCase().trim();
  const rows = tbody.querySelectorAll('tr');
  let foundCount = 0;
  const totalRows = rows.length;

  clearSearchBtn.style.display = query.length > 0 ? 'block' : 'none';

  rows.forEach(row => {
    // Réinitialise le HTML avant surlignage
    row.querySelectorAll('td').forEach(cell => {
      cell.textContent = cell.textContent; // force text-only reset
    });

    const rowText = row.textContent.toLowerCase();
    if (query === '' || rowText.includes(query)) {
      row.style.display = '';
      foundCount++;
      if (query !== '') {
        row.querySelectorAll('td').forEach(cell => {
          if (cell.textContent.toLowerCase().includes(query)) {
            cell.innerHTML = highlightText(escapeHtml(cell.textContent), query);
          }
        });
      }
    } else {
      row.style.display = 'none';
    }
  });

  // Compteur de résultats
  if (resultCount) {
    if (query !== '' && totalRows > 0) {
      resultCount.textContent = `${foundCount} résultat${foundCount !== 1 ? 's' : ''}`;
      resultCount.style.display = 'inline-block';
      resultCount.className = 'result-count ' + (foundCount === 0 ? 'result-count--empty' : 'result-count--found');
    } else {
      resultCount.style.display = 'none';
    }
  }

  emptyStateMsg.style.display = (foundCount === 0 && totalRows > 0 && query !== '') ? 'block' : 'none';
}

const debouncedFilter = debounce(filterRecords, 180);

function highlightText(text, query) {
  // Échappe les caractères spéciaux de regex
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<span class="highlight">$1</span>');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

// --- 4. ÉVÉNEMENTS ---
categorySelect.addEventListener('change', (e) => updateDisplay(e.target.value));
searchInput.addEventListener('input', debouncedFilter);
clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  filterRecords();
  searchInput.focus();
});

// Raccourci clavier "/" pour focaliser le champ de recherche
document.addEventListener('keydown', (e) => {
  // Ignore si on est dans un champ de saisie ou si la modale est ouverte
  const tag = document.activeElement.tagName;
  const modalOpen = modalRoot.style.display === 'flex';
  if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT' && !modalOpen) {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
  if (e.key === 'Escape') closeModal();
});

// --- 5. MODALE ---
const modalRoot = document.getElementById('modal-root');
const form = document.getElementById('report-form');
const successMessage = document.querySelector('.success-message');

function closeModal() {
  modalRoot.style.display = 'none';
  form.reset();
  form.style.display = 'block';
  successMessage.style.display = 'none';
}

document.getElementById('btn-report-global').addEventListener('click', () => {
  const activeId = categorySelect.value.replace('#', '');
  document.getElementById('form-category').value = activeId;
  document.getElementById('type').value = activeId.includes('outdoor') ? 'outdoor' : 'indoor';
  modalRoot.style.display = 'flex';
  document.getElementById('epreuve').focus();
});

document.getElementById('btn-cancel').addEventListener('click', closeModal);
document.getElementById('btn-success-close').addEventListener('click', closeModal);
modalRoot.addEventListener('click', (e) => { if (e.target === modalRoot) closeModal(); });

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const p = Object.fromEntries(formData.entries());
  const body = encodeURIComponent(
    `Catégorie: ${p.category}\nType: ${p.type}\nGenre: ${p.gender}\nÉpreuve: ${p.epreuve}\nNom: ${p.nom}\nRésultat: ${p.resultat}\nLieu: ${p.lieu}\nAnnée: ${p.annee}\nCommentaire: ${p.comment}`
  );
  window.location.href = `mailto:laurentduthoo@gmail.com?cc=secretariat.rusta@gmail.com&subject=Signalement record&body=${body}`;
  form.style.display = 'none';
  successMessage.style.display = 'block';
});

// Lancement
loadRecords();
