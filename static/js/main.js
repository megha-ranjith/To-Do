// ============================================
// FLASK TO-DO LIST - MAIN JAVASCRIPT
// ============================================

// DOM Elements
let addTaskBtn, modal, taskForm, closeModalBtn, cancelBtn, themeToggle;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('App initializing...');
    
    // Get DOM elements
    addTaskBtn = document.getElementById('add-task-btn');
    modal = document.getElementById('addTaskModal');
    taskForm = document.getElementById('taskForm');
    closeModalBtn = document.getElementById('closeModal');
    cancelBtn = document.getElementById('cancelBtn');
    themeToggle = document.getElementById('theme-toggle');
    
    // Setup event listeners
    setupEventListeners();
    
    // Load theme
    loadTheme();
    
    console.log('App initialized successfully');
});

function setupEventListeners() {
    // Add Task button
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', openModal);
        console.log('Add task button listener attached');
    }
    
    // Close modal button (X)
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
        console.log('Close modal button listener attached');
    }
    
    // Cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
        console.log('Cancel button listener attached');
    }
    
    // Click outside modal to close
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Form submit
    if (taskForm) {
        taskForm.addEventListener('submit', submitTask);
        console.log('Form submit listener attached');
    }
    
    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
        console.log('Theme toggle listener attached');
    }
    
    // Delete task buttons
    const deleteButtons = document.querySelectorAll('.delete-task');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', deleteTask);
    });
    console.log(`Attached ${deleteButtons.length} delete listeners`);
    
    // Task toggle checkboxes
    const toggleCheckboxes = document.querySelectorAll('.task-toggle');
    toggleCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', toggleTaskCompletion);
    });
    console.log(`Attached ${toggleCheckboxes.length} toggle listeners`);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// ============================================
// MODAL FUNCTIONS
// ============================================

function openModal() {
    console.log('Opening modal...');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        console.log('Modal opened');
    }
}

function closeModal() {
    console.log('Closing modal...');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        if (taskForm) {
            taskForm.reset();
        }
        console.log('Modal closed');
    }
}

// ============================================
// TASK OPERATIONS
// ============================================

async function submitTask(e) {
    e.preventDefault();
    console.log('Submitting task...');
    
    const formData = new FormData(taskForm);
    const taskData = Object.fromEntries(formData);
    
    console.log('Task data:', taskData);
    
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Task created:', result);
            closeModal();
            showNotification('✓ Task added successfully!', 'success');
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            const error = await response.json();
            console.error('Error response:', error);
            showNotification('❌ Error adding task', 'error');
        }
    } catch (error) {
        console.error('Network error:', error);
        showNotification('❌ Network error', 'error');
    }
}

async function deleteTask(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const taskId = e.target.dataset.taskId || e.target.closest('.delete-task').dataset.taskId;
    console.log('Deleting task:', taskId);
    
    if (!confirm('Are you sure you want to delete this task?')) {
        console.log('Delete cancelled');
        return;
    }
    
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            console.log('Task deleted successfully');
            showNotification('✓ Task deleted!', 'success');
            setTimeout(() => {
                location.reload();
            }, 800);
        } else {
            console.error('Delete failed');
            showNotification('❌ Error deleting task', 'error');
        }
    } catch (error) {
        console.error('Network error:', error);
        showNotification('❌ Network error', 'error');
    }
}

async function toggleTaskCompletion(e) {
    const taskId = e.target.dataset.taskId;
    console.log('Toggling task completion:', taskId);
    
    try {
        const response = await fetch(`/api/tasks/${taskId}/toggle`, {
            method: 'POST'
        });
        
        if (response.ok) {
            console.log('Task toggled successfully');
            location.reload();
        } else {
            console.error('Toggle failed');
        }
    } catch (error) {
        console.error('Network error:', error);
    }
}

// ============================================
// THEME FUNCTIONS
// ============================================

function toggleTheme() {
    console.log('Toggling theme...');
    document.body.classList.toggle('light-mode');
    
    const isLight = document.body.classList.contains('light-mode');
    const theme = isLight ? 'light' : 'dark';
    
    localStorage.setItem('theme', theme);
    console.log('Theme set to:', theme);
    
    // Update icon
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
    
    showNotification(isLight ? '☀️ Light mode' : '🌙 Dark mode', 'info');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    console.log('Loading theme:', savedTheme);
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
    
    // Update icon
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = savedTheme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================

function showNotification(message, type = 'info') {
    console.log(`Notification [${type}]:`, message);
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    const colors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background-color: ${colors[type] || colors.info};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: slideInRight 0.3s ease;
        font-weight: 600;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + N: Open add task modal
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        openModal();
    }
    
    // Escape: Close modal
    if (e.key === 'Escape') {
        closeModal();
    }
    
    // Ctrl/Cmd + K: Focus search (if exists)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('search');
        if (searchInput) {
            searchInput.focus();
        }
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatDate(dateString) {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function getPriorityColor(priority) {
    const colors = {
        high: '#EF4444',
        medium: '#F59E0B',
        low: '#10B981'
    };
    return colors[priority] || '#6B7280';
}

// ============================================
// ANIMATIONS CSS (injected)
// ============================================

const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('JavaScript loaded successfully! 🚀');