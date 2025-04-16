class PomodoroTimer {
    constructor() {
        this.workDuration = 25;
        this.breakDuration = 5;
        this.timeLeft = this.workDuration * 60;
        this.isRunning = false;
        this.isBreak = false;
        this.timer = null;
        
        this.initializeElements();
        this.initializeEventListeners();
    }

    initializeElements() {
        this.minutesDisplay = document.getElementById('timerMinutes');
        this.secondsDisplay = document.getElementById('timerSeconds');
        this.startButton = document.getElementById('startTimer');
        this.pauseButton = document.getElementById('pauseTimer');
        this.resetButton = document.getElementById('resetTimer');
        this.workDurationInput = document.getElementById('workDuration');
        this.breakDurationInput = document.getElementById('breakDuration');
    }

    initializeEventListeners() {
        this.startButton.addEventListener('click', () => this.start());
        this.pauseButton.addEventListener('click', () => this.pause());
        this.resetButton.addEventListener('click', () => this.reset());
        
        this.workDurationInput.addEventListener('change', (e) => {
            this.workDuration = parseInt(e.target.value);
            if (!this.isRunning && !this.isBreak) {
                this.timeLeft = this.workDuration * 60;
                this.updateDisplay();
            }
        });
        
        this.breakDurationInput.addEventListener('change', (e) => {
            this.breakDuration = parseInt(e.target.value);
            if (!this.isRunning && this.isBreak) {
                this.timeLeft = this.breakDuration * 60;
                this.updateDisplay();
            }
        });
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startButton.disabled = true;
            this.pauseButton.disabled = false;
            
            this.timer = setInterval(() => {
                this.timeLeft--;
                this.updateDisplay();
                
                if (this.timeLeft <= 0) {
                    this.switchPhase();
                }
            }, 1000);
        }
    }

    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            this.startButton.disabled = false;
            this.pauseButton.disabled = true;
            clearInterval(this.timer);
        }
    }

    reset() {
        this.pause();
        this.isBreak = false;
        this.timeLeft = this.workDuration * 60;
        this.updateDisplay();
        this.updatePhaseStyles();
    }

    switchPhase() {
        this.isBreak = !this.isBreak;
        this.timeLeft = (this.isBreak ? this.breakDuration : this.workDuration) * 60;
        this.updatePhaseStyles();
        this.notifyPhaseChange();
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        
        this.minutesDisplay.textContent = minutes.toString().padStart(2, '0');
        this.secondsDisplay.textContent = seconds.toString().padStart(2, '0');
        
        // Update page title
        document.title = `${minutes}:${seconds.toString().padStart(2, '0')} - TimeLoop`;
    }

    updatePhaseStyles() {
        const timerDisplay = document.querySelector('.timer-display');
        if (this.isBreak) {
            timerDisplay.classList.add('break');
        } else {
            timerDisplay.classList.remove('break');
        }
    }

    notifyPhaseChange() {
        if (Notification.permission === 'granted') {
            new Notification('TimeLoop', {
                body: `Time for ${this.isBreak ? 'a break' : 'work'}!`,
                icon: './icons/icon-192x192.png'
            });
        }

        // Play sound
        const audio = new Audio('notification.mp3');
        audio.play().catch(() => console.log('Audio playback failed'));
    }
}

// Initialize Pomodoro timer
document.addEventListener('DOMContentLoaded', () => {
    const pomodoro = new PomodoroTimer();
    
    // Request notification permission
    if ('Notification' in window) {
        Notification.requestPermission();
    }
}); 