# Dynamic Weather App with Flask Backend

A sleek, simple, and elegant weather website that displays real-time weather and air quality for any city.

This project uses a secure Python Flask backend to handle all API requests, which are then displayed by a clean, responsive frontend. The UI is translucent and blurred, allowing a beautiful scenery background to show through for an elegant, modern look.

![Project Preview]- https://weatherwise-lake.vercel.app/

## Features

* **Real-time Weather:** Get the current temperature, humidity, wind speed, and weather description (e.g., "Haze", "Cloudy").
* **Air Quality (AQI):** Displays the live PM2.5 data, the most common air quality metric.
* **Dynamic AQI Coloring:** The color of the AQI text automatically changes based on the air quality level (Good, Moderate, Unhealthy, etc.) for an easy-to-read visual cue.
* **Secure Backend API:** All requests to the OpenWeatherMap API are handled by a Flask backend, keeping your secret API key 100% secure and hidden from the public frontend.
* **Global Search:** Find the weather for any city around the world.

---

## How It Works: Tech Stack & Architecture

This project is a great example of a modern "client-server" application. The frontend (what you see) is separate from the backend (what does the work).

### 1. Backend (The "Engine" - `app.py`)

* **Framework:** **Flask (Python)**
* **Role:** The backend's only job is to be a secure middleman. It runs a small web server.
* **API Security:** The OpenWeatherMap API key is stored secretly on the server in an environment variable. It is **never** exposed to the user's browser.
* **Process:**
    1.  The frontend sends a city name (like "Delhi") to our Flask server's custom API endpoint (e.g., `/weather?city=Delhi`).
    2.  The Flask server receives "Delhi," securely adds its secret API key, and calls the *real* OpenWeatherMap API.
    3.  OpenWeatherMap sends the data back to our Flask server.
    4.  Our server cleans up the data and sends a simple JSON object back to the frontend.

### 2. Frontend (The "Dashboard" - HTML/CSS/JS)

* **Framework:** Pure HTML, CSS, and JavaScript.
* **Role:** To display the data and interact with the user.
* **`index.html`:** Provides the simple structure for the search bar and the weather card.
* **`style.css`:** Provides the "translucent blur" effect for the card, sets the beautiful scenery background, and handles all text styling (including the dynamic AQI colors).
* **`script.js`:**
    1.  Listens for a "click" on the search button or an "Enter" key press.
    2.  Takes the city name from the search bar.
    3.  Calls our *own* Flask backend (`/weather`), not the public OpenWeatherMap API.
    4.  Receives the simple JSON data from Flask and updates all the text and colors on the page.

---

## How to Run Locally

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
    cd your-repo-name
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    # Windows
    python -m venv venv
    venv\Scripts\activate
    
    # macOS/Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install the required Python packages:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Create your Environment File:**
    * Create a file named `.env` in the main project folder.
    * Open it and add your secret API key:
        ```
        WEATHER_API_KEY="YOUR_SECRET_API_KEY_HERE"
        ```

5.  **Run the Flask app:**
    ```bash
    flask run
    ```
    Your app will be live at `http://127.0.0.1:5000`.

## How to Deploy (Vercel)

This project is ready to deploy on Vercel.

1.  **Push your code to GitHub.** (Make sure your `.env` file is in your `.gitignore` and is **NOT** pushed!)

2.  **Import your project** on the Vercel dashboard. Vercel will automatically detect `vercel.json` and set up the Flask server.

3.  **Add your Environment Variable:**
    * In your Vercel project's settings, go to **Settings -> Environment Variables**.
    * Add your API key:
        * **Name:** `WEATHER_API_KEY`
        * **Value:** `YOUR_SECRET_API_KEY_HERE`

4.  **Deploy.** Your site will be live!

## Acknowledgements

* All weather and air quality data is from the **[OpenWeatherMap API](https://openweathermap.org/api)**.
* Background image from **[Unsplash](https://unsplash.com/)**.
