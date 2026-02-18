const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Add a new student (user)
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { name, std, school, board, m_mob_no, f_mob_no, address, area, reference_name } = req.body;

        // Auto-compute reference: entered_name + '-' + user_branch
        const reference = reference_name
            ? `${reference_name.trim()}-${req.session.user.user_branch}`
            : req.session.user.user_branch;

        const student = new Student({
            name,
            std,
            school,
            board,
            m_mob_no,
            f_mob_no: f_mob_no || '',
            address,
            area,
            reference,
            added_by: req.session.user.username
        });

        await student.save();
        res.status(201).json({ message: 'Student added successfully', student });
    } catch (err) {
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ error: errors.join(', ') });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// Get current user's students + count
router.get('/my', isAuthenticated, async (req, res) => {
    try {
        const students = await Student.find({ added_by: req.session.user.username }).sort({ createdAt: -1 });
        res.json({ count: students.length, students });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all students (admin only)
router.get('/', isAdmin, async (req, res) => {
    try {
        const students = await Student.find().sort({ createdAt: -1 });
        res.json({ count: students.length, students });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Edit a student (user can edit own entries)
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ error: 'Student not found' });

        // Users can only edit their own entries; admin can edit any
        if (req.session.user.role !== 'admin' && student.added_by !== req.session.user.username) {
            return res.status(403).json({ error: 'You can only edit your own entries' });
        }

        const { name, std, school, board, m_mob_no, f_mob_no, address, area, reference_name } = req.body;

        student.name = name || student.name;
        student.std = std || student.std;
        student.school = school || student.school;
        student.board = board || student.board;
        student.m_mob_no = m_mob_no || student.m_mob_no;
        student.f_mob_no = f_mob_no !== undefined ? f_mob_no : student.f_mob_no;
        student.address = address || student.address;
        student.area = area || student.area;
        if (reference_name !== undefined) {
            student.reference = reference_name
                ? `${reference_name.trim()}-${req.session.user.user_branch}`
                : student.reference;
        }

        await student.save();
        res.json({ message: 'Student updated successfully', student });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete a student (user can delete own, admin can delete any)
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ error: 'Student not found' });

        if (req.session.user.role !== 'admin' && student.added_by !== req.session.user.username) {
            return res.status(403).json({ error: 'You can only delete your own entries' });
        }

        await Student.findByIdAndDelete(req.params.id);
        res.json({ message: 'Student deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Bulk upload (hinex user only)
router.post('/bulk', isAuthenticated, async (req, res) => {
    try {
        if (req.session.user.username !== 'hinex') {
            return res.status(403).json({ error: 'Bulk upload is restricted to hinex user only' });
        }

        const { students } = req.body;
        if (!students || !Array.isArray(students) || students.length === 0) {
            return res.status(400).json({ error: 'No student data provided' });
        }

        let inserted = 0;
        let errors = [];

        for (let i = 0; i < students.length; i++) {
            try {
                const s = students[i];
                const student = new Student({
                    name: (s.name || '').toString().trim(),
                    std: (s.std || '').toString().trim(),
                    school: (s.school || '').toString().trim(),
                    board: (s.board || '').toString().trim().toUpperCase(),
                    m_mob_no: (s.m_mob_no || '').toString().trim(),
                    f_mob_no: (s.f_mob_no || '').toString().trim(),
                    address: (s.address || '').toString().trim(),
                    area: (s.area || '').toString().trim().toUpperCase(),
                    reference: (s.reference || '').toString().trim(),
                    added_by: req.session.user.username
                });
                await student.save();
                inserted++;
            } catch (err) {
                errors.push(`Row ${i + 1}: ${err.message}`);
            }
        }

        res.json({
            message: `Bulk upload complete: ${inserted} inserted, ${errors.length} failed`,
            inserted,
            failed: errors.length,
            errors: errors.slice(0, 10) // Show first 10 errors
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

