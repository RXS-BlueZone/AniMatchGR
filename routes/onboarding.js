const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// initialize Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// route to save genres
router.post('/api/save-genres', async (req, res) => {
    const { genres } = req.body;

    if (!req.session.user || !req.session.user.id) {
        return res.status(401).send('Unauthorized: User ID is missing.');
    }

    if (!Array.isArray(genres) || genres.length < 3) {
        return res.status(400).send('Please select at least three genres.');
    }

    try {
        const userId = req.session.user.id;

        // delete existing genres for the user
        await supabase
            .from('GENRE_PREFERENCES')
            .delete()
            .eq('user_id', userId);

        // insert new genres
        const genreEntries = genres.map((genre) => ({
            user_id: userId,
            genre_selected: genre,
        }));

        const { error } = await supabase.from('GENRE_PREFERENCES').insert(genreEntries);

        if (error) {
            return res.status(500).send('Error saving genres.');
        }

        // udate session to mark onboarding as complete
        req.session.user.genresCompleted = true;

        // go back to recommendations after onboarding
        res.status(200).json({ redirect: '/recommendations' });
    } catch (err) {
        res.status(500).send('Server error. Please try again later.');
    }
});

module.exports = router;
