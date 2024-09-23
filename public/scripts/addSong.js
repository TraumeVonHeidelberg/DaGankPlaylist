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

// Funkcja do dynamicznego załadowania utworów (aktualizacja listy utworów po dodaniu nowego)
async function loadTracks() {
	try {
		const response = await fetch('/api/tracks') // Pobierz listę utworów z API
		if (response.ok) {
			const tracks = await response.json() // Parsowanie odpowiedzi
			const trackList = document.querySelector('.track-list') // Element listy utworów
			trackList.innerHTML = '' // Wyczyszczenie aktualnej listy

			tracks.forEach((track, index) => {
				const trackElement = document.createElement('li')
				trackElement.classList.add('track')
				trackElement.innerHTML = `
                    <div class="track-main-info">
                        <span class="track-number">${index + 1}</span>
                        <i class="play-track-icon fa-solid fa-play" data-src="${track.file}"></i>
                        <img class="track-image" src="./img/da gank members/me.webp" alt="Da gank member who added this song">
                        <span class="track-title">${track.title}</span>
                    </div>
                    <span class="track-plays">0</span>
                    <span class="track-duration">${track.duration}</span>
                `
				trackList.appendChild(trackElement) // Dodanie utworu do listy
			})
		} else {
			console.error('Błąd podczas pobierania listy utworów.')
		}
	} catch (error) {
		console.error('Błąd podczas ładowania listy utworów:', error)
	}
}

// Obsługa wysyłania formularza (dodawanie nowego utworu)
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
			const newTrack = await response.json() // Nowy dodany utwór
			console.log('Utwór został dodany:', newTrack)
			hideAddSongModal() // Ukryj modal po dodaniu utworu
			loadTracks() // Odśwież listę utworów po dodaniu nowego
		} else {
			console.error('Błąd podczas dodawania utworu.')
		}
	} catch (error) {
		console.error('Błąd podczas wysyłania formularza:', error)
	}
})
