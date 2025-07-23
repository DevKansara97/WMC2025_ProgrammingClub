import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/auth.css';

export const Login = () => {
  // State to hold form input data (username and password)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
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
   * Handles the form submission for login.
   * Prevents default form submission, makes an API call to the backend,
   * handles responses, stores tokens/user info, and redirects.
   * @param {Object} e - The event object from the form submission.
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default browser form submission

    setMessage(''); // Clear any previous messages
    setLoading(true); // Set loading state to true

    try {
      // Make a POST request to the backend login endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' // Specify content type as JSON
        },
        body: JSON.stringify(formData), // Send username and password as JSON
        // 'include' credentials to send cookies (if your backend uses session cookies or HTTP-only JWT cookies)
        // If JWT is returned in the body, this might not be strictly necessary for login,
        // but it's good practice if other authentication mechanisms are involved.
        credentials: 'include' 
      });

      // Check if the response was successful (status code 2xx)
      if (response.ok) {
        const data = await response.json(); // Parse the JSON response from the backend

        // Assuming the backend returns user details and potentially a JWT in the 'data' object
        // Based on your AuthResponse.java, it likely contains username, role, and jwt.
        const { username, role, jwt } = data; 

        // Store user information and JWT (if available) in localStorage or sessionStorage
        // localStorage is persistent across browser sessions, sessionStorage is cleared on tab close.
        // For JWTs, localStorage is common, but consider security implications (XSS).
        localStorage.setItem('userToken', jwt); // Store the JWT
        localStorage.setItem('userRole', role); // Store the user's role
        localStorage.setItem('username', username); // Store the username

        setMessage('Login successful! Redirecting...');
        // Add a success class for styling (assuming you have .success in auth.css)
        // This is a placeholder, you might want to manage classes more dynamically or use state for styling
        // loginMessage.classList.add('success'); // (Not directly applicable in React this way, manage via state)

        // Redirect based on the user's role received from the backend
        setTimeout(() => {
          if (role === 'ADMIN') {
            navigate('/admin-dashboard');
          } else if (role === 'AVENGER') {
            navigate('/avenger-dashboard');
          } else {
            // Fallback for unknown roles, or show an error
            console.warn('Unknown user role received:', role);
            setMessage('Login successful, but unknown role. Please contact support.');
            // Optionally redirect to a generic dashboard or back to login
            navigate('/'); 
          }
        }, 1000); // Redirect after 1 second
      } else {
        // Handle unsuccessful login responses (e.g., 401 Unauthorized, 400 Bad Request)
        let errorMessage = 'Login failed: Invalid credentials.';
        const contentType = response.headers.get('content-type');

        // Attempt to parse error message from JSON response if available
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage; // Use backend message if provided
        } else {
          // If not JSON, try to get error message as plain text
          const textError = await response.text();
          if (response.status === 401) {
            errorMessage = 'Login failed: Incorrect username or password.';
          } else if (response.status === 400) {
            errorMessage = textError || 'Login failed: Bad request.';
          } else {
            errorMessage = `Login failed: Server error (${response.status}).`;
          }
        }
        setMessage(errorMessage);
        // Add an error class for styling (assuming you have .error in auth.css)
        // loginMessage.classList.add('error'); // (Not directly applicable in React this way, manage via state)
      }
    } catch (error) {
      // Handle network errors (e.g., server unreachable)
      console.error('Error during login:', error);
      setMessage('An unexpected error occurred. Please check your network or try again later.');
      // loginMessage.classList.add('error'); // (Not directly applicable in React this way, manage via state)
    } finally {
      setLoading(false); // Always set loading to false after the request
    }
  };

  return (
    <div className="content-wrapper">
      <div className="container">
        <h1>AVENGERS ASSEMBLE</h1>
        
        <form onSubmit={handleSubmit} className="form-section">
          <div className="input-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              disabled={loading} // Disable input while loading
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={loading} // Disable input while loading
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Logging In...' : 'Login'}
          </button>
        </form>

        <p className="register-link-text">
          Don't have an account? <Link to="/register">Register here</Link>.
        </p>
        
        {/* Display messages to the user */}
        {message && <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>{message}</div>}
      </div>
    </div>
  );
};
