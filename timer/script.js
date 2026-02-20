// script.js

// --- State Variables ---
let timerInterval = null;
let currentSeconds = 0;
let totalSessionSeconds = 0;
let isRunning = false;
let isWorkMode = true;
let sessionCount = 0; // tracking number of completed work sessions

// --- DOM Elements ---
const modeIndicator = document.getElementById('mode-indicator');
const timerDisplay = document.getElementById('timer-display');
const workTimeInput = document.getElementById('work-time');
const breakTimeInput = document.getElementById('break-time');
const progressBar = document.getElementById('progress-bar');
const sessionCountDisplay = document.getElementById('session-count');

const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const presetBtns = document.querySelectorAll('.preset-btn');
const autoRepeatCheckbox = document.getElementById('auto-repeat');

// --- Theme Logic ---
const themeToggleBtn = document.getElementById('theme-toggle');
const moonIcon = document.querySelector('.moon-icon');
const sunIcon = document.querySelector('.sun-icon');

let isDarkMode = localStorage.getItem('trimmerTheme') === 'dark';
applyTheme(isDarkMode);

themeToggleBtn.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    applyTheme(isDarkMode);
    localStorage.setItem('trimmerTheme', isDarkMode ? 'dark' : 'light');
});

function applyTheme(dark) {
    if (dark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        moonIcon.style.display = 'none';
        sunIcon.style.display = 'block';
    } else {
        document.documentElement.removeAttribute('data-theme');
        moonIcon.style.display = 'block';
        sunIcon.style.display = 'none';
    }
}

// --- Timer Logic ---
function updateDisplay() {
    const hours = Math.floor(currentSeconds / 3600);
    const minutes = Math.floor((currentSeconds % 3600) / 60);
    const seconds = currentSeconds % 60;

    timerDisplay.textContent =
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Update progress bar
    if (totalSessionSeconds > 0) {
        const progressPercentage = ((totalSessionSeconds - currentSeconds) / totalSessionSeconds) * 100;
        progressBar.style.width = `${progressPercentage}%`;
    } else {
        progressBar.style.width = '0%';
    }
}

function initTimer() {
    let workMin = parseInt(workTimeInput.value);
    let breakMin = parseInt(breakTimeInput.value);

    if (isNaN(workMin) || workMin <= 0) { workMin = 25; workTimeInput.value = 25; }
    if (isNaN(breakMin) || breakMin <= 0) { breakMin = 5; breakTimeInput.value = 5; }

    const min = isWorkMode ? workMin : breakMin;
    currentSeconds = min * 60;
    totalSessionSeconds = currentSeconds;

    updateDisplay();
    updateThemeColor();
}

function updateThemeColor() {
    if (isWorkMode) {
        modeIndicator.textContent = "Work Mode";
        modeIndicator.className = "mode-work";
        progressBar.style.backgroundColor = "var(--work-mode-color)";
    } else {
        modeIndicator.textContent = "Break Mode";
        modeIndicator.className = "mode-break";
        progressBar.style.backgroundColor = "var(--break-mode-color)";
    }
}

function startTimer() {
    if (isRunning) return;

    if (currentSeconds <= 0) {
        initTimer();
    }

    isRunning = true;
    timerInterval = setInterval(() => {
        if (currentSeconds > 0) {
            currentSeconds--;
            updateDisplay();
        } else {
            handleSessionEnd();
        }
    }, 1000);
}

function handleSessionEnd() {
    clearInterval(timerInterval);
    isRunning = false;

    if (isWorkMode) {
        sessionCount++;
        sessionCountDisplay.textContent = sessionCount;
        setTimeout(() => {
            alert("Work session completed!");
            isWorkMode = false;
            initTimer();
            startTimer(); // auto start break
        }, 10);
    } else {
        setTimeout(() => {
            alert("Break session completed!");
            isWorkMode = true;
            initTimer(); // Setup for next work session

            // Check autorepeat setting
            if (autoRepeatCheckbox.checked) {
                startTimer();
            }
        }, 10);
    }
}

function pauseTimer() {
    if (!isRunning) return;
    clearInterval(timerInterval);
    isRunning = false;
}

function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    isWorkMode = true;
    initTimer();
}

function handleTimeChange(e) {
    if (e.target.value < 1) e.target.value = 1;
    if (!isRunning) {
        const isCurrentModeInput = (isWorkMode && e.target === workTimeInput) || (!isWorkMode && e.target === breakTimeInput);
        if (isCurrentModeInput) initTimer();
    }
}

// Preset Buttons Logic
presetBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const mins = e.target.getAttribute('data-time');
        if (isWorkMode) {
            workTimeInput.value = mins;
        } else {
            breakTimeInput.value = mins;
        }
        if (!isRunning) initTimer(); // update display instantly if not running
    });
});

// Timer Event Listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
workTimeInput.addEventListener('change', handleTimeChange);
breakTimeInput.addEventListener('change', handleTimeChange);


// --- To-Do List Logic ---
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const tasksRemainingDisplay = document.getElementById('tasks-remaining');

let tasks = JSON.parse(localStorage.getItem('trimmerTasks')) || [];

function saveTasks() {
    localStorage.setItem('trimmerTasks', JSON.stringify(tasks));
    updateTaskStats();
}

function updateTaskStats() {
    const remaining = tasks.filter(t => !t.completed).length;
    tasksRemainingDisplay.textContent = `${remaining} task${remaining !== 1 ? 's' : ''} remaining`;
}

function renderTasks() {
    taskList.innerHTML = '';

    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;

        // Checkbox container for styling
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => toggleTaskComplete(index));

        // Task text 
        const span = document.createElement('span');
        span.className = 'task-text';
        span.textContent = task.text;

        // Delete button
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" class="trash-icon"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
        delBtn.addEventListener('click', () => deleteTask(index));

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(delBtn);

        taskList.appendChild(li);
    });

    updateTaskStats();
}

function addTask() {
    const text = taskInput.value.trim();
    if (text) {
        tasks.push({ text: text, completed: false });
        taskInput.value = '';
        saveTasks();
        renderTasks();
    }
}

function toggleTaskComplete(index) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    renderTasks();
}

function deleteTask(index) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
}

// Event Listeners for Tasks
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

// --- Initialize App ---
initTimer();
renderTasks();
