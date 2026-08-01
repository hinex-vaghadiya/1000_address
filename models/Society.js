const mongoose = require('mongoose');

const societySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    address: { type: String, required: true, trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    placeId: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Society', societySchema);
