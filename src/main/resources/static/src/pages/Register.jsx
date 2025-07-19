
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/auth.css'

export const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
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
    
    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match!')
      return
    }
    
    if (formData.username && formData.email && formData.password) {
      setMessage('Registration successful! Redirecting to login...')
      setTimeout(() => navigate('/'), 2000)
    } else {
      setMessage('Please fill in all fields.')
    }
  }

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
            />
          </div>
          <button type="submit">Register</button>
        </form>

        <p className="login-link-text">
          Already have an account? <Link to="/">Login here</Link>.
        </p>
        
        {message && <div className="message">{message}</div>}
      </div>
    </div>
  )
}
