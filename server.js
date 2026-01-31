const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

// import routes
const authRoutes = require('./routes/auth');
const onboardingRoutes = require('./routes/onboarding');
const pageRoutes = require('./routes/pages');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60, // 1 hour
    },
}));

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});


app.use((req, res, next) => {
    console.log("Session at middleware:", req.session);
    next();
});




// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// use routes
app.use(authRoutes);          // authentication routes
app.use(onboardingRoutes);    // onboarding-related routes
app.use(pageRoutes);          // static page routes


// start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
