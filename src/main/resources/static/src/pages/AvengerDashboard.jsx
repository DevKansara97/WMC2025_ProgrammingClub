
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/dashboard.css'

export const AvengerDashboard = () => {
  const [activeSection, setActiveSection] = useState('overview')
  const navigate = useNavigate()

  const handleNavClick = (section) => {
    setActiveSection(section)
  }

  const handleLogout = () => {
    navigate('/')
  }

  return (
    <div className="content-wrapper">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Avengers Portal</h1>
        <p className="welcome-message">Welcome, <span>Agent!</span></p>
      </header>

      <div className="dashboard-layout-container">
        <nav className="sidebar">
          <ul>
            <li className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`} onClick={() => handleNavClick('overview')}>
              <i className="fas fa-home"></i> Home Base
            </li>
            <li className={`nav-item ${activeSection === 'missions' ? 'active' : ''}`} onClick={() => handleNavClick('missions')}>
              <i className="fas fa-rocket"></i> My Missions
            </li>
            <li className={`nav-item ${activeSection === 'attendance' ? 'active' : ''}`} onClick={() => handleNavClick('attendance')}>
              <i className="fas fa-user-check"></i> Check-In
            </li>
            <li className={`nav-item ${activeSection === 'balance' ? 'active' : ''}`} onClick={() => handleNavClick('balance')}>
              <i className="fas fa-wallet"></i> Account Balance
            </li>
            <li className={`nav-item ${activeSection === 'feedback' ? 'active' : ''}`} onClick={() => handleNavClick('feedback')}>
              <i className="fas fa-comment-dots"></i> Send Feedback
            </li>
            <li className={`nav-item ${activeSection === 'announcements' ? 'active' : ''}`} onClick={() => handleNavClick('announcements')}>
              <i className="fas fa-bullhorn"></i> Announcements
            </li>
            <li className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`} onClick={() => handleNavClick('profile')}>
              <i className="fas fa-user-cog"></i> Profile
            </li>
          </ul>
          <button className="logout-sidebar-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </nav>

        <main className="dashboard-main-content">
          {activeSection === 'overview' && (
            <section className="dashboard-section">
              <h2 className="section-title">Home Base</h2>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon"><i className="fas fa-rocket"></i></div>
                  <h3>Active Missions</h3>
                  <p>3</p>
                </div>
                <div className="stat-card">
                  <div className="stat-icon"><i className="fas fa-trophy"></i></div>
                  <h3>Completed Missions</h3>
                  <p>45</p>
                </div>
                <div className="stat-card">
                  <div className="stat-icon"><i className="fas fa-percentage"></i></div>
                  <h3>Attendance Rate</h3>
                  <p>94%</p>
                </div>
                <div className="stat-card">
                  <div className="stat-icon"><i className="fas fa-coins"></i></div>
                  <h3>Current Balance</h3>
                  <p>₹ 50,000</p>
                </div>
              </div>

              <div className="card">
                <h3><i className="fas fa-bolt"></i> Quick Actions</h3>
                <div className="quick-actions">
                  <button className="action-btn" onClick={() => handleNavClick('attendance')}>
                    <i className="fas fa-user-check"></i>
                    <span>Mark Attendance</span>
                  </button>
                  <button className="action-btn" onClick={() => handleNavClick('missions')}>
                    <i className="fas fa-rocket"></i>
                    <span>View Missions</span>
                  </button>
                  <button className="action-btn" onClick={() => handleNavClick('feedback')}>
                    <i className="fas fa-comment-dots"></i>
                    <span>Send Feedback</span>
                  </button>
                  <button className="action-btn" onClick={() => handleNavClick('announcements')}>
                    <i className="fas fa-bullhorn"></i>
                    <span>View Announcements</span>
                  </button>
                </div>
              </div>

              <div className="card">
                <h3><i className="fas fa-clock"></i> Recent Activity</h3>
                <div className="activity-timeline">
                  <div className="activity-item">
                    <i className="fas fa-rocket activity-icon"></i>
                    <span>Mission "Operation Shield" assigned</span>
                    <time>2 hours ago</time>
                  </div>
                  <div className="activity-item">
                    <i className="fas fa-user-check activity-icon"></i>
                    <span>Attendance marked for today</span>
                    <time>8 hours ago</time>
                  </div>
                  <div className="activity-item">
                    <i className="fas fa-trophy activity-icon"></i>
                    <span>Mission "Rescue Alpha" completed</span>
                    <time>1 day ago</time>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Add other sections as needed */}
          {activeSection !== 'overview' && (
            <section className="dashboard-section">
              <h2 className="section-title">
                <i className="fas fa-cog"></i>
                {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
              </h2>
              <div className="card">
                <p>This section is under development.</p>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
