function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    return res.status(401).json({ error: 'Not authenticated' });
}

function isAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ error: 'Admin access required' });
}

module.exports = { isAuthenticated, isAdmin };
