const SEARCH_HISTORY_KEY = 'weatherwise-history';

async function fetchForecast(lat, lon) {
    const forecastUrl = `/forecast?lat=${lat}&lon=${lon}`;
    
    try {
        const response = await fetch(forecastUrl);
        if (!response.ok) {
            throw new Error("Could not fetch forecast.");
        }
        const data = await response.json();
        
        if (data.error) {
            throw new Error(`Forecast error: ${data.error}`);
        }
        
        displayForecast(data); 
    } catch (error) {
        console.error("Error fetching forecast:", error);
        const forecastContainer = document.getElementById('forecast-container');
        forecastContainer.innerHTML = 'Forecast unavailable.';
        document.getElementById('forecast-box').classList.remove('loading');
    }
}

function displayForecast(data) {
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = ''; 
    
    const forecastList = data.list;
    if (!forecastList) {
        forecastContainer.innerText = "Forecast data is unavailable.";
        document.getElementById('forecast-box').classList.remove('loading');
        return;
    }
    
    const dailyData = [
        forecastList[4], 
        forecastList[12], 
        forecastList[20], 
        forecastList[28], 
        forecastList[36]  
    ];

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    dailyData.forEach(day => {
        if (!day) return; 
        const date = new Date(day.dt * 1000); 
        const dayName = dayNames[date.getDay()]; 
        const icon = day.weather[0].icon;
        const temp = Math.round(day.main.temp);

        const box = document.createElement('div');
        box.className = 'forecast-item'; 
        box.innerHTML = `
            <h4>${dayName}</h4>
            <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${day.weather[0].description}">
            <div class="forecast-temp">${temp}°C</div>
        `;
        forecastContainer.appendChild(box);
    });

    document.getElementById('forecast-box').classList.remove('loading');
}


function populateHistoryDropdown() {
    const history = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || [];
    const dropdown = document.getElementById('history-dropdown');
    
    if (!dropdown) return;

    dropdown.innerHTML = ''; 

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

function hideHistoryDropdown() {
    const dropdown = document.getElementById('history-dropdown');
    if (dropdown) {
        dropdown.classList.remove('visible');
    }
}

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

function calculateSafetyScore(data) {
    const { speed, description, pm2_5, temp } = data;
    let score = 100; 

    if (pm2_5 > 150.4) { score -= 40; } 
    else if (pm2_5 > 55.4) { score -= 25; } 
    else if (pm2_5 > 35.4) { score -= 10; } 

    if (temp > 40 || temp < -5) { score -= 20; } 
    else if (temp > 35 || temp < 5) { score -= 10; } 

    if (speed > 50) { score -= 20; }
    else if (speed > 30) { score -= 10; }

    if (description.includes("thunderstorm")) { score -= 50; }
    else if (description.includes("fog") || description.includes("haze") || description.includes("mist")) { score -= 15; }
    else if (description.includes("rain")) { score -= 10; }
    
    return Math.max(0, Math.round(score)); 
}


function updateSafetyInfo(data) {
    const { speed, description, pm2_5 } = data;

    const safetyScore = calculateSafetyScore(data);
    
    const percentageEl = document.getElementById('safety-percentage');
    const barFillEl = document.getElementById('safety-bar-fill');

    if (percentageEl && barFillEl) {
        percentageEl.innerText = `${safetyScore}%`;
        barFillEl.style.width = `${safetyScore}%`;

        if (safetyScore < 30) {
            barFillEl.style.backgroundColor = '#FF0000'; 
        } else if (safetyScore < 60) {
            barFillEl.style.backgroundColor = '#FFFF00'; 
        } else {
            barFillEl.style.backgroundColor = '#00E400'; 
        }
    }

    let tips = [];
    
    if (pm2_5 <= 12.0) {
        tips.push("✔️ Air quality is excellent.");
    } else if (pm2_5 <= 55.4) {
        tips.push("⚠️ Air quality is moderate. Sensitive groups should limit outdoor activity.");
    } else {
        tips.push("❌ Air quality is poor. Avoid outdoor activity and wear a mask if outside.");
    }
    
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
    
    if (speed > 30) {
        tips.push("💨 High winds! Secure loose items outdoors.");
    }

    const tipsList = document.getElementById('safety-tips');
    tipsList.innerHTML = ''; 
    tips.forEach(tip => {
        const li = document.createElement('li');
        li.innerText = tip;
        tipsList.appendChild(li);
    });

    document.getElementById('tips-box').classList.remove('loading');
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
        pm25Element.className = "pm25"; 
        pm25Element.classList.add(pm25Details.cssClass); 

        document.querySelector(".weather").classList.remove("loading");
        
        updateSafetyInfo(data); 
        fetchForecast(lat, lon); 
    },

    search : function() {
        document.getElementById('tips-box').classList.add('loading');
        document.getElementById('forecast-box').classList.add('loading');
        
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

weather.fetchWeather("Delhi");
