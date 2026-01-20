/**
 * SCRIPT UNIQUE : GESTION DES RECORDS RUSTA
 * Fusion de global-search.js et records.js
 */

let allData = {};

// --- 1. INITIALISATION ET CHARGEMENT ---
async function init() {
    const dataSource = window.DATA_SOURCE || 'records.json';
    
    try {
        const response = await fetch(dataSource);
        if (!response.ok) throw new Error("Fichier de données introuvable");
        allData = await response.json();
        console.log("Données chargées avec succès !");

        // Initialiser la vue "Records par catégorie" si on est sur la bonne page
        if (document.getElementById('category-select')) {
            const initialCategory = window.location.hash || document.getElementById('category-select').value;
            updateDisplay(initialCategory);
        }
    } catch (error) {
        console.error('Erreur de chargement:', error);
        const errorContainer = document.getElementById('results-tbody') || document.getElementById('records-tbody');
        if (errorContainer) {
            errorContainer.innerHTML = `<tr><td colspan="8" style="color:red; text-align:center;">Erreur : ${error.message}</td></tr>`;
        }
    }
}

// --- 2. LOGIQUE DE RECHERCHE GLOBALE (global-search.js) ---
function lancerRecherche() {
    const query = document.getElementById('global-search-input').value.toLowerCase().trim();
    const tbody = document.getElementById('results-tbody');
    if (!tbody) return;

    if (query.length < 2) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Tapez au moins 2 lettres...</td></tr>';
        return;
    }

    let resultsHtml = '';
    let count = 0;

    for (const category in allData) {
        ['garcons', 'filles'].forEach(genre => {
            const records = allData[category][genre] || [];
            records.forEach(r => {
                const texteComplet = `${category} ${genre} ${r.epreuve} ${r.nom} ${r.annee}`.toLowerCase();
                if (texteComplet.includes(query)) {
                    count++;
                    resultsHtml += `
                        <tr>
                            <td style="font-weight:bold">${category.replace('_', ' ')}</td>
                            <td>${genre === 'garcons' ? 'M' : 'F'}</td>
                            <td>${escapeHtml(r.epreuve)}</td>
                            <td>${escapeHtml(r.nom)}</td>
                            <td>${escapeHtml(r.resultat)}</td>
                            <td>${r.annee}</td>
                        </tr>`;
                }
            });
        });
    }
    tbody.innerHTML = count > 0 ? resultsHtml : '<tr><td colspan="6" style="text-align:center;">Aucun résultat trouvé pour "' + query + '"</td></tr>';
}

// --- 3. LOGIQUE DE RENDU PAR CATÉGORIE (records.js) ---
function updateDisplay(categoryAnchor) {
    const categorySelect = document.getElementById('category-select');
    const tbody = document.getElementById('records-tbody');
    if (!categorySelect || !tbody) return;

    const categoryId = categoryAnchor.replace('#', '');
    const data = allData[categoryId];
    if (!data) return;

    // Mise à jour des titres
    const selectedOption = categorySelect.querySelector(`option[value="${categoryAnchor}"]`);
    const catName = selectedOption ? selectedOption.textContent : "";
    
    if (document.getElementById('current-category-title')) document.getElementById('current-category-title').textContent = catName;
    if (document.getElementById('current-category-name')) document.getElementById('current-category-name').textContent = catName;
    categorySelect.value = categoryAnchor;

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
    
    // Reset filtre interne si présent
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = '';
        filterRecords();
    }
}

// Filtrage interne au tableau de catégorie
function filterRecords() {
    const searchInput = document.getElementById('search-input');
    const tbody = document.getElementById('records-tbody');
    const clearSearchBtn = document.getElementById('clear-search-button');
    if (!searchInput || !tbody) return;

    const query = searchInput.value.toLowerCase().trim();
    const rows = tbody.querySelectorAll('tr');
    let foundCount = 0;

    if (clearSearchBtn) clearSearchBtn.style.display = query.length > 0 ? 'block' : 'none';

    rows.forEach(row => {
        row.querySelectorAll('td').forEach(cell => cell.innerHTML = cell.textContent); // Nettoie le highlight
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
}

// --- 4. OUTILS (HELPERS) ---
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

// --- 5. ÉVÉNEMENTS ---

// Recherche Globale
const globalSearchInput = document.getElementById('global-search-input');
if (globalSearchInput) globalSearchInput.addEventListener('input', lancerRecherche);

// Records par catégorie
const categorySelect = document.getElementById('category-select');
if (categorySelect) categorySelect.addEventListener('change', (e) => updateDisplay(e.target.value));

const searchInput = document.getElementById('search-input');
if (searchInput) searchInput.addEventListener('input', filterRecords);

const clearSearchBtn = document.getElementById('clear-search-button');
if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        filterRecords();
        searchInput.focus();
    });
}

// --- 6. GESTION MODALE ---
const modalRoot = document.getElementById('modal-root');
const form = document.getElementById('report-form');

if (modalRoot && form) {
    const successMessage = document.querySelector('.success-message');
    const closeModal = () => {
        modalRoot.style.display = 'none';
        form.reset();
        form.style.display = 'block';
        successMessage.style.display = 'none';
    };

    const btnReport = document.getElementById('btn-report-global');
    if (btnReport) {
        btnReport.addEventListener('click', () => {
            const activeId = categorySelect ? categorySelect.value.replace('#', '') : 'Inconnu';
            document.getElementById('form-category').value = activeId;
            document.getElementById('type').value = activeId.includes('_outdoor') ? 'outdoor' : 'indoor';
            modalRoot.style.display = 'flex';
            document.getElementById('epreuve').focus();
        });
    }

    document.getElementById('btn-cancel')?.addEventListener('click', closeModal);
    document.getElementById('btn-success-close')?.addEventListener('click', closeModal);
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
}

// LANCEMENT FINAL
init();