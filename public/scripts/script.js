// script.js

// Wrap the entire code in an IIFE to prevent global scope pollution
;(function () {
	const backendUrl = 'https://dagankplaylist.onrender.com' // Backend URL

	// Initialize variables
	let currentAudio = null // Stores the current audio player
	let currentTrackIndex = null // Index of the currently playing track
	let currentVolume = 0.5 // Default volume set to 50%
	let previousVolume = 0.5 // Store the volume before muting
	let isDragging = false // Controls the dragging of the progress slider
	let isMuted = false // Tracks if the audio is muted
	let tracks = [] // Declare tracks globally

	// Get elements
	const topPlayBtn = document.querySelector('.play-btn')
	const topPlayIcon = topPlayBtn.querySelector('.play-icon')
	const playBtn = document.querySelector('.music-player-play-btn')
	const pauseBtn = document.querySelector('.music-player-pause-btn')
	const songProgress = document.querySelector('.song-progress')
	const volumeControl = document.querySelector('.music-loudness')

	// Dynamically load the track list from the backend
	async function loadTracks() {
		try {
			const response = await fetch(`${backendUrl}/api/tracks`)
			if (!response.ok) {
				throw new Error('Failed to load tracks')
			}
			tracks = await response.json() // Assign to global tracks

			const trackList = document.querySelector('.track-list')
			trackList.innerHTML = '' // Clear the existing list

			// Populate the track list with tracks from the response
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
				// Add an event listener to play the track when clicked
				trackElement.addEventListener('click', () => playTrackByIndex(index))
				trackList.appendChild(trackElement)
			})

			updateActiveTrack() // Update the UI to reflect the currently active track
		} catch (error) {
			console.error('Error loading tracks:', error)
		}
	}

	// Function to play a selected track by index
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

		// If a track is already playing, stop it
		if (currentAudio) {
			currentAudio.pause()
			currentAudio.currentTime = 0
			currentAudio.removeEventListener('timeupdate', updateProgressBar)
			currentAudio.removeEventListener('loadedmetadata', updateDuration)
			currentAudio.removeEventListener('ended', handleTrackEnd)
		}

		currentTrackIndex = index
		const track = tracks[index]
		const songSrc = track.file
		const songTitle = track.title

		// Initialize the new audio player
		currentAudio = new Audio(songSrc)
		currentAudio.volume = currentVolume
		currentAudio.muted = isMuted

		// Reset progress bar and current time display
		songProgress.value = 0
		document.querySelector('.time-current').textContent = '0:00'
		document.querySelector('.time-total').textContent = '0:00'

		// Play the track
		currentAudio.play()

		// Update the UI for the music player
		document.querySelector('.music-player-song-title').textContent = songTitle
		document.querySelector('.music-player-img').src = './img/da gank members/me.webp' // Placeholder for image

		// Update track and play/pause buttons
		updateActiveTrack()
		updatePlayPauseButtons(true)

		// Set event listeners for the audio player
		currentAudio.addEventListener('loadedmetadata', updateDuration)
		currentAudio.addEventListener('timeupdate', updateProgressBar)
		currentAudio.addEventListener('ended', handleTrackEnd)
	}

	// Update the total track duration display
	function updateDuration() {
		if (currentAudio && currentAudio.duration) {
			document.querySelector('.time-total').textContent = formatTime(currentAudio.duration)
		}
	}

	// Handle when a track ends
	function handleTrackEnd() {
		playNextTrack()
	}

	// Play the next track in the list
	function playNextTrack() {
		if (tracks.length === 0) return
		let nextIndex = (currentTrackIndex + 1) % tracks.length
		playTrackByIndex(nextIndex)
	}

	// Play the previous track in the list
	function playPreviousTrack() {
		if (tracks.length === 0) return
		let prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length
		playTrackByIndex(prevIndex)
	}

	// Toggle play/pause functionality
	function togglePlayPause() {
		if (currentAudio) {
			if (currentAudio.paused) {
				currentAudio.play()
				updatePlayPauseButtons(true)
			} else {
				currentAudio.pause()
				updatePlayPauseButtons(false)
			}
		} else if (tracks.length > 0) {
			playTrackByIndex(0)
		}
	}

	// Update the progress bar as the track plays
	function updateProgressBar() {
		const currentTime = document.querySelector('.time-current')

		if (!isDragging && currentAudio && currentAudio.duration) {
			const progress = (currentAudio.currentTime / currentAudio.duration) * 100
			songProgress.value = progress
			currentTime.textContent = formatTime(currentAudio.currentTime)
		}
	}

	// Handle dragging and changing the progress of the track
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

	// Handle changing the volume with the volume slider
	volumeControl.addEventListener('input', function () {
		currentVolume = volumeControl.value / 100
		if (currentAudio) {
			currentAudio.volume = currentVolume
		}
		updateVolumeIcon()
	})

	// Format seconds into MM:SS
	function formatTime(seconds) {
		const minutes = Math.floor(seconds / 60)
		const sec = Math.floor(seconds % 60)
		return `${minutes}:${sec < 10 ? '0' : ''}${sec}`
	}

	// Toggle mute on/off
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

	// Update the speaker icon based on the current volume
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

	// Update the active track title and play/pause icons
	function updateActiveTrack() {
		const trackList = document.querySelectorAll('.track')
		trackList.forEach(track => {
			const title = track.querySelector('.track-title')
			title.classList.remove('active')

			const icon = track.querySelector('.play-track-icon')
			icon.classList.remove('fa-pause')
			icon.classList.add('fa-play')
		})

		if (currentTrackIndex !== null && trackList[currentTrackIndex]) {
			const currentTrack = trackList[currentTrackIndex]
			const title = currentTrack.querySelector('.track-title')
			title.classList.add('active')

			const icon = currentTrack.querySelector('.play-track-icon')
			icon.classList.remove('fa-play')
			icon.classList.add('fa-pause')
		}
	}

	// Update play/pause buttons in the music player and track list
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

	// Expose loadTracks globally so it can be called from other scripts
	window.loadTracks = loadTracks

	// Load tracks and handle user login on page load
	window.addEventListener('DOMContentLoaded', () => {
		handleUserLogin()
		loadTracks() // Load the tracks after the page is fully loaded

		// Add event listeners after DOM content is loaded
		const nextBtn = document.querySelector('.next-btn')
		const prevBtn = document.querySelector('.previous-btn')
		const speakerBtn = document.querySelector('.speaker-btn')
		const loginBtn = document.querySelector('.log-in-btn')

		if (nextBtn) {
			nextBtn.addEventListener('click', playNextTrack)
		}

		if (prevBtn) {
			prevBtn.addEventListener('click', playPreviousTrack)
		}

		if (playBtn) {
			playBtn.addEventListener('click', togglePlayPause)
		}

		if (pauseBtn) {
			pauseBtn.addEventListener('click', togglePlayPause)
		}

		if (topPlayBtn) {
			topPlayBtn.addEventListener('click', function () {
				if (currentTrackIndex === null) {
					if (tracks.length > 0) {
						playTrackByIndex(0)
					}
				} else {
					togglePlayPause()
				}
			})
		}

		if (speakerBtn) {
			speakerBtn.addEventListener('click', toggleMute)
		}

		if (loginBtn) {
			loginBtn.addEventListener('click', () => {
				window.location.href = `${backendUrl}/auth/discord`
			})
		}
	})
})()
