// Key for saving history in localStorage
const SEARCH_HISTORY_KEY = 'weatherwise-history';

// --- All Map variables and functions are removed ---

/**
 * Gets history from localStorage and builds the new dropdown
 */
function populateHistoryDropdown() {
    const history = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || [];
    const dropdown = document.getElementById('history-dropdown');
    
    if (!dropdown) return;

    dropdown.innerHTML = ''; // Clear old items

    if (history.length === 0) {
        dropdown.innerHTML = '<div class="history-item" style="cursor:default;">No recent searches</div>';
    } else {
        history.forEach(city => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.textContent = city;
            
            item.addEventListener('click', () => {
                document.querySelector('.searchbar').value = city;
                weather.search(); 
                hideHistoryDropdown(); 
            });
            dropdown.appendChild(item);
        });
    }

    dropdown.classList.add('visible');
}

/**
 * Hides the custom dropdown
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
    if (!city || city.trim() === "") return; 

    let history = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || [];
    
    const existingIndex = history.map(c => c.toLowerCase()).indexOf(city.toLowerCase());
    if (existingIndex > -1) {
        history.splice(existingIndex, 1);
    }

    history.unshift(city);
    history = history.slice(0, 10);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
}

/**
 * A helper function to get the air quality details
 * based on the PM2.5 value.
 */
function getPm25Details(pm2_5) {
    let text = "";
    let cssClass = "";

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

    return { text: text, cssClass: cssClass };
}

/**
 * --- NEW: Updates the Safety Score and Tips boxes ---
 */
function updateSafetyInfo(data) {
    const { speed, description, pm2_5 } = data;
    
    // --- 1. Calculate Safety Score (out of 100) ---
    let score = 100;
    let scoreDescription = "Excellent";
    let scoreColor = "#00E400"; // Good
    
    // Penalize for high PM2.5
    if (pm2_5 > 35.4) { // Moderate
        score -= 20;
        scoreDescription = "Moderate";
        scoreColor = "#FFFF00"; // Moderate
    }
    if (pm2_5 > 55.4) { // Unhealthy for Sensitive
        score -= 15;
        scoreDescription = "Unhealthy";
        scoreColor = "#FF7E00"; // Unhealthy (Sensitive)
    }
    if (pm2_5 > 150.4) { // Very Unhealthy
        score -= 30;
        scoreDescription = "Very Unhealthy";
        scoreColor = "#FF0000"; // Unhealthy
    }
    
    // Penalize for high wind (e.g., > 30 km/h)
    if (speed > 30) {
        score -= 15;
        if (scoreDescription === "Excellent") scoreDescription = "Windy";
    }
    
    // Penalize for rain/thunderstorm
    if (description.includes("rain") || description.includes("thunderstorm")) {
        score -= 10;
    }
    
    if (score < 0) score = 0; // Don't go below 0

    // --- 2. Generate Safety Tips ---
    let tips = [];
    
    // PM2.5 Tips
    if (pm2_5 <= 12.0) {
        tips.push("✔️ Air quality is excellent.");
    } else if (pm2_5 <= 55.4) {
        tips.push("⚠️ Air quality is moderate. Sensitive groups should limit outdoor activity.");
    } else {
        tips.push("❌ Air quality is poor. Avoid outdoor activity and wear a mask if outside.");
    }
    
    // Weather Description Tips
    if (description.includes("rain")) {
        tips.push("☔ It's raining. Don't forget an umbrella!");
    }
    if (description.includes("thunderstorm")) {
        tips.push("⚡ Thunderstorms expected. Stay indoors and avoid electronics.");
    }
    if (description.includes("sun") || description.includes("clear")) {
        tips.push("☀️ Clear skies. A great day to be outside (if AQI is good)!");
    }
    if (description.includes("fog") || description.includes("haze") || description.includes("mist")) {
        tips.push("🌫️ Low visibility. Be careful if driving.");
    }
    
    // Wind Tips
    if (speed > 30) {
        tips.push("💨 High winds! Secure loose items outdoors.");
    }

    // --- 3. Update the HTML ---
    document.getElementById('safety-score').innerText = Math.round(score);
    document.getElementById('score-description').innerText = scoreDescription;
    document.querySelector('.score-circle').style.borderColor = scoreColor;
    
    const tipsList = document.getElementById('safety-tips');
    tipsList.innerHTML = ''; // Clear old tips
    tips.forEach(tip => {
        const li = document.createElement('li');
        li.innerText = tip;
        tipsList.appendChild(li);
    });
}


let weather = {
    
    fetchWeather : function (city) {
        fetch("/weather?city=" + encodeURIComponent(city))
            .then((response) => {
                if (!response.ok) {
                    throw new Error("City not found or server error");
                }
                return response.json();
            })
            .then((data) => {
                if (data.error) {
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
        // We get all data here
        const { name, icon, description, temp, humidity, speed, pm2_5 } = data;
        
        // Update the main weather bar
        document.querySelector(".city").innerText = "Weather in " + name;
        document.querySelector(".icon").src = "https://openweathermap.org/img/wn/" + icon + ".png";
        document.querySelector(".description").innerText = description;
        document.querySelector(".temp").innerText = temp + "°C";
        document.querySelector(".humidity").innerText = "Humidity: " + humidity + "%";
        document.querySelector(".wind").innerText = "Wind speed: " + speed + " km/h";
        
        let pm25Element = document.querySelector(".pm25");
        let pm25Details = getPm25Details(pm2_5);
        pm25Element.innerText = `PM2.5: ${pm2_5} μg/m³ (${pm25Details.text})`;
        pm25Element.className = "pm25"; // Reset classes
        pm25Element.classList.add(pm25Details.cssClass); // Add new AQI class

        document.querySelector(".weather").classList.remove("loading");
        
        // --- NEW: Call the function to update score and tips ---
        updateSafetyInfo(data);
    },

    search : function() {
        const searchInput = document.querySelector(".searchbar");
        const city = searchInput.value;
        
        this.fetchWeather(city);
        saveSearch(city); 
        hideHistoryDropdown(); 
        searchInput.blur(); 
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

document.querySelector('.searchbar').addEventListener('focus', () => {
    populateHistoryDropdown();
});

window.addEventListener('click', function(e) {
    const searchContainer = document.querySelector('.search');
    if (searchContainer && !searchContainer.contains(e.target)) {
        hideHistoryDropdown();
    }
});

// Load default city on startup
weather.fetchWeather("Delhi");

// --- All map-related 'DOMContentLoaded' listeners are removed ---
