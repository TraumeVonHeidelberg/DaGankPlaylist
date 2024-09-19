let currentAudio = null; // Przechowuje odtwarzacz audio

// Funkcja do odtwarzania wybranego utworu
function playTrack(event) {
    const playIcon = event.currentTarget;
    const songSrc = playIcon.getAttribute('data-src'); // Pobierz ścieżkę do pliku audio
    const songTitle = playIcon.nextElementSibling.nextElementSibling.textContent; // Tytuł utworu
    const songImage = playIcon.nextElementSibling.src; // Ścieżka do obrazka

    // Sprawdź, czy istnieje już audio - jeśli tak, zatrzymaj go przed odtwarzaniem nowego utworu
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0; // Resetuj czas odtwarzania
    }

    // Tworzenie nowego elementu audio dynamicznie
    currentAudio = new Audio(songSrc);
    currentAudio.play();

    // Aktualizacja UI odtwarzacza
    document.querySelector('.music-player-song-title').textContent = songTitle;
    document.querySelector('.music-player-img').src = songImage;

    // Obsługa zdarzeń, takich jak zakończenie utworu
    currentAudio.addEventListener('ended', () => {
        playIcon.classList.remove('fa-pause');
        playIcon.classList.add('fa-play');
    });

    // Zmiana ikony play na pause
    playIcon.classList.remove('fa-play');
    playIcon.classList.add('fa-pause');
}

// Pobieramy wszystkie ikony play-track-icon
const playIcons = document.querySelectorAll('.play-track-icon');

// Dodajemy nasłuchiwanie kliknięcia dla każdej ikony
playIcons.forEach(icon => {
    icon.addEventListener('click', playTrack);
});
