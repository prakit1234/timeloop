class ReportsManager {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
        this.currentRange = 'week';
        this.generateReports();
    }

    initializeElements() {
        this.dateRangeButtons = document.querySelectorAll('.date-range button');
        this.productivityScore = document.getElementById('productivityScore');
    }

    initializeEventListeners() {
        this.dateRangeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.dateRangeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                this.currentRange = button.dataset.range;
                this.generateReports();
            });
        });
    }

    getDateRange() {
        const end = new Date();
        const start = new Date();
        
        switch (this.currentRange) {
            case 'week':
                start.setDate(end.getDate() - 7);
                break;
            case 'month':
                start.setMonth(end.getMonth() - 1);
                break;
            case 'year':
                start.setFullYear(end.getFullYear() - 1);
                break;
        }
        
        return { start, end };
    }

    generateReports() {
        const { start, end } = this.getDateRange();
        const entries = JSON.parse(localStorage.getItem('timeloop-entries') || '[]')
            .filter(entry => {
                const entryDate = new Date(entry.timestamp);
                return entryDate >= start && entryDate <= end;
            });

        this.updateMoodChart(entries);
        this.updateActivityChart(entries);
        this.updateGoalsChart();
        this.calculateProductivityScore(entries);
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

        const ctx = document.getElementById('reportMoodChart').getContext('2d');
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

        const ctx = document.getElementById('reportActivityChart').getContext('2d');
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

    updateGoalsChart() {
        if (!window.goalsManager) return;

        const stats = goalsManager.getGoalsStats();
        const ctx = document.getElementById('reportGoalsChart').getContext('2d');
        
        if (this.goalsChart) {
            this.goalsChart.destroy();
        }
        this.goalsChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Completed', 'In Progress', 'Not Started', 'Overdue'],
                datasets: [{
                    data: [
                        stats.completed,
                        stats.onTrack,
                        stats.total - stats.completed - stats.onTrack - stats.overdue,
                        stats.overdue
                    ],
                    backgroundColor: [
                        '#4CAF50',
                        '#2196F3',
                        '#9e9e9e',
                        '#f44336'
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

    calculateProductivityScore(entries) {
        let score = 0;
        const maxScore = 100;
        
        // Factor 1: Consistency (30 points)
        const uniqueDates = new Set(entries.map(entry => 
            new Date(entry.timestamp).toDateString()
        )).size;
        const daysInRange = Math.ceil((this.getDateRange().end - this.getDateRange().start) / (1000 * 60 * 60 * 24));
        score += (uniqueDates / daysInRange) * 30;

        // Factor 2: Mood (20 points)
        const positiveEntries = entries.filter(entry => 
            ['happy', 'excited'].includes(entry.mood)
        ).length;
        score += (positiveEntries / Math.max(1, entries.length)) * 20;

        // Factor 3: Goals Progress (30 points)
        if (window.goalsManager) {
            const stats = goalsManager.getGoalsStats();
            const goalScore = ((stats.completed + stats.onTrack * 0.5) / Math.max(1, stats.total)) * 30;
            score += goalScore;
        }

        // Factor 4: Activity Diversity (20 points)
        const uniqueCategories = new Set(entries.map(entry => entry.category)).size;
        score += Math.min(uniqueCategories / 5, 1) * 20;

        // Update display
        const finalScore = Math.round(Math.min(score, maxScore));
        this.productivityScore.textContent = finalScore;
        this.productivityScore.className = finalScore >= 80 ? 'high' : finalScore >= 50 ? 'medium' : 'low';
    }
}

// Initialize Reports Manager
let reportsManager;
document.addEventListener('DOMContentLoaded', () => {
    reportsManager = new ReportsManager();
}); 