const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// middleware to check authentication
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    return res.sendFile(path.join(__dirname, '../public', 'signup-prompt.html')); // go to sign-up prompt if not authenticated
}

// middleware to check onboarding completion
async function isOnboardingComplete(req, res, next) {
    try {
        // skip if the user is explicitly navigating to onboarding
        if (req.path === '/onboarding') {
            return next();
        }

        // skip if the user is not logged in
        if (!req.session || !req.session.user) {
            return next(); // allow access to public routes
        }

        // allow access if onboarding is already complete
        if (req.session.user.genresCompleted) {
            return next();
        }

        const userId = req.session.user.id;

        // fetch genres from the database
        const { data: genres, error } = await supabase
            .from('GENRE_PREFERENCES')
            .select('genre_selected')
            .eq('user_id', userId);

        if (error) {
            console.error('Error checking onboarding:', error.message);
            return res.redirect('/onboarding');
        }

        // Mark onboarding as complete if the user has selected at least 3 genres
        if (genres && genres.length >= 3) {
            req.session.user.genresCompleted = true; // Mark onboarding as complete
            return next();
        }

        // redirect to onboarding if genres are not completed
        return res.redirect('/onboarding');
    } catch (err) {
        console.error('Unexpected error in onboarding check:', err);
        return res.redirect('/onboarding');
    }
}





// Route for the login page
router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/index'); 
    }
    res.sendFile(path.join(__dirname, '../public', 'login.html'));
});

// rotue for the signup page
router.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'signup.html'));
});

// Route for the homepage (index.html)
router.get('/index', isOnboardingComplete, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// rute for the recommendations page
router.get('/recommendations', isAuthenticated, isOnboardingComplete, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'recommendations.html'));
});

// route for profile
router.get('/profile', isAuthenticated, isOnboardingComplete, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'profile.html'));
});

// Route for the onboarding page - requires authentication but not onboarding completion
router.get('/onboarding', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'onboarding.html'));
});

router.get('/addReview', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'add-review.html'));
});

// Public routes
// explore
router.get('/explore', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'explore.html'));
});

// anime details
router.get('/anime-details', (req, res) => {
    const animeId = req.query.id; // get"id" query parameter
    if (!animeId) {
        return res.status(400).send("Anime ID is required");
    }
    res.sendFile(path.join(__dirname, '../public', 'anime-details.html'));
});


// get based on user's genre preferences
router.get('/api/recommendations', async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Unauthorized. Please log in or sign up.' });
    }

    try {
        const { data: genres, error } = await supabase
            .from('GENRE_PREFERENCES')
            .select('genre_selected')
            .eq('user_id', req.session.user.id);

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch genres.' });
        }

        if (!genres || genres.length === 0) {
            return res.status(404).json({ error: 'No genre preferences found. Please set your preferences first.' });
        }

        res.status(200).json({ genres });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// route for the signup-prompt page
router.get('/prompt', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'signup-prompt.html'));
});

router.get("/api/favorite-status", async (req, res) => {
    const animeId = req.query.id;
    console.log("Fetching favorite status for Anime ID:", animeId);

    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const userId = req.session.user.id;

    if (!animeId) {
        return res.status(400).json({ error: "Missing anime ID." });
    }

    try {
        const { data: favoriteEntry, error } = await supabase
            .from("FAVORITES")
            .select("favorite_id")
            .eq("user_id", userId)
            .eq("anime_id", animeId)
            .single();

        console.log("Favorite Entry:", favoriteEntry);
        if (error && error.details !== "Row not found") {
            return res.status(500).json({ error: "Failed to fetch favorite status." });
        }

        return res.status(200).json({ isFavorite: !!favoriteEntry });
    } catch (err) {
        return res.status(500).json({ error: "Internal server error." });
    }
});



router.get("/api/anime-status", async (req, res) => {
    const animeId = req.query.id;

    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const userId = req.session.user.id;

    if (!animeId) {
        return res.status(400).json({ error: "Missing anime ID." });
    }

    try {
        // check the current status of the anime in the database
        const { data: animeEntry, error } = await supabase
            .from("ANIME_LIST")
            .select("status")
            .eq("user_id", userId)
            .eq("anime_id", animeId)
            .single();

        if (error && error.details !== "Row not found") {
            return res.status(500).json({ error: "Failed to fetch anime status." });
        }

        // Return the status
        return res.status(200).json({ status: animeEntry ? animeEntry.status : null });
    } catch (err) {
        return res.status(500).json({ error: "Internal server error." });
    }
});

// route to fetch anime list for the user
router.get("/api/anime-list", async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const userId = req.session.user.id;

    try {
        const { data: animeList, error } = await supabase
            .from("ANIME_LIST")
            .select("anime_id, status") // get anime ID and status
            .eq("user_id", userId);

        if (error) {
            return res.status(500).json({ error: "Failed to fetch anime list." });
        }

        res.status(200).json({ animeList });
    } catch (err) {
        res.status(500).json({ error: "Internal server error." });
    }
});

router.get('/api/favorites', async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const userId = req.session.user.id;

    try {
        // query the favorites table
        const { data: favorites, error } = await supabase
            .from('FAVORITES') // replace with your actual table name
            .select('anime_id')
            .eq('user_id', userId);

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch favorites.' });
        }

        return res.status(200).json({ favorites });
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error.' });
    }
});



module.exports = router;
