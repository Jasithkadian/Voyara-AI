import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface WeatherDay {
  day: number;
  condition: string;
  temp: number;
}

export const useWeather = (destination: string, startDate: string = '2026-06-12', days: number = 5) => {
  const [weather, setWeather] = useState<WeatherDay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!destination) return;
    
    const fetchWeather = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`${API_BASE_URL}/api/weather`, {
          params: {
            destination,
            start_date: startDate,
            days
          }
        });
        setWeather(response.data);
      } catch (err: any) {
        console.error("Failed to fetch weather data", err);
        setError(err.message || 'Failed to retrieve weather data.');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [destination, startDate, days]);

  return { weather, loading, error };
};
