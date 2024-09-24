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
const cloudinary = require('cloudinary').v2 // Import Cloudinary
const { Readable } = require('stream') // For streaming buffer to Cloudinary
const app = express()
const port = process.env.PORT || 3000

// Cloudinary Configuration
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Multer configuration: store files in memory
const storage = multer.memoryStorage()
const upload = multer({
	storage: storage,
	limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit
	fileFilter: (req, file, cb) => {
		const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/flac']
		if (allowedTypes.includes(file.mimetype)) {
			cb(null, true)
		} else {
			cb(new Error('Only audio files are allowed!'), false)
		}
	},
})

// Connect to MongoDB
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

// Use CORS
app.use(
	cors({
		origin: ['https://dagankplaylist.netlify.app', 'http://localhost:3000'], // Replace with your frontend URLs
		methods: ['GET', 'POST'],
		allowedHeaders: ['Content-Type', 'Authorization'],
	})
)

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

		// Store user data in localStorage or session (you may need to adjust based on your frontend setup)
		// Here, we're redirecting to the frontend with query parameters
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

// Route to fetch tracks sorted by creation date ascending
app.get('/api/tracks', async (req, res) => {
	try {
		const tracks = await Track.find().sort({ createdAt: 1 }) // Sort by creation date ascending
		res.json(tracks)
	} catch (error) {
		console.error('Error fetching tracks:', error)
		res.status(500).json({ error: 'Failed to fetch tracks.' })
	}
})

// Middleware to authenticate user
function authenticateUser(req, res, next) {
	const { userId, username, avatar } = req.body
	if (userId && username && avatar) {
		// Możesz dodać dodatkową weryfikację tutaj
		next()
	} else {
		res.status(401).json({ error: 'Unauthorized' })
	}
}

// Route to add a new track
app.post('/api/tracks', authenticateUser, upload.single('songFile'), async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ error: 'No file uploaded.' })
	}

	const fileBuffer = req.file.buffer
	const originalName = req.file.originalname
	const uniqueFilename = `${Date.now()}-${path.parse(originalName).name}`

	try {
		// Upload to Cloudinary
		const uploadResult = await new Promise((resolve, reject) => {
			const uploadStream = cloudinary.uploader.upload_stream(
				{
					folder: 'music_tracks', // Folder in Cloudinary
					public_id: uniqueFilename, // Unique filename
					resource_type: 'auto', // Automatically detect resource type
				},
				(error, result) => {
					if (error) {
						reject(error)
					} else {
						resolve(result)
					}
				}
			)
			Readable.from(fileBuffer).pipe(uploadStream)
		})

		const fileUrl = uploadResult.secure_url
		const filePublicId = uploadResult.public_id

		// Cloudinary provides 'duration' in metadata for audio files
		const durationInSeconds = Math.floor(uploadResult.duration)
		const minutes = Math.floor(durationInSeconds / 60)
		const seconds = durationInSeconds % 60
		const formattedDuration = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`

		// Validate that songTitle is provided
		const songTitle = req.body.songTitle
		if (!songTitle || songTitle.trim() === '') {
			return res.status(400).json({ error: 'Song title is required.' })
		}

		// Create a new track record
		const newTrack = new Track({
			title: songTitle,
			file: fileUrl, // Cloudinary URL
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
		console.error('Error processing track:', error)
		res.status(500).json({ error: 'Failed to process track.' })
	}
})

// Error route
app.get('/error', (req, res) => {
	res.status(500).send('An error occurred during authentication.')
})

// Start the server
app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`)
})
