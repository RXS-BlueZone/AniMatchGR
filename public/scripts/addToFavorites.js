document.addEventListener("DOMContentLoaded", async () => {
    const animeID = getAnimeIDFromURL(); 
    console.log("Anime ID:", animeID); // for debugging purposes
    if (!animeID) {
        console.error("Anime ID is missing!");
        return;
    }

    const favBtn = document.getElementById("fav-btn");
    const favIcon = favBtn.querySelector("i");

    try {
        // gwtthe current favorite status from the backend
        const response = await fetch(`/api/favorite-status?id=${animeID}`);
        const result = await response.json();
        console.log("Favorite Status API Response:", result); // Log response for debugging

        if (response.ok) {
            const isFavorite = result.isFavorite;

            // Update the button state when toggling favorite
            if (isFavorite) {
                favIcon.classList.remove("white-heart");
                favIcon.classList.add("red-heart");
            } else {
                favIcon.classList.add("white-heart");
                favIcon.classList.remove("red-heart");
            }
        } else {
            console.error("Failed to fetch favorite status:", result.error);
        }
    } catch (error) {
        console.error("Error fetching favorite status:", error);
    }

    //  event listener for toggling favorite
    favBtn.addEventListener("click", async () => {
        console.log("Favorite button clicked for Anime ID:", animeID);
    
        try {
            // toggle the favorite status in the database
            const response = await fetch("/api/toggle-favorite", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ animeId: animeID }),
            });
    
            const result = await response.json();
            console.log("Toggle Favorite API Response:", result);
    
            if (response.ok) {
                // update the button state when toggling favorite
                const isFavorite = result.isFavorite;
                if (isFavorite) {
                    favIcon.classList.remove("white-heart");
                    favIcon.classList.add("red-heart");
                } else {
                    favIcon.classList.add("white-heart");
                    favIcon.classList.remove("red-heart");
                }
            } else {
                console.error("Failed to toggle favorite status:", result.error);
                alert("Failed to toggle favorite status: " + result.error);
            }
        } catch (error) {
            console.error("Error toggling favorite status:", error);
            alert("An error occurred while toggling favorite status.");
        }
    });
    
});
