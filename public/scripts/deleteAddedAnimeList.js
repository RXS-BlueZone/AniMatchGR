document.addEventListener('click', async (event) => {
    if (event.target.closest('.remove-anime-btn')) {
        const removeBtn = event.target.closest('.remove-anime-btn');
        const animeRow = removeBtn.closest('.anime-list-row');
        const animeId = animeRow.dataset.animeId;

        if (confirm('Are you sure you want to delete this anime?')) {
            try {
                const response = await fetch('/api/delete-anime', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ animeId }),
                });

                const result = await response.json();

                if (response.ok) {
                    animeRow.remove(); // Remove from DOM
                    console.log('Anime deleted successfully:', result.message);
                } else {
                    console.error('Failed to delete anime:', result.error);
                    alert(`Failed to delete the anime. Error: ${result.error}`);
                }
            } catch (error) {
                console.error('Error during delete request:', error);
                alert('An error occurred while trying to delete the anime. Please check the console for details.');
            }
        }
    }
});
