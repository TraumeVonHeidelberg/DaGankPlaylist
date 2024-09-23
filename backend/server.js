require('dotenv').config() // Załaduj zmienne środowiskowe
const express = require('express')
const cors = require('cors') // Import CORS
const axios = require('axios')
const mongoose = require('mongoose') // Import Mongoose
const multer = require('multer') // Import Multer
const path = require('path') // Do pracy ze ścieżkami plików
const ffmpeg = require('fluent-ffmpeg') // Import ffmpeg
const Track = require('./models/Track') // Import modelu Track
const app = express()
const fs = require('fs')
const port = process.env.PORT || 3000

const uploadDir = path.join(__dirname, 'uploads')

// Sprawdź, czy katalog istnieje, jeśli nie, utwórz go
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true })
}

// 1. Połączenie z MongoDB
mongoose
	.connect(process.env.MONGODB_URI)
	.then(() => {
		console.log('Połączono z MongoDB')
	})
	.catch(err => {
		console.error('Błąd połączenia z MongoDB:', err)
	})

// Obsługa plików statycznych z folderu 'public'
app.use(express.static(path.join(__dirname, '../public')))

// Użycie CORS
app.use(
	cors({
		origin: 'https://dagankplaylist.netlify.app', // Zastąp URL swojej strony Netlify
	})
)

// Konfiguracja multer do obsługi uploadu plików
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'uploads/') // Ścieżka do katalogu, gdzie będą przechowywane pliki
	},
	filename: (req, file, cb) => {
		cb(null, Date.now() + path.extname(file.originalname)) // Nazwa pliku z unikalnym timestampem
	},
})

const upload = multer({ storage: storage }) // Inicjalizacja multer z powyższą konfiguracją

// Strona główna — teraz załaduje plik index.html z folderu 'public'
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '../public/index.html'))
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

// Trasa do pobierania utworów
app.get('/api/tracks', async (req, res) => {
	try {
		const tracks = await Track.find() // Pobiera wszystkie utwory z bazy
		res.json(tracks)
	} catch (error) {
		res.status(500).json({ error: 'Nie udało się pobrać utworów.' })
	}
})

// Trasa do dodawania nowego utworu
app.post('/api/tracks', upload.single('songFile'), (req, res) => {
	const filePath = path.join(__dirname, 'uploads', req.file.filename) // Ścieżka do pliku

	// Ustalanie długości utworu za pomocą ffmpeg
	ffmpeg.ffprobe(filePath, async (err, metadata) => {
		if (err) {
			console.error('Błąd podczas analizy pliku audio:', err)
			return res.status(500).json({ error: 'Nie udało się ustalić długości utworu.' })
		}

		// Obliczanie czasu trwania utworu w formacie MM:SS
		const durationInSeconds = Math.floor(metadata.format.duration)
		const minutes = Math.floor(durationInSeconds / 60)
		const seconds = durationInSeconds % 60
		const formattedDuration = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`

		// Tworzenie nowego rekordu utworu
		try {
			const newTrack = new Track({
				title: req.body.songTitle,
				file: `/uploads/${req.file.filename}`, // Ścieżka do pliku
				duration: formattedDuration, // Obliczony czas trwania
			})

			await newTrack.save() // Zapisanie nowego utworu do MongoDB
			res.status(201).json(newTrack) // Zwrócenie odpowiedzi z nowo dodanym utworem
		} catch (error) {
			console.error('Błąd podczas zapisu utworu do bazy danych:', error)
			res.status(500).json({ error: 'Nie udało się dodać utworu.' })
		}
	})
})

// Uruchomienie serwera
app.listen(port, () => {
	console.log(`Serwer działa na http://localhost:${port}`)
})
