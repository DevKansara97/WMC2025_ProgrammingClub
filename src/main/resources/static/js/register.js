document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const registerMessage = document.getElementById('registerMessage');

    // Handle registration form submission
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const username = document.getElementById('regUsername').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;
            const email = document.getElementById('regEmail').value;
            const role = 'AVENGER'; // Default role for all new registrations

            if (password !== confirmPassword) {
                registerMessage.textContent = 'Passwords do not match!';
                registerMessage.classList.add('error');
                registerMessage.classList.remove('success');
                return;
            }

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password, email, role })
                });

                if (response.ok) {
                    registerMessage.textContent = 'Registration successful! Redirecting to login...';
                    registerMessage.classList.add('success');
                    registerMessage.classList.remove('error');
                    setTimeout(() => {
                        window.location.href = 'index.html'; // Redirect to login page
                    }, 2000);
                } else {
                    const errorData = await response.json();
                    registerMessage.textContent = errorData.message || 'Registration failed.';
                    registerMessage.classList.add('error');
                    registerMessage.classList.remove('success');
                }
            } catch (error) {
                console.error('Error during registration:', error);
                registerMessage.textContent = 'An error occurred during registration. Please try again.';
                registerMessage.classList.add('error');
                registerMessage.classList.remove('success');
            }
        });
    }
});