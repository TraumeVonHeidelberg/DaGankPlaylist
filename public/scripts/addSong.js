// Elementy modala
const addBtn = document.querySelector('.add-btn')
const addSongModal = document.getElementById('addSongModal')
const modalContent = document.querySelector('.modal-content')
const songUploadForm = document.getElementById('song-upload-form')

// Funkcja wyświetlania modala
function showAddSongModal() {
	addSongModal.style.display = 'flex' // Wyświetl modal
}

// Funkcja ukrywania modala
function hideAddSongModal() {
	addSongModal.style.display = 'none' // Ukryj modal
}

// Obsługa kliknięcia w przycisk 'add-btn'
addBtn.addEventListener('click', showAddSongModal)

// Zamknięcie modala po kliknięciu poza jego obszarem
addSongModal.addEventListener('click', event => {
	if (event.target === addSongModal) {
		hideAddSongModal() // Ukryj modal, gdy klikniesz poza modalem
	}
})

// Obsługa wysyłania formularza
songUploadForm.addEventListener('submit', async event => {
	event.preventDefault() // Zapobiegamy domyślnemu zachowaniu formularza

	const formData = new FormData(songUploadForm) // Zbieranie danych z formularza

	try {
		// Wysłanie danych do API
		const response = await fetch('/api/tracks', {
			method: 'POST',
			body: formData,
		})

		if (response.ok) {
			const newTrack = await response.json()
			console.log('Utwór został dodany:', newTrack)
			hideAddSongModal() // Ukryj modal po dodaniu utworu
			loadTracks() // Odśwież listę utworów
		} else {
			console.error('Błąd podczas dodawania utworu.')
		}
	} catch (error) {
		console.error('Błąd podczas wysyłania formularza:', error)
	}
})
