let allData = {};

// 1. On charge les données dès l'ouverture de la page
async function init() {
    const tbody = document.getElementById('results-tbody');
    try {
        const response = await fetch('recordsmasters.json'); // Vérifiez bien ce nom de fichier !
        if (!response.ok) throw new Error("Fichier JSON introuvable");
        allData = await response.json();
        console.log("Données chargées !");
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">Erreur : ${error.message}</td></tr>`;
    }
}

function lancerRecherche() {
    const query = document.getElementById('global-search-input').value.toLowerCase().trim();
    const tbody = document.getElementById('results-tbody');

    if (query.length < 2) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Tapez au moins 2 lettres...</td></tr>';
        return;
    }

    let resultsHtml = '';
    let count = 0;

    // On fouille dans chaque catégorie du JSON
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
                            <td>${r.epreuve}</td>
                            <td>${r.nom}</td>
                            <td>${r.resultat}</td>
                            <td>${r.annee}</td>
                        </tr>`;
                }
            });
        });
    }

    tbody.innerHTML = count > 0 ? resultsHtml : '<tr><td colspan="6" style="text-align:center;">Aucun résultat trouvé pour "' + query + '"</td></tr>';
}

// Écouteurs d'événements
document.getElementById('global-search-input').addEventListener('input', lancerRecherche);

// Démarrage
init();