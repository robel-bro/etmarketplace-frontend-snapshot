import { useState, useEffect } from 'react';
import axios from 'axios';

// Coordinates for Addis Ababa
const LAT = 9.03;
const LON = 38.74;

// WMO Weather interpretation codes (simplified)
const weatherCodeMap: Record<number, string> = {
  0: 'clear',      // Clear sky
  1: 'clear',      // Mainly clear
  2: 'clouds',     // Partly cloudy
  3: 'clouds',     // Overcast
  45: 'clouds',    // Fog
  48: 'clouds',    // Depositing rime fog
  51: 'rain',      // Drizzle: Light
  53: 'rain',      // Drizzle: Moderate
  55: 'rain',      // Drizzle: Dense intensity
  56: 'rain',      // Freezing Drizzle: Light
  57: 'rain',      // Freezing Drizzle: Dense intensity
  61: 'rain',      // Rain: Slight
  63: 'rain',      // Rain: Moderate
  65: 'rain',      // Rain: Heavy intensity
  66: 'rain',      // Freezing Rain: Light
  67: 'rain',      // Freezing Rain: Heavy intensity
  71: 'rain',      // Snow fall: Slight
  73: 'rain',      // Snow fall: Moderate
  75: 'rain',      // Snow fall: Heavy intensity
  77: 'rain',      // Snow grains
  80: 'rain',      // Rain showers: Slight
  81: 'rain',      // Rain showers: Moderate
  82: 'rain',      // Rain showers: Violent
  85: 'rain',      // Snow showers slight
  86: 'rain',      // Snow showers heavy
  95: 'rain',      // Thunderstorm: Slight or moderate
  96: 'rain',      // Thunderstorm with slight hail
  99: 'rain',      // Thunderstorm with heavy hail
};

export interface SkyState {
  timeOfDay: 'day' | 'night';
  weather: string; // 'clear', 'clouds', 'rain'
  temp: number;
  description: string;
  weatherCode: number;
}

export const useEthiopianSky = () => {
  const [skyState, setSkyState] = useState<SkyState>({
    timeOfDay: 'day',
    weather: 'clear',
    temp: 22,
    description: 'clear sky',
    weatherCode: 0,
  });

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await axios.get(
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current_weather=true&daily=sunrise,sunset&timezone=auto`
        );
        const data = res.data;
        const current = data.current_weather;
        const time = new Date(current.time);
        const sunrise = new Date(data.daily.sunrise[0]);
        const sunset = new Date(data.daily.sunset[0]);

        const isDay = time >= sunrise && time < sunset;
        const weatherMain = weatherCodeMap[current.weathercode] || 'clear';

        // Map weather code to description
        const descriptions: Record<number, string> = {
          0: 'clear sky',
          1: 'mainly clear',
          2: 'partly cloudy',
          3: 'overcast',
          45: 'fog',
          48: 'rime fog',
          51: 'light drizzle',
          53: 'moderate drizzle',
          55: 'dense drizzle',
          56: 'light freezing drizzle',
          57: 'dense freezing drizzle',
          61: 'slight rain',
          63: 'moderate rain',
          65: 'heavy rain',
          66: 'light freezing rain',
          67: 'heavy freezing rain',
          71: 'slight snowfall',
          73: 'moderate snowfall',
          75: 'heavy snowfall',
          77: 'snow grains',
          80: 'slight rain showers',
          81: 'moderate rain showers',
          82: 'violent rain showers',
          85: 'slight snow showers',
          86: 'heavy snow showers',
          95: 'thunderstorm',
          96: 'thunderstorm with hail',
          99: 'thunderstorm with heavy hail',
        };

        setSkyState({
          timeOfDay: isDay ? 'day' : 'night',
          weather: weatherMain,
          temp: Math.round(current.temperature),
          description: descriptions[current.weathercode] || 'unknown',
          weatherCode: current.weathercode,
        });
      } catch (error) {
        console.error('Weather fetch failed – using fallback', error);
        // Keep existing state
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); // every 10 minutes
    return () => clearInterval(interval);
  }, []);

  return skyState;
};