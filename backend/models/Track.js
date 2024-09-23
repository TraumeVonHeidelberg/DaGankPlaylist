// models/Track.js

const mongoose = require('mongoose')

// Define the schema for tracks
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
	addedBy: {
		id: String, // Discord user ID
		username: String, // Discord username
		avatar: String, // Discord avatar hash
	},
})

// Create the model from the schema
const Track = mongoose.model('Track', trackSchema)

module.exports = Track
