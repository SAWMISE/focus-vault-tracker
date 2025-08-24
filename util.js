// Focus Vault - Utility Functions

const Utils = {
  
  // Date and Time Utilities
  formatDuration(milliseconds) {
    if (!milliseconds || milliseconds < 0) return '00:00:00';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  },

  formatDurationHours(milliseconds) {
    if (!milliseconds || milliseconds < 0) return '0h';
    const hours = milliseconds / (1000 * 60 * 60);
    return hours < 1 ? `${Math.round(hours * 60)}m` : `${hours.toFixed(1)}h`;
  },

  formatDate(date, format = 'default') {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    switch (format) {
      case 'short':
        return d.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      case 'long':
        return d.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'time':
        return d.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      case 'datetime':
        return d.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      default:
        return d.toLocaleDateString();
    }
  },

  getDateRange(period) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today':
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return {
          start: weekStart,
          end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
        };
      case 'month':
        return {
          start: new Date(today.getFullYear(), today.getMonth(), 1),
          end: new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)
        };
      default:
        return { start: null, end: null };
    }
  },

  // Data Validation
  validateEmail(email) {
    return CONFIG.VALIDATION.EMAIL.PATTERN.test(email);
  },

  validateProjectName(name) {
    if (!name || typeof name !== 'string') return false;
    const trimmed = name.trim();
    return trimmed.length >= CONFIG.VALIDATION.PROJECT_NAME.MIN_LENGTH && 
           trimmed.length <= CONFIG.VALIDATION.PROJECT_NAME.MAX_LENGTH &&
           CONFIG.VALIDATION.PROJECT_NAME.PATTERN.test(trimmed);
  },

  validatePassword(password) {
    if (!password || typeof password !== 'string') return false;
    return password.length >= CONFIG.VALIDATION.PASSWORD.MIN_LENGTH && 
           password.length <= CONFIG.VALIDATION.PASSWORD.MAX_LENGTH;
  },

  // String Utilities
  sanitizeString(str) {
    if (!str) return '';
    return str.toString().trim().replace(/[<>]/g, '');
  },

  truncateString(str, maxLength = 50) {
    if (!str) return '';
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  },

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // Array Utilities
  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  },

  sortBy(array, key, direction = 'asc') {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  },

  // Statistics Calculations
  calculateStats(timeEntries, projects = []) {
    const now = new Date();
    const today = Utils.getDateRange('today');
    const week = Utils.getDateRange('week');
    const month = Utils.getDateRange('month');

    const stats = {
      today: { time: 0, sessions: 0, projects: new Set() },
      week: { time: 0, sessions: 0, projects: new Set() },
      month: { time: 0, sessions: 0, projects: new Set() },
      total: { time: 0, sessions: timeEntries.length, projects: projects.length },
      productivity: { score: 0, streak: 0, avgSessionTime: 0 }
    };

    timeEntries.forEach(entry => {
      const entryDate = new Date(entry.startTime);
      const duration = entry.duration || 0;

      // Total stats
      stats.total.time += duration;

      // Today stats
      if (entryDate >= today.start && entryDate <= today.end) {
        stats.today.time += duration;
        stats.today.sessions++;
        stats.today.projects.add(entry.projectId);
      }

      // Week stats
      if (entryDate >= week.start && entryDate <= week.end) {
        stats.week.time += duration;
        stats.week.sessions++;
        stats.week.projects.add(entry.projectId);
      }

      // Month stats
      if (entryDate >= month.start && entryDate <= month.end) {
        stats.month.time += duration;
        stats.month.sessions++;
        stats.month.projects.add(entry.projectId);
      }
    });

    // Convert sets to counts
    stats.today.projects = stats.today.projects.size;
    stats.week.projects = stats.week.projects.size;
    stats.month.projects = stats.month.projects.size;

    // Calculate productivity metrics
    if (stats.total.sessions > 0) {
      stats.productivity.avgSessionTime = stats.total.time / stats.total.sessions;
      stats.productivity.score = Math.min(100, Math.round((stats.today.time / CONFIG.STATS.PRODUCTIVITY_THRESHOLD) * 100));
    }

    return stats;
  },

  // DOM Utilities
  createElement(tag, className = '', content = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content) element.textContent = content;
    return element;
  },

  show(element) {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    if (element) {
      element.classList.remove('hidden');
      element.style.display = '';
    }
  },

  hide(element) {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    if (element) {
      element.classList.add('hidden');
    }
  },

  toggle(element) {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    if (element) {
      element.classList.toggle('hidden');
    }
  },

  // Event Utilities
  debounce(func, delay = CONFIG.UI.DEBOUNCE_DELAY) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  },

  throttle(func, limit = 100) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Notification System
  showNotification(message, type = 'info', duration = CONFIG.UI.NOTIFICATION_DURATION) {
    const notification = Utils.createElement('div', `notification notification-${type}`);
    notification.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" style="background:none;border:none;color:inherit;font-size:1.2rem;cursor:pointer;margin-left:10px;">×</button>
    `;

    document.body.appendChild(notification);

    // Auto remove after duration
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, duration);

    return notification;
  },

  // Local Storage Helpers
  storage: {
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error('Storage error:', error);
        Utils.showNotification(CONFIG.ERRORS.STORAGE, 'error');
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
    },

    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error('Storage removal error:', error);
        return false;
      }
    },

    clear() {
      try {
        localStorage.clear();
        return true;
      } catch (error) {
        console.error('Storage clear error:', error);
        return false;
      }
    }
  },

  // Color Utilities
  getProjectColor(colorName) {
    return CONFIG.PROJECT_COLORS[colorName] || CONFIG.PROJECT_COLORS.gold;
  },

  hexToRgba(hex, alpha = 1) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(212, 175, 55, ${alpha})`;
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },

  // Performance Utilities
  measure(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
  },

  // Export/Import Utilities
  downloadJSON(data, filename = 'focus-vault-data.json') {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = filename;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  },

  // Animation Utilities
  animate(element, className, duration = CONFIG.UI.ANIMATION_DURATION) {
    return new Promise(resolve => {
      element.classList.add(className);
      setTimeout(() => {
        element.classList.remove(className);
        resolve();
      }, duration);
    });
  },

  // Feature Detection
  isStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },

  isNotificationSupported() {
    return 'Notification' in window;
  },

  // Focus Tracking Utilities
  calculateProductivityScore(timeEntries, targetHours = 8) {
    const today = Utils.getDateRange('today');
    const todayEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.startTime);
      return entryDate >= today.start && entryDate <= today.end;
    });

    const totalTime = todayEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const targetTime = targetHours * 60 * 60 * 1000; // Convert to milliseconds
    
    return Math.min(100, Math.round((totalTime / targetTime) * 100));
  },

  calculateStreak(timeEntries) {
    if (timeEntries.length === 0) return 0;

    const sortedEntries = timeEntries.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    let streak = 0;
    let currentDate = new Date();
    
    // Remove time component for date comparison
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedEntries.length; i++) {
      const entryDate = new Date(sortedEntries[i].startTime);
      entryDate.setHours(0, 0, 0, 0);

      const dayDiff = (currentDate - entryDate) / (1000 * 60 * 60 * 24);

      if (dayDiff === streak) {
        streak++;
      } else if (dayDiff > streak + 1) {
        break;
      }
    }

    return streak;
  }
};

// Export utilities
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
} else {
  window.Utils = Utils;
}
