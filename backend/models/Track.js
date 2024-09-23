const mongoose = require('mongoose')

// Definicja schematu dla utworów (Tracks)
const trackSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
	},
	file: {
		type: String,
		required: true,
	},
	plays: {
		type: Number,
		default: 0,
	},
	duration: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
})

// Tworzenie modelu na podstawie schematu
const Track = mongoose.model('Track', trackSchema)

module.exports = Track
