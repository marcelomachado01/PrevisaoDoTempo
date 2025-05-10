// Configurações da API
import { API_KEY } from './config.js'; // Obtenha em https://openweathermap.org/
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';
const ICON_URL = 'https://openweathermap.org/img/wn/';

// Elementos do DOM
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const cityName = document.getElementById('city-name');
const currentTemp = document.getElementById('current-temp');
const weatherDescription = document.getElementById('weather-description');
const weatherIcon = document.getElementById('weather-icon');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');
const feelsLike = document.getElementById('feels-like');
const forecastContainer = document.getElementById('forecast-container');
const themeToggle = document.getElementById('theme-toggle');

// Unidade de medida (metric para Celsius)
const UNITS = 'metric';
const LANG = 'pt_br';

// Funções principais
async function getWeatherData(city) {
    try {
        const [currentData, forecastData] = await Promise.all([
            fetchData(`${BASE_URL}?q=${city}&units=${UNITS}&lang=${LANG}&appid=${API_KEY}`),
            fetchData(`${FORECAST_URL}?q=${city}&units=${UNITS}&lang=${LANG}&appid=${API_KEY}`)
        ]);
        
        updateWeatherUI(currentData, forecastData);
    } catch (error) {
        handleError(error);
    }
}

async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Cidade não encontrada');
    return response.json();
}

function updateWeatherUI(currentData, forecastData) {
    // Dados atuais
    cityName.textContent = `${currentData.name}, ${currentData.sys.country}`;
    currentTemp.textContent = Math.round(currentData.main.temp);
    weatherDescription.textContent = capitalizeFirstLetter(currentData.weather[0].description);
    weatherIcon.src = `${ICON_URL}${currentData.weather[0].icon}@2x.png`;
    weatherIcon.alt = currentData.weather[0].description;
    humidity.textContent = `${currentData.main.humidity}%`;
    wind.textContent = `${Math.round(currentData.wind.speed * 3.6)} km/h`;
    feelsLike.textContent = `${Math.round(currentData.main.feels_like)}°C`;
    
    updateForecastUI(forecastData);
}

function updateForecastUI(forecastData) {
    forecastContainer.innerHTML = '';
    
    const dailyForecasts = forecastData.list.reduce((acc, item) => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('pt-BR', { weekday: 'short' });
        
        if (!acc[day]) {
            acc[day] = { ...item.main, ...item.weather[0], date };
        } else {
            acc[day].temp_max = Math.max(acc[day].temp_max, item.main.temp_max);
            acc[day].temp_min = Math.min(acc[day].temp_min, item.main.temp_min);
        }
        return acc;
    }, {});
    
    Object.entries(dailyForecasts)
        .slice(0, 5)
        .forEach(([day, forecast]) => {
            const forecastCard = document.createElement('div');
            forecastCard.className = 'forecast-card';
            forecastCard.innerHTML = `
                <div class="forecast-day">${day}</div>
                <div class="forecast-icon">
                    <img src="${ICON_URL}${forecast.icon}.png" alt="${forecast.description}">
                </div>
                <div class="forecast-temp">
                    <span class="max-temp">${Math.round(forecast.temp_max)}°</span>
                    <span class="min-temp">${Math.round(forecast.temp_min)}°</span>
                </div>
            `;
            forecastContainer.appendChild(forecastCard);
        });
}

// Funções de localização
function getLocationWeather() {
    if (!navigator.geolocation) {
        alert('Geolocalização não suportada pelo seu navegador');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async ({ coords: { latitude, longitude } }) => {
            try {
                const [currentData, forecastData] = await Promise.all([
                    fetchData(`${BASE_URL}?lat=${latitude}&lon=${longitude}&units=${UNITS}&lang=${LANG}&appid=${API_KEY}`),
                    fetchData(`${FORECAST_URL}?lat=${latitude}&lon=${longitude}&units=${UNITS}&lang=${LANG}&appid=${API_KEY}`)
                ]);
                
                updateWeatherUI(currentData, forecastData);
                cityInput.value = currentData.name;
            } catch (error) {
                handleError(error);
            }
        },
        (error) => {
            alert('Permissão de localização negada ou erro ao obter localização');
            console.error(error);
        }
    );
}

// Funções de tema
function checkThemePreference() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light');
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    themeToggle.innerHTML = `<i class="fas fa-${theme === 'dark' ? 'sun' : 'moon'}"></i>`;
}

// Utilitários
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function handleError(error) {
    alert(error.message || 'Erro ao buscar dados meteorológicos');
    console.error('Erro:', error);
}

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) getWeatherData(city);
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && cityInput.value.trim()) {
        getWeatherData(cityInput.value.trim());
    }
});

locationBtn.addEventListener('click', getLocationWeather);
themeToggle.addEventListener('click', toggleTheme);

// Inicialização
window.addEventListener('DOMContentLoaded', () => {
    checkThemePreference();
    getWeatherData('São Paulo');
});