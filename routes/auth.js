const express = require('express');
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// API to check session status
router.get('/api/session', (req, res) => {
    if (req.session && req.session.user) {
        res.json({
            loggedIn: true,
            username: req.session.user.username,
            genresCompleted: req.session.user.genresCompleted || false,
        });
    } else {
        res.json({
            loggedIn: false,
            genresCompleted: false,
        });
    }
});

// Signup route
const sanitizeHtml = require('sanitize-html');

router.post('/signup', async (req, res) => {
    let { user_username, user_email, user_password, terms } = req.body;

    // sanitizing inputs
    const sanitizeInput = (input) => sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
    user_username = sanitizeInput(user_username);
    user_email = sanitizeInput(user_email);
    terms = sanitizeInput(terms);

    const errors = []; // list validation errors

    // check for missing fields
    if (!user_username) {
        errors.push({ field: 'username', error: 'Username is required.' });
    }

    if (!user_email) {
        errors.push({ field: 'email', error: 'Email is required.' });
    }

    if (!user_password) {
        errors.push({ field: 'password', error: 'Password is required.' });
    }

    // validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (user_email && !emailRegex.test(user_email)) {
        errors.push({ field: 'email', error: 'Invalid email format.' });
    }

    // validate username length
    if (user_username && (user_username.length < 3 || user_username.length > 20)) {
        errors.push({ field: 'username', error: 'Username must be between 3 and 20 characters.' });
    }

    // validate password strength
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/; // At least 8 characters, 1 letter, 1 number
    if (user_password && !passwordRegex.test(user_password)) {
        errors.push({
            field: 'password',
            error: 'Password must be at least 8 characters with at least one letter and one number.',
        });
    }

    // validate terms acceptance
    if (!terms || terms !== 'on') {
        errors.push({ field: 'terms', error: 'You must agree to the Terms and Privacy Policy.' });
    }

    // goto conflict validation even if there are validation errors
    try {
        // check for existing users by username or email
        const { data: existingUsers, error } = await supabase
            .from('USERS')
            .select('user_username, user_email')
            .or(`user_email.eq.${user_email},user_username.eq.${user_username}`);
    
        if (error) {
            console.error('Supabase query error:', error);
            errors.push({ field: 'all', error: 'Server error during validation. Please try again later.' });
        } else {
            console.log('Existing users:', existingUsers);// debugging purposes
            // collect conflicting fields
            existingUsers.forEach((user) => {
                if (user.user_email === user_email) {
                    errors.push({ field: 'email', error: 'Email is already registered.' });
                }
                if (user.user_username === user_username) {
                    errors.push({ field: 'username', error: 'Username is already registered.' });
                }
            });
        }
    } catch (err) {
        errors.push({ field: 'all', error: 'Server error during validation. Please try again later.' });
    }
    

    // return all collected errors
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    try {
        // encrypt password and insert new user
        const hashedPassword = await bcrypt.hash(user_password, 12);
        await supabase.from('USERS').insert([{ user_username, user_email, user_password: hashedPassword }]);

        return res.status(200).json({ success: true, redirect: '/login' });
    } catch (err) {
        console.error('Signup error: ', { email: user_email, username: user_username, error: err });
        return res.status(500).json({
            errors: [{ field: 'all', error: 'Server error. Please try again later.' }],
        });
    }
});


// Login route
router.post('/login', async (req, res) => {
    const { user_email, user_password } = req.body;

    if (!user_email || !user_password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const { data: user, error } = await supabase
            .from("USERS")
            .select('*')
            .eq('user_email', user_email)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const match = await bcrypt.compare(user_password, user.user_password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // onboarding check
        const { data: genres } = await supabase
            .from("GENRE_PREFERENCES")
            .select('genre_selected')
            .eq('user_id', user.user_id);

        const genresCompleted = genres && genres.length >= 3;

        // set session fo r user
        req.session.user = {
            id: user.user_id,
            username: user.user_username,
            email: user.user_email,
            genresCompleted,
        };

        // redirect based on onboarding status
        if (!genresCompleted) {
            return res.status(200).json({ redirect: '/onboarding' }); // first-time login
        }

        res.status(200).json({ redirect: '/index' }); // existing user
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

    
// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error logging out. Please try again.');
        }
        res.redirect('/login');
    });
});

// Add or update anime status, endpoint for added-to-list
router.post("/api/update-list", async (req, res) => {
    const { animeId, status } = req.body;

    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const userId = req.session.user.id;

    try {
        // Insert or update the anime list entry
        const { data, error } = await supabase
            .from("ANIME_LIST")
            .upsert(
                { user_id: userId, anime_id: animeId, status },
                { onConflict: ["user_id", "anime_id"] } // ensure unique user-anime pairing
            );

        if (error) {
            return res.status(500).json({ error: "Failed to update anime list." });
        }

        res.status(200).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ error: "An unexpected error occurred." });
    }
});

// endpoint for toggling favorites
router.post("/api/toggle-favorite", async (req, res) => {
    const { animeId } = req.body;
    console.log("Toggling favorite status for Anime ID:", animeId);

    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const userId = req.session.user.id;

    if (!animeId) {
        return res.status(400).json({ error: "Missing anime ID." });
    }

    try {
        console.log("Checking if the anime is already in favorites...");
        const { data: favoriteEntry, error: fetchError } = await supabase
            .from("FAVORITES")
            .select("favorite_id")
            .eq("user_id", userId)
            .eq("anime_id", animeId)
            .maybeSingle();


        if (fetchError) {
            return res.status(500).json({ error: "Failed to toggle favorite status." });
        }

        if (favoriteEntry) {
            const { error: deleteError } = await supabase
                .from("FAVORITES")
                .delete()
                .eq("favorite_id", favoriteEntry.favorite_id);


            if (deleteError) {
                return res.status(500).json({ error: "Failed to remove favorite." });
            }

            return res.status(200).json({ isFavorite: false });
        } else {
            const { error: insertError } = await supabase
                .from("FAVORITES")
                .insert([{ user_id: userId, anime_id: animeId }]);


            if (insertError) {
                return res.status(500).json({ error: "Failed to add favorite." });
            }

            return res.status(200).json({ isFavorite: true });
        }
    } catch (err) {
        return res.status(500).json({ error: "Internal server error." });
    }
});

// endpoint for updaitng anime status for profile
router.post('/api/update-anime-status', async (req, res) => {
    const { animeId, status } = req.body;

    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const userId = req.session.user.id;

    if (!animeId || !status) {
        return res.status(400).json({ error: 'Missing anime ID or status.' });
    }

    try {
        const { error } = await supabase
            .from('ANIME_LIST')
            .update({ status })
            .eq('user_id', userId)
            .eq('anime_id', animeId);

        if (error) {
            console.error('Error updating anime status:', error.message);
        }

        res.status(200).json({ message: 'Anime status updated successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// delete aniem from list
router.delete('/api/delete-anime', async (req, res) => {
    const { animeId } = req.body;

    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const userId = req.session.user.id;

    if (!animeId) {
        return res.status(400).json({ error: 'Missing anime ID.' });
    }

    try {
        const { error } = await supabase
            .from('ANIME_LIST')
            .delete()
            .eq('user_id', userId)
            .eq('anime_id', animeId);

        if (error) {
            return res.status(500).json({ error: 'Failed to delete anime.' });
        }

        return res.status(200).json({ message: 'Anime deleted successfully.' });
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

// delete anime from favorites for profile
router.delete('/api/remove-favorite', async (req, res) => {
    const { animeId } = req.body;

    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const userId = req.session.user.id;

    if (!animeId) {
        return res.status(400).json({ error: 'Missing anime ID.' });
    }

    try {
        const { error } = await supabase
            .from('FAVORITES') 
            .delete()
            .eq('user_id', userId)
            .eq('anime_id', animeId);

        if (error) {
            return res.status(500).json({ error: 'Failed to remove favorite.' });
        }

        return res.status(200).json({ message: 'Favorite removed successfully.' });
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error.' });
    }
});



module.exports = router;
