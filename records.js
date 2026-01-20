// --- VARIABLES GLOBALES ---
let allRecordsData = {};
const categorySelect = document.getElementById('category-select');
const currentCategoryNameSpan = document.getElementById('current-category-name');
const currentCategoryTitle = document.getElementById('current-category-title');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-button');
const tbody = document.getElementById('records-tbody');
const emptyStateMsg = document.getElementById('empty-state-msg');

// --- 1. CHARGEMENT DES DONNÉES ---
async function loadRecords() {
  // On regarde si une source spécifique est définie dans le HTML, 
  // sinon on prend 'records.json' par défaut.
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
  const catName = selectedOption ? selectedOption.textContent : "";
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

// --- 3. RECHERCHE ET FILTRAGE ---
function filterRecords() {
  const query = searchInput.value.toLowerCase().trim();
  const rows = tbody.querySelectorAll('tr');
  let foundCount = 0;

  clearSearchBtn.style.display = query.length > 0 ? 'block' : 'none';

  rows.forEach(row => {
    // Nettoyage HTML pour le surlignage précédent
    row.querySelectorAll('td').forEach(cell => cell.innerHTML = cell.textContent);

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

  emptyStateMsg.style.display = (foundCount === 0 && rows.length > 0) ? 'block' : 'none';
}

function highlightText(text, query) {
  const regex = new RegExp(`(${query})`, 'gi');
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
searchInput.addEventListener('input', filterRecords);
clearSearchBtn.addEventListener('click', () => { searchInput.value = ''; filterRecords(); searchInput.focus(); });

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
  document.getElementById('type').value = activeId.includes('_outdoor') ? 'outdoor' : 'indoor';
  modalRoot.style.display = 'flex';
  document.getElementById('epreuve').focus();
});

document.getElementById('btn-cancel').addEventListener('click', closeModal);
document.getElementById('btn-success-close').addEventListener('click', closeModal);
modalRoot.addEventListener('click', (e) => { if (e.target === modalRoot) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const p = Object.fromEntries(formData.entries());
  const body = encodeURIComponent(`Catégorie: ${p.category}\nType: ${p.type}\nGenre: ${p.gender}\nÉpreuve: ${p.epreuve}\nNom: ${p.nom}\nRésultat: ${p.resultat}\nLieu: ${p.lieu}\nAnnée: ${p.annee}\nCommentaire: ${p.comment}`);
  window.location.href = `mailto:laurentduthoo@gmail.com?cc=secretariat.rusta@gmail.com&subject=Signalement record&body=${body}`;
  form.style.display = 'none';
  successMessage.style.display = 'block';
});

// Lancement
loadRecords();