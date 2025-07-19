
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/auth.css'

export const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Simple authentication logic
    if (formData.username === 'admin' && formData.password === 'admin') {
      setMessage('Login successful! Redirecting to Admin Dashboard...')
      setTimeout(() => navigate('/admin-dashboard'), 2000)
    } else if (formData.username && formData.password) {
      setMessage('Login successful! Redirecting to Avenger Dashboard...')
      setTimeout(() => navigate('/avenger-dashboard'), 2000)
    } else {
      setMessage('Please enter both username and password.')
    }
  }

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
            />
          </div>
          <button type="submit">Login</button>
        </form>

        <p className="register-link-text">
          Don't have an account? <Link to="/register">Register here</Link>.
        </p>
        
        {message && <div className="message">{message}</div>}
      </div>
    </div>
  )
}
