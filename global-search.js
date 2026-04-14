// ============================================================
// global-search.js — recherche globale pour records.json
// ============================================================

let allData = {};

// --- UTILITAIRES ---
function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

function highlightText(text, query) {
  if (!text || !query) return escapeHtml(text);
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escapeHtml(String(text)).replace(new RegExp(`(${escaped})`, 'gi'), '<span class="highlight">$1</span>');
}

// --- CHARGEMENT ---
async function init() {
  const tbody = document.getElementById('results-tbody');
  try {
    const response = await fetch('records.json');
    if (!response.ok) throw new Error('Fichier JSON introuvable');
    allData = await response.json();
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:red;text-align:center;">Erreur : ${error.message}</td></tr>`;
  }
}

// --- RECHERCHE ---
function lancerRecherche() {
  const query   = document.getElementById('global-search-input').value.toLowerCase().trim();
  const tbody   = document.getElementById('results-tbody');
  const countEl = document.getElementById('global-result-count');
  const clearBtn = document.getElementById('clear-global-search');

  clearBtn.style.display = query.length > 0 ? 'block' : 'none';

  if (query.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#666;">Entrez un mot-clé ci-dessus pour lancer la recherche globale.</td></tr>';
    if (countEl) countEl.style.display = 'none';
    return;
  }
  if (query.length < 2) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#666;">Tapez au moins 2 caractères…</td></tr>';
    if (countEl) countEl.style.display = 'none';
    return;
  }

  let resultsHtml = '';
  let count = 0;

  for (const category in allData) {
    ['garcons', 'filles'].forEach(genre => {
      const records = allData[category][genre] || [];
      records.forEach(r => {
        const texte = `${category} ${genre} ${r.epreuve} ${r.nom} ${r.annee}`.toLowerCase();
        if (texte.includes(query)) {
          count++;
          const catLabel = category.replace(/_/g, ' ');
          resultsHtml += `<tr>
            <td style="font-weight:bold">${highlightText(catLabel, query)}</td>
            <td>${genre === 'garcons' ? 'M' : 'F'}</td>
            <td>${highlightText(r.epreuve, query)}</td>
            <td>${highlightText(r.nom, query)}</td>
            <td>${escapeHtml(r.resultat)}</td>
            <td>${highlightText(r.annee ? String(r.annee) : '', query)}</td>
          </tr>`;
        }
      });
    });
  }

  tbody.innerHTML = count > 0
    ? resultsHtml
    : `<tr><td colspan="6" style="text-align:center;padding:20px;color:#666;">Aucun résultat pour « ${escapeHtml(query)} ».</td></tr>`;

  if (countEl) {
    countEl.textContent = `${count} résultat${count !== 1 ? 's' : ''}`;
    countEl.style.display = 'inline-block';
    countEl.className = 'result-count ' + (count === 0 ? 'result-count--empty' : 'result-count--found');
  }
}

const debouncedSearch = debounce(lancerRecherche, 180);

// --- ÉVÉNEMENTS ---
document.getElementById('global-search-input').addEventListener('input', debouncedSearch);

document.getElementById('clear-global-search').addEventListener('click', () => {
  document.getElementById('global-search-input').value = '';
  lancerRecherche();
  document.getElementById('global-search-input').focus();
});

document.addEventListener('keydown', (e) => {
  const tag = document.activeElement.tagName;
  if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
    e.preventDefault();
    const inp = document.getElementById('global-search-input');
    inp.focus();
    inp.select();
  }
});

init();
