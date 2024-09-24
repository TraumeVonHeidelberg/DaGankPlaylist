// script.js

// Wrap the entire code in an IIFE to prevent global scope pollution
;(function () {
	const backendUrl = 'https://dagankplaylist.onrender.com' // Backend URL
	window.backendUrl = backendUrl;
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
	const topPlayIcon = topPlayBtn ? topPlayBtn.querySelector('.play-icon') : null
	const playBtn = document.querySelector('.music-player-play-btn')
	const pauseBtn = document.querySelector('.music-player-pause-btn')
	const songProgress = document.querySelector('.song-progress')
	const volumeControl = document.querySelector('.music-loudness')
	const addBtn = document.querySelector('.add-btn') // The "Add Song" button

	// Function to handle user login and update the UI
	function handleUserLogin() {
		const urlParams = new URLSearchParams(window.location.search)
		const username = urlParams.get('username')
		const avatar = urlParams.get('avatar')
		const id = urlParams.get('id')

		// Check if there is user data in the URL
		if (username && avatar && id) {
			// Save user data in localStorage for future sessions
			localStorage.setItem('discordUser', JSON.stringify({ username, avatar, id }))

			// Remove URL parameters
			window.history.replaceState({}, document.title, window.location.pathname)
		}

		// Check if there is user data in localStorage
		const storedUser = localStorage.getItem('discordUser')
		const loginBtns = document.querySelector('.login-btns')

		if (storedUser) {
			const user = JSON.parse(storedUser)

			// Replace login buttons with the user's profile picture
			if (loginBtns) {
				loginBtns.innerHTML = `
                    <img class="nav-img" src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" alt="${user.username}">
                `
			}

			// Show the "Add Song" button
			if (addBtn) {
				addBtn.style.display = 'inline-block'
			}
		} else {
			// User is not logged in
			if (loginBtns) {
				loginBtns.innerHTML = `
                    <button class="main-btn log-in-btn">Log in</button>
                `
				// Add event listener to the login button
				const loginBtn = loginBtns.querySelector('.log-in-btn')
				if (loginBtn) {
					loginBtn.addEventListener('click', () => {
						window.location.href = `${backendUrl}/auth/discord`
					})
				}
			}

			// Hide the "Add Song" button
			if (addBtn) {
				addBtn.style.display = 'none'
			}
		}
	}

	// Function to format seconds into MM:SS
	function formatTime(seconds) {
		const minutes = Math.floor(seconds / 60)
		const sec = Math.floor(seconds % 60)
		return `${minutes}:${sec < 10 ? '0' : ''}${sec}`
	}

	// Function to update the volume icon based on the current volume
	function updateVolumeIcon() {
		const speakerIcon = document.querySelector('.speaker-btn i')
		if (!speakerIcon) return

		if (currentVolume === 0 || isMuted) {
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

	// Function to toggle mute on/off
	function toggleMute() {
		const speakerIcon = document.querySelector('.speaker-btn i')
		if (!speakerIcon) return

		if (currentAudio) {
			isMuted = !isMuted

			if (isMuted) {
				previousVolume = currentVolume
				currentVolume = 0
				volumeControl.value = 0
				currentAudio.volume = 0
				updateVolumeIcon()
			} else {
				currentVolume = previousVolume
				volumeControl.value = previousVolume * 100
				currentAudio.volume = currentVolume
				updateVolumeIcon()
			}
		}
	}

	// Function to update the duration display
	function updateDuration() {
		if (currentAudio && currentAudio.duration) {
			document.querySelector('.time-total').textContent = formatTime(currentAudio.duration)
		}
	}

	// Function to update the progress bar
	function updateProgressBar() {
		const currentTimeDisplay = document.querySelector('.time-current')
		if (!currentTimeDisplay) return

		if (!isDragging && currentAudio && currentAudio.duration) {
			const progress = (currentAudio.currentTime / currentAudio.duration) * 100
			songProgress.value = progress
			currentTimeDisplay.textContent = formatTime(currentAudio.currentTime)
		}
	}

	// Function to handle when a track ends
	function handleTrackEnd() {
		playNextTrack()
	}

	// Function to play the next track in the list
	function playNextTrack() {
		if (tracks.length === 0) return
		let nextIndex = (currentTrackIndex + 1) % tracks.length
		playTrackByIndex(nextIndex)
	}

	// Function to play the previous track in the list
	function playPreviousTrack() {
		if (tracks.length === 0) return
		let prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length
		playTrackByIndex(prevIndex)
	}

	// Function to toggle play/pause functionality
	function togglePlayPause() {
		if (currentAudio) {
			if (currentAudio.paused) {
				currentAudio
					.play()
					.then(() => {
						updatePlayPauseButtons(true)
					})
					.catch(error => {
						console.error('Error playing audio:', error)
					})
			} else {
				currentAudio.pause()
				updatePlayPauseButtons(false)
			}
		} else if (tracks.length > 0) {
			playTrackByIndex(0)
		}
	}

	// Function to update play/pause buttons in the music player and track list
	function updatePlayPauseButtons(isPlaying) {
		if (isPlaying) {
			if (playBtn) playBtn.style.display = 'none'
			if (pauseBtn) pauseBtn.style.display = 'inline-block'
		} else {
			if (pauseBtn) pauseBtn.style.display = 'none'
			if (playBtn) playBtn.style.display = 'inline-block'
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

		if (topPlayIcon) {
			if (isPlaying) {
				topPlayIcon.classList.remove('fa-play')
				topPlayIcon.classList.add('fa-pause')
			} else {
				topPlayIcon.classList.remove('fa-pause')
				topPlayIcon.classList.add('fa-play')
			}
		}
	}

	// Function to update the active track title and play/pause icons
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

	// Function to play a selected track by index
	function playTrackByIndex(index) {
		if (currentTrackIndex === index && currentAudio) {
			if (currentAudio.paused) {
				currentAudio
					.play()
					.then(() => {
						updatePlayPauseButtons(true)
					})
					.catch(error => {
						console.error('Error playing audio:', error)
					})
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
			currentAudio.removeEventListener('error', handleAudioError)
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
		const currentTimeDisplay = document.querySelector('.time-current')
		const totalTimeDisplay = document.querySelector('.time-total')
		if (currentTimeDisplay) currentTimeDisplay.textContent = '0:00'
		if (totalTimeDisplay) totalTimeDisplay.textContent = '0:00'

		// Update the UI for the music player
		const songTitleElement = document.querySelector('.music-player-song-title')
		if (songTitleElement) {
			songTitleElement.textContent = songTitle
		}

		// Update the player image to the track image
		const musicPlayerImg = document.querySelector('.music-player-img')
		let trackImageSrc = './img/default-track-image.png' // Default image
		if (track.addedBy && track.addedBy.id && track.addedBy.avatar) {
			trackImageSrc = `https://cdn.discordapp.com/avatars/${track.addedBy.id}/${track.addedBy.avatar}.png`
		}
		if (musicPlayerImg) {
			musicPlayerImg.src = trackImageSrc
			musicPlayerImg.alt = track.addedBy ? track.addedBy.username : 'Track image'
		}

		// Update active track in the track list
		updateActiveTrack()

		// Add event listeners for the audio player
		currentAudio.addEventListener('loadedmetadata', updateDuration)
		currentAudio.addEventListener('timeupdate', updateProgressBar)
		currentAudio.addEventListener('ended', handleTrackEnd)
		currentAudio.addEventListener('error', handleAudioError)

		// Play the track with enhanced error handling
		currentAudio
			.play()
			.then(() => {
				updatePlayPauseButtons(true)
			})
			.catch(error => {
				console.error('Error playing audio:', error)
				alert(`Cannot play the track "${songTitle}". It might be missing or corrupted.`)
				playNextTrack()
			})
	}

	// Function to handle audio load errors
	function handleAudioError() {
		if (currentTrackIndex !== null) {
			const track = tracks[currentTrackIndex]
			console.error(`Failed to load audio for track: ${track.title} (${track.file})`)
			alert(`Failed to load the track "${track.title}". Skipping to the next track.`)
			playNextTrack()
		}
	}

	// Function to test if an audio file can be loaded
	function testAudioFile(url) {
		return new Promise((resolve, reject) => {
			const audio = new Audio()
			audio.src = url
			audio.addEventListener('canplaythrough', () => {
				resolve(true)
			})
			audio.addEventListener('error', () => {
				reject(new Error('Audio file cannot be loaded.'))
			})
		})
	}

	// Function to set the first valid track as default in the music player
	async function setDefaultTrack() {
		// Only set default track if no track is currently playing
		if (currentTrackIndex !== null) return

		for (let i = 0; i < tracks.length; i++) {
			const track = tracks[i]
			const songSrc = track.file

			try {
				// Attempt to load the audio file
				await testAudioFile(songSrc)
				// If successful, set it as the default track without autoplaying
				currentTrackIndex = i
				// Update the UI to reflect the selected track
				updateActiveTrack()
				break // Exit the loop after setting the default track
			} catch (error) {
				console.warn(`Track is invalid: ${track.title} (${songSrc})`)
				// Continue to the next track
			}
		}

		if (currentTrackIndex === null) {
			console.error('No valid tracks available.')
			// Optionally, display a message to the user
			const musicPlayerTitle = document.querySelector('.music-player-song-title')
			if (musicPlayerTitle) {
				musicPlayerTitle.textContent = 'No tracks available'
			}
			const musicPlayerImg = document.querySelector('.music-player-img')
			if (musicPlayerImg) {
				musicPlayerImg.src = './img/default-track-image.png' // Set to default image
			}
		}
	}

	// Function to populate the track list and set the first valid track as default
	async function loadTracks(setDefault = false) {
		try {
			// Save current track ID if a track is playing
			let currentTrackId = null
			if (currentTrackIndex !== null && tracks[currentTrackIndex]) {
				currentTrackId = tracks[currentTrackIndex]._id
			}

			const response = await fetch(`${backendUrl}/api/tracks`)
			if (!response.ok) {
				throw new Error('Failed to load tracks')
			}
			tracks = await response.json() // Assign to global tracks

			const trackList = document.querySelector('.track-list')
			if (!trackList) {
				console.error('Track list element not found in the DOM.')
				return
			}
			trackList.innerHTML = '' // Clear the existing list

			// No array reversal, maintain insertion order
			tracks.forEach((track, index) => {
				const trackElement = document.createElement('li')
				trackElement.classList.add('track')

				// Get the track image source
				let trackImageSrc = './img/default-track-image.png' // Default image
				if (track.addedBy && track.addedBy.id && track.addedBy.avatar) {
					trackImageSrc = `https://cdn.discordapp.com/avatars/${track.addedBy.id}/${track.addedBy.avatar}.png`
				}

				trackElement.innerHTML = `
                    <div class="track-main-info">
                        <span class="track-number">${index + 1}</span>
                        <i class="play-track-icon fa-solid fa-play" data-id="${track._id}"></i>
                        <img class="track-image" src="${trackImageSrc}" alt="${
					track.addedBy ? track.addedBy.username : 'Track image'
				}">
                        <span class="track-title">${track.title}</span>
                    </div>
                    <span class="track-plays">${track.plays}</span>
                    <span class="track-duration">${track.duration}</span>
                `
				// Add an event listener to play the track when play icon is clicked
				const playIcon = trackElement.querySelector('.play-track-icon')
				if (playIcon) {
					playIcon.addEventListener('click', event => {
						event.stopPropagation() // Prevent the click from bubbling up to the li
						const trackId = event.target.getAttribute('data-id')
						const index = tracks.findIndex(t => t._id === trackId)
						if (index !== -1) {
							playTrackByIndex(index)
						}
					})
				}

				// Add an event listener to the entire li to play the track
				trackElement.addEventListener('click', () => {
					playTrackByIndex(index)
				})

				trackList.appendChild(trackElement)
			})

			// After loading tracks, set currentTrackIndex to the saved track ID's index
			if (!setDefault && currentTrackId) {
				const newIndex = tracks.findIndex(track => track._id === currentTrackId)
				if (newIndex !== -1) {
					currentTrackIndex = newIndex
					updateActiveTrack() // Update the UI
				} else {
					// If the current track is not found, reset currentTrackIndex
					currentTrackIndex = null
				}
			}

			// If setDefault is true and no track is playing, set the first track as default
			if (setDefault && currentTrackIndex === null && tracks.length > 0) {
				await setDefaultTrack()
			}
		} catch (error) {
			console.error('Error loading tracks:', error)
			alert('Failed to load tracks. Please try again later.')
		}
	}

	// Event listener for the "Add Song" button (optional)
	if (addBtn) {
		addBtn.addEventListener('click', () => {
			// Implement your "Add Song" functionality here
			// For example, open a modal or redirect to an upload page
			console.log('Add Song button clicked.')
		})
	}

	// Handle dragging and changing the progress of the track
	if (songProgress) {
		songProgress.addEventListener('input', function () {
			isDragging = true
			if (currentAudio && currentAudio.duration) {
				const newTime = (songProgress.value / 100) * currentAudio.duration
				currentAudio.currentTime = newTime
				const currentTimeDisplay = document.querySelector('.time-current')
				if (currentTimeDisplay) {
					currentTimeDisplay.textContent = formatTime(newTime)
				}
			}
		})

		songProgress.addEventListener('change', function () {
			isDragging = false
		})
	}

	// Handle changing the volume with the volume slider
	if (volumeControl) {
		volumeControl.addEventListener('input', function () {
			currentVolume = volumeControl.value / 100
			if (currentAudio) {
				currentAudio.volume = currentVolume
			}
			updateVolumeIcon()
		})
	}

	// Handle mute button click
	const speakerBtn = document.querySelector('.speaker-btn')
	if (speakerBtn) {
		speakerBtn.addEventListener('click', toggleMute)
	}

	// Handle play/pause button clicks
	if (playBtn) {
		playBtn.addEventListener('click', togglePlayPause)
	}

	if (pauseBtn) {
		pauseBtn.addEventListener('click', togglePlayPause)
	}

	// Handle top play button click
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

	// Handle next and previous buttons
	const nextBtn = document.querySelector('.next-btn')
	const prevBtn = document.querySelector('.previous-btn')

	if (nextBtn) {
		nextBtn.addEventListener('click', playNextTrack)
	}

	if (prevBtn) {
		prevBtn.addEventListener('click', playPreviousTrack)
	}

	// Expose loadTracks to the global window object
	window.loadTracks = loadTracks

	// Handle user login and load tracks on page load
	window.addEventListener('DOMContentLoaded', () => {
		handleUserLogin()
		loadTracks(true) // Load the tracks and set the default track on initial page load

		// Additional event listeners are already set up above
	})
})()
