// Key for saving history in localStorage
const SEARCH_HISTORY_KEY = 'weatherwise-history';

// --- NEW: Store API key after asking once ---
let userApiKey = null; 

/**
 * --- NEW: Asks for API key if we don't have it ---
 */
async function getApiKey() {
    if (!userApiKey) {
        userApiKey = prompt("Please enter your OpenWeather API key to fetch the forecast:");
    }
    return userApiKey;
}

/**
 * --- NEW: Fetches the 5-day forecast ---
 */
async function fetchForecast(lat, lon) {
    const apiKey = await getApiKey();
    if (!apiKey) {
        alert("Cannot fetch forecast without an API key.");
        return;
    }

    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    
    try {
        const response = await fetch(forecastUrl);
        if (!response.ok) {
            throw new Error("Could not fetch forecast.");
        }
        const data = await response.json();
        displayForecast(data);
    } catch (error) {
        console.error("Error fetching forecast:", error);
        alert(error.message);
    }
}

/**
 * --- NEW: Processes and displays the 5-day forecast ---
 */
function displayForecast(data) {
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = ''; // Clear old forecast
    
    const forecastList = data.list;
    
    // Get 5 days, picking the data from 12:00 PM
    const dailyData = [
        forecastList[4], // Tomorrow
        forecastList[12], // Day 2
        forecastList[20], // Day 3
        forecastList[28], // Day 4
        forecastList[36]  // Day 5
    ];

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    dailyData.forEach(day => {
        if (!day) return; // Skip if data is missing
        const date = new Date(day.dt * 1000); 
        const dayName = dayNames[date.getDay()]; 
        const icon = day.weather[0].icon;
        const temp = Math.round(day.main.temp);

        const box = document.createElement('div');
        box.className = 'forecast-item'; // Use 'forecast-item' for new style
        box.innerHTML = `
            <h4>${dayName}</h4>
            <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${day.weather[0].description}">
            <div class="forecast-temp">${temp}°C</div>
        `;
        forecastContainer.appendChild(box);
    });
}


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
 * --- NEW: Updates the Safety Tips box ---
 */
function updateSafetyInfo(data) {
    const { speed, description, pm2_5 } = data;
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

    // --- Update the HTML ---
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
        // This is your original, safe call to your backend
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
        const { name, icon, description, temp, humidity, speed, pm2_5, lat, lon } = data;
        
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
        
        // --- NEW: Call BOTH functions ---
        updateSafetyInfo(data); // Update the tips
        fetchForecast(lat, lon); // Fetch the 5-day forecast
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
