import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/auth.css'; // Assuming this CSS file contains styling for auth forms

export const Register = () => {
  // State to hold form input data
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  // State to display messages to the user (success, error, loading)
  const [message, setMessage] = useState('');
  // State to manage loading status during API calls
  const [loading, setLoading] = useState(false);
  // Hook for programmatic navigation
  const navigate = useNavigate();

  /**
   * Handles changes in the input fields and updates the formData state.
   * @param {Object} e - The event object from the input change.
   */
  const handleInputChange = (e) => {
    setFormData({
      ...formData, // Spread the existing formData to retain other fields
      [e.target.name]: e.target.value // Update the specific field by its name
    });
  };

  /**
   * Handles the form submission for registration.
   * Performs client-side validation, makes an API call to the backend,
   * handles responses, and redirects on success.
   * @param {Object} e - The event object from the form submission.
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default browser form submission

    setMessage(''); // Clear any previous messages
    setLoading(true); // Set loading state to true

    // --- Client-side validation ---
    let clientErrors = [];

    // Password confirmation check
    if (formData.password !== formData.confirmPassword) {
      clientErrors.push('Passwords do not match!');
    }

    // Username length validation (matching backend @Size(min=3, max=50))
    if (formData.username.length < 3 || formData.username.length > 50) {
      clientErrors.push('Username must be between 3 and 50 characters.');
    }

    // Password length validation (matching backend @Size(min=6))
    if (formData.password.length < 6) {
      clientErrors.push('Password must be at least 6 characters long.');
    }

    // Basic email format validation (more robust validation is done on backend)
    // This regex is a simple check, not a comprehensive email validator.
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      clientErrors.push('Please provide a valid email address.');
    }

    // If client-side errors exist, display them and stop submission
    if (clientErrors.length > 0) {
      setMessage(clientErrors.join('<br>')); // Join errors with <br> for multi-line display
      setLoading(false); // Reset loading state
      return;
    }
    // --- End client-side validation ---

    try {
      // Make a POST request to the backend registration endpoint
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' // Specify content type as JSON
        },
        // Send username, email, and password as JSON payload
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        }),
        credentials: 'include' // Include cookies (though typically not needed for registration)
      });

      // Check if the response was successful (status code 2xx)
      if (response.ok) {
        // Registration successful
        setMessage('Registration successful! Redirecting to login...');
        // Add a success class for styling (assuming you have .success in auth.css)
        // This is a placeholder, you might want to manage classes more dynamically or use state for styling
        // registerMessage.classList.add('success'); // (Not directly applicable in React this way, manage via state)

        // Redirect to the login page after a short delay
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        // Registration failed, parse error message from backend
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Registration failed.';

        // Attempt to parse error message from JSON response if available
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();

          // Check for specific validation errors from Spring's MethodArgumentNotValidException
          // This assumes Spring sends validation errors in a specific 'errors' array within the JSON
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

        setMessage(errorMessage);
        // Add an error class for styling (assuming you have .error in auth.css)
        // registerMessage.classList.add('error'); // (Not directly applicable in React this way, manage via state)
      }
    } catch (error) {
      // Handle network errors or other unexpected issues
      console.error('Error during registration:', error);
      setMessage('An error occurred during registration. Please check your network or try again later.');
      // registerMessage.classList.add('error'); // (Not directly applicable in React this way, manage via state)
    } finally {
      setLoading(false); // Always set loading to false after the request
    }
  };

  return (
    <div className="content-wrapper">
      <div className="container">
        <h1>REGISTER</h1>
        
        <form onSubmit={handleSubmit} className="form-section">
          <div className="input-group">
            <label htmlFor="regUsername">Username:</label>
            <input
              type="text"
              id="regUsername"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              disabled={loading} // Disable input while loading
            />
          </div>
          <div className="input-group">
            <label htmlFor="regEmail">Email:</label>
            <input
              type="email"
              id="regEmail"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={loading} // Disable input while loading
            />
          </div>
          <div className="input-group">
            <label htmlFor="regPassword">Password:</label>
            <input
              type="password"
              id="regPassword"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={loading} // Disable input while loading
            />
          </div>
          <div className="input-group">
            <label htmlFor="regConfirmPassword">Confirm Password:</label>
            <input
              type="password"
              id="regConfirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              disabled={loading} // Disable input while loading
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="login-link-text">
          Already have an account? <Link to="/">Login here</Link>.
        </p>
        
        {/* Display messages to the user, dynamically applying success/error class */}
        {message && <div className={`message ${message.includes('successful') ? 'success' : 'error'}`} dangerouslySetInnerHTML={{ __html: message }}></div>}
      </div>
    </div>
  );
};
