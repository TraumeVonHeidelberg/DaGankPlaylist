let currentAudio = null // Przechowuje odtwarzacz audio
let currentTrackIndex = 0 // Przechowuje indeks aktualnie odtwarzanego utworu
let currentVolume = 0.5 // Ustawienie domyślnej głośności na 50%
const trackList = document.querySelectorAll('.track') // Lista utworów
let isDragging = false // Kontrola nad przeciąganiem suwaka postępu
let isMuted = false

// Funkcja do odtwarzania wybranego utworu według indeksu
function playTrackByIndex(index) {
	currentTrackIndex = index // Ustaw bieżący indeks utworu
	const track = trackList[index]
	const playIcon = track.querySelector('.play-track-icon')
	const songSrc = playIcon.getAttribute('data-src') // Pobierz ścieżkę do pliku audio
	const songTitle = playIcon.nextElementSibling.nextElementSibling.textContent // Tytuł utworu
	const songImage = playIcon.nextElementSibling.src // Ścieżka do obrazka

	// Pobranie przycisków play/pause w music playerze
	const playBtn = document.querySelector('.music-player-play-btn')
	const pauseBtn = document.querySelector('.music-player-pause-btn')

	// Sprawdź, czy istnieje już audio - jeśli tak, zatrzymaj go przed odtwarzaniem nowego utworu
	if (currentAudio) {
		currentAudio.pause()
		currentAudio.currentTime = 0 // Resetuj czas odtwarzania
	}

	// Tworzenie nowego elementu audio dynamicznie
	currentAudio = new Audio(songSrc)
	currentAudio.volume = currentVolume // Ustaw głośność na zapamiętaną wartość

	// Reset paska postępu i czasu bieżącego na początku
	const songProgress = document.querySelector('.song-progress')
	songProgress.value = 0
	document.querySelector('.time-current').textContent = '0:00'
	document.querySelector('.time-total').textContent = '0:00' // Resetujemy czas całkowity

	// Odtwarzanie utworu
	currentAudio.play()

	// Aktualizacja UI odtwarzacza
	document.querySelector('.music-player-song-title').textContent = songTitle
	document.querySelector('.music-player-img').src = songImage

	// Ustawienie eventu na załadowanie metadanych (np. czas trwania utworu)
	currentAudio.addEventListener('loadedmetadata', function () {
		document.querySelector('.time-total').textContent = formatTime(currentAudio.duration)
	})

	// Nasłuchuj aktualizacji czasu trwania i postępu utworu
	currentAudio.addEventListener('timeupdate', updateProgressBar)

	// Obsługa zakończenia utworu
	currentAudio.addEventListener('ended', () => {
		// Automatyczne przejście do następnego utworu po zakończeniu obecnego
		playNextTrack()
	})

	// Ukrywanie przycisku Play i wyświetlanie Pause
	playBtn.style.display = 'none'
	pauseBtn.style.display = 'inline-block'
}

// Funkcja do odtwarzania następnego utworu
function playNextTrack() {
	currentTrackIndex = (currentTrackIndex + 1) % trackList.length // Zwiększ indeks, wracaj do 0, gdy przekroczysz długość listy
	playTrackByIndex(currentTrackIndex)
}

// Funkcja do odtwarzania poprzedniego utworu
function playPreviousTrack() {
	currentTrackIndex = (currentTrackIndex - 1 + trackList.length) % trackList.length // Zmniejsz indeks, wracaj do ostatniego utworu, gdy indeks < 0
	playTrackByIndex(currentTrackIndex)
}

// Obsługa kliknięcia na przycisk Next
document.querySelector('.next-btn').addEventListener('click', playNextTrack)

// Obsługa kliknięcia na przycisk Previous
document.querySelector('.previous-btn').addEventListener('click', playPreviousTrack)

// Funkcja do obsługi kliknięcia na utwór z listy
function playTrack(event) {
	const trackElement = event.currentTarget
	const trackIndex = Array.from(trackList).indexOf(trackElement) // Pobierz indeks klikniętego utworu
	playTrackByIndex(trackIndex) // Odtwórz wybrany utwór
}

// Pobieramy wszystkie ikony play-track-icon
trackList.forEach(track => {
	track.addEventListener('click', playTrack)
})

// Funkcja do pauzowania i wznawiania utworu
function togglePlayPause() {
	const playBtn = document.querySelector('.music-player-play-btn')
	const pauseBtn = document.querySelector('.music-player-pause-btn')

	if (currentAudio) {
		if (currentAudio.paused) {
			currentAudio.play() // Wznowienie odtwarzania
			playBtn.style.display = 'none'
			pauseBtn.style.display = 'inline-block'
		} else {
			currentAudio.pause() // Pauza
			pauseBtn.style.display = 'none'
			playBtn.style.display = 'inline-block'
		}
	}
}

// Dodanie nasłuchiwania na przyciski Play i Pause w odtwarzaczu
document.querySelector('.music-player-play-btn').addEventListener('click', togglePlayPause)
document.querySelector('.music-player-pause-btn').addEventListener('click', togglePlayPause)

// Funkcja do aktualizacji paska postępu
function updateProgressBar() {
	const songProgress = document.querySelector('.song-progress')
	const currentTime = document.querySelector('.time-current')

	if (!isDragging && currentAudio && currentAudio.duration) {
		// Warunek sprawdza, czy metadane są dostępne
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
	currentVolume = volumeControl.value / 100 // Przekształcenie wartości z zakresu 0-100 na 0-1
	if (currentAudio) {
		currentAudio.volume = currentVolume // Ustawienie głośności odtwarzacza
	}
})

// Funkcja do formatowania czasu z sekund na format MM:SS
function formatTime(seconds) {
	const minutes = Math.floor(seconds / 60)
	const sec = Math.floor(seconds % 60)
	return `${minutes}:${sec < 10 ? '0' : ''}${sec}`
}

function toggleMute() {
	const speakerIcon = document.querySelector('.speaker-btn i')

	if (currentAudio) {
		isMuted = !isMuted // Zmieniamy stan wyciszenia
		currentAudio.muted = isMuted // Ustaw wyciszenie dla bieżącego utworu

		// Zmiana ikony głośnika w zależności od stanu wyciszenia
		if (isMuted) {
			speakerIcon.classList.remove('fa-volume-low')
			speakerIcon.classList.add('fa-volume-mute')
		} else {
			speakerIcon.classList.remove('fa-volume-mute')
			speakerIcon.classList.add('fa-volume-low')
		}
	}
}

// Obsługa kliknięcia na przycisk mute (głośnik)
document.querySelector('.speaker-btn').addEventListener('click', toggleMute)
