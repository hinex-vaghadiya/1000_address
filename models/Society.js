const mongoose = require('mongoose');

const societySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    address: { type: String, required: true, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Society', societySchema);
