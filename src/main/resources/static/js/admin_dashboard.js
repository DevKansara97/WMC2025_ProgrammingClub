// src/main/resources/static/js/admin_dashboard.js

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

    // --- Payments Section ---
    async function loadAvengersForDropdowns() {
        const avengers = await fetchData('/api/admin/avengers');
        if (avengers) {
            // Clear existing options
            salaryRecipientSelect.innerHTML = '<option value="">Select Avenger</option>';
            missionMembersSelect.innerHTML = ''; // For multiple select

            avengers.forEach(avenger => {
                const option = document.createElement('option');
                option.value = avenger.id; // Use Avenger ID as value
                option.textContent = avenger.username;
                salaryRecipientSelect.appendChild(option);

                const missionMemberOption = option.cloneNode(true); // Clone for mission members
                missionMembersSelect.appendChild(missionMemberOption);
            });
        }
    }

    async function loadPaymentRecords() {
        const transactions = await fetchData('/api/admin/payments/history');
        if (transactions) {
            paymentRecordsTableBody.innerHTML = ''; // Clear existing rows
            if (transactions.length === 0) {
                paymentRecordsTableBody.innerHTML = '<tr><td colspan="6" class="no-data-message">No payment records found.</td></tr>';
                return;
            }
            transactions.forEach(tx => {
                const row = paymentRecordsTableBody.insertRow();
                row.insertCell().textContent = new Date(tx.transactionDate).toLocaleDateString();
                row.insertCell().textContent = tx.senderUsername;
                row.insertCell().textContent = tx.receiverUsername;
                row.insertCell().textContent = `₹ ${tx.amount.toLocaleString('en-IN')}`;
                row.insertCell().textContent = tx.transactionType;
                row.insertCell().textContent = tx.description || '-';
            });
        }
    }

    sendSalaryForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const recipientUsername = salaryRecipientSelect.options[salaryRecipientSelect.selectedIndex].textContent; // Get username from selected option
        const amount = parseFloat(salaryAmountInput.value);
        const type = salaryTypeSelect.value;
        const description = `Payment of type ${type}`; // You can make this dynamic

        // Note: Your backend DTO PaymentRequest does not have 'advancedAmount' or specific logic for 'ADVANCED' type.
        // If 'ADVANCED' implies a different transaction type or additional fields,
        // you'll need to adjust the backend DTO and service logic accordingly.
        // For now, I'm removing the advancedAmount logic to align with current backend DTO.
        // If 'ADVANCED' is a TransactionType enum, it should be handled there.
        // Assuming 'SALARY' and 'SEND_MONEY' are the only types for now.

        if (!recipientUsername || recipientUsername === 'Select Avenger') {
            showMessage(paymentMessage, 'Please select a recipient.', false);
            return;
        }
        if (isNaN(amount) || amount <= 0) {
            showMessage(paymentMessage, 'Please enter a valid amount.', false);
            return;
        }

        const payload = {
            recipientUsername: recipientUsername,
            amount: amount,
            transactionType: type, // This will be 'SEND_MONEY' or 'SALARY'
            description: description
        };

        const result = await fetchData('/api/admin/payments/send', 'POST', payload);
        if (result && result.success) {
            showMessage(paymentMessage, result.message, true);
            sendSalaryForm.reset(); // Clear form
            loadPaymentRecords(); // Reload records
            loadDashboardStats(); // Update stats
        } else if (result) {
            showMessage(paymentMessage, result.message, false);
        }
    });

    // Removed advancedAmountGroup toggle as PaymentRequest DTO doesn't support it directly
    // If you need advanced payments, you'll need to extend PaymentRequest DTO and backend logic.
    // salaryTypeSelect.addEventListener('change', () => {
    //     if (salaryTypeSelect.value === 'ADVANCED') {
    //         advancedAmountGroup.classList.remove('hidden');
    //         advancedAmountInput.setAttribute('required', 'true');
    //     } else {
    //         advancedAmountGroup.classList.add('hidden');
    //         advancedAmountInput.removeAttribute('required');
    //         advancedAmountInput.value = '';
    //     }
    // });

    // --- Missions Section ---
    async function loadMissions() {
        const missions = await fetchData('/api/admin/missions');
        if (missions) {
            missionsTableBody.innerHTML = ''; // Clear existing rows
            if (missions.length === 0) {
                missionsTableBody.innerHTML = '<tr><td colspan="7" class="no-data-message">No missions assigned yet.</td></tr>';
                return;
            }
            missions.forEach(mission => {
                const row = missionsTableBody.insertRow();
                row.insertCell().textContent = mission.missionName;
                row.insertCell().textContent = mission.description.substring(0, 50) + (mission.description.length > 50 ? '...' : ''); // Truncate description
                row.insertCell().textContent = mission.participants.map(p => p.username).join(', ');
                row.insertCell().textContent = mission.status;
                row.insertCell().textContent = mission.assignedByUsername;
                row.insertCell().textContent = new Date(mission.createdAt).toLocaleDateString();
                const actionsCell = row.insertCell();
                actionsCell.innerHTML = `<button class="button small-button" data-mission-id="${mission.id}">Edit</button>`; // Add edit button
                // Add event listener for edit button if needed
            });
        }
    }

    assignMissionForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const missionName = missionNameInput.value;
        const description = missionDescriptionTextarea.value;
        const status = missionStatusSelect.value;
        const selectedMembers = Array.from(missionMembersSelect.selectedOptions).map(option => parseInt(option.value));

        if (selectedMembers.length === 0) {
            showMessage(missionMessage, 'Please select at least one mission participant.', false);
            return;
        }

        const payload = {
            missionName: missionName,
            description: description,
            status: status,
            participantUserIds: selectedMembers
        };

        const result = await fetchData('/api/admin/missions', 'POST', payload);
        if (result && result.id) { // Assuming successful creation returns the MissionDTO with an ID
            showMessage(missionMessage, 'Mission assigned successfully!', true);
            assignMissionForm.reset();
            loadMissions(); // Reload missions
            loadDashboardStats(); // Update stats
        } else if (result) {
            showMessage(missionMessage, result.message || 'Failed to assign mission.', false);
        }
    });

    // --- Attendance Section ---
    async function loadAttendanceRecords() {
        const records = await fetchData('/api/admin/attendance/records');
        if (records) {
            attendanceRecordsTableBody.innerHTML = ''; // Clear existing rows
            if (records.length === 0) {
                attendanceRecordsTableBody.innerHTML = '<tr><td colspan="3" class="no-data-message">No attendance records found.</td></tr>';
                return;
            }
            records.forEach(record => {
                const row = attendanceRecordsTableBody.insertRow();
                row.insertCell().textContent = record.sessionCode;
                row.insertCell().textContent = record.avengerUsername;
                row.insertCell().textContent = new Date(record.markedAt).toLocaleString();
            });
        }
    }

    startAttendanceBtn.addEventListener('click', async () => {
        const result = await fetchData('/api/admin/attendance/start', 'POST');
        if (result && result.attendanceCode) {
            attendanceCodeSpan.textContent = result.attendanceCode;
            attendanceCodeDisplay.classList.remove('hidden');
            showMessage(attendanceSessionMessage, result.message, true);

            let timeLeft = 60; // Hardcoded for now, but could use result.endTime and current time
            // To use result.endTime:
            // const endTime = new Date(result.endTime);
            // let timeLeft = Math.floor((endTime.getTime() - new Date().getTime()) / 1000);

            countdownSpan.textContent = timeLeft;

            clearInterval(countdownInterval); // Clear any existing interval
            countdownInterval = setInterval(() => {
                timeLeft--;
                countdownSpan.textContent = timeLeft;
                if (timeLeft <= 0) {
                    clearInterval(countdownInterval);
                    attendanceCodeDisplay.classList.add('hidden');
                    showMessage(attendanceSessionMessage, 'Attendance session expired.', false);
                }
            }, 1000);
        } else if (result) {
            showMessage(attendanceSessionMessage, result.message || 'Failed to start attendance session.', false);
        }
    });

    // --- Feedback Section ---
    async function loadFeedback() {
        const feedbackItems = await fetchData('/api/admin/feedback');
        if (feedbackItems) {
            feedbackListDiv.innerHTML = ''; // Clear existing
            if (feedbackItems.length === 0) {
                feedbackListDiv.innerHTML = '<p class="no-data-message">No feedback received yet.</p>';
                return;
            }
            feedbackItems.forEach(feedback => {
                const feedbackCard = document.createElement('div');
                feedbackCard.classList.add('feedback-item', 'card'); // Add card class for styling
                if (!feedback.isRead) {
                    feedbackCard.classList.add('unread'); // Add a class for unread feedback
                }
                feedbackCard.innerHTML = `
                    <h4>Feedback from ${feedback.avengerUsername}</h4>
                    <p>Date: ${new Date(feedback.submittedAt).toLocaleDateString()}</p>
                    <p>Message: "${feedback.feedbackText}"</p>
                    <button class="button small-button ${feedback.isRead ? 'hidden' : ''}" data-feedback-id="${feedback.id}">Mark as Read</button>
                `;
                feedbackListDiv.appendChild(feedbackCard);

                // Add event listener for "Mark as Read" button
                const markAsReadBtn = feedbackCard.querySelector('button');
                if (markAsReadBtn && !feedback.isRead) {
                    markAsReadBtn.addEventListener('click', async () => {
                        const success = await fetchData(`/api/admin/feedback/${feedback.id}/read`, 'PUT');
                        if (success && success.success) {
                            showMessage(feedbackListDiv, 'Feedback marked as read.', true);
                            loadFeedback(); // Reload feedback list
                            loadDashboardStats(); // Update stats
                        } else if (success) {
                            showMessage(feedbackListDiv, success.message || 'Failed to mark feedback as read.', false);
                        }
                    });
                }
            });
        }
    }

    // --- Announcements Section ---
    async function loadAnnouncements() {
        const announcements = await fetchData('/api/admin/announcements');
        if (announcements) {
            announcementsListDiv.innerHTML = ''; // Clear existing
            if (announcements.length === 0) {
                announcementsListDiv.innerHTML = '<p class="no-data-message">No announcements posted yet.</p>';
                return;
            }
            announcements.forEach(announcement => {
                const announcementCard = document.createElement('div');
                announcementCard.classList.add('announcement-item', 'card');
                announcementCard.innerHTML = `
                    <h4>${announcement.title}</h4>
                    <p>Posted: ${new Date(announcement.postedAt).toLocaleDateString()}</p>
                    <p>${announcement.content}</p>
                `;
                announcementsListDiv.appendChild(announcementCard);
            });
        }
    }

    createAnnouncementForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const title = announcementTitleInput.value;
        const content = announcementContentTextarea.value;

        const payload = { title, content };
        const result = await fetchData('/api/admin/announcements', 'POST', payload);
        if (result && result.id) { // Assuming successful creation returns the AnnouncementDTO with an ID
            showMessage(announcementMessage, 'Announcement posted successfully!', true);
            createAnnouncementForm.reset();
            loadAnnouncements(); // Reload announcements
        } else if (result) {
            showMessage(announcementMessage, result.message || 'Failed to post announcement.', false);
        }
    });


    // --- Manage Avengers Section ---
    async function loadAvengersRoster() {
        const avengers = await fetchData('/api/admin/avengers');
        if (avengers) {
            avengersRosterTableBody.innerHTML = ''; // Clear existing rows
            if (avengers.length === 0) {
                avengersRosterTableBody.innerHTML = '<tr><td colspan="5" class="no-data-message">No Avengers found.</td></tr>';
                return;
            }
            avengers.forEach(avenger => {
                const row = avengersRosterTableBody.insertRow();
                row.insertCell().textContent = avenger.username;
                row.insertCell().textContent = avenger.email;
                row.insertCell().textContent = `₹ ${avenger.balance.toLocaleString('en-IN')}`;
                row.insertCell().textContent = avenger.isAlive ? 'Active' : 'Inactive';
                const actionsCell = row.insertCell();
                // Add action buttons (e.g., Edit, Activate/Deactivate, Delete)
                actionsCell.innerHTML = `
                    <button class="button small-button edit-avenger-btn" data-user-id="${avenger.id}">Edit</button>
                    <button class="button small-button ${avenger.isAlive ? 'danger-button' : 'success-button'} toggle-status-btn" data-user-id="${avenger.id}" data-current-status="${avenger.isAlive}">
                        ${avenger.isAlive ? 'Deactivate' : 'Activate'}
                    </button>
                `;
                // Add event listeners for these buttons if needed (e.g., for user status update)
            });
        }
    }

    // --- Stats & Reports Section ---
    async function loadCharts() {
        // Placeholder data for charts for now.
        // In a real scenario, you'd fetch specific data for these charts from the backend.
        // Example: /api/admin/attendance/stats, /api/admin/missions/completion-stats

        // Attendance Chart (Example: Bar Chart)
        if (attendanceChartInstance) attendanceChartInstance.destroy(); // Destroy previous instance
        attendanceChartInstance = new Chart(attendanceChartCanvas, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                datasets: [{
                    label: 'Monthly Attendance %',
                    data: [85, 90, 78, 92, 88, 95, 80],
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        // Mission Completion Chart (Example: Doughnut Chart)
        if (missionChartInstance) missionChartInstance.destroy(); // Destroy previous instance
        missionChartInstance = new Chart(missionChartCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Ongoing', 'Failed', 'Martyred'],
                datasets: [{
                    label: 'Mission Status',
                    data: [70, 20, 5, 5], // Example data
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.8)', // Completed
                        'rgba(255, 206, 86, 0.8)', // Ongoing
                        'rgba(255, 99, 132, 0.8)', // Failed
                        'rgba(153, 102, 255, 0.8)' // Martyred
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    }

    // --- Navigation Logic ---
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove 'active' from all nav items and hide all sections
            navItems.forEach(nav => nav.classList.remove('active'));
            dashboardSections.forEach(section => section.classList.add('hidden'));

            // Add 'active' to clicked nav item
            item.classList.add('active');

            // Show the corresponding section
            const targetSectionId = item.dataset.section;
            const targetSection = document.getElementById(targetSectionId);
            if (targetSection) {
                targetSection.classList.remove('hidden');
                // Load data specific to the section when it becomes active
                if (targetSectionId === 'overview') {
                    loadDashboardStats();
                } else if (targetSectionId === 'payments') {
                    loadAvengersForDropdowns();
                    loadPaymentRecords();
                } else if (targetSectionId === 'missions') {
                    loadAvengersForDropdowns(); // Also needed for mission assignment
                    loadMissions();
                } else if (targetSectionId === 'attendance') {
                    loadAttendanceRecords();
                } else if (targetSectionId === 'feedback') {
                    loadFeedback();
                } else if (targetSectionId === 'posts') {
                    loadAnnouncements();
                } else if (targetSectionId === 'users') {
                    loadAvengersRoster();
                } else if (targetSectionId === 'stats') {
                    loadCharts();
                }
            }
        });
    });

    // --- Logout Logic ---
    logoutButton.addEventListener('click', async () => {
        const response = await fetchData('/api/auth/logout', 'POST');
        if (response) { // Response is not JSON, just check if fetch was successful
            alert('Logged out successfully!'); // This alert will be replaced by a custom modal later.
            window.location.href = '/index.html'; // Redirect to login page
        }
    });

    // --- Initial Data Load on Dashboard Load ---
    // Load user details and dashboard stats when the page first loads
    loadUserDetails();
    // Activate the default section (overview)
    // This will trigger loadDashboardStats() via the click event
    document.querySelector('.nav-item[data-section="overview"]').click();
});
