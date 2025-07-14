// src/main/resources/static/js/avenger_dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    const welcomeUsernameSpan = document.getElementById('welcomeUsername');
    const logoutButton = document.getElementById('logoutButton');
    const navItems = document.querySelectorAll('.sidebar .nav-item');
    const dashboardSections = document.querySelectorAll('.dashboard-section');
    const quickActionBtns = document.querySelectorAll('.quick-actions .action-btn');

    // Overview Stats elements
    const activeMissionsElem = document.getElementById('activeMissions');
    const completedMissionsElem = document.getElementById('completedMissions');
    const attendanceRateElem = document.getElementById('attendanceRate');
    const currentBalanceElem = document.getElementById('currentBalance');
    const recentActivityTimeline = document.getElementById('recentActivityTimeline');

    // Missions section elements
    const missionFilterBtns = document.querySelectorAll('.mission-filters .filter-btn');
    const missionsContainer = document.getElementById('missionsContainer');

    // Attendance section elements
    const attendanceCodeInput = document.getElementById('attendance-code');
    const submitAttendanceBtn = document.getElementById('submitAttendanceBtn');
    const attendanceMessage = document.getElementById('attendanceMessage');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const calendarGrid = document.getElementById('calendarGrid');
    const daysPresentStat = document.getElementById('daysPresent');
    const daysAbsentStat = document.getElementById('daysAbsent');
    const attendanceRateStat = document.getElementById('attendanceRateStat');
    let currentCalendarDate = new Date(); // Tracks the month displayed in the calendar

    // Balance section elements
    const currentBalanceOverview = document.getElementById('currentBalanceOverview');
    const thisMonthEarnings = document.getElementById('thisMonthEarnings');
    const lastTransactionAmount = document.getElementById('lastTransactionAmount');
    const lastTransactionDate = document.getElementById('lastTransactionDate');
    const transactionList = document.getElementById('transactionList');

    // Feedback section elements
    const feedbackForm = document.getElementById('feedbackForm');
    const feedbackCategorySelect = document.getElementById('feedback-category');
    const feedbackSubjectInput = document.getElementById('feedback-subject');
    const feedbackMessageTextarea = document.getElementById('feedback-message');
    const feedbackAnonymousCheckbox = document.getElementById('feedback-anonymous');
    const starRatingContainer = document.getElementById('starRating');
    const ratingTextSpan = document.getElementById('ratingText');
    const feedbackMessage = document.getElementById('feedbackMessage');
    const feedbackHistoryList = document.getElementById('feedbackHistoryList');
    let selectedRating = 0; // To store the selected star rating

    // Announcements section elements
    const announcementsContainer = document.getElementById('announcementsContainer');

    // Profile section elements
    const profileNameDisplay = document.getElementById('profileName');
    const profileAliasDisplay = document.getElementById('profileAlias');
    const profileRoleDisplay = document.getElementById('profileRole');
    const profileMissionsStat = document.getElementById('profileMissions');
    const profileAttendanceStat = document.getElementById('profileAttendance');
    const profileRatingStat = document.getElementById('profileRating'); // Assuming a rating field for Avenger
    const profileForm = document.getElementById('profileForm');
    const profileNameInput = document.getElementById('profile-name-input');
    const profileAliasInput = document.getElementById('profile-alias-input');
    const profileEmailInput = document.getElementById('profile-email-input');
    const profilePhoneInput = document.getElementById('profile-phone-input');
    const profileBioInput = document.getElementById('profile-bio-input');
    const profileSkillsInput = document.getElementById('profile-skills-input');
    const profileMessage = document.getElementById('profileMessage');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const toggle2FABtn = document.getElementById('toggle2FABtn');
    const viewLoginHistoryBtn = document.getElementById('viewLoginHistoryBtn');


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
                alert('Session expired or unauthorized. Please log in again.'); // Replace with custom modal
                window.location.href = '/index.html';
                return null;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            return response; // Return response object if not JSON (e.g., for logout)

        } catch (error) {
            console.error('Fetch error:', error);
            alert('An error occurred: ' + error.message); // Replace with custom modal
            return null;
        }
    }

    // --- Initial Load & User Details ---
    async function loadUserDetails() {
        const data = await fetchData('/api/user/details');
        if (data) {
            welcomeUsernameSpan.textContent = data.username;
            // Store user details globally if needed for other sections, e.g., currentBalance
            // currentBalanceElem.textContent = `₹ ${parseFloat(data.balance).toLocaleString('en-IN')}`;
            // For profile section, pre-fill inputs
            profileNameInput.value = data.username || '';
            profileEmailInput.value = data.email || '';
            // Assuming heroAlias, phone, bio, skills are added to User model and returned by /user/details
            // profileAliasInput.value = data.heroAlias || '';
            // profilePhoneInput.value = data.phone || '';
            // profileBioInput.value = data.bio || '';
            // profileSkillsInput.value = data.skills || '';
        }
    }

    // --- Dashboard Overview Stats ---
    async function loadAvengerDashboardStats() {
        const stats = await fetchData('/api/avenger/dashboard-stats');
        if (stats) {
            activeMissionsElem.textContent = stats.activeMissions;
            completedMissionsElem.textContent = stats.completedMissions;
            attendanceRateElem.textContent = `${stats.attendanceRate.toFixed(1)}`; // Format to one decimal place
            currentBalanceElem.textContent = `₹ ${parseFloat(stats.currentBalance).toLocaleString('en-IN')}`;
        }
    }

    // --- Recent Activity (Placeholder, needs backend implementation) ---
    async function loadRecentActivity() {
        // This would ideally fetch a combined list of recent missions, attendance, transactions etc.
        // For now, it remains a placeholder.
        recentActivityTimeline.innerHTML = '<p class="no-data-message">No recent activity.</p>';
        // Example:
        // const activityData = await fetchData('/api/avenger/recent-activity');
        // if (activityData && activityData.length > 0) {
        //     recentActivityTimeline.innerHTML = '';
        //     activityData.forEach(item => {
        //         const activityItem = document.createElement('div');
        //         activityItem.className = 'activity-item';
        //         activityItem.innerHTML = `...`; // Populate based on item type
        //         recentActivityTimeline.appendChild(activityItem);
        //     });
        // }
    }

    // --- My Missions Section ---
    async function loadMyMissions(filterStatus = 'all') {
        const missions = await fetchData('/api/avenger/missions/my');
        if (missions) {
            missionsContainer.innerHTML = ''; // Clear existing
            const filteredMissions = filterStatus === 'all' ? missions : missions.filter(m => m.status === filterStatus);

            if (filteredMissions.length === 0) {
                missionsContainer.innerHTML = '<p class="no-data-message">No missions found for this filter.</p>';
                return;
            }

            filteredMissions.forEach(mission => {
                const missionCard = document.createElement('div');
                missionCard.classList.add('mission-card', mission.status.toLowerCase()); // Add status class for styling
                
                // Determine priority badge class (assuming backend provides a 'priority' or derive from status)
                let priorityClass = 'normal';
                if (mission.status === 'ONGOING') priorityClass = 'critical'; // Example mapping
                else if (mission.status === 'COMPLETED') priorityClass = 'high';

                missionCard.innerHTML = `
                    <div class="mission-header">
                        <h4>${mission.missionName}</h4>
                        <span class="priority-badge ${priorityClass}">${mission.status.charAt(0).toUpperCase() + mission.status.slice(1)}</span>
                    </div>
                    <p class="mission-description">
                        ${mission.description.substring(0, 150) + (mission.description.length > 150 ? '...' : '')}
                    </p>
                    <div class="mission-details">
                        <div class="detail-item">
                            <i class="fas fa-users"></i>
                            <span>${mission.participants.map(p => p.username).join(', ')}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-clock"></i>
                            <span>Assigned: ${new Date(mission.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    ${mission.status === 'ONGOING' ? `
                    <div class="mission-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 50%"></div> <!-- Placeholder progress -->
                        </div>
                        <span class="progress-text">50% Complete</span> <!-- Placeholder progress -->
                    </div>
                    ` : ''}
                    <div class="mission-actions">
                        ${mission.status === 'ONGOING' ? `<button class="button small-button primary-button update-mission-status-btn" data-mission-id="${mission.id}">Update Status</button>` : ''}
                        <button class="button small-button view-mission-details-btn" data-mission-id="${mission.id}">View Details</button>
                    </div>
                `;
                missionsContainer.appendChild(missionCard);
            });
        }
    }

    missionFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            missionFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadMyMissions(btn.dataset.filter);
        });
    });

    // --- Attendance Section ---
    async function loadAttendanceHistory(year, month) {
        const records = await fetchData('/api/avenger/attendance/history');
        const stats = await fetchData(`/api/avenger/attendance/stats/${year}/${month}`);

        if (records) {
            const currentMonthRecords = records.filter(record => {
                const recordDate = new Date(record.markedAt);
                return recordDate.getFullYear() === year && recordDate.getMonth() === month - 1; // Month is 0-indexed in JS
            });

            renderCalendar(year, month, currentMonthRecords.map(r => new Date(r.markedAt).getDate()));
        }

        if (stats) {
            daysPresentStat.textContent = stats.daysPresent;
            daysAbsentStat.textContent = stats.daysAbsent;
            attendanceRateStat.textContent = `${stats.attendanceRate.toFixed(1)}%`;
        }
    }

    function renderCalendar(year, month, presentDays) {
        calendarGrid.innerHTML = `
            <div class="calendar-day header">Sun</div>
            <div class="calendar-day header">Mon</div>
            <div class="calendar-day header">Tue</div>
            <div class="calendar-day header">Wed</div>
            <div class="calendar-day header">Thu</div>
            <div class="calendar-day header">Fri</div>
            <div class="calendar-day header">Sat</div>
        `; // Re-add headers

        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const numDays = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay(); // 0 for Sunday, 1 for Monday...

        currentMonthYear.textContent = firstDay.toLocaleString('en-US', { month: 'long', year: 'numeric' });

        // Add empty cells for days before the 1st
        for (let i = 0; i < startDayOfWeek; i++) {
            calendarGrid.appendChild(document.createElement('div'));
        }

        // Add days
        for (let day = 1; day <= numDays; day++) {
            const dayElem = document.createElement('div');
            dayElem.classList.add('calendar-day');
            dayElem.textContent = day;

            if (presentDays.includes(day)) {
                dayElem.classList.add('present');
            } else {
                // Check if it's a weekend (Saturday or Sunday)
                const date = new Date(year, month - 1, day);
                if (date.getDay() === 0 || date.getDay() === 6) { // 0 = Sunday, 6 = Saturday
                    dayElem.classList.add('weekend');
                } else {
                    dayElem.classList.add('absent'); // Mark as absent if not present and not weekend
                }
            }
            calendarGrid.appendChild(dayElem);
        }
    }

    submitAttendanceBtn.addEventListener('click', async () => {
        const code = attendanceCodeInput.value.trim();
        if (code.length !== 6) {
            showMessage(attendanceMessage, 'Please enter a valid 6-digit attendance code.', false);
            return;
        }

        const payload = { code: code };
        const result = await fetchData('/api/avenger/attendance/mark', 'POST', payload);
        if (result && result.success) {
            showMessage(attendanceMessage, result.message, true);
            attendanceCodeInput.value = '';
            // Reload attendance history and stats for current month
            const year = currentCalendarDate.getFullYear();
            const month = currentCalendarDate.getMonth() + 1;
            loadAttendanceHistory(year, month);
            loadAvengerDashboardStats(); // Update overview stats
        } else if (result) {
            showMessage(attendanceMessage, result.message, false);
        }
    });

    prevMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth() + 1;
        loadAttendanceHistory(year, month);
    });

    nextMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth() + 1;
        loadAttendanceHistory(year, month);
    });

    // --- Balance Section ---
    async function loadBalanceData() {
        const userDetails = await fetchData('/api/user/details'); // Get current balance
        const transactions = await fetchData('/api/avenger/transactions/history'); // Get all transactions
        const currentMonth = new Date();
        const earnings = await fetchData(`/api/avenger/earnings/${currentMonth.getFullYear()}/${currentMonth.getMonth() + 1}`);

        if (userDetails) {
            currentBalanceOverview.textContent = `₹ ${parseFloat(userDetails.balance).toLocaleString('en-IN')}`;
        }
        if (earnings) {
            thisMonthEarnings.textContent = `₹ ${parseFloat(earnings.totalEarnings).toLocaleString('en-IN')}`;
        }

        if (transactions && transactions.length > 0) {
            transactionList.innerHTML = ''; // Clear existing
            // Display last transaction
            const lastTx = transactions[0];
            lastTransactionAmount.textContent = `₹ ${parseFloat(lastTx.amount).toLocaleString('en-IN')}`;
            lastTransactionDate.textContent = new Date(lastTx.transactionDate).toLocaleDateString();

            transactions.forEach(tx => {
                const item = document.createElement('div');
                item.classList.add('transaction-item');
                const isCredit = tx.transactionType === 'SALARY' || tx.transactionType === 'MISSION_REWARD'; // Adjust types as needed
                item.innerHTML = `
                    <div class="transaction-icon ${isCredit ? 'credit' : 'debit'}">
                        <i class="fas fa-${isCredit ? 'plus' : 'minus'}"></i>
                    </div>
                    <div class="transaction-details">
                        <h4>${tx.transactionType.replace('_', ' ')}</h4>
                        <p>${tx.description || 'N/A'}</p>
                        <time>${new Date(tx.transactionDate).toLocaleDateString()}</time>
                    </div>
                    <div class="transaction-amount ${isCredit ? 'credit' : 'debit'}">${isCredit ? '+' : '-'}₹ ${parseFloat(tx.amount).toLocaleString('en-IN')}</div>
                `;
                transactionList.appendChild(item);
            });
        } else {
            transactionList.innerHTML = '<p class="no-data-message">No transaction history found.</p>';
            lastTransactionAmount.textContent = '₹ 0';
            lastTransactionDate.textContent = 'N/A';
        }
    }

    // --- Feedback Section ---
    starRatingContainer.addEventListener('click', (event) => {
        const clickedStar = event.target.closest('.fas.fa-star');
        if (clickedStar) {
            selectedRating = parseInt(clickedStar.dataset.rating);
            updateStarRatingDisplay(selectedRating);
        }
    });

    function updateStarRatingDisplay(rating) {
        const stars = starRatingContainer.querySelectorAll('.fas.fa-star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
        ratingTextSpan.textContent = rating > 0 ? `${rating} Star${rating > 1 ? 's' : ''}` : 'Select a rating';
    }

    feedbackForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const category = feedbackCategorySelect.value;
        const subject = feedbackSubjectInput.value.trim();
        const message = feedbackMessageTextarea.value.trim();
        const isAnonymous = feedbackAnonymousCheckbox.checked;

        if (!category || !subject || !message) {
            showMessage(feedbackMessage, 'Please fill in all required fields.', false);
            return;
        }

        const payload = {
            category: category,
            subject: subject,
            feedbackText: message,
            isAnonymous: isAnonymous,
            rating: selectedRating // Include the selected rating
        };

        const result = await fetchData('/api/avenger/feedback', 'POST', payload);
        if (result && result.success) {
            showMessage(feedbackMessage, result.message, true);
            feedbackForm.reset();
            selectedRating = 0; // Reset rating
            updateStarRatingDisplay(0); // Clear stars
            loadFeedbackHistory(); // Reload history
            loadAvengerDashboardStats(); // Update overview stats
        } else if (result) {
            showMessage(feedbackMessage, result.message, false);
        }
    });

    async function loadFeedbackHistory() {
        const feedbackItems = await fetchData('/api/avenger/feedback/my');
        if (feedbackItems) {
            feedbackHistoryList.innerHTML = ''; // Clear existing
            if (feedbackItems.length === 0) {
                feedbackHistoryList.innerHTML = '<p class="no-data-message">No feedback history found.</p>';
                return;
            }
            feedbackItems.forEach(feedback => {
                const feedbackItem = document.createElement('div');
                feedbackItem.classList.add('feedback-item');
                // You might want to display category, subject, and rating here if added to FeedbackDTO
                feedbackItem.innerHTML = `
                    <div class="feedback-header">
                        <h4>${feedback.subject || 'No Subject'}</h4>
                        <span class="feedback-status ${feedback.isRead ? 'reviewed' : 'pending'}">
                            ${feedback.isRead ? 'Reviewed' : 'Pending Review'}
                        </span>
                    </div>
                    <p>${feedback.feedbackText}</p>
                    <div class="feedback-meta">
                        <span class="feedback-date">Submitted: ${new Date(feedback.submittedAt).toLocaleDateString()}</span>
                        <div class="feedback-rating">
                            ${Array.from({length: 5}, (_, i) => `<i class="fas fa-star ${i < (feedback.rating || 0) ? 'active' : ''}"></i>`).join('')}
                        </div>
                    </div>
                    <!-- Admin response might be added here if your backend supports it -->
                `;
                feedbackHistoryList.appendChild(feedbackItem);
            });
        }
    }

    // --- Announcements Section ---
    async function loadAnnouncements() {
        const announcements = await fetchData('/api/avenger/announcements');
        if (announcements) {
            announcementsContainer.innerHTML = ''; // Clear existing
            if (announcements.length === 0) {
                announcementsContainer.innerHTML = '<p class="no-data-message">No announcements found.</p>';
                return;
            }
            announcements.forEach(announcement => {
                const announcementItem = document.createElement('div');
                // Determine priority class (assuming backend provides a 'priority' or derive from title/content)
                let priorityClass = 'normal';
                if (announcement.title.toLowerCase().includes('emergency') || announcement.title.toLowerCase().includes('urgent')) {
                    priorityClass = 'urgent';
                } else if (announcement.title.toLowerCase().includes('important') || announcement.content.toLowerCase().includes('important')) {
                    priorityClass = 'important';
                }

                announcementItem.classList.add('announcement-item', priorityClass);
                announcementItem.innerHTML = `
                    <div class="announcement-header">
                        <div class="announcement-meta">
                            <h3>${announcement.title}</h3>
                            <span class="priority-badge ${priorityClass}">${priorityClass.charAt(0).toUpperCase() + priorityClass.slice(1)}</span>
                        </div>
                        <span class="announcement-date">${new Date(announcement.postedAt).toLocaleDateString()}</span>
                    </div>
                    <div class="announcement-content">
                        <p>${announcement.content}</p>
                    </div>
                    <div class="announcement-actions">
                        <button class="button small-button primary-button">Acknowledge</button>
                        <button class="button small-button">View Details</button>
                    </div>
                `;
                announcementsContainer.appendChild(announcementItem);
            });
        }
    }

    // --- Profile Section ---
    async function loadProfileData() {
        const data = await fetchData('/api/user/details');
        if (data) {
            profileNameDisplay.textContent = data.username || 'N/A';
            profileAliasDisplay.textContent = data.heroAlias || 'N/A'; // Assuming heroAlias is in UserDTO
            profileRoleDisplay.textContent = data.role || 'N/A';
            profileEmailInput.value = data.email || '';
            profileNameInput.value = data.username || ''; // Map to full name for now

            // Populate profile stats (these would ideally come from backend)
            profileMissionsStat.textContent = completedMissionsElem.textContent; // From overview stats
            profileAttendanceStat.textContent = attendanceRateElem.textContent; // From overview stats
            profileRatingStat.textContent = '4.8'; // Hardcoded for now, implement backend for this

            // Populate form fields
            // Assuming phone, bio, skills are in User model and returned by /user/details
            // profilePhoneInput.value = data.phone || '';
            // profileBioInput.value = data.bio || '';
            // profileSkillsInput.value = data.skills || '';
        }
    }

    profileForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const fullName = profileNameInput.value.trim();
        const heroAlias = profileAliasInput.value.trim();
        const email = profileEmailInput.value.trim();
        const phone = profilePhoneInput.value.trim();
        const bio = profileBioInput.value.trim();
        const skills = profileSkillsInput.value.trim();

        const payload = {
            fullName: fullName,
            heroAlias: heroAlias,
            email: email,
            phone: phone,
            bio: bio,
            skills: skills
        };

        const result = await fetchData('/api/avenger/profile', 'PUT', payload);
        if (result && result.id) { // Assuming success returns updated UserDTO
            showMessage(profileMessage, 'Profile updated successfully!', true);
            loadUserDetails(); // Reload welcome message and other details
            loadProfileData(); // Reload profile section
        } else if (result) {
            showMessage(profileMessage, result.message || 'Failed to update profile.', false);
        }
    });

    changePasswordBtn.addEventListener('click', async () => {
        const newPassword = prompt('Enter your new password:'); // Replace with custom modal
        if (newPassword && newPassword.length >= 8) {
            const confirmNewPassword = prompt('Confirm your new password:'); // Replace with custom modal
            if (newPassword === confirmNewPassword) {
                const payload = { newPassword: newPassword };
                const result = await fetchData('/api/avenger/profile/change-password', 'PUT', payload);
                if (result && result.success) {
                    alert(result.message); // Replace with custom modal
                } else if (result) {
                    alert(result.message); // Replace with custom modal
                }
            } else {
                alert('Passwords do not match!'); // Replace with custom modal
            }
        } else if (newPassword !== null) { // If user didn't cancel
            alert('Password must be at least 8 characters long.'); // Replace with custom modal
        }
    });

    // Placeholder for 2FA and Login History
    toggle2FABtn.addEventListener('click', () => alert('2FA toggle functionality not yet implemented.'));
    viewLoginHistoryBtn.addEventListener('click', () => alert('Login history functionality not yet implemented.'));

    // --- Navigation Logic ---
    function switchSection(sectionId) {
        navItems.forEach(nav => {
            if (nav.dataset.section === sectionId) {
                nav.classList.add('active');
            } else {
                nav.classList.remove('active');
            }
        });
        dashboardSections.forEach(section => {
            if (section.id === sectionId) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        });
        loadSectionData(sectionId);
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            switchSection(item.dataset.section);
        });
    });

    quickActionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchSection(btn.dataset.sectionTarget);
        });
    });

    // --- Logout Logic ---
    logoutButton.addEventListener('click', async () => {
        const response = await fetchData('/api/auth/logout', 'POST');
        if (response) {
            alert('Logged out successfully!'); // Replace with custom modal
            window.location.href = '/index.html';
        }
    });

    // --- Initial Data Load on Dashboard Load ---
    loadUserDetails();
    // Activate the default section (overview) and load its data
    switchSection('overview');
    // Initialize calendar for current month
    const today = new Date();
    renderCalendar(today.getFullYear(), today.getMonth() + 1, []); // Render empty initially, then load data
});
