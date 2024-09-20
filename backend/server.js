require('dotenv').config()
const express = require('express')
const axios = require('axios')
const app = express()
const port = 3000

// Obsługa plików statycznych z folderu 'public'
app.use(express.static('../public'))

// Strona główna — teraz załaduje plik index.html z folderu 'public'
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/../public/index.html');
  });

// Trasa do autoryzacji przez Discord
app.get('/auth/discord', (req, res) => {
	const clientId = process.env.DISCORD_CLIENT_ID
	const redirectUri = encodeURIComponent(process.env.DISCORD_REDIRECT_URI)
	const oauth2Url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20email`

	res.redirect(oauth2Url) // Przekierowanie do Discord OAuth
})

// Trasa, którą Discord wywoła po autoryzacji
app.get('/auth/discord/callback', async (req, res) => {
	const code = req.query.code
	const clientId = process.env.DISCORD_CLIENT_ID
	const clientSecret = process.env.DISCORD_CLIENT_SECRET
	const redirectUri = process.env.DISCORD_REDIRECT_URI

	try {
		// Wymiana kodu na token
		const tokenResponse = await axios.post(
			'https://discord.com/api/oauth2/token',
			{
				client_id: clientId,
				client_secret: clientSecret,
				grant_type: 'authorization_code',
				code: code,
				redirect_uri: redirectUri,
			},
			{
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			}
		)

		const accessToken = tokenResponse.data.access_token

		// Pobieranie danych użytkownika
		const userResponse = await axios.get('https://discord.com/api/users/@me', {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		})

		const user = userResponse.data

		// Tu można dodać użytkownika do bazy danych lub logować go
		res.send(`Hello, ${user.username}`)
	} catch (error) {
		console.error('Błąd OAuth:', error)
		res.redirect('/error')
	}
})

app.listen(port, () => {
	console.log(`Serwer działa na http://localhost:${port}`)
})
