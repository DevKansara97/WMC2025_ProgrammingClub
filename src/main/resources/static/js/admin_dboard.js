// public/js/admin_dboard.js

document.addEventListener('DOMContentLoaded', async () => { // Made async for initial fetch

    // --- Theme Switch Logic (from your style.js or common utils) ---
    // Best practice: put theme switching in a shared `style.js` or `utils.js`
    // and just call it here or include that script before this one.
    // For now, I'll keep it here as it was in your original, but note the redundancy.
    const checkbox = document.getElementById('checkbox');
    const body = document.body;

    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        body.classList.remove('light-mode', 'dark-mode');
        body.classList.add(currentTheme);
        checkbox.checked = (currentTheme === 'dark-mode');
    } else {
        body.classList.add('dark-mode');
        checkbox.checked = true;
    }

    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            body.classList.replace('light-mode', 'dark-mode');
            localStorage.setItem('theme', 'dark-mode');
        } else {
            body.classList.replace('dark-mode', 'light-mode');
            localStorage.setItem('theme', 'light-mode');
        }
    });

    // --- Authentication Check & Fetch User Details ---
    const welcomeMessage = document.querySelector('.welcome-message'); // Get the welcome message element
    let currentUsername = null;
    let currentUserRole = null;

    try {
        const response = await fetch('/api/user/details', { // New backend endpoint needed!
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
                // Cookies are sent automatically by the browser
            }
        });

        if (response.ok) {
            const data = await response.json(); // Expected: { username: "...", role: "ADMIN" }
            currentUsername = data.username;
            currentUserRole = data.role;

            if (currentUserRole !== 'ADMIN') {
                // If not an admin, redirect them out!
                alert('Access Denied: You are not authorized to view this page.');
                await fetch('/api/auth/logout', { method: 'POST' }); // Log out immediately
                window.location.href = 'index.html';
                return; // Stop further execution
            }

            if (welcomeMessage && currentUsername) {
                welcomeMessage.textContent = `Welcome, ${currentUsername}!`; // Dynamically set username
            }

        } else if (response.status === 401 || response.status === 403) {
            // Unauthorized or Forbidden - likely session expired or not logged in
            console.warn('Unauthorized access to admin dashboard. Redirecting to login.');
            window.location.href = 'index.html';
            return;
        } else {
            // Other errors
            const errorData = await response.json();
            console.error('Failed to fetch user details for admin dashboard:', errorData.message || 'Server error');
            alert('Failed to load admin data. Please try logging in again.');
            window.location.href = 'index.html';
            return;
        }
    } catch (error) {
        console.error('Network error fetching user details for admin dashboard:', error);
        alert('An error occurred. Please check your network and try again.');
        window.location.href = 'index.html';
        return;
    }


    // --- Logout Functionality ---
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    console.log('Logged out successfully');
                    window.location.href = 'index.html'; // Redirect to login page
                } else {
                    const errorData = await response.json();
                    console.error('Logout failed:', errorData.message || 'Server error');
                    alert('Logout failed. Please try again.');
                }
            } catch (error) {
                console.error('Network error during logout:', error);
                alert('An error occurred during logout. Please check your connection.');
            }
        });
    }


    // --- Dynamic Section Switching (Sidebar Navigation) ---
    const navItems = document.querySelectorAll('.sidebar .nav-item');
    const sections = document.querySelectorAll('.dashboard-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            sections.forEach(section => section.classList.add('hidden'));

            const targetSectionId = item.dataset.section;
            const targetSection = document.getElementById(targetSectionId);
            if (targetSection) {
                targetSection.classList.remove('hidden');
            }
        });
    });


    // --- Attendance Code Generation Logic ---
    const startAttendanceButton = document.getElementById('start-attendance-btn');
    const attendanceCodeDisplay = document.getElementById('attendance-code-display');
    const attendanceCodeSpan = document.getElementById('attendance-code');
    const countdownSpan = document.getElementById('countdown');
    let countdownInterval;

    if (startAttendanceButton) {
        startAttendanceButton.addEventListener('click', async () => {
            startAttendanceButton.disabled = true;
            startAttendanceButton.textContent = 'Generating...';

            try {
                const response = await fetch('/api/admin/attendance/start', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json(); // Expects { code: "...", message: "..." }
                    attendanceCodeSpan.textContent = data.code;
                    attendanceCodeDisplay.classList.remove('hidden');

                    let timeLeft = 60; // seconds
                    countdownSpan.textContent = timeLeft;

                    clearInterval(countdownInterval);
                    countdownInterval = setInterval(() => {
                        timeLeft--;
                        countdownSpan.textContent = timeLeft;
                        if (timeLeft <= 0) {
                            clearInterval(countdownInterval);
                            attendanceCodeDisplay.classList.add('hidden');
                            attendanceCodeSpan.textContent = '';
                            startAttendanceButton.disabled = false;
                            startAttendanceButton.textContent = 'Generate Attendance Code';
                            alert('Attendance code expired!');
                        }
                    }, 1000);

                } else {
                    const errorData = await response.json();
                    alert('Failed to generate attendance code: ' + (errorData.message || 'Server error'));
                    startAttendanceButton.disabled = false;
                    startAttendanceButton.textContent = 'Generate Attendance Code';
                }
            } catch (error) {
                console.error('Error generating attendance code:', error);
                alert('Network error or server unavailable.');
                startAttendanceButton.disabled = false;
                startAttendanceButton.textContent = 'Generate Attendance Code';
            }
        });
    }

    // --- Payment Form Logic (Advanced Amount Visibility) ---
    const salaryTypeSelect = document.getElementById('salary-type');
    const advancedAmountGroup = document.querySelector('.advanced-amount-group');

    if (salaryTypeSelect && advancedAmountGroup) {
        salaryTypeSelect.addEventListener('change', () => {
            if (salaryTypeSelect.value === 'advanced') {
                advancedAmountGroup.classList.remove('hidden');
            } else {
                advancedAmountGroup.classList.add('hidden');
            }
        });
    }

    // --- Chart.js Initialization ---
    const attendanceCtx = document.getElementById('attendanceChart');
    const missionCtx = document.getElementById('missionChart');

    if (attendanceCtx) {
        new Chart(attendanceCtx, {
            type: 'bar',
            data: {
                labels: ['Bucky Barnes', 'Shuri', 'Okoye', 'Other Avengers'],
                datasets: [{
                    label: 'Attendance Percentage',
                    data: [95, 98, 90, 85],
                    backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)', 'rgba(255, 99, 132, 0.6)'],
                    borderColor: ['rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)', 'rgba(255, 99, 132, 1)'],
                    borderWidth: 1
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }
        });
    }

    if (missionCtx) {
        new Chart(missionCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Mission Completion Rate (%)',
                    data: [75, 80, 85, 90, 92, 88],
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }
        });
    }

    // --- Dynamic Data Fetching (Example placeholders) ---
    async function fetchAvengersList() {
        try {
            const response = await fetch('/api/admin/avengers');
            if (!response.ok) {
                throw new Error('Failed to fetch Avengers list');
            }
            const avengers = await response.json();
            const salaryRecipientSelect = document.getElementById('salary-recipient');
            const missionMembersSelect = document.getElementById('mission-members');

            if (salaryRecipientSelect) {
                salaryRecipientSelect.innerHTML = '<option value="">Select Avenger</option>';
                avengers.forEach(avenger => {
                    const option = document.createElement('option');
                    option.value = avenger.username;
                    option.textContent = avenger.fullName || avenger.username;
                    salaryRecipientSelect.appendChild(option);
                });
            }

            if (missionMembersSelect) {
                missionMembersSelect.innerHTML = '';
                avengers.forEach(avenger => {
                    const option = document.createElement('option');
                    option.value = avenger.username;
                    option.textContent = avenger.fullName || avenger.username;
                    missionMembersSelect.appendChild(option);
                });
            }

        } catch (error) {
            console.error('Error fetching Avengers list:', error);
        }
    }
    fetchAvengersList();

    // Example: Send Salary Form Submission
    const paymentForm = document.querySelector('.payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const recipient = document.getElementById('salary-recipient').value;
            const amount = document.getElementById('salary-amount').value;
            const type = document.getElementById('salary-type').value;
            const advancedAmount = document.getElementById('advanced-amount').value;

            if (!recipient || !amount || (type === 'advanced' && !advancedAmount)) {
                alert('Please fill all required fields for payment.');
                return;
            }

            const paymentData = {
                recipientUsername: recipient, // assuming backend expects 'recipientUsername'
                amount: parseFloat(amount),
                paymentType: type, // assuming backend expects 'paymentType'
                advancedAmount: type === 'advanced' ? parseFloat(advancedAmount) : null
            };

            try {
                const response = await fetch('/api/admin/payments/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(paymentData)
                });

                if (response.ok) {
                    alert('Salary sent successfully!');
                    paymentForm.reset();
                    if (advancedAmountGroup) advancedAmountGroup.classList.add('hidden');
                } else {
                    const errorData = await response.json();
                    alert('Failed to send salary: ' + (errorData.message || 'Server error'));
                }
            } catch (error) {
                console.error('Error sending salary:', error);
                alert('Network error or server unavailable.');
            }
        });
    }

    // Add similar submission handlers for mission-form and announcement-form
    // And functions to fetch and display data in tables (payment records, missions, announcements, users, etc.)
});