const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const user = await User.findOne({ username: username.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        req.session.user = {
            id: user._id,
            username: user.username,
            role: user.role,
            user_branch: user.user_branch
        };

        res.json({
            message: 'Login successful',
            user: {
                username: user.username,
                role: user.role,
                user_branch: user.user_branch
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: 'Could not log out' });
        res.json({ message: 'Logged out successfully' });
    });
});

// Get current user
router.get('/me', (req, res) => {
    if (req.session && req.session.user) {
        return res.json({ user: req.session.user });
    }
    res.status(401).json({ error: 'Not authenticated' });
});

module.exports = router;
