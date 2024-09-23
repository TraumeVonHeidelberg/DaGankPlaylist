// Elementy modala
const addBtn = document.querySelector('.add-btn');
const addSongModal = document.getElementById('addSongModal');
const modalContent = document.querySelector('.modal-content');

// Funkcja wyświetlania modala
function showAddSongModal() {
    addSongModal.style.display = 'flex'; // Wyświetl modal
}

// Funkcja ukrywania modala
function hideAddSongModal() {
    addSongModal.style.display = 'none'; // Ukryj modal
}

// Obsługa kliknięcia w przycisk 'add-btn'
addBtn.addEventListener('click', showAddSongModal);

// Zamknięcie modala po kliknięciu poza jego obszarem
addSongModal.addEventListener('click', (event) => {
    if (event.target === addSongModal) {
        hideAddSongModal(); // Ukryj modal, gdy klikniesz poza modalem
    }
});
