document.addEventListener('DOMContentLoaded', () => {
    // Fetch recommendations when the page loads
    fetchRecommendations();

    // Handle click on "Change Genre Preferences" button
    document.getElementById('change-preferences').addEventListener('click', () => {
        window.location.href = '/onboarding'; // Explicitly navigate to onboarding
    });
});

  // Fetch recommendations logic remains the same
  async function fetchRecommendations() {
    const loader = document.querySelector(".loader");
    const content = document.getElementById("main-content");
    loader.style.display = "flex";

    try {
      const response = await fetch('/api/recommendations');
      if (!response.ok) {
        const errorData = await response.json();
        document.getElementById('content').innerHTML = `<p>${errorData.error || 'Failed to load recommendations.'}</p>`;
        return;
      }

      const { genres } = await response.json();

      if (!genres || genres.length === 0) {
        document.getElementById('content').innerHTML = '<p>No genre preferences found. Please update your preferences.</p>';
        return;
      }

      // Fetch anime for each genre using AniList API
      const genreSections = await Promise.all(
        genres.map(async (genre) => {
          const animeData = await fetchAnimesForGenre(genre.genre_selected);
          return `
            <div class="genre-section">
              <div class="genre-title">${genre.genre_selected}</div>
              <div class="anime-list">
                ${animeData
                  .map(
                    (anime) => `
                      <div class="anime-card">
                        <img src="${anime.coverImage.medium}" alt="${anime.title.romaji}">
                        <p>${anime.title.romaji}</p>
                      </div>
                    `
                  )
                  .join('')}
              </div>
            </div>
          `;
        })
      );

      loader.style.display = "none";
      content.style.display = "flex";
      document.getElementById('content').innerHTML = genreSections.join('');
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      loader.style.display = "none";
      content.style.display = "flex";
      document.getElementById('content').innerHTML = '<p>Failed to load recommendations. Please try again later.</p>';
    }
  }

  // Fetch anime for each genre logic remains the same
  async function fetchAnimesForGenre(genre) {
    const query = `
      query ($genre: String) {
        Page(perPage: 6) {
          media(genre: $genre, type: ANIME, sort: POPULARITY_DESC) {
            title {
              romaji
            }
            coverImage {
              medium
            }
          }
        }
      }
    `;

    const variables = { genre };

    try {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });

      const data = await response.json();
      return data.data.Page.media || [];
    } catch (err) {
      console.error(`Error fetching anime for genre "${genre}":`, err);
      return [];
    }
  }