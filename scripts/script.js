let currentAudio = null // Przechowuje odtwarzacz audio
let isDragging = false // Kontrola nad przeciąganiem suwaka postępu

// Funkcja do odtwarzania wybranego utworu
function playTrack(event) {
	const playIcon = event.currentTarget
	const songSrc = playIcon.getAttribute('data-src') // Pobierz ścieżkę do pliku audio
	const songTitle = playIcon.nextElementSibling.nextElementSibling.textContent // Tytuł utworu
	const songImage = playIcon.nextElementSibling.src // Ścieżka do obrazka

	// Sprawdź, czy istnieje już audio - jeśli tak, zatrzymaj go przed odtwarzaniem nowego utworu
	if (currentAudio) {
		currentAudio.pause()
		currentAudio.currentTime = 0 // Resetuj czas odtwarzania
	}

	// Tworzenie nowego elementu audio dynamicznie
	currentAudio = new Audio(songSrc)

	// Odtwarzanie utworu
	currentAudio.play()

	// Aktualizacja UI odtwarzacza
	document.querySelector('.music-player-song-title').textContent = songTitle
	document.querySelector('.music-player-img').src = songImage
	document.querySelector('.time-total').textContent = formatTime(currentAudio.duration) // Zaktualizuj czas trwania

	// Zaktualizowanie czasu trwania po załadowaniu danych
	currentAudio.addEventListener('loadedmetadata', function () {
		document.querySelector('.time-total').textContent = formatTime(currentAudio.duration)
	})

	// Nasłuchuj aktualizacji czasu trwania i postępu utworu
	currentAudio.addEventListener('timeupdate', updateProgressBar)

	// Obsługa zdarzeń, takich jak zakończenie utworu
	currentAudio.addEventListener('ended', () => {
		playIcon.classList.remove('fa-pause')
		playIcon.classList.add('fa-play')
	})

	// Zmiana ikony play na pause
	playIcon.classList.remove('fa-play')
	playIcon.classList.add('fa-pause')

	// Ustawienie początkowej głośności na podstawie suwaka głośności
	const volumeControl = document.querySelector('.music-loudness')
	currentAudio.volume = volumeControl.value / 100 // Zmieniamy głośność w zakresie 0-1
}

// Pobieramy wszystkie ikony play-track-icon
const playIcons = document.querySelectorAll('.play-track-icon')

// Dodajemy nasłuchiwanie kliknięcia dla każdej ikony
playIcons.forEach(icon => {
	icon.addEventListener('click', playTrack)
})

// Funkcja do aktualizacji paska postępu
function updateProgressBar() {
	const songProgress = document.querySelector('.song-progress')
	const currentTime = document.querySelector('.time-current')
	if (!isDragging) {
		const progress = (currentAudio.currentTime / currentAudio.duration) * 100
		songProgress.value = progress // Ustaw wartość paska postępu
		currentTime.textContent = formatTime(currentAudio.currentTime) // Zaktualizuj bieżący czas
	}
}

// Zmienianie pozycji odtwarzania utworu na podstawie przesunięcia paska
const songProgress = document.querySelector('.song-progress')
songProgress.addEventListener('input', function () {
	isDragging = true // Przeciąganie suwaka
	const newTime = (songProgress.value / 100) * currentAudio.duration // Nowy czas utworu
	currentAudio.currentTime = newTime // Ustaw nowy czas odtwarzania
	document.querySelector('.time-current').textContent = formatTime(newTime) // Zaktualizuj bieżący czas
})

songProgress.addEventListener('change', function () {
	isDragging = false // Zakończenie przeciągania suwaka
})

// Zmiana głośności na podstawie suwaka
const volumeControl = document.querySelector('.music-loudness')
volumeControl.addEventListener('input', function () {
	const volumeValue = volumeControl.value / 100 // Przekształcenie wartości z zakresu 0-100 na 0-1
	if (currentAudio) {
		currentAudio.volume = volumeValue // Ustawienie głośności odtwarzacza
	}
})

// Funkcja do formatowania czasu z sekund na format MM:SS
function formatTime(seconds) {
	const minutes = Math.floor(seconds / 60)
	const sec = Math.floor(seconds % 60)
	return `${minutes}:${sec < 10 ? '0' : ''}${sec}`
}
