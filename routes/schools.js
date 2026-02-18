const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { isAuthenticated } = require('../middleware/auth');

// Get all schools from student data for dropdown
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const schools = await Student.distinct('school');
        const result = schools.filter(s => s && s.trim()).sort().map(name => ({ name }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

