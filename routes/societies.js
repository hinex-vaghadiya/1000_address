const express = require('express');
const router = express.Router();
const Society = require('../models/Society');
const Student = require('../models/Student');
const { isAuthenticated } = require('../middleware/auth');

// Get all societies
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const societies = await Society.find().sort({ name: 1 });
        res.json(societies);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get map data: societies with student counts
router.get('/map-data', isAuthenticated, async (req, res) => {
    try {
        const societies = await Society.find({ latitude: { $ne: null }, longitude: { $ne: null } }).lean();
        const students = await Student.find({}, 'address').lean();

        const mapData = societies.map(soc => {
            // Count students whose address contains this society's name
            const studentCount = students.filter(st =>
                st.address && st.address.toLowerCase().includes(soc.name.toLowerCase())
            ).length;

            return {
                _id: soc._id,
                name: soc.name,
                address: soc.address,
                latitude: soc.latitude,
                longitude: soc.longitude,
                studentCount
            };
        });

        res.json(mapData);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Add a new society
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { name, address, latitude, longitude, placeId } = req.body;

        if (!name || !address) {
            return res.status(400).json({ error: 'Society name and address are required' });
        }

        const existing = await Society.findOne({ name: { $regex: new RegExp('^' + name.trim() + '$', 'i') } });
        if (existing) {
            return res.status(400).json({ error: 'A society with this name already exists' });
        }

        const society = new Society({
            name: name.trim(),
            address: address.trim(),
            latitude: latitude || null,
            longitude: longitude || null,
            placeId: placeId || ''
        });

        await society.save();
        res.status(201).json({ message: 'Society added successfully', society });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Edit a society
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const { name, address, latitude, longitude, placeId } = req.body;
        const society = await Society.findById(req.params.id);
        if (!society) return res.status(404).json({ error: 'Society not found' });

        if (name) society.name = name.trim();
        if (address) society.address = address.trim();
        if (latitude !== undefined) society.latitude = latitude;
        if (longitude !== undefined) society.longitude = longitude;
        if (placeId !== undefined) society.placeId = placeId;

        await society.save();
        res.json({ message: 'Society updated successfully', society });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'A society with this name already exists' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete a society
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const society = await Society.findById(req.params.id);
        if (!society) return res.status(404).json({ error: 'Society not found' });

        await Society.findByIdAndDelete(req.params.id);
        res.json({ message: 'Society deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
