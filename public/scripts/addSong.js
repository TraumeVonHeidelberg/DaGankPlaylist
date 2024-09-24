// addSong.js

// Wrap the code in an IIFE to prevent global scope pollution
;(function () {
	// Elements related to the modal
	const addBtn = document.querySelector('.add-btn')
	const addSongModal = document.getElementById('addSongModal')
	const songUploadForm = document.getElementById('song-upload-form')

	// Function to display the modal
	function showAddSongModal() {
		addSongModal.style.display = 'flex' // Display the modal
	}

	// Function to hide the modal
	function hideAddSongModal() {
		addSongModal.style.display = 'none' // Hide the modal
		songUploadForm.reset() // Reset the form fields
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

			try {
				// Send data to the API
				const response = await fetch('https://dagankplaylist.onrender.com/api/tracks', {
					method: 'POST',
					body: formData,
				})

				if (response.ok) {
					const newTrack = await response.json()
					console.log('Track added:', newTrack)
					hideAddSongModal() // Hide the modal after adding the track
					window.loadTracks() // Call the loadTracks() function from script.js
				} else {
					console.error('Error adding track.')
					alert('An error occurred while adding the track. Please try again.')
				}
			} catch (error) {
				console.error('Error submitting form:', error)
				alert('An error occurred while submitting the form. Please try again.')
			}
		})
	}
})()
