class GoalsManager {
    constructor() {
        this.goals = JSON.parse(localStorage.getItem('timeloop-goals') || '[]');
        this.initializeElements();
        this.initializeEventListeners();
        this.renderGoals();
    }

    initializeElements() {
        this.goalsList = document.getElementById('goalsList');
        this.addGoalBtn = document.getElementById('addGoalBtn');
        this.goalDialog = document.getElementById('goalDialog');
        this.goalForm = document.getElementById('goalForm');
    }

    initializeEventListeners() {
        this.addGoalBtn.addEventListener('click', () => this.goalDialog.showModal());
        
        this.goalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addGoal();
        });
    }

    addGoal() {
        const goal = {
            id: Date.now(),
            title: document.getElementById('goalTitle').value,
            deadline: document.getElementById('goalDeadline').value,
            priority: document.getElementById('goalPriority').value,
            completed: false,
            progress: 0,
            createdAt: new Date().toISOString()
        };

        this.goals.push(goal);
        this.saveGoals();
        this.renderGoals();
        this.goalDialog.close();
        this.goalForm.reset();
    }

    updateGoalProgress(goalId, progress) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            goal.progress = Math.min(100, Math.max(0, progress));
            goal.completed = goal.progress === 100;
            this.saveGoals();
            this.renderGoals();
        }
    }

    deleteGoal(goalId) {
        this.goals = this.goals.filter(g => g.id !== goalId);
        this.saveGoals();
        this.renderGoals();
    }

    saveGoals() {
        localStorage.setItem('timeloop-goals', JSON.stringify(this.goals));
    }

    renderGoals() {
        this.goalsList.innerHTML = '';
        
        const sortedGoals = this.goals.sort((a, b) => {
            if (a.completed === b.completed) {
                return new Date(a.deadline) - new Date(b.deadline);
            }
            return a.completed ? 1 : -1;
        });

        sortedGoals.forEach(goal => {
            const goalElement = document.createElement('div');
            goalElement.className = `goal-card ${goal.priority}`;
            if (goal.completed) goalElement.classList.add('completed');

            const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
            const deadlineClass = daysLeft < 0 ? 'overdue' : daysLeft <= 3 ? 'urgent' : '';

            goalElement.innerHTML = `
                <div class="goal-header">
                    <h4>${goal.title}</h4>
                    <button class="btn-icon delete-goal" onclick="goalsManager.deleteGoal(${goal.id})">×</button>
                </div>
                <div class="goal-progress">
                    <div class="progress-bar">
                        <div class="progress" style="width: ${goal.progress}%"></div>
                    </div>
                    <input type="range" value="${goal.progress}" min="0" max="100" 
                           onchange="goalsManager.updateGoalProgress(${goal.id}, this.value)">
                </div>
                <div class="goal-footer">
                    <span class="deadline ${deadlineClass}">
                        ${daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Due today' : `${daysLeft} days left`}
                    </span>
                    <span class="priority-badge">${goal.priority}</span>
                </div>
            `;

            this.goalsList.appendChild(goalElement);
        });

        // Update goals chart if it exists
        if (typeof updateGoalsChart === 'function') {
            updateGoalsChart();
        }
    }

    getGoalsStats() {
        return {
            total: this.goals.length,
            completed: this.goals.filter(g => g.completed).length,
            overdue: this.goals.filter(g => !g.completed && new Date(g.deadline) < new Date()).length,
            onTrack: this.goals.filter(g => !g.completed && g.progress > 0).length
        };
    }
}

// Initialize Goals Manager
let goalsManager;
document.addEventListener('DOMContentLoaded', () => {
    goalsManager = new GoalsManager();
}); 