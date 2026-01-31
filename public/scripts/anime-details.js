document.addEventListener("DOMContentLoaded", () => {
  const animeID = getAnimeIDFromURL();
  if (animeID) {
    fetchAnimeDetails(animeID);
  } else {
    console.error("No anime ID provided in the URL.");
  }
});

let formatList = ["TV", "ONA", "OVA"];
let rankingInfoList = [];
let animeObject;
let characters;
let anime;
let animeID;
let areDataFetched = false;

// get anime details based on animeID as clicked
function fetchAnimeDetails(animeID, perPageCount = 6) {
  $.ajax({
    url: "https://graphql.anilist.co",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      query: `
    query ($id: Int) {
      Media(id: $id) {
        id
        title {
          romaji
          english
          native
        }
        synonyms
        description
        bannerImage
        coverImage {
          extraLarge
        }
        rankings {
          rank
          type
          context
          year
          season
        }
        stats {
          scoreDistribution {
            score
            amount
          }
        }
        trailer {
          id
        }
        format
        episodes
        duration
        status
        startDate {
          year
          month
          day
        }
        endDate {
          year
          month
          day
        }
        nextAiringEpisode {
          timeUntilAiring
          episode
        }
        rankings {
          rank
          allTime
          context
        }
        season
        seasonYear
        averageScore
        meanScore
        popularity
        favourites
        studios(isMain: true) {
          edges {
            node {
              name
            }
          }
        }
        source
        hashtag
        genres
      }
    }
  `,
      variables: {
        id: animeID,
      },
    }),
    success: function (result) {
      anime = result.data.Media;
      const scoreDistribution = anime.stats.scoreDistribution;
      displayAnimeDetails(anime);
      fetchCharacterDetails(animeID, perPageCount);
      fetchCharacterDetails2(animeID);
      fetchRelationDetails(animeID);
      fetchRecommendationDetails(animeID);
      fetchTagDetails(animeID);
      fetchProducers(animeID);
      displayScoreDistribution(scoreDistribution);
      displayAiringInfo(anime);
      handleSections(animeID);
      areDataFetched = true;
    },
    error: function (error) {
      console.error("Error fetching anime details:", error);
    },
  });
}

// get anime ID from URL
function getAnimeIDFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}


function displayAiringInfo(anime) {
  const airingEpElement = document.getElementById("airing-ep");
  const airingTimeElement = document.getElementById("airing-time");
  const firstInfoElement = document.querySelector(".info-item:first-child");

  if (anime.nextAiringEpisode) {
    const airingTime = anime.nextAiringEpisode.timeUntilAiring;
    const airingEpisode = anime.nextAiringEpisode.episode;

    let remainingSeconds = airingTime;
    const days = Math.floor(remainingSeconds / (24 * 3600));
    remainingSeconds %= 24 * 3600;
    const hours = Math.floor(remainingSeconds / 3600);
    remainingSeconds %= 3600;
    const mins = Math.floor(remainingSeconds / 60);

    airingEpElement.textContent = airingEpisode;
    airingTimeElement.textContent = `${days}d ${hours}h ${mins}m`;
    airingEpElement.style.display = "inline";
    airingTimeElement.style.display = "inline";
  } else {
    airingEpElement.style.display = "none";
    airingTimeElement.style.display = "none";
    firstInfoElement.style.display = "none";
  }
}

function fetchRelationDetails(animeId) {
  $.ajax({
    url: "https://graphql.anilist.co",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      query: `
    query ($id: Int) {
      Media(id: $id) {
        relations {
          edges {
            node {
              title {
                romaji
                english
                native
              }
              coverImage {
                extraLarge
              }
              source
              status
              format
            }
          }
        }
      }
    }
  `,
      variables: {
        id: animeId,
      },
    }),
    success: function (result) {
      console.log("Fetched relation details successfully");
      const relations = result.data.Media.relations.edges;
      displayRelationDetails(relations);
    },
    error: function (error) {
      console.error(error);
    },
  });
}

function displayAnimeDetails(anime) {
  const title =
    anime.title.english ||
    anime.title.romaji ||
    anime.title.native ||
    "No Title Available";
  const description = anime.description || "No Description Available";
  const bannerImage = anime.bannerImage || "";
  const coverImage = anime.coverImage.extraLarge || "";
  const averageScore = anime.averageScore || "N/A";
  const meanScore = anime.meanScore || "N/A";
  const popularity = anime.popularity || "N/A";
  const favourites = anime.favourites || "N/A";
  const format = anime.format || "N/A";
  const episodes = anime.episodes || "N/A";
  const duration = anime.duration || "N/A";
  const status = anime.status || "N/A";
  const startDate = anime.startDate
    ? `${anime.startDate.year}-${anime.startDate.month}-${anime.startDate.day}`
    : "N/A";
  const endDate = anime.endDate
    ? `${anime.endDate.year}-${anime.endDate.month}-${anime.endDate.day}`
    : "N/A";
  const season = anime.season || "N/A";
  const seasonYear = anime.seasonYear || "N/A";
  const source = anime.source
    ? anime.source
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "N/A";

  console.log(anime.rankings);

  if (anime.rankings && anime.rankings.length > 0) {
    // sort the rankings by priority
    anime.rankings.sort((a, b) => {
      const priorityA = getRankingPriority(a);
      const priorityB = getRankingPriority(b);
      return priorityA - priorityB;
    });

    // take up to the top 2 rankings
    rankingInfoList = anime.rankings.slice(0, 2).map(formatRanking);

    // if fewer than 2 rankings, pad with N/A
    while (rankingInfoList.length < 2) {
      rankingInfoList.push({
        type: "N/A",
        context: "N/A",
        rank: "N/A",
        year: "N/A",
        season: "N/A",
      });
    }
  } else {
    // if no rankings
    rankingInfoList.push({
      type: "N/A",
      context: "N/A",
      rank: "N/A",
      year: "N/A",
      season: "N/A",
    });
    rankingInfoList.push({
      type: "N/A",
      context: "N/A",
      rank: "N/A",
      year: "N/A",
      season: "N/A",
    });
  }

  const hashtags = anime.hashtag || "N/A";
  const genres = anime.genres
    ? anime.genres.map((genre) => `<a href=''>${genre}</a>`).join("<br>")
    : "N/A";
  const synonyms = anime.synonyms ? anime.synonyms.join("<br>") : "N/A";
  const mainStudio = anime.studios.edges
    .map((edge) => edge.node.name)
    .join("<br>");
  const scoreDistribution = anime.stats.scoreDistribution
    .map((score) => `${score.score}: ${score.amount}`)
    .join(", ");
  const trailerSrc = anime.trailer ? anime.trailer.id : "";

  const formattedStartDate = formatDate(anime.startDate);
  const formattedEndDate = formatDate(anime.endDate);

  document.title = `${anime.title.romaji} (${anime.title.english}) - AniMatch`;

  console.log(bannerImage);

  const bannerElement = document.querySelector(".banner");
  const detailsLeftElement = document.querySelector(".details-left");
  const bannerImgElement = document.getElementById("banner-img");
  const header = document.querySelector("header");
  if (bannerImage) {
    bannerImgElement.src = bannerImage;
    bannerElement.style.display = "block";
    header.classList.remove("no-banner");
  } else {
    bannerElement.style.display = "none";
    detailsLeftElement.style.marginTop = "0";
    header.classList.add("no-banner");
  }

  document.getElementById("cover-img").src = coverImage;
  document.getElementById("anime-title").textContent = title;
  document.getElementById("anime-description").innerHTML = description;

  const allTimeRank = document.getElementById("rank-alltime");
  const contextRank = document.getElementById("rank-context");
  const allTimeRank2 = document.getElementById("rank-alltime-2");
  const contextRank2 = document.getElementById("rank-context-2");

  const rankItem = document.getElementById("rank-item");
  const rankItem2 = document.getElementById("rank-item-2");

  if (rankingInfoList.length > 1) {
    displayRanking(0, allTimeRank, contextRank, rankItem);
    displayRanking(1, allTimeRank2, contextRank2, rankItem2);
  } else if (rankingInfoList.length === 1) {
    displayRanking(0, allTimeRank, contextRank, rankItem);
    rankItem2.style.display = "none";
  } else {
    rankItem.style.display = "none";
    rankItem2.style.display = "none";
  }

  let formattedFormat = formatList.includes(format)
    ? format
    : format.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

  document.getElementById("format").textContent = formattedFormat;
  document.getElementById("ep-count").textContent = episodes;
  document.getElementById("ep-duration").textContent = duration + " mins";
  document.getElementById("status").textContent = status
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
  document.getElementById("start-date").textContent = formattedStartDate;
  document.getElementById("end-date").textContent = formattedEndDate;
  document.getElementById("season").textContent =
    season.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()) +
    " " +
    seasonYear;
  document.getElementById("average-score").textContent = averageScore + "%";
  document.getElementById("mean-score").textContent = meanScore + "%";
  document.getElementById("popularity").textContent = popularity;
  document.getElementById("favorites").textContent = favourites;
  document.getElementById("studios").innerHTML = mainStudio;
  document.getElementById("source").textContent = source
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
  document.getElementById("hashtag").textContent = hashtags;
  document.getElementById("genres").innerHTML = genres;
  document.getElementById("romaji-title").textContent = anime.title.romaji;
  document.getElementById("english-title").textContent = title;
  document.getElementById("native-title").textContent = anime.title.native;
  document.getElementById("synonyms").innerHTML = synonyms;

  var tag = document.createElement("script");
  tag.src = "https://www.youtube.com/player_api";
  var firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  if (trailerSrc) {
    var player;
    window.onYouTubeIframeAPIReady = function () {
      const videoId = anime.trailer ? anime.trailer.id : "";

      if (videoId) {
        new YT.Player("ytplayer", {
          height: "250",
          width: "500",
          videoId: videoId,
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
          },
        });
      } else {
        console.log("No video ID found.");
      }
    };
  } else {
    document.getElementById("ytplayer").style.display = "none";
    document.querySelector(".trailer").innerHTML =
      "<p>No trailer available.</p>";
  }
}

function onPlayerReady(event) {
  console.log("Player ready");
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    console.log("Video ended");
  } else if (event.data === YT.PlayerState.ERROR) {
    console.error("YouTube Player Error:", event);
  }
}

function onPlayerError(event) {
  let errorMessage;
  switch (event.data) {
    case 2:
      errorMessage =
        "The request contains an invalid parameter value. For example, this error occurs if you specify a video ID that does not have any content associated with it.";
      break;
    case 5:
      errorMessage =
        "The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.";
      break;
    case 100:
      errorMessage =
        "The video requested was not found. This error occurs when a video is removed (for any reason) or if a video is set to private.";
      break;
    case 101: // when the video is unavailable.
      errorMessage =
        "The owner of the requested video does not allow it to be played in embedded players.";
      break;
    default:
      errorMessage = "An unknown error occurred.";
  }
  showError(errorMessage);
}

function showError(message) {
  const errorMessage = document.getElementById("error-message");
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
  const playerContainer = document.getElementById("ytplayer");
  playerContainer.style.display = "none"; // hide the player container if there is an error
}

function fetchCharacterDetails(animeId, characterCount = 6) {
  $.ajax({
    url: "https://graphql.anilist.co",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      query: `
    query ($id: Int, $perPage: Int) {
      Media(id: $id) {
        characters(sort: RELEVANCE, page: 1, perPage: $perPage) {
          edges {
            role
            node {
              name {
                full
              }
              image {
                large
              }
            }
            voiceActors(language: JAPANESE) {
              name {
                full
              }
              languageV2
              image {
                large
              }
            }
          }
        }
      }
    }
  `,
      variables: {
        id: animeId,
        perPage: characterCount,
      },
    }),
    success: function (result) {
      const characters = result.data.Media.characters.edges;

      const sortedCharacters = characters.sort((a, b) => {
        if (a.role === "MAIN" && b.role !== "MAIN") return -1;
        if (a.role !== "MAIN" && b.role === "MAIN") return 1;
        return b.node.favourites - a.node.favourites;
      });

      displayCharacterDetails(sortedCharacters);
    },
    error: function (error) {
      console.error(error);
    },
  });
}

function displayCharacterDetails(characters) {
  // Above code
  const characterContainer = document.querySelector(".characters");
  characterContainer.innerHTML = ""; // Clear previous content

  if (!characters || characters.length === 0) {
    console.log("No recommendations found");
    characterContainer.innerHTML = "<p>No characters found for this anime.</p>";
    return;
  }

  characters.forEach((characterEdge) => {
    const character = characterEdge.node;
    const role = characterEdge.role;
    const characterName = character.name.full;
    const characterImage = character.image.large;
    const voiceActor = characterEdge.voiceActors[0];

    const formattedRole = role
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());

    const characterItemHTML = `
      <div class="character-item">
        <div class="character-img-container">
          <img src="${characterImage}" alt="${characterName}" class="character-img" />
        </div>
        <div class="character-details">
          <p class="character-name">${characterName}</p>
          <p class="character-role">${formattedRole}</p>
        </div>
        ${
          voiceActor
            ? `
          <div class="voice-actor">
            <div class="va-details">
              <p class="va-name">${voiceActor.name.full}</p>
              <p class="va-nationality">${voiceActor.languageV2}</p>
            </div>
            <div class="va-img-container">
              <img src="${voiceActor.image.large}" alt="${voiceActor.name.full}" class="va-img" />
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;

    characterContainer.innerHTML += characterItemHTML;
  });
}

function displayRelationDetails(relations) {
  const relationContainer = document.querySelector(".relations-wrapper"); 
  relationContainer.innerHTML = ""; // clear content

  if (!relations || relations.length === 0) {
    console.log("No relations found");
    relationContainer.innerHTML = "<p>No relations found for this anime.</p>";
    return;
  }

  for (const relationEdge of relations) {
    const relation = relationEdge.node;
    const title =
      relation.title.english ||
      relation.title.romaji ||
      relation.title.native ||
      "No Title Available";
    const coverImage = relation.coverImage.extraLarge || "";
    const status = relation.status || "N/A";
    const format = relation.format || "N/A";

    let formattedFormat = formatList.includes(format)
      ? format
      : format.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

    const relationItem = `
      <div class="relations-item">
        <img src="${coverImage}" alt="${title}" class="relation-img" />
        <div class="relation-details">
          <div>
            <p>Source</p>
            <p class="relation-title">${title}</p>
          </div>
          <div>
            <p class="relation-format">${formattedFormat}</p>
            <p>•</p>
            <p class="relation-status">${status
              .toLowerCase()
              .replace(/\b\w/g, (char) => char.toUpperCase())}</p>
          </div>
        </div>
      </div>
    `;
    relationContainer.innerHTML += relationItem;
  }
}

function fetchRecommendationDetails(animeId) {
  $.ajax({
    url: "https://graphql.anilist.co",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      query: `
    query ($id: Int) {
      Media(id: $id) {
        recommendations(sort: RATING_DESC, page: 1, perPage: 7) {
          edges {
            node {
              mediaRecommendation {
                id
                title {
                  romaji
                  english
                  native
                }
                coverImage {
                  extraLarge
                }
              }
            }
          }
        }
      }
    }
  `,
      variables: {
        id: animeId,
      },
    }),
    success: function (result) {
      const recommendations = result.data.Media.recommendations.edges;
      displayRecommendationDetails(recommendations);
    },
    error: function (error) {
      console.error(error);
    },
  });
}

function displayRecommendationDetails(recommendations) {
  const recommendationContainer = document.querySelector(".recommendations");
  recommendationContainer.innerHTML = "";

  if (!recommendations || recommendations.length === 0) {
    console.log("No recommendations found");
    recommendationContainer.innerHTML =
      "<p>No recommendations found for this anime.</p>";
    return;
  }

  for (const recommendationEdge of recommendations) {
    const recommendation = recommendationEdge.node.mediaRecommendation;
    const title =
      recommendation.title.english ||
      recommendation.title.romaji ||
      recommendation.title.native ||
      "No Title Available";
    const coverImage = recommendation.coverImage.extraLarge || "";
    const animeId = recommendation.id;

    const recommendationItem = `
      <a href="/anime-details?id=${animeId}" class="recommendation-link"  style="text-decoration:none; margin-top: 10px">
        <div class="recommendation-item">
          <img src="${coverImage}" alt="${title}" class="recommendation-img" />
          <p class="recommendation-title">${title}</p>
        </div>
      </a>
    `;
    recommendationContainer.innerHTML += recommendationItem;
  }
}

function fetchTagDetails(animeId) {
  $.ajax({
    url: "https://graphql.anilist.co",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      query: `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        tags {
          name
          description
          isMediaSpoiler
        }
      }
    }
  `,
      variables: {
        id: animeId,
      },
    }),
    success: function (result) {
      const tags = result.data.Media.tags;
      displayTagDetails(tags);
    },
    error: function (error) {
      console.error(error);
    },
  });
}

function displayTagDetails(tags) {
  const tagContainer = document.querySelector(".tags");
  tagContainer.innerHTML = "";

  if (!tags || tags.length === 0) {
    console.log("No tags found");
    tagContainer.innerHTML = "<p>No tags found for this anime.</p>";
    return;
  }

  for (const tag of tags) {
    const tagName = tag.name || "N/A";
    const tagDescription = tag.description || "No Description Available";
    const isSpoiler = tag.isMediaSpoiler || false;

    const tagItem = `
      <div class="tag-item ${isSpoiler ? "spoiler" : ""}">
        <div class="tags-desc">
          <p class="tag">${tagName}</p>
          <span class="tag-info">${tagDescription}</span>
        </div>
      </div>
    `;
    tagContainer.innerHTML += tagItem;
  }
}

function fetchProducers(animeId) {
  $.ajax({
    url: "https://graphql.anilist.co",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      query: `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        studios(isMain : false) {
            edges {
              node {
                name
              }
            }
          }
      }
    }
  `,
      variables: {
        id: animeId,
      },
    }),
    success: function (result) {
      const producers = result.data.Media.studios.edges.map(
        (edge) => edge.node
      );
      displayProducers(producers);
    },
    error: function (error) {
      console.error(error);
    },
  });
}

function displayProducers(producers) {
  const producerElement = producers
    .map((producer) => (producer.name ? producer.name : "N/A"))
    .join("<br>");
  document.getElementById("producers").innerHTML = producerElement;
}

function displayScoreDistribution(scoreDistribution) {
  const container = document.querySelector(".scores");
  const containerHeight = container.clientHeight;

  // find the maximum amount dynamically for display
  let maxAmount = 0;
  for (const score in scoreDistribution) {
    maxAmount = Math.max(maxAmount, scoreDistribution[score].amount);
  }

  for (const score in scoreDistribution) {
    const scoreData = scoreDistribution[score];
    const selector = `.score-item .score-span[id="${scoreData.score}"]`;
    const scoreSpan = document.querySelector(selector);
    const scoreCountSpan =
      scoreSpan.parentElement.querySelector(".score-count");
    const scoreCateg = scoreSpan.parentElement.querySelector(".score-categ");

    if (!scoreSpan || !scoreCountSpan || !scoreCateg) {
      console.error("Score span or score count span not found.");
    }

    scoreCountSpan.textContent = scoreData.amount;
    scoreCateg.textContent = scoreData.score;

    let percentage;
    if (maxAmount === 0) {
      percentage = 0;
    } else {
      percentage = scoreData.amount / maxAmount;
    }

    let height;
    height = percentage * containerHeight;
    scoreSpan.style.height = `${height}px`;
  }
}

function fetchRelationDetails(animeId) {
  console.log("fetchRelationDetails called with animeId:", animeId);
  $.ajax({
    url: "https://graphql.anilist.co",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      query: `
        query ($id: Int) {
          Media(id: $id) {
            relations {
              edges {
                node {
                  title {
                    romaji
                    english
                    native
                  }
                  coverImage {
                    extraLarge
                  }
                  status
                  format
                }
              }
            }
          }
        }
      `,
      variables: {
        id: animeId,
      },
    }),
    success: function (result) {
      console.log("Fetched relation details successfully");
      const relations = result.data.Media.relations.edges;
      displayRelationDetails(relations);
    },
    error: function (error) {
      console.error("Error fetching relation details:", error);
    },
  });
}

function formatDate(dateObject) {
  if (!dateObject || !dateObject.year || !dateObject.month || !dateObject.day) {
    return "N/A"; // Handle missing or incomplete date data gracefully
  }

  const year = parseInt(dateObject.year, 10);
  const month = parseInt(dateObject.month, 10) - 1; //Months are 0-indexed in JavaScript Date
  const day = parseInt(dateObject.day, 10);

  //Validate the date components.  This prevents crashes from bad data.
  if (
    isNaN(year) ||
    isNaN(month) ||
    isNaN(day) ||
    month < 0 ||
    month > 11 ||
    day < 1 ||
    day > 31
  ) {
    return "N/A";
  }

  const date = new Date(year, month, day);

  //Check if the created date is valid.  This catches invalid date combinations (like Feb 30th).
  if (isNaN(date.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatRanking(ranking) {
  const rank =
    ranking.rank !== null && !isNaN(ranking.rank) ? ranking.rank : "N/A";
  const year =
    ranking.year !== null && !isNaN(ranking.year) ? ranking.year : "N/A";
  const season = ranking.season !== null ? ranking.season : "N/A";
  return {
    type: ranking.type || "N/A",
    context: ranking.context || "N/A",
    rank: rank,
    year: year,
    season: season,
  };
}

function displayRanking(index, rankElement, contextElement, containerElement) {
  const ranking = rankingInfoList[index];

  // Remove any existing icon
  const existingIcon = containerElement.querySelector("i");
  if (existingIcon) {
    containerElement.removeChild(existingIcon);
  }

  if (ranking.rank !== "N/A") {
    rankElement.textContent = ranking.rank;
    let contextText = ranking.context;

    //Corrected logic for parenthesis and display
    if (ranking.year !== "N/A" && ranking.season !== "N/A") {
      contextText += ` ${ranking.season
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase())} ${ranking.year}`;
    } else if (ranking.year !== "N/A") {
      contextText += ` ${ranking.year}`;
    } else if (ranking.season !== "N/A") {
      contextText += ` ${ranking.season}`;
    }

    contextElement.textContent = contextText;

    const icon = document.createElement("i");
    icon.classList.add("fa-solid");
    if (ranking.context.includes("rated")) {
      icon.classList.add("fa-star");
    } else if (ranking.context.includes("popular")) {
      icon.classList.add("fa-heart");
    }

    if (containerElement.firstChild) {
      containerElement.insertBefore(icon, containerElement.firstChild);
    } else {
      containerElement.appendChild(icon);
    }
  } else {
    rankElement.textContent = "N/A";
    contextElement.textContent = "N/A";
    containerElement.style.display = "none";
  }
}

function getRankingPriority(ranking) {
  if (
    ranking.type === "RATED" &&
    ranking.context === "highest rated all time"
  ) {
    return 1;
  } else if (
    ranking.type === "POPULAR" &&
    ranking.context === "most popular all time"
  ) {
    return 2;
  } else if (
    ranking.type === "RATED" &&
    ranking.context === "highest rated" &&
    ranking.season === null
  ) {
    return 3;
  } else {
    return 4; // Lower priority for other rankings
  }
}

function handleSections(animeId) {
  const overviewBtn = document.getElementById("overview-btn");
  const charactersBtn = document.getElementById("characters-btn");
  const overviewSections = document.querySelectorAll(".overview-section");
  const charactersSection = document.getElementById("characters-section");

  // Ensure elements exist before adding event listeners.  This is crucial.
  if (
    !overviewBtn ||
    !charactersBtn ||
    !overviewSections ||
    !charactersSection
  ) {
    console.error("DOM elements not found in handleSections");
    return; //Exit early if elements are not found.
  }

  // Set initial state - show overview
  overviewSections.forEach((section) => (section.style.display = "block")); //Use block instead of flex to ensure consistent behavior across browsers.
  charactersSection.style.display = "none";
  overviewBtn.classList.add("active-section");
  charactersBtn.classList.remove("active-section");

  overviewBtn.addEventListener("click", () => {
    overviewSections.forEach((section) => (section.style.display = "block"));
    charactersSection.style.display = "none";
    overviewBtn.classList.add("active-section");
    charactersBtn.classList.remove("active-section");
  });

  charactersBtn.addEventListener("click", () => {
    overviewSections.forEach((section) => (section.style.display = "none"));
    charactersSection.style.display = "block";
    overviewBtn.classList.remove("active-section");
    charactersBtn.classList.add("active-section");
  });
}

function displayCharacterDetails2(characters) {
  // Above code
  const characterContainer = document.getElementById("characters2");
  characterContainer.innerHTML = ""; // Clear previous content

  if (!characters || characters.length === 0) {
    console.log("No recommendations found");
    characterContainer.innerHTML = "<p>No characters found for this anime.</p>";
    return;
  }

  for (const characterEdge of characters) {
    const character = characterEdge.node;
    const role = characterEdge.role;
    const characterName = character.name.full;
    const characterImage = character.image.large;
    const voiceActor = characterEdge.voiceActors[0];

    const formattedRole = role
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());

    const characterItemHTML = `
      <div class="character-item">
        <div class="character-img-container">
          <img src="${characterImage}" alt="${characterName}" class="character-img" />
        </div>
        <div class="character-details">
          <p class="character-name">${characterName}</p>
          <p class="character-role">${formattedRole}</p>
        </div>
        ${
          voiceActor
            ? `
          <div class="voice-actor">
            <div class="va-details">
              <p class="va-name">${voiceActor.name.full}</p>
              <p class="va-nationality">${voiceActor.languageV2}</p>
            </div>
            <div class="va-img-container">
              <img src="${voiceActor.image.large}" alt="${voiceActor.name.full}" class="va-img" />
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;

    characterContainer.innerHTML += characterItemHTML;
  }
}

function fetchCharacterDetails2(animeId) {
  $.ajax({
    url: "https://graphql.anilist.co",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      query: `
    query ($id: Int) {
      Media(id: $id) {
        characters(sort: RELEVANCE) {
          edges {
            role
            node {
              name {
                full
              }
              image {
                large
              }
            }
            voiceActors(language: JAPANESE) {
              name {
                full
              }
              languageV2
              image {
                large
              }
            }
          }
        }
      }
    }
  `,
      variables: {
        id: animeId,
      },
    }),
    success: function (result) {
      const characters = result.data.Media.characters.edges;

      const sortedCharacters = characters.sort((a, b) => {
        if (a.role === "MAIN" && b.role !== "MAIN") return -1;
        if (a.role !== "MAIN" && b.role === "MAIN") return 1;
        return b.node.favourites - a.node.favourites;
      });

      displayCharacterDetails2(sortedCharacters);
      characters = sortedCharacters;
    },
    error: function (error) {
      console.error(error);
    },
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const logoutBtn = document.getElementById('logout-btn');

  try {
      // Fetch session status from the server
      const response = await fetch('/api/session');
      const sessionData = await response.json();

      if (sessionData.loggedIn) {
          // User is logged in
          logoutBtn.textContent = 'Logout';

          logoutBtn.addEventListener('click', async () => {
              // Log out the user
              const logoutResponse = await fetch('/logout', { method: 'GET' });
              if (logoutResponse.ok) {
                  window.location.href = '/login'; // Redirect to login page after logout
              } else {
                  alert('Failed to logout. Please try again.');
              }
          });
      } else {
          // User is not logged in
          logoutBtn.textContent = 'Login';

          logoutBtn.addEventListener('click', () => {
              window.location.href = '/login'; // Redirect to login page
          });
      }
  } catch (error) {
      console.error('Error checking session status:', error);
      logoutBtn.textContent = 'Login'; // Default to "Login" on error
      logoutBtn.addEventListener('click', () => {
          window.location.href = '/login'; // Redirect to login page
      });
  }
});