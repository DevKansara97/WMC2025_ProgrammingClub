document.addEventListener('DOMContentLoaded', () => {
    const welcomeUsernameSpan = document.getElementById('welcomeUsername');
    const logoutButton = document.getElementById('logoutButton');
    const navItems = document.querySelectorAll('.sidebar .nav-item');
    const dashboardSections = document.querySelectorAll('.dashboard-section');

    // Overview Stats elements
    const totalAvengersElem = document.getElementById('totalAvengers');
    const activeMissionsElem = document.getElementById('activeMissions');
    const pendingFeedbackElem = document.getElementById('pendingFeedback');
    const totalPaymentsElem = document.getElementById('totalPayments');

    // Payments section elements
    const sendSalaryForm = document.getElementById('sendSalaryForm');
    const salaryRecipientSelect = document.getElementById('salary-recipient');
    const salaryAmountInput = document.getElementById('salary-amount');
    const salaryTypeSelect = document.getElementById('salary-type');
    const advancedAmountGroup = document.querySelector('.advanced-amount-group');
    const advancedAmountInput = document.getElementById('advanced-amount');
    const paymentMessage = document.getElementById('paymentMessage');
    const paymentRecordsTableBody = document.getElementById('paymentRecordsTableBody');

    // Missions section elements
    const assignMissionForm = document.getElementById('assignMissionForm');
    const missionNameInput = document.getElementById('mission-name');
    const missionDescriptionTextarea = document.getElementById('mission-description');
    const missionMembersSelect = document.getElementById('mission-members');
    const missionStatusSelect = document.getElementById('mission-status');
    const missionMessage = document.getElementById('missionMessage');
    const missionsTableBody = document.getElementById('missionsTableBody');

    // Attendance section elements
    const startAttendanceBtn = document.getElementById('start-attendance-btn');
    const attendanceCodeDisplay = document.getElementById('attendance-code-display');
    const attendanceCodeSpan = document.getElementById('attendance-code');
    const countdownSpan = document.getElementById('countdown');
    const attendanceSessionMessage = document.getElementById('attendanceSessionMessage');
    const attendanceRecordsTableBody = document.getElementById('attendanceRecordsTableBody');
    let countdownInterval;

    // Feedback section elements
    const feedbackListDiv = document.getElementById('feedbackList');

    // Announcements section elements
    const createAnnouncementForm = document.getElementById('createAnnouncementForm');
    const announcementTitleInput = document.getElementById('announcement-title');
    const announcementContentTextarea = document.getElementById('announcement-content');
    const announcementMessage = document.getElementById('announcementMessage');
    const announcementsListDiv = document.getElementById('announcementsList');

    // Manage Avengers section elements
    const avengersRosterTableBody = document.getElementById('avengersRosterTableBody');

    // Stats & Reports Chart elements
    const attendanceChartCanvas = document.getElementById('attendanceChart');
    const missionChartCanvas = document.getElementById('missionChart');
    let attendanceChartInstance;
    let missionChartInstance;

    // --- Navigation functionality ---
    const sections = document.querySelectorAll('.dashboard-section');

    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Hide all sections
            sections.forEach(section => section.classList.add('hidden'));
            
            // Show selected section
            const targetSection = this.getAttribute('data-section');
            const section = document.getElementById(targetSection);
            if (section) {
                section.classList.remove('hidden');
            }
        });
    });

    // --- Attendance code countdown ---
    let countdownTime = 272; // 4 minutes 32 seconds in seconds

    function updateCountdown() {
        const minutes = Math.floor(countdownTime / 60);
        const seconds = countdownTime % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const countdownElement = document.getElementById('countdown');
        if (countdownElement) {
            countdownElement.textContent = formattedTime;
        }
        
        if (countdownTime > 0) {
            countdownTime--;
        } else {
            // Generate new code when countdown reaches 0
            generateNewAttendanceCode();
            countdownTime = 300; // Reset to 5 minutes
        }
    }

    function generateNewAttendanceCode() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        
        const codeElement = document.getElementById('attendanceCode');
        if (codeElement) {
            codeElement.textContent = result;
        }
    }

    // Start countdown
    setInterval(updateCountdown, 1000);

    // --- Button interactions with enhanced animations ---
    document.addEventListener('click', function(e) {
        // Handle specific button actions
        if (e.target.textContent.includes('Generate New Code')) {
            generateNewAttendanceCode();
            countdownTime = 300; // Reset countdown
            showNotification('New attendance code generated!', 'success');
        }
        
        if (e.target.textContent.includes('Deploy Heroes')) {
            showNotification('🚨 All available heroes have been notified and are deploying immediately!', 'warning');
        }
        
        if (e.target.textContent.includes('Monitor')) {
            showNotification('📡 Opening mission monitoring interface...', 'info');
        }
        
        if (e.target.textContent.includes('View Profile')) {
            showNotification('👤 Opening hero profile...', 'info');
        }
        
        if (e.target.textContent.includes('Contact')) {
            showNotification('📞 Establishing secure communication channel...', 'info');
        }
        
        if (e.target.textContent.includes('Update Profile')) {
            showNotification('✅ Profile updated successfully!', 'success');
        }
        
        if (e.target.textContent.includes('Save Security Settings')) {
            showNotification('🔒 Security settings saved successfully!', 'success');
        }
    });

    // --- Add hover effects to cards ---
    const cards = document.querySelectorAll('.card, .stat-card, .mission-card, .avenger-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });

    // --- Simulate real-time updates with enhanced animations ---
    function simulateRealTimeUpdates() {
        // Update active heroes count
        const activeHeroesElement = document.querySelector('.stat-card:first-child p');
        if (activeHeroesElement) {
            const currentCount = parseInt(activeHeroesElement.textContent);
            const newCount = Math.max(20, Math.min(30, currentCount + Math.floor(Math.random() * 3) - 1));
            
            // Add pulse animation when value changes
            if (newCount !== currentCount) {
                activeHeroesElement.style.animation = 'pulse 0.5s ease-in-out';
                setTimeout(() => {
                    activeHeroesElement.style.animation = '';
                }, 500);
            }
            
            activeHeroesElement.textContent = newCount;
        }
        
        // Update threats neutralized
        const threatsElement = document.querySelector('.stat-card:nth-child(3) p');
        if (threatsElement) {
            const currentCount = parseInt(threatsElement.textContent);
            const newCount = currentCount + Math.floor(Math.random() * 2);
            
            if (newCount !== currentCount) {
                threatsElement.style.animation = 'pulse 0.5s ease-in-out';
                setTimeout(() => {
                    threatsElement.style.animation = '';
                }, 500);
            }
            
            threatsElement.textContent = newCount;
        }
    }

    // Update stats every 30 seconds
    setInterval(simulateRealTimeUpdates, 30000);

    // --- Enhanced loading animation for buttons ---
    document.querySelectorAll('.button').forEach(button => {
        button.addEventListener('click', function() {
            if (this.disabled) return;
            
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            this.disabled = true;
            this.style.opacity = '0.7';
            
            setTimeout(() => {
                this.innerHTML = originalText;
                this.disabled = false;
                this.style.opacity = '';
            }, 2000);
        });
    });

    // --- Utility Functions ---
    function showMessage(element, message, isSuccess) {
        element.textContent = message;
        element.classList.remove('success', 'error', 'hidden');
        element.classList.add(isSuccess ? 'success' : 'error');
        setTimeout(() => {
            element.classList.add('hidden'); // Hide after some time
        }, 5000);
    }

    async function fetchData(url, method = 'GET', body = null) {
        try {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include' // IMPORTANT: Send cookies with every authenticated request
            };
            if (body) {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(url, options);

            if (response.status === 401 || response.status === 403) {
                // If unauthorized or forbidden, redirect to login page
                alert('Session expired or unauthorized. Please log in again.'); // Replace with custom modal
                window.location.href = '/index.html';
                return null; // Indicate failure
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            // Check if response has content before parsing JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            return response; // Return response object if not JSON (e.g., for logout)

        } catch (error) {
            console.error('Fetch error:', error);
            // This alert will be replaced by a custom modal later.
            alert('An error occurred: ' + error.message);
            return null;
        }
    }

    // --- Initial Load & User Details ---
    async function loadUserDetails() {
        const data = await fetchData('/api/user/details');
        if (data) {
            welcomeUsernameSpan.textContent = data.username;
        }
    }

    // --- Dashboard Overview Stats ---
    async function loadDashboardStats() {
        const stats = await fetchData('/api/admin/dashboard-stats');
        if (stats) {
            totalAvengersElem.textContent = stats.totalAvengers;
            activeMissionsElem.textContent = stats.activeMissions;
            pendingFeedbackElem.textContent = stats.pendingFeedback;
            totalPaymentsElem.textContent = `₹ ${stats.totalPaymentsThisMonth.toLocaleString('en-IN')}`; // Format for Indian Rupees
        }
    }

    // --- Show overview section by default ---
    const overviewSection = document.getElementById('overview');
    if (overviewSection) {
        overviewSection.classList.remove('hidden');
    }
    
    // --- Add welcome notification ---
    setTimeout(() => {
        showNotification('🦸‍♂️ Welcome to Avengers Command Center!', 'info');
    }, 1000);
    
    console.log('🦸‍♂️ Avengers Command Center initialized successfully!');
});