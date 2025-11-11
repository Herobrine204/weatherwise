import os
import requests
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
API_KEY = os.environ.get("WEATHER_API_KEY")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/weather')
def get_weather():
    city = request.args.get('city')
    if not city:
        return jsonify({"error": "City parameter is required"}), 400
    if not API_KEY:
        return jsonify({"error": "API key is not configured on the server"}), 500

    try:
        # Call 1: Get Current Weather
        weather_url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&units=metric&appid={API_KEY}"
        weather_response = requests.get(weather_url)
        weather_response.raise_for_status()
        weather_data = weather_response.json()

        lat = weather_data['coord']['lat']
        lon = weather_data['coord']['lon']
        
        # Call 2: Get Air Quality Index
        aqi_url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={API_KEY}"
        aqi_response = requests.get(aqi_url)
        aqi_response.raise_for_status()
        aqi_data = aqi_response.json()

        # Combine data
        combined_data = {
            "name": weather_data['name'],
            "icon": weather_data['weather'][0]['icon'],
            "description": weather_data['weather'][0]['description'],
            "temp": weather_data['main']['temp'],
            "humidity": weather_data['main']['humidity'],
            "speed": weather_data['wind']['speed'],
            "pm2_5": aqi_data['list'][0]['components']['pm2_5'],
            "lat": lat,
            "lon": lon
        }

        return jsonify(combined_data)

    except requests.exceptions.HTTPError as errh:
        status_code = errh.response.status_code
        if status_code == 404:
            return jsonify({"error": f"City not found: {city}"}), 404
        if status_code == 401:
            return jsonify({"error": "API key not authorized."}), 401
        return jsonify({"error": f"HTTP Error: {errh}"}), status_code
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {e}"}), 500

# --- NEW: SECURE FORECAST ENDPOINT ---
@app.route('/forecast')
def get_forecast():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    
    if not lat or not lon:
        return jsonify({"error": "Lat/Lon parameters are required"}), 400
    if not API_KEY:
        return jsonify({"error": "API key is not configured on the server"}), 500
    
    try:
        forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&units=metric&appid={API_KEY}"
        forecast_response = requests.get(forecast_url)
        forecast_response.raise_for_status()
        forecast_data = forecast_response.json()
        
        return jsonify(forecast_data)
        
    except requests.exceptions.HTTPError as errh:
        return jsonify({"error": f"HTTP Error: {errh}"}), errh.response.status_code
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {e}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
