import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import DotGrid from '../components/animations/DotGrid';
import TiltedCard from '../components/cards/TiltedCard';
import '../styles/dashboard.css'; // Assuming this CSS file contains styling for the dashboard

export const AvengerDashboard = () => {
  const [activeSection, setActiveSection] = useState('overview');

  // State for Overview Section
  const [avengerDashboardStats, setAvengerDashboardStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]); // For recent activity timeline
  const [loadingRecentActivity, setLoadingRecentActivity] = useState(true);
  const [errorRecentActivity, setErrorRecentActivity] = useState(null);

  // State for Missions Section
  const [myMissions, setMyMissions] = useState([]);
  const [loadingMyMissions, setLoadingMyMissions] = useState(true);
  const [errorMyMissions, setErrorMyMissions] = useState(null);
  const [missionFilter, setMissionFilter] = useState('all');

  // State for Attendance Section
  const [attendanceCode, setAttendanceCode] = useState('');
  const [attendanceMessage, setAttendanceMessage] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [errorAttendance, setErrorAttendance] = useState(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date()); // Tracks the month displayed
  const [presentDaysInMonth, setPresentDaysInMonth] = useState([]);

  // State for Balance Section
  const [userBalance, setUserBalance] = useState(null);
  const [monthlyEarnings, setMonthlyEarnings] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [errorBalance, setErrorBalance] = useState(null);

  // State for Feedback Section
  const [feedbackForm, setFeedbackForm] = useState({ category: '', subject: '', feedbackText: '', isAnonymous: false, rating: 0 });
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [errorFeedback, setErrorFeedback] = useState(null);

  // State for Announcements Section
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [errorAnnouncements, setErrorAnnouncements] = useState(null);

  // State for Profile Section
  const [profileData, setProfileData] = useState(null);
  const [profileForm, setProfileForm] = useState({ username: '', email: '', heroAlias: '', phone: '', bio: '', skills: '' });
  const [profileMessage, setProfileMessage] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errorProfile, setErrorProfile] = useState(null);


  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Utility function to display messages
  const showMessage = (setter, msg, isSuccess = true) => {
    setter(msg);
    setTimeout(() => setter(''), 5000); // Clear message after 5 seconds
  };

  /**
   * Generic fetchData function with JWT and error handling.
   * @param {string} url - The API endpoint URL.
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE).
   * @param {Object} body - Request body for POST/PUT.
   * @param {Function} errorSetter - State setter for error messages.
   * @returns {Promise<Object|null>} - Parsed JSON data or null on error/unauthorized.
   */
  const fetchData = useCallback(async (url, method = 'GET', body = null, errorSetter) => {
    const userToken = localStorage.getItem('userToken');
    if (!userToken) {
      errorSetter('Authentication token not found. Please log in again.');
      handleLogout(); // Use the memoized handleLogout
      return null;
    }

    try {
      const options = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        credentials: 'include'
      };
      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      if (response.status === 401 || response.status === 403) {
        errorSetter('Session expired or unauthorized. Please log in again.');
        handleLogout();
        return null;
      }

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `HTTP error! status: ${response.status}`;
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          errorMessage = await response.text();
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return response; // Return response object if not JSON (e.g., for logout)

    } catch (error) {
      console.error(`Fetch error for ${url}:`, error);
      errorSetter(`An error occurred: ${error.message}`);
      return null;
    }
  }, [navigate]); // navigate is a dependency for useCallback

  /**
   * Handles user logout. Clears local storage and redirects to the login page.
   */
  const handleLogout = useCallback(() => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    navigate('/');
  }, [navigate]);

  /**
   * Handles navigation clicks to change the active section of the dashboard.
   * @param {string} section - The ID of the section to activate.
   */
  const handleNavClick = (section) => {
    setActiveSection(section);
  };

  // --- Data Fetching Functions ---

  const fetchAvengerDashboardStats = useCallback(async () => {
    setLoadingStats(true);
    const stats = await fetchData('/api/avenger/dashboard-stats', 'GET', null, setErrorStats);
    if (stats) {
      setAvengerDashboardStats([
        { icon: 'fas fa-rocket', title: 'Active Missions', value: stats.activeMissions.toString() },
        { icon: 'fas fa-trophy', title: 'Completed Missions', value: stats.completedMissions.toString() },
        { icon: 'fas fa-percentage', title: 'Attendance Rate', value: `${stats.attendanceRate.toFixed(1)}%` },
        { icon: 'fas fa-coins', title: 'Current Balance', value: `₹ ${parseFloat(stats.currentBalance).toLocaleString('en-IN')}` }
      ]);
    }
    setLoadingStats(false);
  }, [fetchData]);

  const fetchRecentActivity = useCallback(async () => {
    setLoadingRecentActivity(true);
    // This endpoint is not explicitly defined in your backend, using placeholder
    // If you implement this, it should return a list of recent activities
    // e.g., /api/avenger/recent-activity
    const dummyActivities = [
      { icon: 'fas fa-rocket', text: 'Mission "Operation Shield" assigned', time: '2 hours ago' },
      { icon: 'fas fa-user-check', text: 'Attendance marked for today', time: '8 hours ago' },
      { icon: 'fas fa-trophy', text: 'Mission "Rescue Alpha" completed', time: '1 day ago' },
    ];
    setRecentActivities(dummyActivities);
    setLoadingRecentActivity(false);
    setErrorRecentActivity(null); // Clear any previous errors
  }, []); // No dependencies as it's dummy data for now

  const fetchMyMissions = useCallback(async (filterStatus = 'all') => {
    setLoadingMyMissions(true);
    const missions = await fetchData('/api/avenger/missions/my', 'GET', null, setErrorMyMissions);
    if (missions) {
      const filtered = filterStatus === 'all' ? missions : missions.filter(m => m.status === filterStatus.toUpperCase());
      setMyMissions(filtered);
    }
    setLoadingMyMissions(false);
  }, [fetchData]);

  const fetchAttendanceData = useCallback(async (year, month) => {
    setLoadingAttendance(true);
    const records = await fetchData('/api/avenger/attendance/history', 'GET', null, setErrorAttendance);
    const stats = await fetchData(`/api/avenger/attendance/stats/${year}/${month}`, 'GET', null, setErrorAttendance);

    if (records) {
      const presentDays = records
        .filter(record => {
          const recordDate = new Date(record.markedAt);
          return recordDate.getFullYear() === year && recordDate.getMonth() === month - 1;
        })
        .map(record => new Date(record.markedAt).getDate());
      setPresentDaysInMonth(presentDays);
      setAttendanceRecords(records); // Store all records for potential future use
    }
    if (stats) {
      setAttendanceStats(stats);
    }
    setLoadingAttendance(false);
  }, [fetchData]);

  const fetchBalanceData = useCallback(async () => {
    setLoadingBalance(true);
    const userDetails = await fetchData('/api/user/details', 'GET', null, setErrorBalance);
    const transactionsHistory = await fetchData('/api/avenger/transactions/history', 'GET', null, setErrorBalance);
    const currentMonth = new Date();
    const earnings = await fetchData(`/api/avenger/earnings/${currentMonth.getFullYear()}/${currentMonth.getMonth() + 1}`, 'GET', null, setErrorBalance);

    if (userDetails) {
      setUserBalance(userDetails.balance);
    }
    if (transactionsHistory) {
      setTransactions(transactionsHistory);
    }
    if (earnings) {
      setMonthlyEarnings(earnings.totalEarnings);
    }
    setLoadingBalance(false);
  }, [fetchData]);

  const fetchFeedbackHistory = useCallback(async () => {
    setLoadingFeedback(true);
    const feedbackItems = await fetchData('/api/avenger/feedback/my', 'GET', null, setErrorFeedback);
    if (feedbackItems) {
      setFeedbackHistory(feedbackItems);
    }
    setLoadingFeedback(false);
  }, [fetchData]);

  const fetchAnnouncements = useCallback(async () => {
    setLoadingAnnouncements(true);
    const announcementsList = await fetchData('/api/avenger/announcements', 'GET', null, setErrorAnnouncements);
    if (announcementsList) {
      setAnnouncements(announcementsList);
    }
    setLoadingAnnouncements(false);
  }, [fetchData]);

  const fetchProfileData = useCallback(async () => {
    setLoadingProfile(true);
    const data = await fetchData('/api/user/details', 'GET', null, setErrorProfile);
    if (data) {
      setProfileData(data);
      setProfileForm({
        username: data.username || '',
        email: data.email || '',
        heroAlias: data.heroAlias || '', // Assuming these fields exist in UserDTO
        phone: data.phone || '',
        bio: data.bio || '',
        skills: data.skills || ''
      });
    }
    setLoadingProfile(false);
  }, [fetchData]);

  // --- useEffect for Data Loading based on Active Section ---
  useEffect(() => {
    const today = new Date();
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth() + 1; // JS months are 0-indexed

    switch (activeSection) {
      case 'overview':
        fetchAvengerDashboardStats();
        fetchRecentActivity();
        break;
      case 'missions':
        fetchMyMissions(missionFilter);
        break;
      case 'attendance':
        fetchAttendanceData(year, month);
        break;
      case 'balance':
        fetchBalanceData();
        break;
      case 'feedback':
        fetchFeedbackHistory();
        break;
      case 'announcements':
        fetchAnnouncements();
        break;
      case 'profile':
        fetchProfileData();
        break;
      default:
        break;
    }
  }, [activeSection, missionFilter, currentCalendarDate,
    fetchAvengerDashboardStats, fetchRecentActivity, fetchMyMissions,
    fetchAttendanceData, fetchBalanceData, fetchFeedbackHistory,
    fetchAnnouncements, fetchProfileData]);


  // --- Attendance Calendar Rendering Logic ---
  const renderCalendar = (year, month, presentDays) => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const numDays = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 for Sunday, 1 for Monday...

    const days = [];
    // Add empty cells for days before the 1st
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add days
    for (let day = 1; day <= numDays; day++) {
      const isPresent = presentDays.includes(day);
      const date = new Date(year, month - 1, day);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6; // 0 = Sunday, 6 = Saturday

      let className = 'calendar-day';
      if (isPresent) {
        className += ' present';
      } else if (isWeekend) {
        className += ' weekend';
      } else {
        className += ' absent';
      }

      days.push(
        <div key={`day-${day}`} className={className}>
          {day}
        </div>
      );
    }
    return days;
  };

  // --- Form Handlers ---

  const handleAttendanceCodeChange = (e) => {
    setAttendanceCode(e.target.value);
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    setAttendanceMessage('');
    if (attendanceCode.trim().length !== 6) {
      showMessage(setAttendanceMessage, 'Please enter a valid 6-digit attendance code.', false);
      return;
    }

    const payload = { code: attendanceCode.trim() };
    const result = await fetchData('/api/avenger/attendance/mark', 'POST', payload, setAttendanceMessage);
    if (result && result.success) {
      showMessage(setAttendanceMessage, result.message, true);
      setAttendanceCode(''); // Clear input
      const year = currentCalendarDate.getFullYear();
      const month = currentCalendarDate.getMonth() + 1;
      fetchAttendanceData(year, month); // Reload attendance history and stats
      fetchAvengerDashboardStats(); // Update overview stats
    } else if (result) {
      showMessage(setAttendanceMessage, result.message || 'Failed to mark attendance.', false);
    }
  };

  const handleFeedbackFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFeedbackForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleStarRatingClick = (rating) => {
    setFeedbackForm(prev => ({ ...prev, rating }));
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setFeedbackMessage('');

    if (!feedbackForm.category || !feedbackForm.subject || !feedbackForm.feedbackText) {
      showMessage(setFeedbackMessage, 'Please fill in all required fields (Category, Subject, Message).', false);
      return;
    }

    const payload = {
      category: feedbackForm.category,
      subject: feedbackForm.subject,
      feedbackText: feedbackForm.feedbackText,
      isAnonymous: feedbackForm.isAnonymous,
      rating: feedbackForm.rating
    };

    const result = await fetchData('/api/avenger/feedback', 'POST', payload, setFeedbackMessage);
    if (result && result.success) {
      showMessage(setFeedbackMessage, result.message, true);
      setFeedbackForm({ category: '', subject: '', feedbackText: '', isAnonymous: false, rating: 0 }); // Reset form
      fetchFeedbackHistory(); // Reload history
      fetchAvengerDashboardStats(); // Update overview stats
    } else if (result) {
      showMessage(setFeedbackMessage, result.message || 'Failed to send feedback.', false);
    }
  };

  const handleProfileFormChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage('');

    const payload = {
      username: profileForm.username,
      email: profileForm.email,
      heroAlias: profileForm.heroAlias,
      phone: profileForm.phone,
      bio: profileForm.bio,
      skills: profileForm.skills
    };

    const result = await fetchData('/api/avenger/profile', 'PUT', payload, setProfileMessage);
    if (result && result.id) { // Assuming success returns updated UserDTO
      showMessage(setProfileMessage, 'Profile updated successfully!', true);
      fetchProfileData(); // Reload profile section
      // You might want to update username in local storage and welcome message if it changed
    } else if (result) {
      showMessage(setProfileMessage, result.message || 'Failed to update profile.', false);
    }
  };

  const handleChangePassword = async () => {
    // This would ideally be a custom modal, replacing prompt/alert
    const newPassword = prompt('Enter your new password:');
    if (newPassword && newPassword.length >= 6) { // Adjusted min length to 6 as per backend
      const confirmNewPassword = prompt('Confirm your new password:');
      if (newPassword === confirmNewPassword) {
        const payload = { newPassword: newPassword };
        const result = await fetchData('/api/avenger/profile/change-password', 'PUT', payload, setProfileMessage);
        if (result && result.success) {
          showMessage(setProfileMessage, result.message, true);
        } else if (result) {
          showMessage(setProfileMessage, result.message, false);
        }
      } else {
        showMessage(setProfileMessage, 'Passwords do not match!', false);
      }
    } else if (newPassword !== null) {
      showMessage(setProfileMessage, 'Password must be at least 6 characters long.', false);
    }
  };

  // Placeholder for 2FA and Login History
  const handleToggle2FA = () => showMessage(setProfileMessage, '2FA toggle functionality not yet implemented.', false);
  const handleViewLoginHistory = () => showMessage(setProfileMessage, 'Login history functionality not yet implemented.', false);


  return (
    <div className="content-wrapper avenger-dashboard">
      {/* DotGrid Background Animation */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1
      }}>
        <DotGrid
          dotSize={2}
          gap={18}
          baseColor="#2a2a2a"
          activeColor={isDark ? "#2507ff" : "#2507ff"} // Avenger dashboard specific color
          proximity={80}
          shockRadius={120}
          shockStrength={4}
          resistance={800}
          returnDuration={1.2}
        />
      </div>

      {/* Dashboard Header */}
      <header className="dashboard-header">
        <h1 className="dashboard-title">Avenger<span className='dashboard-title-span'>  Dashboard</span></h1>

        <nav className="horizontal-nav">
          {/* Navigation Items */}
          {[
            { id: 'overview', label: 'Home Base', icon: 'fas fa-home' },
            { id: 'missions', label: 'My Missions', icon: 'fas fa-rocket' },
            { id: 'attendance', label: 'Check-In', icon: 'fas fa-user-check' },
            { id: 'balance', label: 'Account Balance', icon: 'fas fa-wallet' },
            { id: 'feedback', label: 'Send Feedback', icon: 'fas fa-comment-dots' },
            { id: 'announcements', label: 'Announcements', icon: 'fas fa-bullhorn' },
            { id: 'profile', label: 'Profile', icon: 'fas fa-user-cog' }
          ].map((item) => (
            <button
              key={item.id}
              className={`nav-button ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </button>
          ))}
          <button className="logout-nav-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </nav>
      </header>


      <main className="dashboard-main-content">
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <section className="dashboard-section">
            {loadingStats ? (
              <div className="loading-message">Loading dashboard statistics...</div>
            ) : errorStats ? (
              <div className="error-message">{errorStats}</div>
            ) : (
              <div className="tilted-cards-grid">
                {avengerDashboardStats && avengerDashboardStats.map((stat, index) => (
                  <TiltedCard
                    key={index}
                    altText={stat.title}
                    captionText={stat.title}
                    containerHeight="280px"
                    containerWidth="100%"
                    imageHeight="280px"
                    imageWidth="100%"
                    rotateAmplitude={12}
                    scaleOnHover={1.1}
                    showMobileWarning={false}
                    showTooltip={false}
                    displayOverlayContent={true}
                    overlayContent={
                      <div>
                        <div className="stat-icon">
                          <i className={stat.icon}></i>
                        </div>
                        <div className="stat-title">{stat.title}</div>
                        <div className="stat-value">{stat.value}</div>
                      </div>
                    }
                  />
                ))}
              </div>
            )}

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
              {loadingRecentActivity ? (
                <div className="loading-message">Loading recent activity...</div>
              ) : errorRecentActivity ? (
                <div className="error-message">{errorRecentActivity}</div>
              ) : (
                <div className="activity-timeline">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity, index) => (
                      <div key={index} className="activity-item">
                        <i className={activity.icon + " activity-icon"}></i>
                        <span>{activity.text}</span>
                        <time>{activity.time}</time>
                      </div>
                    ))
                  ) : (
                    <p className="no-data-message">No recent activity.</p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* My Missions Section */}
        {activeSection === 'missions' && (
          <section className="dashboard-section">
            <div className="card">
              <h3><i className="fas fa-rocket"></i> My Missions</h3>
              <div className="mission-filters">
                <button
                  className={`filter-btn ${missionFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setMissionFilter('all')}
                >
                  All
                </button>
                <button
                  className={`filter-btn ${missionFilter === 'ongoing' ? 'active' : ''}`}
                  onClick={() => setMissionFilter('ongoing')}
                >
                  Ongoing
                </button>
                <button
                  className={`filter-btn ${missionFilter === 'completed' ? 'active' : ''}`}
                  onClick={() => setMissionFilter('completed')}
                >
                  Completed
                </button>
                <button
                  className={`filter-btn ${missionFilter === 'failed' ? 'active' : ''}`}
                  onClick={() => setMissionFilter('failed')}
                >
                  Failed
                </button>
                <button
                  className={`filter-btn ${missionFilter === 'martyred' ? 'active' : ''}`}
                  onClick={() => setMissionFilter('martyred')}
                >
                  Martyred
                </button>
              </div>

              {loadingMyMissions ? (
                <div className="loading-message">Loading missions...</div>
              ) : errorMyMissions ? (
                <div className="error-message">{errorMyMissions}</div>
              ) : (
                <div className="missions-container">
                  {myMissions.length > 0 ? (
                    myMissions.map(mission => {
                      let priorityClass = 'normal';
                      if (mission.status === 'ONGOING') priorityClass = 'critical';
                      else if (mission.status === 'COMPLETED') priorityClass = 'high';

                      return (
                        <div key={mission.id} className={`mission-card ${mission.status.toLowerCase()}`}>
                          <div className="mission-header">
                            <h4>{mission.missionName}</h4>
                            <span className={`priority-badge ${priorityClass}`}>
                              {mission.status.charAt(0).toUpperCase() + mission.status.slice(1).toLowerCase()}
                            </span>
                          </div>
                          <p className="mission-description">
                            {mission.description.substring(0, 150) + (mission.description.length > 150 ? '...' : '')}
                          </p>
                          <div className="mission-details">
                            <div className="detail-item">
                              <i className="fas fa-users"></i>
                              <span>{mission.participants.map(p => p.username).join(', ')}</span>
                            </div>
                            <div className="detail-item">
                              <i className="fas fa-clock"></i>
                              <span>Assigned: {new Date(mission.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          {mission.status === 'ONGOING' && (
                            <div className="mission-progress">
                              <div className="progress-bar">
                                {/* Placeholder progress, integrate actual progress if backend provides */}
                                <div className="progress-fill" style={{ width: '50%' }}></div>
                              </div>
                              <span className="progress-text">50% Complete</span>
                            </div>
                          )}
                          <div className="mission-actions">
                            {mission.status === 'ONGOING' && (
                              <button className="button small-button primary-button update-mission-status-btn">Update Status</button>
                            )}
                            <button className="button small-button view-mission-details-btn">View Details</button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="no-data-message">No missions found for this filter.</p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Attendance Section */}
        {activeSection === 'attendance' && (
          <section className="dashboard-section">
            <div className="card">
              <h3><i className="fas fa-user-check"></i> Mark Attendance</h3>
              <form onSubmit={handleSubmitAttendance} className="form-section">
                <div className="input-group">
                  <label htmlFor="attendance-code">Attendance Code:</label>
                  <input
                    type="text"
                    id="attendance-code"
                    name="attendanceCode"
                    value={attendanceCode}
                    onChange={handleAttendanceCodeChange}
                    maxLength="6"
                    required
                  />
                </div>
                <button type="submit" id="submitAttendanceBtn">Submit Attendance</button>
                {attendanceMessage && <div className={`message ${attendanceMessage.includes('successful') ? 'success' : 'error'}`}>{attendanceMessage}</div>}
              </form>
            </div>

            <div className="card">
              <h3><i className="fas fa-calendar-alt"></i> Attendance History</h3>
              {loadingAttendance ? (
                <div className="loading-message">Loading attendance history...</div>
              ) : errorAttendance ? (
                <div className="error-message">{errorAttendance}</div>
              ) : (
                <>
                  <div className="calendar-nav">
                    <button id="prevMonthBtn" onClick={() => setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>&lt; Prev</button>
                    <span id="currentMonthYear">
                      {currentCalendarDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button id="nextMonthBtn" onClick={() => setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>Next &gt;</button>
                  </div>
                  <div className="calendar-grid">
                    <div className="calendar-day header">Sun</div>
                    <div className="calendar-day header">Mon</div>
                    <div className="calendar-day header">Tue</div>
                    <div className="calendar-day header">Wed</div>
                    <div className="calendar-day header">Thu</div>
                    <div className="calendar-day header">Fri</div>
                    <div className="calendar-day header">Sat</div>
                    {renderCalendar(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, presentDaysInMonth)}
                  </div>
                  <div className="attendance-summary">
                    <p>Days Present: <span id="daysPresent">{attendanceStats?.daysPresent || 0}</span></p>
                    <p>Days Absent: <span id="daysAbsent">{attendanceStats?.daysAbsent || 0}</span></p>
                    <p>Attendance Rate: <span id="attendanceRateStat">{attendanceStats?.attendanceRate?.toFixed(1) || 0}%</span></p>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* Account Balance Section */}
        {activeSection === 'balance' && (
          <section className="dashboard-section">
            <div className="card">
              <h3><i className="fas fa-wallet"></i> My Balance Overview</h3>
              {loadingBalance ? (
                <div className="loading-message">Loading balance data...</div>
              ) : errorBalance ? (
                <div className="error-message">{errorBalance}</div>
              ) : (
                <div className="balance-summary">
                  <div className="stat-item">
                    <span className="stat-label">Current Balance:</span>
                    <span className="stat-value highlight">₹ {userBalance ? parseFloat(userBalance).toLocaleString('en-IN') : '0'}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">This Month's Earnings:</span>
                    <span className="stat-value">₹ {monthlyEarnings ? parseFloat(monthlyEarnings).toLocaleString('en-IN') : '0'}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Last Transaction Amount:</span>
                    <span className="stat-value">₹ {transactions.length > 0 ? parseFloat(transactions[0].amount).toLocaleString('en-IN') : '0'}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Last Transaction Date:</span>
                    <span className="stat-value">{transactions.length > 0 ? new Date(transactions[0].transactionDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <h3><i className="fas fa-history"></i> Transaction History</h3>
              {loadingBalance ? (
                <div className="loading-message">Loading transaction history...</div>
              ) : errorBalance ? (
                <div className="error-message">{errorBalance}</div>
              ) : (
                <div className="transaction-list">
                  {transactions.length > 0 ? (
                    transactions.map(tx => {
                      const isCredit = tx.transactionType === 'SALARY' || tx.transactionType === 'MISSION_REWARD';
                      return (
                        <div key={tx.id} className="transaction-item">
                          <div className={`transaction-icon ${isCredit ? 'credit' : 'debit'}`}>
                            <i className={`fas fa-${isCredit ? 'plus' : 'minus'}`}></i>
                          </div>
                          <div className="transaction-details">
                            <h4>{tx.transactionType.replace('_', ' ')}</h4>
                            <p>{tx.description || 'N/A'}</p>
                            <time>{new Date(tx.transactionDate).toLocaleDateString()}</time>
                          </div>
                          <div className={`transaction-amount ${isCredit ? 'credit' : 'debit'}`}>
                            {isCredit ? '+' : '-'}₹ {parseFloat(tx.amount).toLocaleString('en-IN')}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="no-data-message">No transaction history found.</p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Feedback Section */}
        {activeSection === 'feedback' && (
          <section className="dashboard-section">
            <div className="card">
              <h3><i className="fas fa-comment-dots"></i> Send Feedback</h3>
              <form onSubmit={handleSubmitFeedback} className="form-section">
                <div className="input-group">
                  <label htmlFor="feedback-category">Category:</label>
                  <select
                    id="feedback-category"
                    name="category"
                    value={feedbackForm.category}
                    onChange={handleFeedbackFormChange}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="GENERAL_FEEDBACK">General Feedback</option>
                    <option value="MISSION_REPORT">Mission Report</option>
                    <option value="TECHNICAL_ISSUE">Technical Issue</option>
                    <option value="SUGGESTION">Suggestion</option>
                  </select>
                </div>
                <div className="input-group">
                  <label htmlFor="feedback-subject">Subject:</label>
                  <input
                    type="text"
                    id="feedback-subject"
                    name="subject"
                    value={feedbackForm.subject}
                    onChange={handleFeedbackFormChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="feedback-message">Message:</label>
                  <textarea
                    id="feedback-message"
                    name="feedbackText"
                    value={feedbackForm.feedbackText}
                    onChange={handleFeedbackFormChange}
                    required
                  ></textarea>
                </div>
                <div className="input-group checkbox-group">
                  <input
                    type="checkbox"
                    id="feedback-anonymous"
                    name="isAnonymous"
                    checked={feedbackForm.isAnonymous}
                    onChange={handleFeedbackFormChange}
                  />
                  <label htmlFor="feedback-anonymous">Send Anonymously</label>
                </div>
                <div className="input-group">
                  <label>Rating:</label>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={`fas fa-star ${star <= feedbackForm.rating ? 'active' : ''}`}
                        onClick={() => handleStarRatingClick(star)}
                      ></i>
                    ))}
                    <span className="rating-text">
                      {feedbackForm.rating > 0 ? `${feedbackForm.rating} Star${feedbackForm.rating > 1 ? 's' : ''}` : 'Select a rating'}
                    </span>
                  </div>
                </div>
                <button type="submit">Submit Feedback</button>
                {feedbackMessage && <div className={`message ${feedbackMessage.includes('successful') ? 'success' : 'error'}`}>{feedbackMessage}</div>}
              </form>
            </div>

            <div className="card">
              <h3><i className="fas fa-history"></i> My Feedback History</h3>
              {loadingFeedback ? (
                <div className="loading-message">Loading feedback history...</div>
              ) : errorFeedback ? (
                <div className="error-message">{errorFeedback}</div>
              ) : (
                <div className="feedback-history-list">
                  {feedbackHistory.length > 0 ? (
                    feedbackHistory.map(feedback => (
                      <div key={feedback.id} className="feedback-item card">
                        <div className="feedback-header">
                          <h4>{feedback.subject || 'No Subject'}</h4>
                          <span className={`feedback-status ${feedback.isRead ? 'reviewed' : 'pending'}`}>
                            {feedback.isRead ? 'Reviewed' : 'Pending Review'}
                          </span>
                        </div>
                        <p>{feedback.feedbackText}</p>
                        <div className="feedback-meta">
                          <span className="feedback-date">Submitted: {new Date(feedback.submittedAt).toLocaleDateString()}</span>
                          <div className="feedback-rating">
                            {Array.from({ length: 5 }, (_, i) => (
                              <i key={i} className={`fas fa-star ${i < (feedback.rating || 0) ? 'active' : ''}`}></i>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-data-message">No feedback history found.</p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Announcements Section */}
        {activeSection === 'announcements' && (
          <section className="dashboard-section">
            <div className="card">
              <h3><i className="fas fa-bullhorn"></i> Latest Announcements</h3>
              {loadingAnnouncements ? (
                <div className="loading-message">Loading announcements...</div>
              ) : errorAnnouncements ? (
                <div className="error-message">{errorAnnouncements}</div>
              ) : (
                <div className="announcements-container">
                  {announcements.length > 0 ? (
                    announcements.map(announcement => {
                      let priorityClass = 'normal';
                      if (announcement.title.toLowerCase().includes('emergency') || announcement.title.toLowerCase().includes('urgent')) {
                        priorityClass = 'urgent';
                      } else if (announcement.title.toLowerCase().includes('important')) {
                        priorityClass = 'important';
                      }
                      return (
                        <div key={announcement.id} className={`announcement-item card ${priorityClass}`}>
                          <div className="announcement-header">
                            <div className="announcement-meta">
                              <h3>{announcement.title}</h3>
                              <span className={`priority-badge ${priorityClass}`}>
                                {priorityClass.charAt(0).toUpperCase() + priorityClass.slice(1)}
                              </span>
                            </div>
                            <span className="announcement-date">{new Date(announcement.postedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="announcement-content">
                            <p>{announcement.content}</p>
                          </div>
                          <div className="announcement-actions">
                            <button className="button small-button primary-button">Acknowledge</button>
                            <button className="button small-button">View Details</button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="no-data-message">No announcements found.</p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Profile Section */}
        {activeSection === 'profile' && (
          <section className="dashboard-section">
            <div className="card profile-overview">
              <h3><i className="fas fa-user-circle"></i> My Profile</h3>
              {loadingProfile ? (
                <div className="loading-message">Loading profile data...</div>
              ) : errorProfile ? (
                <div className="error-message">{errorProfile}</div>
              ) : (
                <>
                  <div className="profile-header-info">
                    <div className="profile-avatar">
                      <i className="fas fa-user-shield"></i> {/* Generic icon */}
                    </div>
                    <div className="profile-text-info">
                      <h4 id="profileNameDisplay">{profileData?.username || 'N/A'}</h4>
                      <p id="profileAliasDisplay" className="text-muted">{profileData?.heroAlias || 'N/A'}</p>
                      <p id="profileRoleDisplay" className="text-muted">{profileData?.role || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="profile-stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Missions Completed:</span>
                      <span className="stat-value" id="profileMissionsStat">{avengerDashboardStats?.[1]?.value || 'N/A'}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Attendance Rate:</span>
                      <span className="stat-value" id="profileAttendanceStat">{avengerDashboardStats?.[2]?.value || 'N/A'}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Avenger Rating:</span>
                      <span className="stat-value" id="profileRatingStat">4.8</span> {/* Hardcoded, implement backend for this */}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="card">
              <h3><i className="fas fa-edit"></i> Edit Profile</h3>
              <form onSubmit={handleUpdateProfile} className="form-section">
                <div className="input-group">
                  <label htmlFor="profile-name-input">Username:</label>
                  <input
                    type="text"
                    id="profile-name-input"
                    name="username"
                    value={profileForm.username}
                    onChange={handleProfileFormChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="profile-alias-input">Hero Alias:</label>
                  <input
                    type="text"
                    id="profile-alias-input"
                    name="heroAlias"
                    value={profileForm.heroAlias}
                    onChange={handleProfileFormChange}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="profile-email-input">Email:</label>
                  <input
                    type="email"
                    id="profile-email-input"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileFormChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="profile-phone-input">Phone:</label>
                  <input
                    type="tel"
                    id="profile-phone-input"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileFormChange}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="profile-bio-input">Bio:</label>
                  <textarea
                    id="profile-bio-input"
                    name="bio"
                    value={profileForm.bio}
                    onChange={handleProfileFormChange}
                  ></textarea>
                </div>
                <div className="input-group">
                  <label htmlFor="profile-skills-input">Skills (comma-separated):</label>
                  <input
                    type="text"
                    id="profile-skills-input"
                    name="skills"
                    value={profileForm.skills}
                    onChange={handleProfileFormChange}
                  />
                </div>
                <button type="submit">Save Profile</button>
                {profileMessage && <div className={`message ${profileMessage.includes('successful') ? 'success' : 'error'}`}>{profileMessage}</div>}
              </form>
            </div>

            <div className="card profile-actions">
              <h3><i className="fas fa-cogs"></i> Account Actions</h3>
              <button className="button" onClick={handleChangePassword}>Change Password</button>
              <button className="button" onClick={handleToggle2FA}>Toggle 2FA</button>
              <button className="button" onClick={handleViewLoginHistory}>View Login History</button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
