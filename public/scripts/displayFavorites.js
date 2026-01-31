document.addEventListener('DOMContentLoaded', async () => {
    const favoritesContainer = document.querySelector('.favorites'); // container

    try {
        // get favorites from the server
        const response = await fetch('/api/favorites');
        const { favorites } = await response.json();

        if (!response.ok || !favorites) {
            console.error('Failed to fetch favorites:', response.statusText);
            favoritesContainer.innerHTML = `<p>Error fetching your favorites list.</p>`;
            return;
        }

        // Loop through favorites and get details from AniList
        for (const favorite of favorites) {
            const animeDetails = await fetchAnimeDetails(favorite.anime_id);

            if (animeDetails) {
                const favoriteItem = `
                    <div class="favorite-item">
                        <img src="${animeDetails.coverImage.extraLarge}" alt="Anime Cover" />
                        <button type="button" class="remove-item" data-anime-id="${favorite.anime_id}">
                            <i class="fa-sharp fa-solid fa-circle-xmark"></i>
                        </button>
                    </div>
                `;

                favoritesContainer.innerHTML += favoriteItem;
            } else {
                console.warn(`Failed to fetch details for Anime ID: ${favorite.anime_id}`);
            }
        }
    } catch (error) {
        console.error('Error fetching and displaying favorites:', error);
        favoritesContainer.innerHTML = `<p>Error loading your favorites. Please try again later.</p>`;
    }
});

// get anime cover image from AniList
async function fetchAnimeDetails(animeID) {
    const query = `
  query ($id: Int) {
            Media(id: $id) {
                id
                title {
                    romaji
                }
                coverImage {
                    extraLarge
                }
            }
        }
    `;

    try {
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables: { id: animeID },
            }),
        });

        const result = await response.json();

        if (response.ok && result.data.Media) {
            return result.data.Media;
        } else {
            console.error('Error fetching anime details:', result.errors || response.statusText);
            return null;
        }
    } catch (error) {
        console.error('Error fetching anime details from AniList:', error);
        return null;
    }
}

// Handle removing favorites
document.addEventListener('click', async (event) => {
    if (event.target.closest('.remove-item')) {
        const removeBtn = event.target.closest('.remove-item');
        const animeId = removeBtn.dataset.animeId;

        if (confirm('Are you sure you want to remove this anime from your favorites?')) {
            try {
                const response = await fetch('/api/remove-favorite', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ animeId }),
                });

                const result = await response.json();

                if (response.ok) {
                    // Remove the item from the DOM
                    removeBtn.closest('.favorite-item').remove();
                } else {
                    console.error('Failed to remove favorite:', result.error);
                    alert('Failed to remove favorite. Please try again.');
                }
            } catch (error) {
                console.error('Error removing favorite:', error);
                alert('An error occurred while removing the favorite. Please try again.');
            }
        }
    }
});
