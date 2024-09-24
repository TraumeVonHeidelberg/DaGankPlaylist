// addSong.js

// Wrap the code in an IIFE to prevent global scope pollution
;(function () {
	// Elements related to the modal
	const addBtn = document.querySelector('.add-btn')
	const addSongModal = document.getElementById('addSongModal')
	const songUploadForm = document.getElementById('song-upload-form')
	const closeModalBtn = document.querySelector('.close-modal') // Przycisk zamykający modal (jeśli istnieje)
	const uploadButton = document.querySelector('#upload-button') // Przycisk upload (jeśli istnieje)

	// Function to display the modal
	function showAddSongModal() {
		addSongModal.style.display = 'flex' // Display the modal
	}

	// Function to hide the modal
	function hideAddSongModal() {
		addSongModal.style.display = 'none' // Hide the modal
		songUploadForm.reset() // Reset the form fields
		hideLoadingIndicator() // Ukryj wskaźnik ładowania
	}

	// Function to show loading indicator
	function showLoadingIndicator() {
		const loadingElement = document.querySelector('.loading-indicator')
		if (loadingElement) {
			loadingElement.style.display = 'block'
		}
	}

	// Function to hide loading indicator
	function hideLoadingIndicator() {
		const loadingElement = document.querySelector('.loading-indicator')
		if (loadingElement) {
			loadingElement.style.display = 'none'
		}
	}

	// Check if the user is logged in
	function isUserLoggedIn() {
		const storedUser = localStorage.getItem('discordUser')
		return storedUser !== null
	}

	// Event handler for the 'add-btn' click
	if (addBtn) {
		addBtn.addEventListener('click', () => {
			if (isUserLoggedIn()) {
				showAddSongModal()
			} else {
				alert('Please log in to add a song.')
			}
		})
	}

	// Event handler for the 'close modal' button (if exists)
	if (closeModalBtn) {
		closeModalBtn.addEventListener('click', hideAddSongModal)
	}

	// Close the modal when clicking outside of it
	if (addSongModal) {
		addSongModal.addEventListener('click', event => {
			if (event.target === addSongModal) {
				hideAddSongModal() // Hide the modal when clicking outside of it
			}
		})
	}

	// Handle the form submission (adding a new track)
	if (songUploadForm) {
		songUploadForm.addEventListener('submit', async event => {
			event.preventDefault() // Prevent the default form submission behavior

			// Collect data from the form
			const formData = new FormData(songUploadForm)

			// Get user data
			const storedUser = localStorage.getItem('discordUser')
			if (storedUser) {
				const user = JSON.parse(storedUser)
				formData.append('userId', user.id)
				formData.append('username', user.username)
				formData.append('avatar', user.avatar)
			} else {
				// User is not logged in
				alert('You must be logged in to add a song.')
				return
			}

			// Opcjonalnie: Walidacja pól formularza
			const songTitle = songUploadForm.querySelector('input[name="songTitle"]').value.trim()
			const songFile = songUploadForm.querySelector('input[name="songFile"]').files[0]

			if (!songTitle) {
				alert('Please enter a song title.')
				return
			}

			if (!songFile) {
				alert('Please select a song file to upload.')
				return
			}

			// Opcjonalnie: Pokaz wskaźnik ładowania
			showLoadingIndicator()

			try {
				// Send data to the API
				const response = await fetch(`${window.backendUrl}/api/tracks`, {
					method: 'POST',
					body: formData,
				})

				if (response.ok) {
					const newTrack = await response.json()
					console.log('Track added:', newTrack)
					hideAddSongModal() // Hide the modal after adding the track
					if (typeof window.loadTracks === 'function') {
						window.loadTracks(false) // Reload the tracks without setting a new default
					} else {
						console.error('window.loadTracks is not a function')
						alert('Track added, but failed to refresh the track list automatically. Please refresh the page manually.')
					}
				} else {
					console.error('Error adding track:', response.statusText)
					const errorData = await response.json()
					alert(`An error occurred while adding the track: ${errorData.error || response.statusText}`)
				}
			} catch (error) {
				console.error('Error submitting form:', error)
				alert('An error occurred while submitting the form. Please try again.')
			} finally {
				hideLoadingIndicator() // Ukryj wskaźnik ładowania niezależnie od wyniku
			}
		})
	}
})()
