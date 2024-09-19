let currentAudio = null // Stores the current audio player
let currentTrackIndex = null // Stores the index of the currently playing track
let currentVolume = 0.5 // Default volume set to 50%
let previousVolume = 0.5 // Store the volume before muting
const trackList = document.querySelectorAll('.track') // Track list
let isDragging = false // Controls the dragging of the progress slider
let isMuted = false // Tracks if the audio is muted

// Function to play the selected track by index
function playTrackByIndex(index) {
	const track = trackList[index]
	const playIcon = track.querySelector('.play-track-icon')
	const songSrc = playIcon.getAttribute('data-src') // Get the audio file path
	const songTitle = track.querySelector('.track-title').textContent // Track title
	const songImage = track.querySelector('.track-image').src // Image source

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

	currentTrackIndex = index // Set the current track index

	// If an audio is already playing, stop it before playing the new one
	if (currentAudio) {
		currentAudio.pause()
		currentAudio.currentTime = 0 // Reset the playback time
	}

	// Create a new audio element dynamically
	currentAudio = new Audio(songSrc)
	currentAudio.volume = currentVolume // Set volume to the previously saved value
	currentAudio.muted = isMuted // Set the muted state if it was previously muted

	// Reset progress bar and current time at the beginning
	const songProgress = document.querySelector('.song-progress')
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

	// Set event listener for loading metadata (e.g., duration of the track)
	currentAudio.addEventListener('loadedmetadata', function () {
		document.querySelector('.time-total').textContent = formatTime(currentAudio.duration)
	})

	// Listen for time updates and update the progress bar
	currentAudio.addEventListener('timeupdate', updateProgressBar)

	// Handle when the track ends
	currentAudio.addEventListener('ended', () => {
		// Automatically play the next track when the current one finishes
		playNextTrack()
	})
}

// Function to play the next track
function playNextTrack() {
	currentTrackIndex = (currentTrackIndex + 1) % trackList.length // Increment the index, wrap to 0 when exceeding the length
	playTrackByIndex(currentTrackIndex)
}

// Function to play the previous track
function playPreviousTrack() {
	currentTrackIndex = (currentTrackIndex - 1 + trackList.length) % trackList.length // Decrement the index, wrap to the last track when less than 0
	playTrackByIndex(currentTrackIndex)
}

// Handle clicking on the Next button
document.querySelector('.next-btn').addEventListener('click', playNextTrack)

// Handle clicking on the Previous button
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

// Add event listeners to the Play and Pause buttons
document.querySelector('.music-player-play-btn').addEventListener('click', togglePlayPause)
document.querySelector('.music-player-pause-btn').addEventListener('click', togglePlayPause)

// Function to update the progress bar
function updateProgressBar() {
	const songProgress = document.querySelector('.song-progress')
	const currentTime = document.querySelector('.time-current')

	if (!isDragging && currentAudio && currentAudio.duration) {
		// Check if metadata is available
		const progress = (currentAudio.currentTime / currentAudio.duration) * 100
		songProgress.value = progress // Set the value of the progress bar
		currentTime.textContent = formatTime(currentAudio.currentTime) // Update the current time
	}
}

// Handle dragging and changing the progress of the track
const songProgress = document.querySelector('.song-progress')
songProgress.addEventListener('input', function () {
	isDragging = true // The user is dragging the progress bar
	const newTime = (songProgress.value / 100) * currentAudio.duration // Calculate the new time
	currentAudio.currentTime = newTime // Set the new playback time
	document.querySelector('.time-current').textContent = formatTime(newTime) // Update the current time
})

songProgress.addEventListener('change', function () {
	isDragging = false // End dragging
})

// Handle changing the volume with the volume slider
const volumeControl = document.querySelector('.music-loudness')
volumeControl.addEventListener('input', function () {
	currentVolume = volumeControl.value / 100 // Convert the value from 0-100 to 0-1
	if (currentAudio) {
		currentAudio.volume = currentVolume // Set the volume of the audio player
	}

	// Update the speaker icon based on the volume
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
		isMuted = !isMuted // Toggle the mute state

		// If muting, store the current volume and set it to 0
		if (isMuted) {
			previousVolume = currentVolume // Save the current volume before muting
			currentVolume = 0 // Set volume to 0 when muted
			volumeControl.value = 0 // Update the volume slider to 0
			currentAudio.volume = 0 // Mute the audio
			speakerIcon.classList.remove('fa-volume-low', 'fa-volume-up', 'fa-volume-high')
			speakerIcon.classList.add('fa-volume-mute')
		} else {
			// Restore the previous volume when unmuted
			currentVolume = previousVolume // Restore the previous volume
			volumeControl.value = previousVolume * 100 // Update the volume slider
			currentAudio.volume = currentVolume // Set the audio volume
			updateVolumeIcon() // Restore the volume icon after unmuting
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
	const playBtn = document.querySelector('.music-player-play-btn')
	const pauseBtn = document.querySelector('.music-player-pause-btn')

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
			// For other tracks, ensure they show 'play' icon
			icon.classList.remove('fa-pause')
			icon.classList.add('fa-play')
		}
	})
}
