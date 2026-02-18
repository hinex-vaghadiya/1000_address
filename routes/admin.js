const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const { isAdmin } = require('../middleware/auth');

// Get all users
router.get('/users', isAdmin, async (req, res) => {
    try {
        const users = await User.find({}, '-password').sort({ createdAt: -1 });

        // Get student count per user
        const usersWithCounts = await Promise.all(
            users.map(async (user) => {
                const count = await Student.countDocuments({ added_by: user.username });
                return { ...user.toObject(), studentCount: count };
            })
        );

        res.json(usersWithCounts);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Create a new user
router.post('/users', isAdmin, async (req, res) => {
    try {
        const { username, password, user_branch } = req.body;

        if (!username || !password || !user_branch) {
            return res.status(400).json({ error: 'Username, password, and branch are required' });
        }

        const existing = await User.findOne({ username: username.toLowerCase().trim() });
        if (existing) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const user = new User({
            username: username.toLowerCase().trim(),
            password,
            role: 'user',
            user_branch: user_branch.trim()
        });

        await user.save();
        res.status(201).json({ message: 'User created successfully', user: { username: user.username, user_branch: user.user_branch } });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete a user
router.delete('/users/:id', isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.role === 'admin') return res.status(400).json({ error: 'Cannot delete admin user' });

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get dashboard stats
router.get('/stats', isAdmin, async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        const totalUsers = await User.countDocuments({ role: 'user' });
        res.json({ totalStudents, totalUsers });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
