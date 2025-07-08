/*document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');

    // Login Form Logic
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password }),
					credentials: 'include'
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('userRole', data.role);
                    localStorage.setItem('username', username);

                    loginMessage.textContent = 'Login successful! Redirecting...';
                    loginMessage.classList.remove('error');
                    loginMessage.classList.add('success');
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                } else {
                    let errorMessage = 'Login failed: Invalid credentials.';
                    const contentType = response.headers.get('content-type');

                    if (contentType && contentType.includes('application/json')) {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    } else {
                        errorMessage = await response.text();
                        if (response.status === 401) {
                            errorMessage = 'Login failed: Incorrect username or password.';
                        } else if (response.status === 400) {
                             errorMessage = errorMessage || 'Login failed: Bad request.';
                        }
                    }

                    loginMessage.textContent = errorMessage;
                    loginMessage.classList.remove('success');
                    loginMessage.classList.add('error');
                }
            } catch (error) {
                console.error('Error during login:', error);
                loginMessage.textContent = 'An unexpected error occurred. Please check your network or try again later.';
                loginMessage.classList.remove('success');
                loginMessage.classList.add('error');
            }
        });
    }
});*/


// src/main/resources/static/js/script.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');

    // Login Form Logic
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password }),
                    credentials: 'include'
                });

                if (response.ok) {
                    const data = await response.json(); // Assuming backend returns { username: "...", role: "ADMIN" }

                    loginMessage.textContent = 'Login successful! Redirecting...';
                    loginMessage.classList.remove('error');
                    loginMessage.classList.add('success');

                    // Redirect based on the user's role received from the backend
                    setTimeout(() => {
                        let redirectUrl = 'dashboard.html'; // Default fallback
                        if (data.role === 'ADMIN') {
                            redirectUrl = 'admin_dashboard.html';
                        } else if (data.role === 'AVENGER') {
                            redirectUrl = 'avenger_dashboard.html';
                        } else {
                            console.warn('Unknown user role received:', data.role);
                        }
                        // IMPORTANT: For the dashboard page, if it's served by Spring Security
                        // and requires authentication, the browser *must* send the cookies.
                        // This happens automatically for direct browser navigation after a redirect,
                        // *provided* the domain and path match the cookie settings.
                        window.location.href = redirectUrl;
                    }, 1000); // Redirect after 1 second

                } else {
                    let errorMessage = 'Login failed: Invalid credentials.';
                    const contentType = response.headers.get('content-type');

                    if (contentType && contentType.includes('application/json')) {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    } else {
                        errorMessage = await response.text();
                        if (response.status === 401) {
                            errorMessage = 'Login failed: Incorrect username or password.';
                        } else if (response.status === 400) {
                             errorMessage = errorMessage || 'Login failed: Bad request.';
                        }
                    }

                    loginMessage.textContent = errorMessage;
                    loginMessage.classList.remove('success');
                    loginMessage.classList.add('error');
                }
            } catch (error) {
                console.error('Error during login:', error);
                loginMessage.textContent = 'An unexpected error occurred. Please check your network or try again later.';
                loginMessage.classList.remove('success');
                loginMessage.classList.add('error');
            }
        });
    }

    // --- IMPORTANT: For ALL subsequent authenticated API calls from your frontend ---
    // Make sure you always include credentials: 'include'
    // Example for a hypothetical dashboard data fetch:
    /*
    async function fetchDashboardData() {
        try {
            const response = await fetch('/api/user/details', { // Or any authenticated endpoint
                method: 'GET',
                credentials: 'include' // <--- REQUIRED HERE TOO!
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Dashboard data:', data);
            } else if (response.status === 401 || response.status === 403) {
                console.error('Not authorized to access dashboard data. Redirecting to login.');
                window.location.href = 'index.html'; // Or login.html
            } else {
                console.error('Failed to fetch dashboard data:', response.status);
            }
        } catch (error) {
            console.error('Network error fetching dashboard data:', error);
        }
    }

    // Call this function when the dashboard page loads
    if (window.location.pathname.includes('dashboard.html') ||
        window.location.pathname.includes('admin_dashboard.html') ||
        window.location.pathname.includes('avenger_dashboard.html')) {
        // You'd call authenticated fetch functions here, e.g., fetchDashboardData();
    }
    */
});
