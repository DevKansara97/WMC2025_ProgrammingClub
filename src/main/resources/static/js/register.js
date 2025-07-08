// src/main/resources/static/js/register.js

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const registerMessage = document.getElementById('registerMessage');

    // Handle registration form submission
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            const username = document.getElementById('regUsername').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;
            const email = document.getElementById('regEmail').value;

            // Clear previous messages
            registerMessage.textContent = '';
            registerMessage.classList.remove('error', 'success');

            // --- Client-side validation ---
            let clientErrors = [];

            // Password confirmation
            if (password !== confirmPassword) {
                clientErrors.push('Passwords do not match!');
            }

            // Username length validation (matches backend @Size(min=3, max=50))
            if (username.length < 3 || username.length > 50) {
                clientErrors.push('Username must be between 3 and 50 characters.');
            }

            // Password length validation (matches backend @Size(min=6))
            if (password.length < 6) {
                clientErrors.push('Password must be at least 6 characters long.');
            }

            // Basic email format validation (more robust validation is done on backend)
            if (!/^\S+@\S+\.\S+$/.test(email)) {
                clientErrors.push('Please provide a valid email address.');
            }

            if (clientErrors.length > 0) {
                registerMessage.innerHTML = clientErrors.join('<br>'); // Display all client-side errors
                registerMessage.classList.add('error');
                return; // Stop the submission if client-side errors exist
            }
            // --- End client-side validation ---


            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password, email }),
                    credentials: 'include'
                });

                if (response.ok) {
                    // Registration successful
                    registerMessage.textContent = 'Registration successful! Redirecting to login...';
                    registerMessage.classList.add('success');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);
                } else {
                    // Registration failed, parse error message from backend
                    const contentType = response.headers.get('content-type');
                    let errorMessage = 'Registration failed.';

                    if (contentType && contentType.includes('application/json')) {
                        const errorData = await response.json();

                        // Check for specific validation errors from Spring's MethodArgumentNotValidException
                        if (response.status === 400 && errorData.errors && Array.isArray(errorData.errors)) {
                            // Concatenate all validation error messages
                            errorMessage = errorData.errors.map(err => err.defaultMessage).join('<br>');
                        } else {
                            // Fallback to general message from ApiResponse or default
                            errorMessage = errorData.message || errorMessage;
                        }
                    } else {
                        // If response is not JSON, get plain text error
                        errorMessage = await response.text();
                    }

                    registerMessage.innerHTML = errorMessage; // Use innerHTML to display <br> tags
                    registerMessage.classList.add('error');
                }
            } catch (error) {
                // Handle network errors or other unexpected issues
                console.error('Error during registration:', error);
                registerMessage.textContent = 'An error occurred during registration. Please check your network or try again later.';
                registerMessage.classList.add('error');
            }
        });
    }
});
