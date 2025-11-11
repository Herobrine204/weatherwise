// Key for saving history in localStorage
const SEARCH_HISTORY_KEY = 'weatherwise-history';

// --- NEW: Global variables for the map ---
let map;
let marker;

/**
 * --- NEW: Initializes the map on page load ---
 */
function initMap() {
    // Check if map element exists
    if (!document.getElementById('map')) return;
    
    // Start map centered on Delhi
    map = L.map('map').setView([28.6139, 77.2090], 10);

    // Add a free map "tile layer" from OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add a marker that we can move later
    marker = L.marker([28.6139, 77.2090]).addTo(map);
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
        const { name, icon, description, temp, humidity, speed, pm2_5, lat, lon } = data;
        
        document.querySelector(".city").innerText = "Weather in " + name;
        document.querySelector(".icon").src = "https://openweathermap.org/img/wn/" + icon + ".png";
        document.querySelector(".description").innerText = description;
        document.querySelector(".temp").innerText = temp + "°C";
        document.querySelector(".humidity").innerText = "Humidity: " + humidity + "%";
        document.querySelector(".wind").innerText = "Wind speed: " + speed + " km/h";
        
        let pm25Element = document.querySelector(".pm25");
        let pm25Details = getPm25Details(pm2_5);
        pm25Element.innerText = `PM2.5: ${pm2_5} μg/m³ (${pm25Details.text})`;
        
        // --- THIS IS THE FIX ---
        // It was "pm2s" before, which caused a crash on the next search
        pm25Element.className = "pm25"; 
        
        pm25Element.classList.add(pm25Details.cssClass); 

        document.querySelector(".weather").classList.remove("loading");
        
        // --- NEW: Update the map's position ---
        if (map && marker) {
            const newLocation = [lat, lon];
            map.setView(newLocation, 10); // Move the map
            marker.setLatLng(newLocation); // Move the marker
        } else {
             // If map wasn't ready, init it now (for the first load)
            initMap();
        }
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

// --- NEW: Initialize the map when the page is ready ---
document.addEventListener('DOMContentLoaded', initMap);
