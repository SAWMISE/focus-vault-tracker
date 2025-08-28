// Focus Vault - Complete Script
// This file contains all functionality in one place for easier setup

// Configuration
const CONFIG = {
  STORAGE_KEYS: {
    USERS: 'focusVaultUsers',
    CURRENT_USER: 'currentFocusVaultUser'
  },
  TIMER: {
    UPDATE_INTERVAL: 1000,
    MIN_SESSION_TIME: 60000
  },
  MESSAGES: {
    LOGIN_SUCCESS: '🎉 Welcome back to your Focus Vault!',
    REGISTER_SUCCESS: '✅ Vault created successfully! Please sign in.',
    PROJECT_CREATED: '🎯 Mission added to your vault!',
    SESSION_STARTED: '🚀 Focus session initiated!',
    SESSION_STOPPED: '⏹️ Session completed and logged!'
  }
};

// Global variables
let currentUser = null;
let timerInterval = null;
let startTime = null;
let elapsedTime = 0;
let isRunning = false;
let isPaused = false;
let currentSession = null;

// Utility Functions
const Utils = {
  formatDuration(milliseconds) {
    if (!milliseconds || milliseconds < 0) return '00:00:00';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  },

  formatDurationHours(milliseconds) {
    if (!milliseconds || milliseconds < 0) return '0s';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } else if (minutes > 0) {
      return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  },

  showNotification(message, type = 'info') {
    // Simple alert for now - can be enhanced later
    alert(message);
  },

  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2);
  },

  show(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.remove('hidden');
    }
  },

  hide(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.add('hidden');
    }
  },

  storage: {
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error('Storage error:', error);
        return false;
      }
    },

    get(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        console.error('Storage retrieval error:', error);
        return defaultValue;
      }
    }
  }
};

// Authentication Module
const auth = {
  init() {
    this.createDefaultAccount();
    
    const savedUser = Utils.storage.get(CONFIG.STORAGE_KEYS.CURRENT_USER);
    if (savedUser) {
      currentUser = savedUser;
      this.showMainApp();
    } else {
      this.showLogin();
    }
  },

  createDefaultAccount() {
    const users = Utils.storage.get(CONFIG.STORAGE_KEYS.USERS, {});
    
    if (!users['smalesker@focusvault.com']) {
      users['smalesker@focusvault.com'] = {
        id: 'smalesker-001',
        name: 'SMALESKER',
        email: 'smalesker@focusvault.com',
        password: 'admin',
        projects: [
          {
            id: '1',
            name: 'Web Development',
            description: 'Building awesome web applications',
            color: 'gold',
            createdAt: new Date().toISOString(),
            totalTime: 0
          },
          {
            id: '2',
            name: 'Learning & Research',
            description: 'Studying new technologies and concepts', 
            color: 'blue',
            createdAt: new Date().toISOString(),
            totalTime: 0
          }
        ],
        timeEntries: [],
        createdAt: new Date().toISOString()
      };
      
      Utils.storage.set(CONFIG.STORAGE_KEYS.USERS, users);
    }
  },

  showLogin() {
    Utils.show('loginForm');
    Utils.hide('registerForm');
    Utils.show('authSection');
    Utils.hide('mainApp');
  },

  showRegister() {
    Utils.hide('loginForm');
    Utils.show('registerForm');
  },

  login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    console.log('Login attempt:', email, password); // Debug log

    if (!email || !password) {
      Utils.showNotification('🔑 Please enter both email and password');
      return;
    }

    const users = Utils.storage.get(CONFIG.STORAGE_KEYS.USERS, {});
    console.log('Available users:', users); // Debug log
    
    if (!users[email] || users[email].password !== password) {
      Utils.showNotification('🚫 Invalid credentials. Access denied.');
      return;
    }

    currentUser = users[email];
    Utils.storage.set(CONFIG.STORAGE_KEYS.CURRENT_USER, currentUser);
    Utils.showNotification(CONFIG.MESSAGES.LOGIN_SUCCESS);
    this.showMainApp();
  },

  register() {
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;

    if (!name || !email || !password) {
      Utils.showNotification('📝 Please fill in all fields');
      return;
    }

    const users = Utils.storage.get(CONFIG.STORAGE_KEYS.USERS, {});
    
    if (users[email]) {
      Utils.showNotification('⚠️ A vault with this email already exists');
      return;
    }

    users[email] = {
      id: Utils.generateId(),
      name: name,
      email: email,
      password: password,
      projects: [],
      timeEntries: [],
      createdAt: new Date().toISOString()
    };

    Utils.storage.set(CONFIG.STORAGE_KEYS.USERS, users);
    Utils.showNotification(CONFIG.MESSAGES.REGISTER_SUCCESS);
    this.showLogin();
  },

  logout() {
    if (isRunning) {
      const confirmLogout = confirm('🛡️ You have an active focus session. Are you sure you want to exit?');
      if (!confirmLogout) return;
      
      timer.stop();
    }

    currentUser = null;
    Utils.storage.set(CONFIG.STORAGE_KEYS.CURRENT_USER, null);
    this.showLogin();
    Utils.showNotification('👋 Vault secured. See you next time!');
  },

  showMainApp() {
    Utils.hide('authSection');
    Utils.show('mainApp');
    
    document.getElementById('userName').textContent = currentUser.name;
    
    projects.loadAll();
    entries.loadAll();
    stats.updateAll();
  }
};

// Timer Module - Fixed version
const timer = {
  start() {
    const projectSelect = document.getElementById('projectSelect');
    const taskDescription = document.getElementById('taskDescription');
    
    const selectedProjectId = projectSelect.value;
    const task = taskDescription.value.trim();

    if (!selectedProjectId) {
      Utils.showNotification('🎯 Please select a mission first');
      return;
    }

    const project = currentUser.projects.find(p => p.id === selectedProjectId);
    if (!project) {
      Utils.showNotification('❌ Selected project not found');
      return;
    }

    startTime = new Date();
    isRunning = true;
    isPaused = false;
    elapsedTime = 0; // Reset elapsed time when starting fresh
    
    currentSession = {
      projectId: selectedProjectId,
      projectName: project.name,
      task: task,
      startTime: startTime.toISOString()
    };

    this.updateButtons();
    this.showCurrentSession();
    
    document.getElementById('projectSelect').disabled = true;
    document.getElementById('taskDescription').disabled = true;

    timerInterval = setInterval(() => this.updateDisplay(), CONFIG.TIMER.UPDATE_INTERVAL);
    
    Utils.showNotification(CONFIG.MESSAGES.SESSION_STARTED);
  },

  pause() {
    if (!isRunning || isPaused) return;
    
    // Capture the current elapsed time before pausing
    elapsedTime = new Date() - new Date(currentSession.startTime);
    
    isPaused = true;
    clearInterval(timerInterval);
    this.updateButtons();
    
    Utils.showNotification('⏸️ Session paused');
  },

  resume() {
    if (!isRunning || !isPaused) return;
    
    // Update the start time to account for paused time
    // New start time = current time - elapsed time before pause
    const now = new Date();
    startTime = new Date(now - elapsedTime);
    currentSession.startTime = startTime.toISOString();
    
    isPaused = false;
    timerInterval = setInterval(() => this.updateDisplay(), CONFIG.TIMER.UPDATE_INTERVAL);
    this.updateButtons();
    
    Utils.showNotification('▶️ Session resumed');
  },

  stop() {
    if (!isRunning) return;

    const endTime = new Date();
    // Use the current elapsed time if paused, otherwise calculate from start time
    const duration = isPaused ? elapsedTime : (endTime - new Date(currentSession.startTime));

    const timeEntry = {
      id: Utils.generateId(),
      projectId: currentSession.projectId,
      projectName: currentSession.projectName,
      task: currentSession.task,
      startTime: currentSession.startTime,
      endTime: endTime.toISOString(),
      duration: duration,
      date: new Date().toDateString(),
      createdAt: new Date().toISOString()
    };

    currentUser.timeEntries.push(timeEntry);

    const project = currentUser.projects.find(p => p.id === currentSession.projectId);
    if (project) {
      project.totalTime = (project.totalTime || 0) + duration;
    }

    this.saveUserData();
    this.reset();
    
    entries.loadAll();
    stats.updateAll();

    const durationStr = Utils.formatDuration(duration);
    Utils.showNotification(`🎉 Session complete! ${durationStr} logged for ${currentSession.projectName}`);
  },

  reset() {
    clearInterval(timerInterval);
    isRunning = false;
    isPaused = false;
    startTime = null;
    currentSession = null;
    elapsedTime = 0;

    this.updateDisplay();
    this.updateButtons();
    this.hideCurrentSession();
    
    document.getElementById('projectSelect').disabled = false;
    document.getElementById('taskDescription').disabled = false;
    document.getElementById('taskDescription').value = '';
  },

  updateDisplay() {
    const display = document.getElementById('timerDisplay');
    if (!display) return;

    if (isRunning && !isPaused) {
      elapsedTime = new Date() - new Date(currentSession.startTime);
    }
    // If paused, elapsedTime retains its last value from when pause() was called

    display.textContent = Utils.formatDuration(elapsedTime);
  },

  updateButtons() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const pauseBtn = document.getElementById('pauseBtn');

    if (isRunning) {
      startBtn.disabled = true;
      stopBtn.disabled = false;
      
      if (isPaused) {
        pauseBtn.textContent = '▶️ Resume';
        pauseBtn.disabled = false;
        pauseBtn.onclick = () => this.resume();
      } else {
        pauseBtn.textContent = '⏸️ Pause';
        pauseBtn.disabled = false;
        pauseBtn.onclick = () => this.pause();
      }
    } else {
      startBtn.disabled = false;
      stopBtn.disabled = true;
      pauseBtn.disabled = true;
      pauseBtn.textContent = '⏸️ Pause';
    }
  },

  showCurrentSession() {
    const currentSessionEl = document.getElementById('currentSession');
    Utils.show('currentSession');
    
    document.getElementById('currentProject').textContent = currentSession.projectName;
    document.getElementById('currentTask').textContent = currentSession.task || 'No specific task';
    document.getElementById('sessionStart').textContent = new Date(currentSession.startTime).toLocaleTimeString();
  },

  hideCurrentSession() {
    Utils.hide('currentSession');
  },

  saveUserData() {
    const users = Utils.storage.get(CONFIG.STORAGE_KEYS.USERS, {});
    users[currentUser.email] = currentUser;
    Utils.storage.set(CONFIG.STORAGE_KEYS.USERS, users);
    Utils.storage.set(CONFIG.STORAGE_KEYS.CURRENT_USER, currentUser);
  }
};

// Projects Module
const projects = {
  add() {
    const name = document.getElementById('newProjectName').value.trim();
    const description = document.getElementById('projectDescription').value.trim();
    const color = document.getElementById('projectColor').value;

    if (!name) {
      Utils.showNotification('🎯 Please enter a mission name');
      return;
    }

    const project = {
      id: Utils.generateId(),
      name: name,
      description: description,
      color: color,
      createdAt: new Date().toISOString(),
      totalTime: 0
    };

    currentUser.projects.push(project);
    timer.saveUserData();
    this.loadAll();
    
    document.getElementById('newProjectName').value = '';
    document.getElementById('projectDescription').value = '';
    
    Utils.showNotification(CONFIG.MESSAGES.PROJECT_CREATED);
  },

  delete(projectId) {
    if (confirm('🗑️ Are you sure you want to delete this mission?')) {
      currentUser.projects = currentUser.projects.filter(p => p.id !== projectId);
      currentUser.timeEntries = currentUser.timeEntries.filter(e => e.projectId !== projectId);
      timer.saveUserData();
      this.loadAll();
      entries.loadAll();
      stats.updateAll();
    }
  },

  loadAll() {
    const projectSelect = document.getElementById('projectSelect');
    const projectList = document.getElementById('projectList');
    
    // Clear existing
    projectSelect.innerHTML = '<option value="">Choose your mission...</option>';
    projectList.innerHTML = '';

    currentUser.projects.forEach(project => {
      // Add to select dropdown
      const option = document.createElement('option');
      option.value = project.id;
      option.textContent = project.name;
      projectSelect.appendChild(option);

      // Add to project list
      const projectDiv = document.createElement('div');
      projectDiv.className = 'project-item';
      projectDiv.innerHTML = `
        <div class="project-info">
          <div class="project-name">🎯 ${project.name}</div>
          ${project.description ? `<div class="project-description">${project.description}</div>` : ''}
          <div class="project-stats">
            Total: ${Utils.formatDurationHours(project.totalTime || 0)}
          </div>
        </div>
        <div class="project-actions">
          <button class="btn btn-danger btn-small" onclick="projects.delete('${project.id}')">🗑️ Delete</button>
        </div>
      `;
      projectList.appendChild(projectDiv);
    });

    if (currentUser.projects.length === 0) {
      projectList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">No missions yet. Create your first focus target!</p>';
    }
  }
};

// Entries Module
const entries = {
  loadAll() {
    const entriesList = document.getElementById('entriesList');
    entriesList.innerHTML = '';
    
    const sortedEntries = [...currentUser.timeEntries].sort((a, b) => 
      new Date(b.startTime) - new Date(a.startTime)
    );
    
    const recentEntries = sortedEntries.slice(0, 10);
    
    recentEntries.forEach(entry => {
      const entryDiv = document.createElement('div');
      entryDiv.className = 'time-entry';
      
      const startDate = new Date(entry.startTime);
      const formattedDate = startDate.toLocaleDateString();
      const formattedTime = startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      entryDiv.innerHTML = `
        <div class="entry-info">
          <h4>🎯 ${entry.projectName}</h4>
          ${entry.task ? `<div class="entry-task">${entry.task}</div>` : ''}
          <div class="entry-meta">
            <span>📅 ${formattedDate}</span>
            <span>🕐 ${formattedTime}</span>
          </div>
        </div>
        <div class="entry-duration">
          ${Utils.formatDurationHours(entry.duration)}
        </div>
      `;
      
      entriesList.appendChild(entryDiv);
    });
    
    if (recentEntries.length === 0) {
      entriesList.innerHTML = '<div class="empty-state"><p>No time entries yet. Start tracking your focus!</p></div>';
    }
  },

  filterByProject() {
    // Placeholder for filtering functionality
    this.loadAll();
  },

  filterByDate() {
    // Placeholder for date filtering
    this.loadAll();
  }
};

// Stats Module
const stats = {
  updateAll() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    // Calculate today's time
    const todayEntries = currentUser.timeEntries.filter(entry => 
      new Date(entry.startTime).toDateString() === today.toDateString()
    );
    const todayTime = todayEntries.reduce((total, entry) => total + (entry.duration || 0), 0);

    // Calculate week's time  
    const weekEntries = currentUser.timeEntries.filter(entry => 
      new Date(entry.startTime) >= weekStart
    );
    const weekTime = weekEntries.reduce((total, entry) => total + (entry.duration || 0), 0);

    // Calculate total time
    const totalTime = currentUser.timeEntries.reduce((total, entry) => total + (entry.duration || 0), 0);

    // Update displays
    document.getElementById('todayTime').textContent = Utils.formatDurationHours(todayTime);
    document.getElementById('weekTime').textContent = Utils.formatDurationHours(weekTime);
    document.getElementById('totalProjects').textContent = currentUser.projects.length;
    document.getElementById('totalTime').textContent = Utils.formatDurationHours(totalTime);
  }
};

// Reports Module
const reports = {
  showReports() {
    Utils.show('reportsModal');
    // Basic reports functionality
    document.getElementById('reportsContent').innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${currentUser.timeEntries.length}</div>
          <div class="stat-label">Total Sessions</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${currentUser.projects.length}</div>
          <div class="stat-label">Projects</div>
        </div>
      </div>
      <p style="text-align: center; margin-top: 20px; color: var(--text-muted);">
        More detailed reports coming soon!
      </p>
    `;
  },

  close() {
    Utils.hide('reportsModal');
  },

  showTodayDetails() {
    this.showReports();
  },

  showWeekDetails() {
    this.showReports();
  },

  showAllTime() {
    this.showReports();
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Initializing Focus Vault...');
  
  auth.init();
  timer.updateDisplay();
  
  console.log('✅ Focus Vault initialized successfully');
});

// Make functions available globally for HTML onclick handlers
window.auth = auth;
window.timer = timer;
window.projects = projects;
window.entries = entries;
window.stats = stats;
window.reports = reports;
