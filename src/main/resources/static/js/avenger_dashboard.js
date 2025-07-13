document.addEventListener('DOMContentLoaded', async () => {
    const body = document.body;
    const themeToggle = document.getElementById('checkbox');
    const navItems = document.querySelectorAll('.nav-item');
    const dashboardSections = document.querySelectorAll('.dashboard-section');
    const logoutButton = document.getElementById('logoutButton');
    const welcomeMessage = document.querySelector('.welcome-message');

    let currentUsername = null;
    let currentUserRole = null;
    let selectedRating = 0;

    // Mock data
    const mockUserData = {
        username: 'Peter Parker',
        alias: 'Spider-Man',
        balance: 75000,
        activeMissions: 3,
        completedMissions: 47,
        attendanceRate: 96
    };

    // Theme Toggle Functionality
    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        }
    });

    // Set initial theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        themeToggle.checked = false;
    } else {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        themeToggle.checked = true;
    }

    // Authentication Check (Mock for now)
    try {
        currentUsername = mockUserData.username;
        currentUserRole = 'AVENGER';
        
        if (welcomeMessage && currentUsername) {
            welcomeMessage.textContent = `Welcome, ${currentUsername}!`;
        }
        
        // Update stats
        updateDashboardStats();
    } catch (error) {
        console.error('Authentication error:', error);
        // Redirect to login in real implementation
        // window.location.href = 'index.html';
    }

    // Logout Functionality
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                localStorage.removeItem('auth-token');
                showNotification('Logged out successfully', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } catch (error) {
                console.error('Logout error:', error);
                showNotification('Logout failed', 'error');
            }
        });
    }

    // Sidebar Navigation
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            dashboardSections.forEach(section => section.classList.add('hidden'));

            const targetSectionId = item.dataset.section;
            const targetSection = document.getElementById(targetSectionId);
            if (targetSection) {
                targetSection.classList.remove('hidden');
            }

            // Load section-specific data
            loadSectionData(targetSectionId);
        });
    });

    // Global function for quick actions
    window.switchSection = (sectionId) => {
        const targetNavItem = document.querySelector(`[data-section="${sectionId}"]`);
        if (targetNavItem) {
            targetNavItem.click();
        }
    };

    // Attendance Code Submission
    const submitAttendanceBtn = document.getElementById('submit-attendance');
    const attendanceCodeInput = document.getElementById('attendance-code');
    const attendanceStatus = document.getElementById('attendance-status');

    if (submitAttendanceBtn && attendanceCodeInput) {
        submitAttendanceBtn.addEventListener('click', () => {
            const code = attendanceCodeInput.value.trim();
            
            if (code.length !== 6) {
                showNotification('Please enter a valid 6-digit code', 'error');
                return;
            }

            // Mock attendance marking
            submitAttendanceBtn.disabled = true;
            submitAttendanceBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Marking...';

            setTimeout(() => {
                attendanceStatus.classList.remove('hidden');
                attendanceCodeInput.value = '';
                submitAttendanceBtn.disabled = false;
                submitAttendanceBtn.innerHTML = '<i class="fas fa-user-check"></i> Mark Attendance';
                showNotification('Attendance marked successfully!', 'success');
            }, 1500);
        });

        // Auto-format attendance code input
        attendanceCodeInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
        });
    }

    // Mission Filters
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            filterMissions(filter);
        });
    });

    // Star Rating System
    const stars = document.querySelectorAll('.star-rating i');
    const ratingText = document.querySelector('.rating-text');

    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            selectedRating = index + 1;
            updateStarRating(selectedRating);
        });

        star.addEventListener('mouseenter', () => {
            updateStarRating(index + 1);
        });
    });

    document.querySelector('.star-rating').addEventListener('mouseleave', () => {
        updateStarRating(selectedRating);
    });

    function updateStarRating(rating) {
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.remove('far');
                star.classList.add('fas');
            } else {
                star.classList.remove('fas');
                star.classList.add('far');
            }
        });
        
        if (ratingText) {
            const ratingTexts = ['Select a rating', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
            ratingText.textContent = ratingTexts[rating] || 'Select a rating';
        }
    }

    // Feedback Form Submission
    const feedbackForm = document.querySelector('.feedback-form');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const category = document.getElementById('feedback-category').value;
            const subject = document.getElementById('feedback-subject').value;
            const message = document.getElementById('feedback-message').value;
            const anonymous = document.getElementById('feedback-anonymous').checked;

            if (!category || !subject || !message || selectedRating === 0) {
                showNotification('Please fill all required fields and select a rating', 'error');
                return;
            }

            // Mock feedback submission
            const submitBtn = feedbackForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

            setTimeout(() => {
                feedbackForm.reset();
                selectedRating = 0;
                updateStarRating(0);
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Feedback';
                showNotification('Feedback sent successfully!', 'success');
            }, 2000);
        });
    }

    // Profile Form Submission
    const profileForm = document.querySelector('.profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const submitBtn = profileForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
                showNotification('Profile updated successfully!', 'success');
            }, 1500);
        });
    }

    // Calendar Generation and Navigation
    let currentDate = new Date();
    
    function generateCalendar(year, month) {
        const calendarGrid = document.querySelector('.calendar-grid');
        if (!calendarGrid) return;

        const monthHeader = document.getElementById('current-month');
        if (monthHeader) {
            const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            monthHeader.textContent = `${monthNames[month]} ${year}`;
        }

        // Clear existing calendar days (keep headers)
        const existingDays = calendarGrid.querySelectorAll('.calendar-day:not(.header)');
        existingDays.forEach(day => day.remove());

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day';
            calendarGrid.appendChild(emptyDay);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;

            // Mock attendance data - randomly mark some days as present/absent
            if (day <= new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) {
                if (Math.random() > 0.1) { // 90% attendance rate
                    dayElement.classList.add('present');
                } else {
                    dayElement.classList.add('absent');
                }
            }

            calendarGrid.appendChild(dayElement);
        }
    }

    // Calendar navigation
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
        });
    }

    // Initialize calendar
    generateCalendar(currentDate.getFullYear(), currentDate.getMonth());

    // Helper Functions
    function updateDashboardStats() {
        document.getElementById('activeMissions').textContent = mockUserData.activeMissions;
        document.getElementById('completedMissions').textContent = mockUserData.completedMissions;
        document.getElementById('attendanceRate').textContent = `${mockUserData.attendanceRate}%`;
        document.getElementById('currentBalance').textContent = `₹ ${mockUserData.balance.toLocaleString()}`;
    }

    function filterMissions(filter) {
        const missionCards = document.querySelectorAll('.mission-card');
        
        missionCards.forEach(card => {
            switch (filter) {
                case 'all':
                    card.style.display = 'block';
                    break;
                case 'active':
                    card.style.display = card.classList.contains('active') ? 'block' : 'none';
                    break;
                case 'completed':
                    card.style.display = card.classList.contains('completed') ? 'block' : 'none';
                    break;
                case 'pending':
                    card.style.display = card.classList.contains('pending') ? 'block' : 'none';
                    break;
                default:
                    card.style.display = 'block';
            }
        });
    }

    function loadSectionData(sectionId) {
        switch (sectionId) {
            case 'attendance':
                generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
                break;
            case 'balance':
                // Load transaction history or balance data
                break;
            case 'profile':
                // Load user profile data
                break;
        }
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    function getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }

    function getNotificationColor(type) {
        switch (type) {
            case 'success': return 'linear-gradient(135deg, #28a745, #20c997)';
            case 'error': return 'linear-gradient(135deg, #dc3545, #e74c3c)';
            case 'warning': return 'linear-gradient(135deg, #ffc107, #f39c12)';
            default: return 'linear-gradient(135deg, #1e3a8a, #3b82f6)';
        }
    }

    // Add notification animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // Initialize with overview section
    loadSectionData('overview');
});
