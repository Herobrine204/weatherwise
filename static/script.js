// --- NEW: Key for saving history in localStorage ---
const SEARCH_HISTORY_KEY = 'weatherwise-history';

/**
 * --- NEW: Loads search history from localStorage into the datalist. ---
 */
function loadSearchHistory() {
    const history = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || [];
    const datalist = document.getElementById('search-history');
    
    if (datalist) {
        datalist.innerHTML = ''; // Clear old options
        history.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            datalist.appendChild(option);
        });
    }
}

/**
 * --- NEW: Saves a new city to the search history in localStorage. ---
 */
function saveSearch(city) {
    if (!city || city.trim() === "") return; // Don't save empty searches

    let history = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || [];
    
    // Remove city if it already exists (so we can move it to the front)
    const existingIndex = history.indexOf(city);
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
        // This stops the background from changing with the city.
        // document.body.style.backgroundImage = "url('https://source.unsplash.com/1600x900/?" + name + "')"
    },

    search : function() {
        // --- UPDATED THIS FUNCTION ---
        const city = document.querySelector(".searchbar").value;
        this.fetchWeather(city); // Fetch the weather
        saveSearch(city); // Save the search to history
        loadSearchHistory(); // Update the datalist so it's visible next time
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

// Load default city on startup
weather.fetchWeather("Delhi");

// --- NEW: Load history from localStorage when the page first loads ---
// We use DOMContentLoaded to make sure the HTML elements are ready
document.addEventListener('DOMContentLoaded', loadSearchHistory);
