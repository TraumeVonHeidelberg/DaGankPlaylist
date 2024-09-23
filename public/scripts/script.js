const backendUrl = 'https://dagankplaylist.onrender.com' // URL backendu

// Initialize variables
let currentAudio = null // Stores the current audio player
let currentTrackIndex = null // Index of the currently playing track
let currentVolume = 0.5 // Default volume set to 50%
let previousVolume = 0.5 // Store the volume before muting
let isDragging = false // Controls the dragging of the progress slider
let isMuted = false // Tracks if the audio is muted

// Get elements
const topPlayBtn = document.querySelector('.play-btn')
const topPlayIcon = topPlayBtn.querySelector('.play-icon')
const playBtn = document.querySelector('.music-player-play-btn')
const pauseBtn = document.querySelector('.music-player-pause-btn')
const songProgress = document.querySelector('.song-progress')
const volumeControl = document.querySelector('.music-loudness')

// Dynamic loading of track list
async function loadTracks() {
	try {
		const response = await fetch('/api/tracks')
		const tracks = await response.json()

		const trackList = document.querySelector('.track-list')
		trackList.innerHTML = '' // Clear existing list

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
                <span class="track-plays">${track.plays}</span>
                <span class="track-duration">${track.duration}</span>
            `
			trackElement.addEventListener('click', () => playTrackByIndex(index))
			trackList.appendChild(trackElement)
		})
	} catch (error) {
		console.error('Error loading tracks:', error)
	}
}

// Function to play the selected track by index
function playTrackByIndex(index) {
	if (currentTrackIndex === index && currentAudio) {
		if (currentAudio.paused) {
			currentAudio.play()
			updatePlayPauseButtons(true)
		} else {
			currentAudio.pause()
			updatePlayPauseButtons(false)
		}
		return
	}

	if (currentAudio) {
		currentAudio.pause()
		currentAudio.currentTime = 0
		currentAudio.removeEventListener('timeupdate', updateProgressBar)
		currentAudio.removeEventListener('loadedmetadata', updateDuration)
		currentAudio.removeEventListener('ended', handleTrackEnd)
	}

	currentTrackIndex = index

	const track = document.querySelectorAll('.track')[index]
	const playIcon = track.querySelector('.play-track-icon')
	const songSrc = playIcon.getAttribute('data-src')
	const songTitle = track.querySelector('.track-title').textContent
	const songImage = track.querySelector('.track-image').src

	currentAudio = new Audio(songSrc)
	currentAudio.volume = currentVolume
	currentAudio.muted = isMuted

	songProgress.value = 0
	document.querySelector('.time-current').textContent = '0:00'
	document.querySelector('.time-total').textContent = '0:00'

	currentAudio.play()

	document.querySelector('.music-player-song-title').textContent = songTitle
	document.querySelector('.music-player-img').src = songImage

	updateActiveTrack()
	updatePlayPauseButtons(true)

	currentAudio.addEventListener('loadedmetadata', updateDuration)
	currentAudio.addEventListener('timeupdate', updateProgressBar)
	currentAudio.addEventListener('ended', handleTrackEnd)
}

function updateDuration() {
	document.querySelector('.time-total').textContent = formatTime(currentAudio.duration)
}

function handleTrackEnd() {
	playNextTrack()
}

function playNextTrack() {
	let nextIndex = (currentTrackIndex + 1) % document.querySelectorAll('.track').length
	playTrackByIndex(nextIndex)
}

function playPreviousTrack() {
	let prevIndex =
		(currentTrackIndex - 1 + document.querySelectorAll('.track').length) % document.querySelectorAll('.track').length
	playTrackByIndex(prevIndex)
}

// Event listeners for Next and Previous buttons
document.querySelector('.next-btn').addEventListener('click', playNextTrack)
document.querySelector('.previous-btn').addEventListener('click', playPreviousTrack)

function togglePlayPause() {
	if (currentAudio) {
		if (currentAudio.paused) {
			currentAudio.play()
			updatePlayPauseButtons(true)
		} else {
			currentAudio.pause()
			updatePlayPauseButtons(false)
		}
	}
}

playBtn.addEventListener('click', togglePlayPause)
pauseBtn.addEventListener('click', togglePlayPause)

function updateProgressBar() {
	const currentTime = document.querySelector('.time-current')

	if (!isDragging && currentAudio && currentAudio.duration) {
		const progress = (currentAudio.currentTime / currentAudio.duration) * 100
		songProgress.value = progress
		currentTime.textContent = formatTime(currentAudio.currentTime)
	}
}

songProgress.addEventListener('input', function () {
	isDragging = true
	if (currentAudio && currentAudio.duration) {
		const newTime = (songProgress.value / 100) * currentAudio.duration
		currentAudio.currentTime = newTime
		document.querySelector('.time-current').textContent = formatTime(newTime)
	}
})

songProgress.addEventListener('change', function () {
	isDragging = false
})

volumeControl.addEventListener('input', function () {
	currentVolume = volumeControl.value / 100
	if (currentAudio) {
		currentAudio.volume = currentVolume
	}
	updateVolumeIcon()
})

function formatTime(seconds) {
	const minutes = Math.floor(seconds / 60)
	const sec = Math.floor(seconds % 60)
	return `${minutes}:${sec < 10 ? '0' : ''}${sec}`
}

function toggleMute() {
	const speakerIcon = document.querySelector('.speaker-btn i')

	if (currentAudio) {
		isMuted = !isMuted

		if (isMuted) {
			previousVolume = currentVolume
			currentVolume = 0
			volumeControl.value = 0
			currentAudio.volume = 0
			speakerIcon.classList.remove('fa-volume-low', 'fa-volume-up', 'fa-volume-high')
			speakerIcon.classList.add('fa-volume-mute')
		} else {
			currentVolume = previousVolume
			volumeControl.value = previousVolume * 100
			currentAudio.volume = currentVolume
			updateVolumeIcon()
		}
	}
}

function updateVolumeIcon() {
	const speakerIcon = document.querySelector('.speaker-btn i')

	if (currentVolume === 0) {
		speakerIcon.classList.remove('fa-volume-low', 'fa-volume-up', 'fa-volume-high')
		speakerIcon.classList.add('fa-volume-mute')
	} else if (currentVolume > 0 && currentVolume <= 0.33) {
		speakerIcon.classList.remove('fa-volume-mute', 'fa-volume-up', 'fa-volume-high')
		speakerIcon.classList.add('fa-volume-low')
	} else if (currentVolume > 0.33 && currentVolume <= 0.66) {
		speakerIcon.classList.remove('fa-volume-mute', 'fa-volume-low', 'fa-volume-high')
		speakerIcon.classList.add('fa-volume-up')
	} else {
		speakerIcon.classList.remove('fa-volume-mute', 'fa-volume-low', 'fa-volume-up')
		speakerIcon.classList.add('fa-volume-high')
	}
}

document.querySelector('.speaker-btn').addEventListener('click', toggleMute)

function updateActiveTrack() {
	const trackList = document.querySelectorAll('.track')
	trackList.forEach(track => {
		const title = track.querySelector('.track-title')
		title.classList.remove('active')

		const icon = track.querySelector('.play-track-icon')
		icon.classList.remove('fa-pause')
		icon.classList.add('fa-play')
	})

	const currentTrack = trackList[currentTrackIndex]
	const title = currentTrack.querySelector('.track-title')
	title.classList.add('active')
}

function updatePlayPauseButtons(isPlaying) {
	if (isPlaying) {
		playBtn.style.display = 'none'
		pauseBtn.style.display = 'inline-block'
	} else {
		pauseBtn.style.display = 'none'
		playBtn.style.display = 'inline-block'
	}

	const trackList = document.querySelectorAll('.track')
	trackList.forEach((track, index) => {
		const icon = track.querySelector('.play-track-icon')
		if (index === currentTrackIndex) {
			if (isPlaying) {
				icon.classList.remove('fa-play')
				icon.classList.add('fa-pause')
			} else {
				icon.classList.remove('fa-pause')
				icon.classList.add('fa-play')
			}
		} else {
			icon.classList.remove('fa-pause')
			icon.classList.add('fa-play')
		}
	})

	if (isPlaying) {
		topPlayIcon.classList.remove('fa-play')
		topPlayIcon.classList.add('fa-pause')
	} else {
		topPlayIcon.classList.remove('fa-pause')
		topPlayIcon.classList.add('fa-play')
	}
}

topPlayBtn.addEventListener('click', function () {
	if (currentTrackIndex === null) {
		playTrackByIndex(0)
	} else {
		togglePlayPause()
	}
})

// Discord login functionality
function handleUserLogin() {
	const urlParams = new URLSearchParams(window.location.search)
	const username = urlParams.get('username')
	const avatar = urlParams.get('avatar')
	const id = urlParams.get('id')

	if (username && avatar && id) {
		localStorage.setItem('discordUser', JSON.stringify({ username, avatar, id }))
		window.history.replaceState({}, document.title, window.location.pathname)
	}

	const storedUser = localStorage.getItem('discordUser')
	if (storedUser) {
		const user = JSON.parse(storedUser)
		const loginBtns = document.querySelector('.login-btns')
		if (loginBtns) {
			loginBtns.innerHTML = `
                <img class="nav-img" src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" alt="${user.username}">
            `
		}
	}
}

document.querySelector('.log-in-btn').addEventListener('click', () => {
	window.location.href = `${backendUrl}/auth/discord`
})

window.addEventListener('DOMContentLoaded', () => {
	handleUserLogin()
	loadTracks()
})
