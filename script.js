/**
 * @typedef {Object} TimeEntry
 * @property {string} activity
 * @property {string} mood
 * @property {number} duration
 * @property {number} timestamp
 */

// Dark mode toggle
function initDarkMode() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    document.getElementById('darkModeToggle').textContent = darkMode ? '☀️' : '🌙';
}

document.getElementById('darkModeToggle').addEventListener('click', () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('darkMode', !isDark);
    document.getElementById('darkModeToggle').textContent = isDark ? '🌙' : '☀️';
});

// Tags handling
const tags = new Set();

function addTag(tag) {
    if (tag && !tags.has(tag)) {
        tags.add(tag);
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.innerHTML = `
            ${tag}
            <button onclick="removeTag('${tag}')">&times;</button>
        `;
        document.getElementById('tagsList').appendChild(tagElement);
    }
}

function removeTag(tag) {
    tags.delete(tag);
    renderTags();
}

function renderTags() {
    const tagsList = document.getElementById('tagsList');
    tagsList.innerHTML = '';
    tags.forEach(tag => addTag(tag));
}

document.getElementById('tags').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const tag = e.target.value.trim().replace(',', '');
        if (tag) {
            addTag(tag);
            e.target.value = '';
        }
    }
});

// Weather integration
async function getWeather() {
    try {
        // Get API key from config
        const API_KEY = config.OPENWEATHER_API_KEY;
        
        // First check if API key is valid
        if (!API_KEY) {
            throw new Error('Missing OpenWeather API Key');
        }

        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 10000,
                maximumAge: 0
            });
        });
        
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}&units=metric&appid=${API_KEY}`
        );
        
        if (response.status === 401) {
            throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
        }
        
        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        const weatherInfo = document.getElementById('weatherInfo');
        
        if (weatherInfo) {
            weatherInfo.innerHTML = `
                <span class="weather-icon">${getWeatherEmoji(data.weather[0].main)}</span>
                <span class="weather-text">${Math.round(data.main.temp)}°C, ${data.weather[0].main}</span>
            `;
        }
    } catch (error) {
        console.error('Weather error:', error);
        const weatherInfo = document.getElementById('weatherInfo');
        if (weatherInfo) {
            weatherInfo.innerHTML = `
                <span class="weather-icon">🌍</span>
                <span class="weather-text">Weather unavailable</span>
            `;
        }
    }
}

// Helper function to get weather emoji
function getWeatherEmoji(weatherMain) {
    const weatherEmojis = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Snow': '❄️',
        'Thunderstorm': '⛈️',
        'Drizzle': '🌦️',
        'Mist': '🌫️',
        'Fog': '🌫️',
        'Haze': '🌫️'
    };
    return weatherEmojis[weatherMain] || '🌡️';
}

// Streak calculation
function updateStreak() {
    const entries = JSON.parse(localStorage.getItem('timeloop-entries') || '[]');
    if (entries.length === 0) return;

    const today = new Date().setHours(0, 0, 0, 0);
    const sortedDates = entries
        .map(entry => new Date(entry.timestamp).setHours(0, 0, 0, 0))
        .sort((a, b) => b - a);

    let streak = 1;
    let currentDate = sortedDates[0];

    if (currentDate < today - 86400000) {
        streak = 0;
    } else {
        for (let i = 1; i < sortedDates.length; i++) {
            if (currentDate - sortedDates[i] === 86400000) {
                streak++;
                currentDate = sortedDates[i];
            } else {
                break;
            }
        }
    }

    document.getElementById('streakCount').textContent = streak;
}

// Discord webhook configuration
const DISCORD_WEBHOOK_URL = config.DISCORD_WEBHOOK_URL;

// Send memory to Discord
async function sendToDiscord(memory) {
    // Only send happy or excited memories
    if (memory.mood !== 'happy' && memory.mood !== 'excited') return;

    const embed = {
        title: '✨ New Happy Memory!',
        color: 0x00f2c3, // Matches our theme color
        fields: [
            {
                name: 'Memory',
                value: memory.text
            },
            {
                name: 'Mood',
                value: memory.mood === 'happy' ? '🙂 Happy' : '🤩 Excited',
                inline: true
            },
            {
                name: 'Category',
                value: memory.category,
                inline: true
            }
        ],
        footer: {
            text: 'TimeLoop Memory Tracker'
        },
        timestamp: new Date(memory.timestamp).toISOString()
    };

    // Add description if present
    if (memory.description) {
        embed.fields.push({
            name: 'Additional Notes',
            value: memory.description
        });
    }

    // Add tags if present
    if (memory.tags.length > 0) {
        embed.fields.push({
            name: 'Tags',
            value: memory.tags.map(tag => `#${tag}`).join(' ')
        });
    }

    // Add weather if present
    if (memory.weather) {
        embed.fields.push({
            name: 'Weather',
            value: memory.weather,
            inline: true
        });
    }

    try {
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                embeds: [embed]
            })
        });

        if (!response.ok) {
            throw new Error('Failed to send to Discord');
        }

        showNotification('Memory shared to Discord! 🎉');
    } catch (error) {
        console.error('Discord webhook error:', error);
        showNotification('Failed to share memory to Discord', true);
    }
}

// Notification system
function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : 'success'}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Memory form submission (updated)
document.getElementById('memoryForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const memory = {
        text: document.getElementById('memoryInput').value,
        mood: document.getElementById('moodSelect').value,
        category: document.getElementById('categorySelect').value,
        timestamp: document.getElementById('dateTime').value || new Date().toISOString(),
        description: document.getElementById('description').value,
        tags: Array.from(tags),
        weather: document.querySelector('.weather-text')?.textContent || ''
    };
    
    // Save to localStorage
    const entries = JSON.parse(localStorage.getItem('timeloop-entries') || '[]');
    entries.push(memory);
    localStorage.setItem('timeloop-entries', JSON.stringify(entries));
    
    // Update UI
    renderMemory(memory);
    updateStreak();
    if (memoryCharts) {
        memoryCharts.updateCharts(entries);
    }
    
    // Send to Discord if it's a good memory
    await sendToDiscord(memory);
    
    // Reset form
    event.target.reset();
    tags.clear();
    renderTags();
});

// Search and filter
document.getElementById('searchMemories').addEventListener('input', filterMemories);
document.getElementById('filterCategory').addEventListener('change', filterMemories);
document.getElementById('filterMood').addEventListener('change', filterMemories);

function filterMemories() {
    const searchTerm = document.getElementById('searchMemories').value.toLowerCase();
    const categoryFilter = document.getElementById('filterCategory').value;
    const moodFilter = document.getElementById('filterMood').value;
    
    const entries = JSON.parse(localStorage.getItem('timeloop-entries') || '[]');
    const filteredEntries = entries.filter(entry => {
        const matchesSearch = entry.text.toLowerCase().includes(searchTerm) ||
                            entry.description.toLowerCase().includes(searchTerm) ||
                            entry.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        const matchesCategory = !categoryFilter || entry.category === categoryFilter;
        const matchesMood = !moodFilter || entry.mood === moodFilter;
        
        return matchesSearch && matchesCategory && matchesMood;
    });
    
    renderMemories(filteredEntries);
}

function renderMemory(memory) {
    const listItem = document.createElement('li');
    listItem.innerHTML = `
        <div class="memory-header">
            <strong>${new Date(memory.timestamp).toLocaleString()}</strong>
            <span class="memory-mood">${memory.mood}</span>
        </div>
        <p>${memory.text}</p>
        ${memory.description ? `<p class="memory-description">${memory.description}</p>` : ''}
        <div class="memory-footer">
            <span class="memory-category">${memory.category}</span>
            ${memory.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            <span class="memory-weather">${memory.weather}</span>
        </div>
    `;
    document.getElementById('memoryList').prepend(listItem);
}

function renderMemories(memories) {
    const memoryList = document.getElementById('memoryList');
    memoryList.innerHTML = '';
    memories.forEach(renderMemory);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    getWeather();
    updateStreak();
    
    // Set default datetime to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('dateTime').value = now.toISOString().slice(0, 16);
    
    // Load and render existing memories
    const entries = JSON.parse(localStorage.getItem('timeloop-entries') || '[]');
    renderMemories(entries);
    
    // Update memory charts
    if (memoryCharts) {
        memoryCharts.updateCharts(entries);
    }

    // Add credits to the footer
    const footer = document.createElement('footer');
    footer.className = 'app-footer';
    footer.innerHTML = `
        <div class="credits">
            <p>Developed by <a href="https://github.com/prakit1234" target="_blank">prakit1234 (Kaii)</a> with ❤️</p>
        </div>
    `;
    document.querySelector('.app-container').appendChild(footer);

    // Navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');

    function switchView(viewId) {
        // Hide all views
        views.forEach(view => view.classList.remove('active'));
        // Show selected view
        document.getElementById(viewId + 'View').classList.add('active');
        
        // Update navigation buttons
        navButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === viewId) {
                btn.classList.add('active');
            }
        });

        // Update charts when switching to reports view
        if (viewId === 'reports' && window.reportsManager) {
            reportsManager.generateReports();
        }
    }

    // Add click handlers to nav buttons
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const viewId = button.dataset.view;
            switchView(viewId);
        });
    });

    // Initialize with memories view
    switchView('memories');
});

// Export data as JSON
function exportData() {
    const data = localStorage.getItem('timeloop-entries');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timeloop-data.json';
    a.click();
    URL.revokeObjectURL(url);
}

document.getElementById('exportData').addEventListener('click', exportData);

// Import data from JSON
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = JSON.parse(e.target.result);
        localStorage.setItem('timeloop-entries', JSON.stringify(data));
        alert('Data imported successfully!');
    };
    reader.readAsText(file);
}

document.getElementById('importData').addEventListener('click', () => {
    document.getElementById('importFile').click();
});

document.getElementById('importFile').addEventListener('change', importData);

// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}
