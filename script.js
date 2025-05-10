// Configurações da API
const API_KEY = 'f524ed742085301ee0e4d269629a320d'; // Obtenha em https://openweathermap.org/
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

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherData(city);
    }
});

locationBtn.addEventListener('click', getLocationWeather);

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getWeatherData(city);
        }
    }
});

// Carregar dados climáticos de uma cidade padrão ao iniciar
window.addEventListener('load', () => {
    getWeatherData('São Paulo');
});

// Função para obter dados climáticos
async function getWeatherData(city) {
    try {
        // Dados atuais
        const response = await fetch(`${BASE_URL}?q=${city}&units=${UNITS}&lang=${LANG}&appid=${API_KEY}`);
        if (!response.ok) {
            throw new Error('Cidade não encontrada');
        }
        const data = await response.json();
        
        // Dados de previsão
        const forecastResponse = await fetch(`${FORECAST_URL}?q=${city}&units=${UNITS}&lang=${LANG}&appid=${API_KEY}`);
        const forecastData = await forecastResponse.json();
        
        updateWeatherUI(data, forecastData);
    } catch (error) {
        alert(error.message);
        console.error('Erro ao buscar dados:', error);
    }
}

// Função para obter clima pela localização
function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Dados atuais
                    const response = await fetch(`${BASE_URL}?lat=${latitude}&lon=${longitude}&units=${UNITS}&lang=${LANG}&appid=${API_KEY}`);
                    const data = await response.json();
                    
                    // Dados de previsão
                    const forecastResponse = await fetch(`${FORECAST_URL}?lat=${latitude}&lon=${longitude}&units=${UNITS}&lang=${LANG}&appid=${API_KEY}`);
                    const forecastData = await forecastResponse.json();
                    
                    updateWeatherUI(data, forecastData);
                    cityInput.value = data.name;
                } catch (error) {
                    alert('Erro ao obter dados de localização');
                    console.error(error);
                }
            },
            (error) => {
                alert('Permissão de localização negada ou erro ao obter localização');
                console.error(error);
            }
        );
    } else {
        alert('Geolocalização não suportada pelo seu navegador');
    }
}

// Atualizar a interface com os dados climáticos
function updateWeatherUI(currentData, forecastData) {
    // Dados atuais
    cityName.textContent = `${currentData.name}, ${currentData.sys.country}`;
    currentTemp.textContent = Math.round(currentData.main.temp);
    weatherDescription.textContent = currentData.weather[0].description;
    weatherIcon.src = `${ICON_URL}${currentData.weather[0].icon}@2x.png`;
    humidity.textContent = `${currentData.main.humidity}%`;
    wind.textContent = `${Math.round(currentData.wind.speed * 3.6)} km/h`; // Convertendo m/s para km/h
    feelsLike.textContent = `${Math.round(currentData.main.feels_like)}°C`;
    
    // Previsão para os próximos dias
    updateForecastUI(forecastData);
}

// Atualizar a previsão para os próximos dias
function updateForecastUI(forecastData) {
    // Limpar container
    forecastContainer.innerHTML = '';
    
    // Agrupar previsões por dia (a API retorna previsões a cada 3 horas)
    const dailyForecasts = {};
    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('pt-BR', { weekday: 'short' });
        
        if (!dailyForecasts[day]) {
            dailyForecasts[day] = {
                temp_max: item.main.temp_max,
                temp_min: item.main.temp_min,
                icon: item.weather[0].icon,
                description: item.weather[0].description,
                date: date
            };
        } else {
            // Atualizar máximas e mínimas
            if (item.main.temp_max > dailyForecasts[day].temp_max) {
                dailyForecasts[day].temp_max = item.main.temp_max;
            }
            if (item.main.temp_min < dailyForecasts[day].temp_min) {
                dailyForecasts[day].temp_min = item.main.temp_min;
            }
        }
    });
    
    // Criar cards de previsão para os próximos 5 dias
    const days = Object.keys(dailyForecasts).slice(0, 5);
    days.forEach(day => {
        const forecast = dailyForecasts[day];
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

// Verificar preferência do usuário ao carregar a página
function checkThemePreference() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    } else if (prefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeIcon('dark');
    }
}

// Alternar tema
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

// Atualizar ícone do botão de tema
function updateThemeIcon(theme) {
    const icon = theme === 'dark' ? 'sun' : 'moon';
    themeToggle.innerHTML = `<i class="fas fa-${icon}"></i>`;
}

// Event Listeners (adicione esta linha com os outros event listeners)
themeToggle.addEventListener('click', toggleTheme);

// Verificar tema ao carregar a página (adicione esta linha no final do arquivo)
window.addEventListener('DOMContentLoaded', checkThemePreference);