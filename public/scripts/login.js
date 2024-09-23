const backendUrl="https://dagankplaylist.onrender.com"

// Event listeners for the buttons
document.querySelector('.log-in-btn').addEventListener('click', () => {
	window.location.href = `${backendUrl}/auth/discord` // Redirect to backend route
})

// Function to check for Discord user data in the URL or localStorage
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
	if (storedUser) {
		const user = JSON.parse(storedUser)

		// Replace login buttons with the user's profile picture
		const loginBtns = document.querySelector('.login-btns')
		if (loginBtns) {
			loginBtns.innerHTML = `
        <img class="nav-img" src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" alt="${user.username}">
      `
		}
	}
}

// Call the function to handle login when the page loads
window.addEventListener('DOMContentLoaded', handleUserLogin)
