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

	// Event handler for the 'add-btn' click
	addBtn.addEventListener('click', showAddSongModal)

	// Close the modal when clicking outside of it
	addSongModal.addEventListener('click', event => {
		if (event.target === addSongModal) {
			hideAddSongModal() // Hide the modal when clicking outside of it
		}
	})

	// Handle the form submission (adding a new track)
	songUploadForm.addEventListener('submit', async event => {
		event.preventDefault() // Prevent the default form submission behavior

		// Collect data from the form
		const formData = new FormData(songUploadForm)

		try {
			// Send data to the API
			const response = await fetch('https://dagankplaylist.onrender.com/api/tracks', {
				method: 'POST',
				body: formData,
			})

			if (response.ok) {
				const newTrack = await response.json() // The newly added track
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
})()
