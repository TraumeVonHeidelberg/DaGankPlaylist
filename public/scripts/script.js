// Initialize variables
let currentAudio = null // Stores the current audio player
let currentTrackIndex = null // Index of the currently playing track
let currentVolume = 0.5 // Default volume set to 50%
let previousVolume = 0.5 // Store the volume before muting
let isDragging = false // Controls the dragging of the progress slider
let isMuted = false // Tracks if the audio is muted

// Get elements
const trackList = document.querySelectorAll('.track') // List of tracks
const topPlayBtn = document.querySelector('.play-btn')
const topPlayIcon = topPlayBtn.querySelector('.play-icon')
const playBtn = document.querySelector('.music-player-play-btn')
const pauseBtn = document.querySelector('.music-player-pause-btn')
const songProgress = document.querySelector('.song-progress')
const volumeControl = document.querySelector('.music-loudness')

// Function to play the selected track by index
function playTrackByIndex(index) {
	// Check if the clicked track is the same as the current and if it's playing
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

	// If an audio is already playing, stop it before playing the new one
	if (currentAudio) {
		currentAudio.pause()
		currentAudio.currentTime = 0 // Reset the playback time
		currentAudio.removeEventListener('timeupdate', updateProgressBar)
		currentAudio.removeEventListener('loadedmetadata', updateDuration)
		currentAudio.removeEventListener('ended', handleTrackEnd)
	}

	currentTrackIndex = index // Set the current track index

	const track = trackList[index]
	const playIcon = track.querySelector('.play-track-icon')
	const songSrc = playIcon.getAttribute('data-src') // Get the audio file path
	const songTitle = track.querySelector('.track-title').textContent // Track title
	const songImage = track.querySelector('.track-image').src // Image source

	// Create a new audio element
	currentAudio = new Audio(songSrc)
	currentAudio.volume = currentVolume // Set volume to the previously saved value
	currentAudio.muted = isMuted // Set the muted state if it was previously muted

	// Reset progress bar and current time at the beginning
	songProgress.value = 0
	document.querySelector('.time-current').textContent = '0:00'
	document.querySelector('.time-total').textContent = '0:00' // Reset total time

	// Play the track
	currentAudio.play()

	// Update the UI of the music player
	document.querySelector('.music-player-song-title').textContent = songTitle
	document.querySelector('.music-player-img').src = songImage

	// Update active track and play/pause buttons
	updateActiveTrack()
	updatePlayPauseButtons(true)

	// Set event listeners
	currentAudio.addEventListener('loadedmetadata', updateDuration)
	currentAudio.addEventListener('timeupdate', updateProgressBar)
	currentAudio.addEventListener('ended', handleTrackEnd)
}

// Update the total duration display
function updateDuration() {
	document.querySelector('.time-total').textContent = formatTime(currentAudio.duration)
}

// Handle when the track ends
function handleTrackEnd() {
	playNextTrack()
}

// Function to play the next track
function playNextTrack() {
	let nextIndex = (currentTrackIndex + 1) % trackList.length // Wrap around to the first track
	playTrackByIndex(nextIndex)
}

// Function to play the previous track
function playPreviousTrack() {
	let prevIndex = (currentTrackIndex - 1 + trackList.length) % trackList.length // Wrap around to the last track
	playTrackByIndex(prevIndex)
}

// Event listeners for Next and Previous buttons
document.querySelector('.next-btn').addEventListener('click', playNextTrack)
document.querySelector('.previous-btn').addEventListener('click', playPreviousTrack)

// Function to handle clicking on a track from the list
function playTrack(event) {
	const trackElement = event.currentTarget
	const trackIndex = Array.from(trackList).indexOf(trackElement) // Get the index of the clicked track
	playTrackByIndex(trackIndex)
}

// Add event listeners to each track for clicking
trackList.forEach(track => {
	track.addEventListener('click', playTrack)
})

// Function to pause or resume the track
function togglePlayPause() {
	if (currentAudio) {
		if (currentAudio.paused) {
			currentAudio.play() // Resume playing
			updatePlayPauseButtons(true)
		} else {
			currentAudio.pause() // Pause the audio
			updatePlayPauseButtons(false)
		}
	}
}

// Event listeners for Play and Pause buttons
playBtn.addEventListener('click', togglePlayPause)
pauseBtn.addEventListener('click', togglePlayPause)

// Function to update the progress bar
function updateProgressBar() {
	const currentTime = document.querySelector('.time-current')

	if (!isDragging && currentAudio && currentAudio.duration) {
		const progress = (currentAudio.currentTime / currentAudio.duration) * 100
		songProgress.value = progress // Update the progress bar
		currentTime.textContent = formatTime(currentAudio.currentTime) // Update current time display
	}
}

// Handle dragging and changing the progress of the track
songProgress.addEventListener('input', function () {
	isDragging = true // User is dragging the progress bar
	if (currentAudio && currentAudio.duration) {
		const newTime = (songProgress.value / 100) * currentAudio.duration
		currentAudio.currentTime = newTime
		document.querySelector('.time-current').textContent = formatTime(newTime)
	}
})

songProgress.addEventListener('change', function () {
	isDragging = false // User has finished dragging
})

// Handle changing the volume with the volume slider
volumeControl.addEventListener('input', function () {
	currentVolume = volumeControl.value / 100 // Convert value to 0-1
	if (currentAudio) {
		currentAudio.volume = currentVolume
	}
	updateVolumeIcon()
})

// Function to format seconds into MM:SS
function formatTime(seconds) {
	const minutes = Math.floor(seconds / 60)
	const sec = Math.floor(seconds % 60)
	return `${minutes}:${sec < 10 ? '0' : ''}${sec}`
}

// Function to toggle mute on/off
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

// Add event listener to the mute button (speaker icon)
document.querySelector('.speaker-btn').addEventListener('click', toggleMute)

// Function to update the active track title and play/pause icons
function updateActiveTrack() {
	// Remove 'active' class from all track titles and reset play icons
	trackList.forEach(track => {
		const title = track.querySelector('.track-title')
		title.classList.remove('active')

		const icon = track.querySelector('.play-track-icon')
		icon.classList.remove('fa-pause')
		icon.classList.add('fa-play')
	})

	// Add 'active' class to the selected track's title
	const currentTrack = trackList[currentTrackIndex]
	const title = currentTrack.querySelector('.track-title')
	title.classList.add('active')
}

// Function to update play/pause buttons in the music player and track list
function updatePlayPauseButtons(isPlaying) {
	if (isPlaying) {
		playBtn.style.display = 'none'
		pauseBtn.style.display = 'inline-block'
	} else {
		pauseBtn.style.display = 'none'
		playBtn.style.display = 'inline-block'
	}

	// Update the play/pause icon in the track list
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

	// Update the top play button icon
	if (isPlaying) {
		topPlayIcon.classList.remove('fa-play')
		topPlayIcon.classList.add('fa-pause')
	} else {
		topPlayIcon.classList.remove('fa-pause')
		topPlayIcon.classList.add('fa-play')
	}
}

// Add event listener to the top play button
topPlayBtn.addEventListener('click', function () {
	// If no track is selected yet, play the first track
	if (currentTrackIndex === null) {
		playTrackByIndex(0)
	} else {
		// Toggle play/pause of the current track
		togglePlayPause()
	}
})
