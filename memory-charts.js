class MemoryCharts {
    constructor() {
        this.moodChart = null;
        this.activityChart = null;
    }

    updateCharts(entries) {
        this.updateMoodChart(entries);
        this.updateActivityChart(entries);
    }

    updateMoodChart(entries) {
        const moodCounts = {
            'happy': 0,
            'sad': 0,
            'neutral': 0,
            'excited': 0,
            'tired': 0
        };

        entries.forEach(entry => {
            if (moodCounts.hasOwnProperty(entry.mood)) {
                moodCounts[entry.mood]++;
            }
        });

        const ctx = document.getElementById('memoryMoodChart').getContext('2d');
        if (this.moodChart) {
            this.moodChart.destroy();
        }
        this.moodChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(moodCounts).map(mood => mood.charAt(0).toUpperCase() + mood.slice(1)),
                datasets: [{
                    data: Object.values(moodCounts),
                    backgroundColor: [
                        '#4CAF50',
                        '#f44336',
                        '#9e9e9e',
                        '#2196F3',
                        '#FF9800'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 8,
                            font: {
                                size: 11
                            }
                        }
                    }
                },
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10,
                        left: 10,
                        right: 10
                    }
                }
            }
        });
    }

    updateActivityChart(entries) {
        const activityCounts = {};
        entries.forEach(entry => {
            activityCounts[entry.category] = (activityCounts[entry.category] || 0) + 1;
        });

        const ctx = document.getElementById('memoryActivityChart').getContext('2d');
        if (this.activityChart) {
            this.activityChart.destroy();
        }
        this.activityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(activityCounts),
                datasets: [{
                    label: 'Activities',
                    data: Object.values(activityCounts),
                    backgroundColor: '#4f46e5',
                    borderRadius: 4,
                    maxBarThickness: 35
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            font: {
                                size: 11
                            },
                            maxTicksLimit: 5
                        },
                        grid: {
                            display: true,
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                layout: {
                    padding: {
                        top: 20,
                        bottom: 10,
                        left: 10,
                        right: 10
                    }
                }
            }
        });
    }
}

// Initialize Memory Charts
let memoryCharts;
document.addEventListener('DOMContentLoaded', () => {
    memoryCharts = new MemoryCharts();
}); 