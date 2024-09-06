// backend/routes/api/csrf.js
const router = require('express').Router();
const csrf = require('csurf');

// Apply CSRF protection middleware
const csrfProtection = csrf({ cookie: true });

// This route will send the CSRF token to the frontend
router.get('/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

module.exports = router;
