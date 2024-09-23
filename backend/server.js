require('dotenv').config() // Załaduj zmienne środowiskowe
const express = require('express')
const cors = require('cors') // Import CORS
const axios = require('axios')
const mongoose = require('mongoose') // Import Mongoose
const app = express()
const Track = require('./models/Track')
const port = 3000

// 1. Połączenie z MongoDB
mongoose
	.connect(process.env.MONGODB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => {
		console.log('Połączono z MongoDB')
	})
	.catch(err => {
		console.error('Błąd połączenia z MongoDB:', err)
	})

// Obsługa plików statycznych z folderu 'public'
app.use(express.static('../public'))

app.use(
	cors({
		origin: 'https://dagankplaylist.netlify.app', // Zastąp URL swojej strony Netlify
	})
)

// Strona główna — teraz załaduje plik index.html z folderu 'public'
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/../public/index.html')
})

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

		// Przekierowanie do strony głównej z danymi użytkownika w query string
		res.redirect(`/index.html?username=${user.username}&avatar=${user.avatar}&id=${user.id}`)
	} catch (error) {
		console.error('Błąd OAuth:', error)
		res.redirect('/error')
	}
})

app.get('/api/tracks', async (req, res) => {
	try {
		const tracks = await Track.find() // Pobiera wszystkie utwory z bazy
		res.json(tracks)
	} catch (error) {
		res.status(500).json({ error: 'Nie udało się pobrać utworów.' })
	}
})

app.post('/api/tracks', upload.single('songFile'), async (req, res) => {
    try {
        const newTrack = new Track({
            title: req.body.songTitle,
            file: `/uploads/${req.file.filename}`, // Ścieżka do pliku
            duration: req.body.duration // Zakładamy, że dostarczasz czas trwania z formularza
        });

        await newTrack.save(); // Zapisanie nowego utworu do MongoDB

        res.status(201).json(newTrack);
    } catch (error) {
        res.status(500).json({ error: 'Nie udało się dodać utworu.' });
    }
});

app.listen(port, () => {
	console.log(`Serwer działa na http://localhost:${port}`)
})
