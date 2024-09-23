require('dotenv').config() // Load environment variables
const express = require('express')
const cors = require('cors') // Import CORS
const axios = require('axios')
const mongoose = require('mongoose') // Import Mongoose
const multer = require('multer') // Import Multer
const path = require('path') // For working with file paths
const ffmpeg = require('fluent-ffmpeg') // Import ffmpeg
const Track = require('./models/Track') // Import Track model
const app = express()
const fs = require('fs')
const port = process.env.PORT || 3000

const uploadDir = path.join(__dirname, 'uploads')

// Check if the directory exists, if not, create it
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true })
}

// 1. Connect to MongoDB
mongoose
	.connect(process.env.MONGODB_URI)
	.then(() => {
		console.log('Connected to MongoDB')
	})
	.catch(err => {
		console.error('MongoDB connection error:', err)
	})

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, '../public')))

// Serve static files from 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Use CORS
app.use(
	cors({
		origin: ['https://dagankplaylist.netlify.app', 'http://localhost:3000'], // Replace with your frontend URLs
	})
)

// Multer configuration for file uploads
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'uploads/') // Path to the directory where files will be stored
	},
	filename: (req, file, cb) => {
		cb(null, Date.now() + path.extname(file.originalname)) // Unique filename with timestamp
	},
})

const upload = multer({ storage: storage }) // Initialize multer with the above configuration

// Home page — now loads index.html from 'public' folder
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '../public/index.html'))
})

// Route for Discord authentication
app.get('/auth/discord', (req, res) => {
	const clientId = process.env.DISCORD_CLIENT_ID
	const redirectUri = encodeURIComponent(process.env.DISCORD_REDIRECT_URI)
	const oauth2Url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20email`

	res.redirect(oauth2Url) // Redirect to Discord OAuth
})

// Route that Discord will call after authentication
app.get('/auth/discord/callback', async (req, res) => {
	const code = req.query.code
	const clientId = process.env.DISCORD_CLIENT_ID
	const clientSecret = process.env.DISCORD_CLIENT_SECRET
	const redirectUri = process.env.DISCORD_REDIRECT_URI

	try {
		// Exchange code for token
		const params = new URLSearchParams()
		params.append('client_id', clientId)
		params.append('client_secret', clientSecret)
		params.append('grant_type', 'authorization_code')
		params.append('code', code)
		params.append('redirect_uri', redirectUri)

		const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', params, {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		})

		const accessToken = tokenResponse.data.access_token

		// Fetch user data
		const userResponse = await axios.get('https://discord.com/api/users/@me', {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		})

		const user = userResponse.data

		// Redirect to homepage with user data in query string
		res.redirect(`/index.html?username=${user.username}&avatar=${user.avatar}&id=${user.id}`)
	} catch (error) {
		console.error('OAuth error:', error)
		res.redirect('/error')
	}
})

// Route to fetch tracks
app.get('/api/tracks', async (req, res) => {
	try {
		const tracks = await Track.find() // Fetch all tracks from the database
		res.json(tracks)
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch tracks.' })
	}
})

// Route to add a new track
app.post('/api/tracks', upload.single('songFile'), (req, res) => {
	const filePath = path.join(__dirname, 'uploads', req.file.filename) // Path to the file

	// Get track duration using ffmpeg
	ffmpeg.ffprobe(filePath, async (err, metadata) => {
		if (err) {
			console.error('Error analyzing audio file:', err)
			return res.status(500).json({ error: 'Failed to determine track duration.' })
		}

		// Calculate track duration in MM:SS format
		const durationInSeconds = Math.floor(metadata.format.duration)
		const minutes = Math.floor(durationInSeconds / 60)
		const seconds = durationInSeconds % 60
		const formattedDuration = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`

		// Create a full URL for the file
		const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`

		// Create a new track record
		try {
			const newTrack = new Track({
				title: req.body.songTitle,
				file: fileUrl, // Full URL to the file
				duration: formattedDuration, // Calculated duration
				addedBy: {
					id: req.body.userId,
					username: req.body.username,
					avatar: req.body.avatar,
				},
			})

			await newTrack.save() // Save the new track to MongoDB
			res.status(201).json(newTrack) // Return the newly added track
		} catch (error) {
			console.error('Error saving track to database:', error)
			res.status(500).json({ error: 'Failed to add track.' })
		}
	})
})

// Start the server
app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`)
})
