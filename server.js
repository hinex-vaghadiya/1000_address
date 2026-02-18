require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });

// --- Session ---
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret_change_me',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 24 * 60 * 60 // 1 day
    }),
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    }
}));

// --- Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/schools', require('./routes/schools'));
app.use('/api/admin', require('./routes/admin'));

// Serve pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/user', (req, res) => res.sendFile(path.join(__dirname, 'public', 'user.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// --- Seed Admin User ---
const User = require('./models/User');
async function seedAdmin() {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            await User.create({
                username: 'admin',
                password: process.env.ADMIN_PASSWORD || 'admin123',
                role: 'admin',
                user_branch: 'main'
            });
            console.log('🔑 Default admin user created (username: admin)');
        }
    } catch (err) {
        console.error('Error seeding admin:', err.message);
    }
}

mongoose.connection.once('open', () => {
    seedAdmin();
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
