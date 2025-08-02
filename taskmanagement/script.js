// SkyList - Aviation Task Management Application
// Interactive JavaScript for comprehensive task management with aviation theme

document.addEventListener('DOMContentLoaded', function() {
    
    // ===== APPLICATION STATE =====
    // Central data store for all tasks and application state
    let tasks = [
        // Demo tasks for initial showcase
        {
            id: 1,
            text: 'Complete pre-flight inspection checklist',
            completed: false,
            createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            priority: 'high'
        },
        {
            id: 2,
            text: 'Review weather conditions for departure',
            completed: true,
            createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            completedAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
            priority: 'normal'
        },
        {
            id: 3,
            text: 'File flight plan with ATC',
            completed: false,
            createdAt: new Date(Date.now() - 5400000).toISOString(), // 1.5 hours ago
            priority: 'high'
        }
    ];
    
    let currentFilter = 'all';
    let currentSection = 'tasks';
    let taskIdCounter = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;

    // ===== DOM ELEMENT REFERENCES =====
    // Cache frequently accessed DOM elements for performance
    const elements = {
        // Navigation
        navButtons: document.querySelectorAll('.nav-btn'),
        sections: document.querySelectorAll('.content-section'),
        
        // Task management
        newTaskInput: document.getElementById('new-task-input'),
        addTaskBtn: document.getElementById('add-task-btn'),
        tasksList: document.getElementById('tasks-list'),
        emptyState: document.getElementById('empty-state'),
        
        // Filters
        filterTabs: document.querySelectorAll('.filter-tab'),
        
        // Counters
        upcomingCount: document.getElementById('upcoming-count'),
        completedCount: document.getElementById('completed-count'),
        totalTasks: document.getElementById('total-tasks'),
        pendingTasks: document.getElementById('pending-tasks'),
        completedTasks: document.getElementById('completed-tasks'),
        completionRate: document.getElementById('completion-rate'),
        flightHours: document.getElementById('flight-hours')
    };

    // ===== NAVIGATION FUNCTIONALITY =====
    // Handle section switching between Tasks and Dashboard
    function initializeNavigation() {
        elements.navButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetSection = this.dataset.section;
                switchSection(targetSection);
            });
        });
    }

    function switchSection(sectionName) {
        // Update navigation active state
        elements.navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === sectionName);
        });

        // Update content sections
        elements.sections.forEach(section => {
            section.classList.toggle('active', section.id === `${sectionName}-section`);
        });

        currentSection = sectionName;

        // Update dashboard when switching to it
        if (sectionName === 'dashboard') {
            updateDashboard();
        }
    }

    // ===== TASK MANAGEMENT FUNCTIONALITY =====
    
    // Add new task
    function addTask() {
        const taskText = elements.newTaskInput.value.trim();
        
        if (taskText === '') {
            // Add visual feedback for empty input
            elements.newTaskInput.style.borderColor = '#e74c3c';
            elements.newTaskInput.placeholder = 'Please enter a task...';
            setTimeout(() => {
                elements.newTaskInput.style.borderColor = '#bdc3c7';
                elements.newTaskInput.placeholder = 'Log new flight...';
            }, 2000);
            return;
        }

        // Create new task object
        const newTask = {
            id: taskIdCounter++,
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString(),
            priority: 'normal'
        };

        // Add to tasks array
        tasks.unshift(newTask); // Add to beginning for newest-first display
        
        // Clear input
        elements.newTaskInput.value = '';
        
        // Update display
        renderTasks();
        updateCounters();
        
        // Add success feedback
        showNotification('Flight logged successfully! ✈️', 'success');
    }

    // Toggle task completion
    function toggleTask(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            
            if (task.completed) {
                task.completedAt = new Date().toISOString();
                showNotification('Flight completed! Safe landing! 🛬', 'success');
            } else {
                delete task.completedAt;
                showNotification('Flight rescheduled for takeoff 🛫', 'info');
            }
            
            renderTasks();
            updateCounters();
        }
    }

    // Delete task
    function deleteTask(taskId) {
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            const task = tasks[taskIndex];
            
            // Add confirmation for safety
            if (confirm(`Cancel flight: "${task.text}"?`)) {
                tasks.splice(taskIndex, 1);
                renderTasks();
                updateCounters();
                showNotification('Flight cancelled 🚫', 'warning');
            }
        }
    }

    // ===== TASK RENDERING =====
    // Create HTML element for individual task (boarding pass style)
    function createTaskElement(task) {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.style.animationDelay = `${Math.random() * 0.2}s`;
        
        // Determine task icon based on completion status
        const taskIcon = task.completed ? '🛬' : '🛫';
        
        taskItem.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                 data-task-id="${task.id}"
                 role="checkbox" 
                 aria-checked="${task.completed}"
                 tabindex="0">
            </div>
            <div class="task-content">
                <span class="task-icon">${taskIcon}</span>
                <span class="task-text">${escapeHtml(task.text)}</span>
            </div>
            <div class="task-actions">
                <button class="task-btn complete-btn" data-task-id="${task.id}" data-action="toggle">
                    <span>${task.completed ? '🛫' : '🛬'}</span>
                    <span>${task.completed ? 'Reschedule' : 'Land'}</span>
                </button>
                <button class="task-btn delete-btn" data-task-id="${task.id}" data-action="delete">
                    <span>🚨</span>
                    <span>Cancel</span>
                </button>
            </div>
        `;

        return taskItem;
    }

    // Render all tasks based on current filter
    function renderTasks() {
        const filteredTasks = getFilteredTasks();
        
        // Clear current tasks
        elements.tasksList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            elements.tasksList.appendChild(elements.emptyState);
            elements.emptyState.style.display = 'block';
        } else {
            elements.emptyState.style.display = 'none';
            
            // Create and append task elements
            filteredTasks.forEach((task, index) => {
                const taskElement = createTaskElement(task);
                taskElement.style.animationDelay = `${index * 0.1}s`;
                elements.tasksList.appendChild(taskElement);
            });
        }

        // Add event listeners to new task elements
        addTaskEventListeners();
    }

    // Add event listeners to task elements
    function addTaskEventListeners() {
        // Checkbox click handlers
        const checkboxes = elements.tasksList.querySelectorAll('.task-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('click', function() {
                const taskId = parseInt(this.dataset.taskId);
                toggleTask(taskId);
            });
            
            // Keyboard accessibility
            checkbox.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const taskId = parseInt(this.dataset.taskId);
                    toggleTask(taskId);
                }
            });
        });

        // Action button click handlers
        const actionButtons = elements.tasksList.querySelectorAll('.task-btn');
        actionButtons.forEach(button => {
            button.addEventListener('click', function() {
                const taskId = parseInt(this.dataset.taskId);
                const action = this.dataset.action;
                
                if (action === 'toggle') {
                    toggleTask(taskId);
                } else if (action === 'delete') {
                    deleteTask(taskId);
                }
            });
        });
    }

    // ===== FILTERING FUNCTIONALITY =====
    // Initialize filter tab event listeners
    function initializeFilters() {
        elements.filterTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const filterType = this.dataset.filter;
                setFilter(filterType);
            });
        });
    }

    // Set active filter and update display
    function setFilter(filterType) {
        currentFilter = filterType;
        
        // Update active filter tab
        elements.filterTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === filterType);
        });
        
        // Re-render tasks with new filter
        renderTasks();
    }

    // Get tasks based on current filter
    function getFilteredTasks() {
        let filteredTasks = [...tasks];
        
        switch (currentFilter) {
            case 'pending':
                filteredTasks = tasks.filter(task => !task.completed);
                break;
            case 'completed':
                filteredTasks = tasks.filter(task => task.completed);
                break;
            default: // 'all'
                filteredTasks = tasks;
        }
        
        // Sort by creation date (newest first), with completed tasks at bottom for 'all' view
        if (currentFilter === 'all') {
            filteredTasks.sort((a, b) => {
                if (a.completed !== b.completed) {
                    return a.completed ? 1 : -1; // Incomplete tasks first
                }
                return new Date(b.createdAt) - new Date(a.createdAt); // Newest first within each group
            });
        } else {
            filteredTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        
        return filteredTasks;
    }

    // ===== STATISTICS AND COUNTERS =====
    // Update all counters and statistics
    function updateCounters() {
        const totalCount = tasks.length;
        const completedCount = tasks.filter(task => task.completed).length;
        const pendingCount = totalCount - completedCount;
        const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        
        // Update counter displays
        if (elements.upcomingCount) elements.upcomingCount.textContent = pendingCount;
        if (elements.completedCount) elements.completedCount.textContent = completedCount;
        if (elements.totalTasks) elements.totalTasks.textContent = totalCount;
        if (elements.pendingTasks) elements.pendingTasks.textContent = pendingCount;
        if (elements.completedTasks) elements.completedTasks.textContent = completedCount;
        if (elements.completionRate) elements.completionRate.textContent = `${completionRate}%`;
    }

    // Update dashboard statistics
    function updateDashboard() {
        updateCounters();
        
        // Calculate flight hours (mock calculation based on tasks)
        const flightHours = tasks.length * 2.5; // 2.5 hours per task average
        if (elements.flightHours) elements.flightHours.textContent = Math.round(flightHours);
        
        // Add subtle animations to stat cards
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('fade-in');
        });
    }

    // ===== NOTIFICATION SYSTEM =====
    // Show user feedback notifications
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 25px;
            color: white;
            font-weight: 500;
            z-index: 2000;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            max-width: 300px;
        `;
        
        // Set background color based on type
        const colors = {
            success: '#27ae60',
            warning: '#f39c12',
            error: '#e74c3c',
            info: '#3498db'
        };
        notification.style.background = colors[type] || colors.info;
        
        // Add notification styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        if (!document.querySelector('#notification-styles')) {
            style.id = 'notification-styles';
            document.head.appendChild(style);
        }
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    // ===== UTILITY FUNCTIONS =====
    // Escape HTML to prevent XSS attacks
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ===== INPUT HANDLING =====
    // Initialize input event listeners
    function initializeInputHandlers() {
        // Add task button click
        elements.addTaskBtn.addEventListener('click', addTask);
        
        // Enter key to add task
        elements.newTaskInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTask();
            }
        });
        
        // Clear error styling on input
        elements.newTaskInput.addEventListener('input', function() {
            this.style.borderColor = '#bdc3c7';
        });
    }

    // ===== LOCAL STORAGE (OPTIONAL) =====
    // Save tasks to localStorage for persistence
    function saveTasks() {
        try {
            localStorage.setItem('skylist-tasks', JSON.stringify(tasks));
        } catch (error) {
            console.warn('Could not save tasks to localStorage:', error);
        }
    }

    // Load tasks from localStorage
    function loadTasks() {
        try {
            const savedTasks = localStorage.getItem('skylist-tasks');
            if (savedTasks) {
                const parsedTasks = JSON.parse(savedTasks);
                if (Array.isArray(parsedTasks)) {
                    tasks = parsedTasks;
                    if (tasks.length > 0) {
                        taskIdCounter = Math.max(...tasks.map(t => t.id)) + 1;
                    }
                }
            }
        } catch (error) {
            console.warn('Could not load tasks from localStorage:', error);
        }
    }

    // Save tasks whenever they change
    function saveTasksWithDelay() {
        clearTimeout(window.saveTasksTimeout);
        window.saveTasksTimeout = setTimeout(saveTasks, 500);
    }

    // Override task modification functions to auto-save
    const originalAddTask = addTask;
    const originalToggleTask = toggleTask;
    const originalDeleteTask = deleteTask;

    addTask = function() {
        originalAddTask();
        saveTasksWithDelay();
    };

    toggleTask = function(taskId) {
        originalToggleTask(taskId);
        saveTasksWithDelay();
    };

    deleteTask = function(taskId) {
        originalDeleteTask(taskId);
        saveTasksWithDelay();
    };

    // ===== INITIALIZATION =====
    // Initialize the application
    function initializeApp() {
        console.log('🛫 SkyList Aviation Task Management - Taking Off!');
        
        // Load saved tasks
        loadTasks();
        
        // Initialize all components
        initializeNavigation();
        initializeFilters();
        initializeInputHandlers();
        
        // Initial render
        renderTasks();
        updateCounters();
        
        // Add welcome message
        showNotification('Welcome to SkyList Control Tower! ✈️', 'success');
        
        console.log('✅ SkyList initialized successfully with', tasks.length, 'flights');
    }

    // ===== PAGE LOADING ANIMATION =====
    // Add smooth page entrance animation
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);

    // Start the application
    initializeApp();

    // ===== DEVELOPER TOOLS =====
    // Expose useful functions for debugging
    window.SkyListDebug = {
        tasks: () => tasks,
        addSampleTasks: () => {
            const sampleTasks = [
                'Check fuel levels and weight distribution',
                'Coordinate with ground crew for pushback',
                'Review passenger manifest and seating',
                'Test all navigation and communication systems',
                'Conduct final safety walkthrough'
            ];
            
            sampleTasks.forEach(taskText => {
                const newTask = {
                    id: taskIdCounter++,
                    text: taskText,
                    completed: false,
                    createdAt: new Date().toISOString(),
                    priority: 'normal'
                };
                tasks.unshift(newTask);
            });
            
            renderTasks();
            updateCounters();
            saveTasksWithDelay();
            showNotification('Sample flights added for demo! 🛩️', 'info');
        },
        clearAllTasks: () => {
            if (confirm('Clear all flights from the system?')) {
                tasks = [];
                taskIdCounter = 1;
                renderTasks();
                updateCounters();
                saveTasks();
                showNotification('All flights cleared! Ready for new missions! 🏁', 'warning');
            }
        }
    };

    console.log('🔧 Debug tools available: window.SkyListDebug');
});

/* ===== FEATURE SUMMARY =====
 * 
 * SkyList Aviation Task Management Application Features:
 * 
 * 🎯 CORE FUNCTIONALITY:
 * - Add, complete, and delete tasks with aviation terminology
 * - Filter tasks by status (All Flights, Scheduled, Landed)
 * - Real-time statistics and progress tracking
 * - Responsive boarding pass-style task cards
 * - Local storage persistence for task data
 * 
 * 🛫 AVIATION THEME IMPLEMENTATION:
 * - Boarding pass-style task items with perforated edges
 * - Airplane window-style checkboxes
 * - Aviation terminology throughout (takeoff, landing, flights)
 * - Sky gradient backgrounds with cloud motifs
 * - Pilot profile and control tower dashboard
 * 
 * 🎨 USER EXPERIENCE FEATURES:
 * - Smooth animations and transitions
 * - Real-time notifications with feedback
 * - Keyboard accessibility support
 * - Mobile-responsive design
 * - Empty state with helpful guidance
 * 
 * 🔧 TECHNICAL IMPLEMENTATION:
 * - Vanilla JavaScript for maximum performance
 * - Event delegation for efficient DOM handling
 * - Local storage for data persistence
 * - XSS prevention with HTML escaping
 * - Modular function organization
 * 
 * 📊 DASHBOARD ANALYTICS:
 * - Task completion statistics
 * - Flight hours calculation
 * - Success rate tracking
 * - Pilot profile information
 * 
 * This implementation provides a fully functional task management system
 * with comprehensive aviation theming that enhances user engagement
 * while maintaining professional functionality.
 */
