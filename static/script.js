// Key for saving history in localStorage
const SEARCH_HISTORY_KEY = 'weatherwise-history';

/**
 * --- NEW: Gets history from localStorage and builds the new dropdown ---
 */
function populateHistoryDropdown() {
    const history = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || [];
    const dropdown = document.getElementById('history-dropdown');
    
    if (!dropdown) return;

    dropdown.innerHTML = ''; // Clear old items

    if (history.length === 0) {
        // Optional: Show a message if history is empty
        dropdown.innerHTML = '<div class="history-item" style="cursor:default;">No recent searches</div>';
    } else {
        history.forEach(city => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.textContent = city;
            
            // --- NEW: Add click event to each history item ---
            item.addEventListener('click', () => {
                document.querySelector('.searchbar').value = city; // Set search bar value
                weather.search(); // Run the search
                hideHistoryDropdown(); // Hide dropdown after clicking
            });
            dropdown.appendChild(item);
        });
    }

    // Show the dropdown
    dropdown.classList.add('visible');
}

/**
 * --- NEW: Hides the custom dropdown ---
 */
function hideHistoryDropdown() {
    const dropdown = document.getElementById('history-dropdown');
    if (dropdown) {
        dropdown.classList.remove('visible');
    }
}

/**
 * Saves a new city to the search history in localStorage.
 */
function saveSearch(city) {
    if (!city || city.trim() === "") return; // Don't save empty searches

    let history = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || [];
    
    // Remove city if it already exists (so we can move it to the front)
    const existingIndex = history.map(c => c.toLowerCase()).indexOf(city.toLowerCase());
    if (existingIndex > -1) {
        history.splice(existingIndex, 1);
    }

    // Add the new city to the front of the list
    history.unshift(city);

    // Keep only the 10 most recent searches
    history = history.slice(0, 10);

    // Save the updated list back to localStorage
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
}

/**
 * A helper function to get the air quality details
 * based on the PM2.5 value.
 */
function getPm25Details(pm2_5) {
    let text = "";
    let cssClass = "";

    // These breakpoints are based on the standard US AQI
    if (pm2_5 <= 12.0) {
        text = "Good";
        cssClass = "aqi-good";
    } else if (pm2_5 <= 35.4) {
        text = "Moderate";
        cssClass = "aqi-moderate";
    } else if (pm2_5 <= 55.4) {
        text = "Unhealthy for Sensitive";
        cssClass = "aqi-unhealthy-sensitive";
    } else if (pm2_5 <= 150.4) {
        text = "Unhealthy";
        cssClass = "aqi-unhealthy";
    } else if (pm2_5 <= 250.4) {
        text = "Very Unhealthy";
        cssClass = "aqi-very-unhealthy";
    } else {
        text = "Hazardous";
        cssClass = "aqi-hazardous";
    }

    // Return both values as an object
    return { text: text, cssClass: cssClass };
}


let weather = {
    
    fetchWeather : function (city) {
        // Fetch from our own Flask backend endpoint
        fetch("/weather?city=" + encodeURIComponent(city))
            .then((response) => {
                if (!response.ok) {
                    throw new Error("City not found or server error");
                }
                return response.json();
            })
            .then((data) => {
                if (data.error) {
                    // Handle errors sent from our server
                    alert(data.error);
                    document.querySelector(".weather").classList.add("loading");
                } else {
                    this.displayWeather(data);
                }
            })
            .catch((error) => {
                console.error("Error fetching weather:", error);
                alert("Could not retrieve weather data. " + error.message);
            });
    },

    displayWeather: function(data) {
        const { name, icon, description, temp, humidity, speed, pm2_5 } = data;
        
        document.querySelector(".city").innerText = "Weather in " + name;
        document.querySelector(".icon").src = "https://openweathermap.org/img/wn/" + icon + ".png";
        document.querySelector(".description").innerText = description;
        document.querySelector(".temp").innerText = temp + "°C";
        document.querySelector(".humidity").innerText = "Humidity: " + humidity + "%";
        document.querySelector(".wind").innerText = "Wind speed: " + speed + " km/h";
        
        // --- PM2.5 SECTION ---
        let pm25Element = document.querySelector(".pm25");
        let pm25Details = getPm25Details(pm2_5);
        pm25Element.innerText = `PM2.5: ${pm2_5} μg/m³ (${pm25Details.text})`;
        pm25Element.className = "pm25"; 
        pm25Element.classList.add(pm25Details.cssClass);
        // --- END OF PM2.5 SECTION ---

        document.querySelector(".weather").classList.remove("loading");
        
        // --- THIS LINE IS COMMENTED OUT ---
        // document.body.style.backgroundImage = "url('https://source.unsplash.com/1600x900/?" + name + "')"
    },

    search : function() {
        // --- UPDATED THIS FUNCTION ---
        const searchInput = document.querySelector(".searchbar");
        const city = searchInput.value;
        
        this.fetchWeather(city); // Fetch the weather
        saveSearch(city); // Save the search to history
        hideHistoryDropdown(); // Hide dropdown after searching
        searchInput.blur(); // Un-focus the search bar
    }
};

document.querySelector(".search button").addEventListener("click", function() {
    weather.search();
});

document.querySelector(".searchbar").addEventListener("keyup", function(event){
    if(event.key == "Enter"){
        weather.search();
    }
});

// --- NEW: Show dropdown on focus ---
document.querySelector('.searchbar').addEventListener('focus', () => {
    populateHistoryDropdown();
});

// --- NEW: Hide dropdown when clicking outside ---
window.addEventListener('click', function(e) {
    const searchContainer = document.querySelector('.search');
    // If the click is outside the .search container, hide the dropdown
    if (searchContainer && !searchContainer.contains(e.target)) {
        hideHistoryDropdown();
    }
});

// Load default city on startup
weather.fetchWeather("Delhi");

// --- REMOVED: Old DOMContentLoaded listener ---
// (No longer needed, as we populate the list on focus)
