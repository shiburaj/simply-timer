// Timer State
let timerInterval = null;
let totalSeconds = 0;
let isCountDown = true;
let isPaused = false;
let initialSeconds = 0;

// DOM Elements
const countdownBtn = document.getElementById('countdownBtn');
const countupBtn = document.getElementById('countupBtn');
const hoursDisplay = document.getElementById('hours');
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const hoursSegment = document.getElementById('hoursSegment');
const minutesSegment = document.getElementById('minutesSegment');
const hourSeparator = document.getElementById('hourSeparator');
const inputHours = document.getElementById('inputHours');
const inputMinutes = document.getElementById('inputMinutes');
const inputSeconds = document.getElementById('inputSeconds');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const timerDisplay = document.querySelector('.timer-display');
const presetButtons = document.querySelectorAll('.preset-btn');
const fullscreenView = document.getElementById('fullscreenView');
const exitFullscreenBtn = document.getElementById('exitFullscreenBtn');
const fullscreenHours = document.getElementById('fullscreenHours');
const fullscreenMinutes = document.getElementById('fullscreenMinutes');
const fullscreenSeconds = document.getElementById('fullscreenSeconds');
const fullscreenMode = document.getElementById('fullscreenMode');
const fullscreenHourSep = document.getElementById('fullscreenHourSep');
const alarmHours = document.getElementById('alarmHours');
const alarmMinutes = document.getElementById('alarmMinutes');
const alarmSeconds = document.getElementById('alarmSeconds');
const addAlarmBtn = document.getElementById('addAlarmBtn');
const alarmsList = document.getElementById('alarmsList');

// Audio for alarms
const alarm1Sound = new Audio('alarm1.mp3'); // Rings at set alarm times
const alarm2Sound = new Audio('alarm2.mp3'); // Rings at timer completion
alarm1Sound.loop = false;
alarm2Sound.loop = false;

// Alarms array
let alarms = [];
let triggeredAlarms = new Set();

// Initialize from localStorage
function initializeFromStorage() {
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
        const state = JSON.parse(savedState);
        isCountDown = state.isCountDown;
        totalSeconds = state.totalSeconds;
        initialSeconds = state.initialSeconds;
        isPaused = state.isPaused;
        
        // Restore alarms
        const savedAlarms = localStorage.getItem('timerAlarms');
        if (savedAlarms) {
            alarms = JSON.parse(savedAlarms);
            renderAlarms();
        }
        
        if (isCountDown) {
            countdownBtn.classList.add('active');
            countupBtn.classList.remove('active');
        } else {
            countupBtn.classList.add('active');
            countdownBtn.classList.remove('active');
        }
        
        updateDisplay();
        
        if (state.isRunning && !isPaused) {
            const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
            if (isCountDown) {
                totalSeconds = Math.max(0, totalSeconds - elapsed);
            } else {
                totalSeconds += elapsed;
            }
            startTimer();
        }
    }
}

// Save state to localStorage
function saveState(isRunning = false) {
    const state = {
        isCountDown,
        totalSeconds,
        initialSeconds,
        isPaused,
        isRunning,
        startTime: Date.now()
    };
    localStorage.setItem('timerState', JSON.stringify(state));
    localStorage.setItem('timerAlarms', JSON.stringify(alarms));
}

// Update Display
function updateDisplay() {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    hoursDisplay.textContent = String(hours).padStart(2, '0');
    minutesDisplay.textContent = String(minutes).padStart(2, '0');
    secondsDisplay.textContent = String(seconds).padStart(2, '0');
    
    // Update fullscreen display
    fullscreenHours.textContent = String(hours).padStart(2, '0');
    fullscreenMinutes.textContent = String(minutes).padStart(2, '0');
    fullscreenSeconds.textContent = String(seconds).padStart(2, '0');
    
    // Smart display: hide hours if 0, hide minutes if both hours and minutes are 0
    if (hours === 0) {
        hoursSegment.classList.add('hidden');
        hourSeparator.classList.add('hidden');
        fullscreenHours.classList.add('hidden');
        fullscreenHourSep.classList.add('hidden');
        
        if (minutes === 0) {
            minutesSegment.classList.add('hidden');
            document.querySelectorAll('.separator')[1].classList.add('hidden');
            fullscreenMinutes.classList.add('hidden');
            document.querySelectorAll('.fullscreen-separator')[1].classList.add('hidden');
        } else {
            minutesSegment.classList.remove('hidden');
            document.querySelectorAll('.separator')[1].classList.remove('hidden');
            fullscreenMinutes.classList.remove('hidden');
            document.querySelectorAll('.fullscreen-separator')[1].classList.remove('hidden');
        }
    } else {
        hoursSegment.classList.remove('hidden');
        hourSeparator.classList.remove('hidden');
        minutesSegment.classList.remove('hidden');
        document.querySelectorAll('.separator')[1].classList.remove('hidden');
        fullscreenHours.classList.remove('hidden');
        fullscreenHourSep.classList.remove('hidden');
        fullscreenMinutes.classList.remove('hidden');
        document.querySelectorAll('.fullscreen-separator')[1].classList.remove('hidden');
    }
    
    saveState(timerInterval !== null);
}

// Start Timer
function startTimer() {
    if (timerInterval) return;
    
    if (!isPaused && totalSeconds === 0 && isCountDown) {
        // Get time from inputs
        const hours = parseInt(inputHours.value) || 0;
        const minutes = parseInt(inputMinutes.value) || 0;
        const seconds = parseInt(inputSeconds.value) || 0;
        totalSeconds = hours * 3600 + minutes * 60 + seconds;
        initialSeconds = totalSeconds;
    }
    
    if (totalSeconds === 0 && isCountDown) {
        alert('Please set a time for countdown!');
        return;
    }
    
    isPaused = false;
    timerDisplay.classList.add('running');
    timerDisplay.classList.remove('expired');
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    fullscreenBtn.disabled = false;
    
    timerInterval = setInterval(() => {
        if (isCountDown) {
            totalSeconds--;
            if (totalSeconds <= 0) {
                totalSeconds = 0;
                stopTimer();
                playCompletionAlarm();
                timerDisplay.classList.add('expired');
                fullscreenView.classList.add('expired');
            } else {
                // Check alarms for count down mode
                checkAlarms();
            }
        } else {
            totalSeconds++;
            // Check if count up reached a preset time (optional alarm)
            if (initialSeconds > 0 && totalSeconds >= initialSeconds) {
                stopTimer();
                playCompletionAlarm();
                timerDisplay.classList.add('expired');
                fullscreenView.classList.add('expired');
            } else {
                // Check alarms for count up mode
                checkAlarms();
            }
        }
        updateDisplay();
    }, 1000);
    
    saveState(true);
}

// Pause Timer
function pauseTimer() {
    if (!timerInterval) return;
    
    clearInterval(timerInterval);
    timerInterval = null;
    isPaused = true;
    timerDisplay.classList.remove('running');
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    fullscreenBtn.disabled = true;
    saveState(false);
}

// Stop Timer
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timerDisplay.classList.remove('running');
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    fullscreenBtn.disabled = true;
}

// Reset Timer
function resetTimer() {
    stopTimer();
    stopAllAlarms();
    exitFullscreen();
    totalSeconds = 0;
    initialSeconds = 0;
    isPaused = false;
    triggeredAlarms.clear();
    timerDisplay.classList.remove('expired');
    updateDisplay();
    renderAlarms();
    inputHours.value = 0;
    inputMinutes.value = 0;
    inputSeconds.value = 0;
    localStorage.removeItem('timerState');
}

// Check Alarms
function checkAlarms() {
    alarms.forEach((alarm, index) => {
        if (alarm.totalSeconds === totalSeconds && !triggeredAlarms.has(index)) {
            triggeredAlarms.add(index);
            playAlarm1();
            renderAlarms();
        }
    });
}

// Play Alarm 1 (at set times)
function playAlarm1() {
    alarm1Sound.currentTime = 0;
    alarm1Sound.play().catch(err => {
        console.log('Could not play alarm1 sound:', err);
    });
}

// Play Alarm 2 (completion)
function playCompletionAlarm() {
    alarm2Sound.currentTime = 0;
    alarm2Sound.play().catch(err => {
        console.log('Could not play alarm2 sound:', err);
        alert('Timer Complete!');
    });
    
    // Stop alarm after 30 seconds
    setTimeout(() => {
        stopAllAlarms();
    }, 30000);
}

// Stop All Alarms
function stopAllAlarms() {
    alarm1Sound.pause();
    alarm1Sound.currentTime = 0;
    alarm2Sound.pause();
    alarm2Sound.currentTime = 0;
}

// Add Alarm
function addAlarm() {
    const hours = parseInt(alarmHours.value) || 0;
    const minutes = parseInt(alarmMinutes.value) || 0;
    const seconds = parseInt(alarmSeconds.value) || 0;
    
    const totalAlarmSeconds = hours * 3600 + minutes * 60 + seconds;
    
    if (totalAlarmSeconds === 0) {
        alert('Please set a valid alarm time!');
        return;
    }
    
    // Check if alarm already exists
    if (alarms.some(alarm => alarm.totalSeconds === totalAlarmSeconds)) {
        alert('This alarm already exists!');
        return;
    }
    
    alarms.push({
        hours,
        minutes,
        seconds,
        totalSeconds: totalAlarmSeconds
    });
    
    // Sort alarms by time
    alarms.sort((a, b) => a.totalSeconds - b.totalSeconds);
    
    renderAlarms();
    saveState(timerInterval !== null);
    
    // Reset inputs
    alarmHours.value = 0;
    alarmMinutes.value = 0;
    alarmSeconds.value = 0;
}

// Remove Alarm
function removeAlarm(index) {
    alarms.splice(index, 1);
    triggeredAlarms.delete(index);
    renderAlarms();
    saveState(timerInterval !== null);
}

// Render Alarms
function renderAlarms() {
    alarmsList.innerHTML = '';
    
    if (alarms.length === 0) {
        alarmsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 12px;">No alarms set</p>';
        return;
    }
    
    alarms.forEach((alarm, index) => {
        const alarmItem = document.createElement('div');
        alarmItem.className = 'alarm-item';
        
        if (triggeredAlarms.has(index)) {
            alarmItem.classList.add('triggered');
        }
        
        const timeText = `${String(alarm.hours).padStart(2, '0')}:${String(alarm.minutes).padStart(2, '0')}:${String(alarm.seconds).padStart(2, '0')}`;
        const statusText = triggeredAlarms.has(index) ? '✓ Triggered' : 'Pending';
        
        alarmItem.innerHTML = `
            <div>
                <span class="alarm-time">${timeText}</span>
                <span class="alarm-status">${statusText}</span>
            </div>
            <button class="remove-alarm-btn" onclick="removeAlarm(${index})">Remove</button>
        `;
        
        alarmsList.appendChild(alarmItem);
    });
}

// Enter Fullscreen
function enterFullscreen() {
    fullscreenView.classList.add('active');
    fullscreenMode.textContent = isCountDown ? 'COUNT DOWN' : 'COUNT UP';
    updateDisplay();
}

// Exit Fullscreen
function exitFullscreen() {
    fullscreenView.classList.remove('active');
    fullscreenView.classList.remove('expired');
}

// Set Preset Time
function setPresetTime(seconds) {
    if (timerInterval) {
        pauseTimer();
    }
    
    totalSeconds = seconds;
    initialSeconds = seconds;
    isPaused = false;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    inputHours.value = hours;
    inputMinutes.value = minutes;
    inputSeconds.value = secs;
    
    updateDisplay();
}

// Event Listeners
countdownBtn.addEventListener('click', () => {
    if (timerInterval) return; // Don't switch mode while running
    isCountDown = true;
    countdownBtn.classList.add('active');
    countupBtn.classList.remove('active');
    resetTimer();
});

countupBtn.addEventListener('click', () => {
    if (timerInterval) return; // Don't switch mode while running
    isCountDown = false;
    countupBtn.classList.add('active');
    countdownBtn.classList.remove('active');
    resetTimer();
});

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
fullscreenBtn.addEventListener('click', enterFullscreen);
exitFullscreenBtn.addEventListener('click', exitFullscreen);
addAlarmBtn.addEventListener('click', addAlarm);

// Allow Enter key to add alarm
[alarmHours, alarmMinutes, alarmSeconds].forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addAlarm();
        }
    });
});

presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const seconds = parseInt(btn.getAttribute('data-time'));
        setPresetTime(seconds);
    });
});

// Stop alarm on any click when expired
timerDisplay.addEventListener('click', () => {
    if (timerDisplay.classList.contains('expired')) {
        stopAllAlarms();
        timerDisplay.classList.remove('expired');
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && fullscreenView.classList.contains('active')) {
        exitFullscreen();
    }
});

// Stop alarm on fullscreen click when expired
fullscreenView.addEventListener('click', (e) => {
    if (fullscreenView.classList.contains('expired') && e.target === fullscreenView) {
        stopAllAlarms();
        fullscreenView.classList.remove('expired');
        timerDisplay.classList.remove('expired');
    }
});

// Make removeAlarm available globally
window.removeAlarm = removeAlarm;

// Initialize
initializeFromStorage();
updateDisplay();
