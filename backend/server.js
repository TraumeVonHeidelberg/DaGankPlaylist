// server.js

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

// Define upload directory
const uploadDir = path.join(__dirname, 'uploads')
const redirectUri = process.env.DISCORD_REDIRECT_URI

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true })
}

// 1. Connect to MongoDB
mongoose
	.connect(process.env.MONGODB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => {
		console.log('Connected to MongoDB')
	})
	.catch(err => {
		console.error('MongoDB connection error:', err)
	})

// Middleware to parse JSON and urlencoded data
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, '../public')))

// Serve static files from 'uploads' directory
app.use('/uploads', express.static(uploadDir))

// Use CORS
app.use(
	cors({
		origin: ['https://dagankplaylist.netlify.app', 'http://localhost:3000'], // Replace with your frontend URLs
		methods: ['GET', 'POST'],
		allowedHeaders: ['Content-Type', 'Authorization'],
	})
)

// Multer configuration for file uploads
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadDir) // Path to the directory where files will be stored
	},
	filename: (req, file, cb) => {
		// Generate unique filename: timestamp + original extension
		const uniqueSuffix = Date.now() + path.extname(file.originalname)
		cb(null, uniqueSuffix)
	},
})

// File filter to accept only audio files
function fileFilter(req, file, cb) {
	const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/flac']
	if (allowedTypes.includes(file.mimetype)) {
		cb(null, true)
	} else {
		cb(new Error('Only audio files are allowed!'), false)
	}
}

const upload = multer({
	storage: storage,
	fileFilter: fileFilter,
	limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit
})

// Home page — now loads index.html from 'public' folder
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '../public/index.html'))
})

// Route for Discord authentication
app.get('/auth/discord', (req, res) => {
	const clientId = process.env.DISCORD_CLIENT_ID
	const redirectUri = process.env.DISCORD_REDIRECT_URI
	const scope = 'identify email'
	const oauth2Url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
		redirectUri
	)}&response_type=code&scope=${encodeURIComponent(scope)}`

	res.redirect(oauth2Url) // Redirect to Discord OAuth
})

// Route that Discord will call after authentication
app.get('/auth/discord/callback', async (req, res) => {
	const code = req.query.code
	const clientId = process.env.DISCORD_CLIENT_ID
	const clientSecret = process.env.DISCORD_CLIENT_SECRET
	const redirectUri = process.env.DISCORD_REDIRECT_URI // Ensure this matches exactly

	console.log('Redirect URI:', redirectUri) // Optional: For debugging purposes

	try {
		// Exchange code for token
		const params = new URLSearchParams()
		params.append('client_id', clientId)
		params.append('client_secret', clientSecret)
		params.append('grant_type', 'authorization_code')
		params.append('code', code)
		params.append('redirect_uri', redirectUri) // Must match exactly with the one used in /auth/discord

		const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', params.toString(), {
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
		res.redirect(
			`/?username=${encodeURIComponent(user.username)}&avatar=${encodeURIComponent(
				user.avatar
			)}&id=${encodeURIComponent(user.id)}`
		)
	} catch (error) {
		if (error.response) {
			console.error('OAuth error:', error.response.data)
		} else {
			console.error('OAuth error:', error.message)
		}
		res.redirect('/error')
	}
})

// Route to fetch tracks
app.get('/api/tracks', async (req, res) => {
	try {
		const tracks = await Track.find() // Fetch all tracks from the database
		res.json(tracks)
	} catch (error) {
		console.error('Error fetching tracks:', error)
		res.status(500).json({ error: 'Failed to fetch tracks.' })
	}
})

// Route to add a new track
app.post('/api/tracks', upload.single('songFile'), (req, res) => {
	if (!req.file) {
		return res.status(400).json({ error: 'No file uploaded.' })
	}

	const filePath = path.join(uploadDir, req.file.filename) // Path to the file

	// Get track duration using ffmpeg
	ffmpeg.ffprobe(filePath, async (err, metadata) => {
		if (err) {
			console.error('Error analyzing audio file:', err)
			// Delete the uploaded file if ffprobe fails
			fs.unlink(filePath, unlinkErr => {
				if (unlinkErr) console.error('Error deleting file after ffprobe failure:', unlinkErr)
			})
			return res.status(500).json({ error: 'Failed to determine track duration.' })
		}

		// Calculate track duration in MM:SS format
		const durationInSeconds = Math.floor(metadata.format.duration)
		const minutes = Math.floor(durationInSeconds / 60)
		const seconds = durationInSeconds % 60
		const formattedDuration = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`

		// Create a full URL for the file
		const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`

		// Validate that songTitle is provided
		const songTitle = req.body.songTitle
		if (!songTitle || songTitle.trim() === '') {
			// Delete the uploaded file if title is missing
			fs.unlink(filePath, unlinkErr => {
				if (unlinkErr) console.error('Error deleting file after missing title:', unlinkErr)
			})
			return res.status(400).json({ error: 'Song title is required.' })
		}

		// Create a new track record
		try {
			const newTrack = new Track({
				title: songTitle,
				file: fileUrl, // Full URL to the file
				duration: formattedDuration, // Calculated duration
				plays: 0, // Initialize plays to 0
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
			// Delete the uploaded file if database save fails
			fs.unlink(filePath, unlinkErr => {
				if (unlinkErr) console.error('Error deleting file after database save failure:', unlinkErr)
			})
			res.status(500).json({ error: 'Failed to add track.' })
		}
	})
})

// Error route
app.get('/error', (req, res) => {
	res.status(500).send('An error occurred during authentication.')
})

// Start the server
app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`)
})
