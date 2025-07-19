// Theme switching functionality
const themeToggle = document.getElementById('checkbox');
const themeLabel = document.querySelector('.theme-switch-wrapper em');

if (themeToggle) {
    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.className = 'dark-mode';
            themeLabel.textContent = 'Dark Mode';
            localStorage.setItem('theme', 'dark-mode');
        } else {
            document.body.className = 'light-mode';
            themeLabel.textContent = 'Light Mode';
            localStorage.setItem('theme', 'light-mode');
        }
    });
}

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.body.className = savedTheme;
    if (themeToggle) {
        themeToggle.checked = savedTheme === 'dark-mode';
        if (themeLabel) {
            themeLabel.textContent = savedTheme === 'dark-mode' ? 'Dark Mode' : 'Light Mode';
        }
    }
} else {
    // Default to dark mode
    document.body.className = 'dark-mode';
    if (themeToggle) {
        themeToggle.checked = true;
        if (themeLabel) {
            themeLabel.textContent = 'Dark Mode';
        }
    }
}

// Enhanced notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add notification styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: ${type === 'success' ? 'linear-gradient(135deg, #28a745, #20c997)' : 
                    type === 'warning' ? 'linear-gradient(135deg, #ffc107, #fd7e14)' : 
                    type === 'error' ? 'linear-gradient(135deg, #dc3545, #c82333)' : 
                    'linear-gradient(135deg, #17a2b8, #6f42c1)'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(15px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
        font-weight: 500;
    `;
    
    // Add close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
    
    document.body.appendChild(notification);
}

// Enhanced loading animation for buttons
document.addEventListener('click', function(e) {
    if (e.target.matches('.button')) {
        // Add click animation
        e.target.style.transform = 'scale(0.95)';
        setTimeout(() => {
            e.target.style.transform = '';
        }, 150);
    }
});

// Form validation and enhancement
const forms = document.querySelectorAll('form');
forms.forEach(form => {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Add form validation animation
        const inputs = form.querySelectorAll('.input-field');
        let isValid = true;
        
        inputs.forEach(input => {
            if (input.hasAttribute('required') && !input.value.trim()) {
                input.style.borderColor = '#dc3545';
                input.style.animation = 'shake 0.5s ease-in-out';
                isValid = false;
                
                setTimeout(() => {
                    input.style.animation = '';
                    input.style.borderColor = '';
                }, 500);
            }
        });
        
        if (isValid) {
            showNotification('Form submitted successfully!', 'success');
        } else {
            showNotification('Please fill in all required fields.', 'error');
        }
    });
});

// Enhanced search functionality
const searchInputs = document.querySelectorAll('input[type="search"], input[placeholder*="search"]');
searchInputs.forEach(input => {
    input.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        // Add search functionality based on context
        // This would be implemented based on specific search requirements
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K for quick search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"]');
        if (searchInput) {
            searchInput.focus();
        }
    }
    
    // Escape to close modals/notifications
    if (e.key === 'Escape') {
        const notification = document.querySelector('.notification');
        if (notification) {
            notification.querySelector('.notification-close').click();
        }
    }
});

// Initialize page with enhanced loading
document.addEventListener('DOMContentLoaded', function() {
    // Add loading animation
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease-in-out';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
    
    console.log('🎨 Base styles and theme system initialized!');
});

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
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
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s ease;
    }
    
    .notification-close:hover {
        background-color: rgba(255, 255, 255, 0.2);
    }
`;
document.head.appendChild(style);