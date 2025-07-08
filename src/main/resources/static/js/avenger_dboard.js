/*document.addEventListener('DOMContentLoaded', () => {
    const welcomeMessage = document.getElementById('welcomeMessage');
    const avengerContent = document.getElementById('avengerContent');
    const adminContent = document.getElementById('adminContent');
    const logoutButton = document.getElementById('logoutButton');

    const authToken = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    const username = localStorage.getItem('username');

    // --- Authentication Check & Redirect ---
    // If no authToken, redirect to login page
    if (!authToken) {
        window.location.href = 'index.html';
        return; // Stop execution of dashboard logic
    }

    // --- Display Welcome Message ---
    if (welcomeMessage && username) {
        welcomeMessage.textContent = `Welcome, ${username}!`;
    }

    // --- Show/Hide Content Based on Role ---
    if (avengerContent && adminContent) {
        if (userRole === 'ADMIN') {
            avengerContent.style.display = 'none';
            adminContent.style.display = 'block'; // Or 'flex' if you use flexbox for children
        } else if (userRole === 'AVENGER') {
            avengerContent.style.display = 'block'; // Or 'flex'
            adminContent.style.display = 'none';
        } else {
            // Fallback for unknown roles (e.g., if role isn't 'ADMIN' or 'AVENGER')
            // You might want to show a generic message or redirect to an error page
            welcomeMessage.textContent = `Welcome, unknown agent!`;
            avengerContent.style.display = 'none';
            adminContent.style.display = 'none';
            console.warn('Unknown user role detected:', userRole);
            // Optionally, force logout for unknown roles:
            // localStorage.clear();
            // window.location.href = 'index.html';
        }
    }

    // --- Logout Functionality ---
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            // Clear all relevant data from localStorage
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            localStorage.removeItem('username');
            // Redirect to the login page
            window.location.href = 'index.html';
        });
    }

    // --- Add specific logic for dashboard buttons/links here later ---
    // Example: Mark Attendance button
    const markAttendanceButton = document.getElementById('markAttendanceButton');
    if (markAttendanceButton) {
        markAttendanceButton.addEventListener('click', () => {
            alert('Mark Attendance feature coming soon!');
            // Add AJAX call or redirect here later
        });
    }

    // Example: Start Attendance button (for Admin)
    const startAttendanceButton = document.getElementById('startAttendanceButton');
    if (startAttendanceButton) {
        startAttendanceButton.addEventListener('click', () => {
            alert('Start Attendance feature coming soon for Admin!');
            // Add AJAX call or redirect here later
        });
    }
});*/

// public/js/avenger_dboard.js (Renamed from dashboard.js)

document.addEventListener('DOMContentLoaded', async () => {
    const welcomeMessage = document.getElementById('welcomeMessage');
    const avengerContent = document.getElementById('avengerContent');
    const adminContent = document.getElementById('adminContent'); // This won't be in avenger_dashboard.html, but keep for now if dashboard.html is temporarily used
    const logoutButton = document.getElementById('logoutButton');

    let currentUserRole = null;
    let currentUsername = null;

    // --- Fetch User Details from Backend ---
    try {
        const response = await fetch('/api/user/details', { // New backend endpoint needed!
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
                // Cookies are sent automatically by the browser
            }
        });

        if (response.ok) {
            const data = await response.json(); // Expected: { username: "...", role: "AVENGER" }
            currentUsername = data.username;
            currentUserRole = data.role;

            // Display Welcome Message
            if (welcomeMessage && currentUsername) {
                welcomeMessage.textContent = `Welcome, ${currentUsername}!`;
            }

            // Show/Hide Content Based on Role (though this file is for AVENGER, good to have checks)
            if (avengerContent && adminContent) { // adminContent might not exist on avenger_dashboard.html
                if (currentUserRole === 'AVENGER') {
                    avengerContent.style.display = 'block';
                    adminContent.style.display = 'none'; // Ensure admin content is hidden
                } else if (currentUserRole === 'ADMIN') {
                    // This scenario shouldn't happen if redirected correctly from login
                    // But if it does, you might want to redirect to admin dashboard
                    window.location.href = 'admin_dashboard.html';
                } else {
                    console.warn('Unknown user role or unauthorized access:', currentUserRole);
                    // Force logout for unknown roles or if role is missing
                    await fetch('/api/auth/logout', { method: 'POST' }); // Log out immediately
                    window.location.href = 'index.html';
                }
            }
        } else if (response.status === 401 || response.status === 403) {
            // Unauthorized or Forbidden - likely session expired or not logged in
            console.warn('Unauthorized access. Redirecting to login.');
            window.location.href = 'index.html';
        } else {
            // Other errors
            const errorData = await response.json();
            console.error('Failed to fetch user details:', errorData.message || 'Server error');
            alert('Failed to load user data. Please try logging in again.');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Network error fetching user details:', error);
        alert('An error occurred. Please check your network and try again.');
        window.location.href = 'index.html';
    }


    // --- Logout Functionality ---
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

    // --- Add specific logic for Avenger dashboard buttons/links here ---
    const markAttendanceButton = document.getElementById('markAttendanceButton');
    if (markAttendanceButton) {
        markAttendanceButton.addEventListener('click', async () => {
            const attendanceCode = prompt("Please enter the attendance code:");
            if (attendanceCode) {
                try {
                    const response = await fetch('/api/avenger/attendance/mark', { // New backend endpoint
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ code: attendanceCode })
                    });

                    if (response.ok) {
                        alert('Attendance marked successfully!');
                    } else {
                        const errorData = await response.json();
                        alert('Failed to mark attendance: ' + (errorData.message || 'Invalid code or session expired.'));
                    }
                } catch (error) {
                    console.error('Error marking attendance:', error);
                    alert('Network error or server unavailable.');
                }
            } else {
                alert('Attendance code cannot be empty.');
            }
        });
    }

    // --- Other Avenger specific functionalities (e.g., send money, view transactions) ---
    // You would add fetch calls for 'send-money.html', 'my-transactions.html', etc.
    // These might become sections within avenger_dashboard.html just like admin_dashboard.html
    // For now, if they are separate pages, they will also need the initial /api/user/details check.
});