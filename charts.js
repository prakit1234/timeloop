const ctx = document.getElementById('activityChart').getContext('2d');

function renderChart(data) {
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Activity Frequency',
                data: data.values,
                backgroundColor: 'rgba(0, 152, 240, 0.8)',
                borderColor: 'rgba(0, 152, 240, 1)',
                borderWidth: 1,
                borderRadius: 8,
                maxBarThickness: 50
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        font: {
                            family: 'Inter',
                            weight: 500
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: {
                            family: 'Inter'
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            family: 'Inter'
                        }
                    }
                }
            }
        }
    });
}

function updateChart() {
    const entries = JSON.parse(localStorage.getItem('timeloop-entries') || '[]');
    const activityCounts = {};
    entries.forEach(entry => {
        activityCounts[entry.activity] = (activityCounts[entry.activity] || 0) + 1;
    });
    const labels = Object.keys(activityCounts);
    const values = Object.values(activityCounts);
    renderChart({ labels, values });
}

document.addEventListener('DOMContentLoaded', updateChart); 