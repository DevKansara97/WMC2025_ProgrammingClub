import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import DotGrid from '../components/animations/DotGrid';
import TiltedCard from '../components/cards/TiltedCard';
import '../styles/dashboard.css';
// Import Chart.js and react-chartjs-2 for the reports section
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('overview');

  // State for Overview Section
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState(null);

  // State for Heroes/Users Section
  const [avengersData, setAvengersData] = useState([]);
  const [loadingAvengers, setLoadingAvengers] = useState(true);
  const [errorAvengers, setErrorAvengers] = useState(null);

  // State for Payments Section
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [errorPayments, setErrorPayments] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ recipientUsername: '', amount: '', transactionType: 'SALARY' });
  const [paymentMessage, setPaymentMessage] = useState('');

  // State for Missions Section
  const [missionsData, setMissionsData] = useState([]);
  const [loadingMissions, setLoadingMissions] = useState(true);
  const [errorMissions, setErrorMissions] = useState(null);
  const [missionForm, setMissionForm] = useState({ missionName: '', description: '', status: 'ONGOING', participantUserIds: [] });
  const [missionMessage, setMissionMessage] = useState('');

  // State for Attendance Section
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [errorAttendance, setErrorAttendance] = useState(null);
  const [attendanceSession, setAttendanceSession] = useState(null); // { code, endTime }
  const [countdown, setCountdown] = useState(0);
  const [attendanceSessionMessage, setAttendanceSessionMessage] = useState('');

  // State for Feedback Section
  const [feedbackData, setFeedbackData] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [errorFeedback, setErrorFeedback] = useState(null);

  // State for Announcements Section
  const [announcementsData, setAnnouncementsData] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [errorAnnouncements, setErrorAnnouncements] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '' });
  const [announcementMessage, setAnnouncementMessage] = useState('');

  // State for Charts (Reports Section)
  const [attendanceChartData, setAttendanceChartData] = useState(null);
  const [missionChartData, setMissionChartData] = useState(null);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [errorCharts, setErrorCharts] = useState(null);


  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Utility function to display messages
  const showMessage = (setter, msg, isSuccess = true) => {
    setter(msg);
    // You might want to add a class based on isSuccess for styling in your CSS
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
      navigate('/');
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
        handleLogout(); // Log out and redirect
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


  // --- Data Fetching Functions (Memoized with useCallback) ---

  const fetchDashboardStats = useCallback(async () => {
    setLoadingStats(true);
    const stats = await fetchData('/api/admin/dashboard-stats', 'GET', null, setErrorStats);
    if (stats) {
      setDashboardStats([
        { icon: 'fas fa-users', title: 'Total Avengers', value: stats.totalAvengers.toString() },
        { icon: 'fas fa-crosshairs', title: 'Active Missions', value: stats.activeMissions.toString() },
        { icon: 'fas fa-comment-dots', title: 'Pending Feedback', value: stats.pendingFeedback.toString() },
        { icon: 'fas fa-coins', title: 'Payments This Month', value: `₹ ${stats.totalPaymentsThisMonth.toLocaleString('en-IN')}` }
      ]);
    }
    setLoadingStats(false);
  }, [fetchData]);

  const fetchAvengers = useCallback(async () => {
    setLoadingAvengers(true);
    const avengers = await fetchData('/api/admin/avengers', 'GET', null, setErrorAvengers);
    if (avengers) {
      setAvengersData(avengers);
    }
    setLoadingAvengers(false);
  }, [fetchData]);

  const fetchPaymentRecords = useCallback(async () => {
    setLoadingPayments(true);
    const transactions = await fetchData('/api/admin/payments/history', 'GET', null, setErrorPayments);
    if (transactions) {
      setPaymentRecords(transactions);
    }
    setLoadingPayments(false);
  }, [fetchData]);

  const fetchMissions = useCallback(async () => {
    setLoadingMissions(true);
    const missions = await fetchData('/api/admin/missions', 'GET', null, setErrorMissions);
    if (missions) {
      setMissionsData(missions);
    }
    setLoadingMissions(false);
  }, [fetchData]);

  const fetchAttendanceRecords = useCallback(async () => {
    setLoadingAttendance(true);
    const records = await fetchData('/api/admin/attendance/records', 'GET', null, setErrorAttendance);
    if (records) {
      setAttendanceRecords(records);
    }
    setLoadingAttendance(false);
  }, [fetchData]);

  const fetchFeedback = useCallback(async () => {
    setLoadingFeedback(true);
    const feedbackItems = await fetchData('/api/admin/feedback', 'GET', null, setErrorFeedback);
    if (feedbackItems) {
      setFeedbackData(feedbackItems);
    }
    setLoadingFeedback(false);
  }, [fetchData]);

  const fetchAnnouncements = useCallback(async () => {
    setLoadingAnnouncements(true);
    const announcements = await fetchData('/api/admin/announcements', 'GET', null, setErrorAnnouncements);
    if (announcements) {
      setAnnouncementsData(announcements);
    }
    setLoadingAnnouncements(false);
  }, [fetchData]);

  const fetchChartsData = useCallback(async () => {
    setLoadingCharts(true);
    setErrorCharts(null);
    try {
      // Fetch attendance stats for chart
      // This endpoint needs to be adjusted if it doesn't return data suitable for a monthly chart
      // For now, using a placeholder, you'd integrate actual backend calls here.
      // Example: const attendanceStats = await fetchData('/api/admin/attendance/monthly-stats', 'GET', null, setErrorCharts);
      // const missionCompletionStats = await fetchData('/api/admin/missions/completion-stats', 'GET', null, setErrorCharts);

      // Placeholder data for charts
      const dummyAttendanceData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [{
          label: 'Monthly Attendance %',
          data: [85, 90, 78, 92, 88, 95, 80],
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      };

      const dummyMissionData = {
        labels: ['Completed', 'Ongoing', 'Failed', 'Martyred'],
        datasets: [{
          label: 'Mission Status',
          data: [70, 20, 5, 5], // Example data
          backgroundColor: [
            'rgba(75, 192, 192, 0.8)', // Completed
            'rgba(255, 206, 86, 0.8)', // Ongoing
            'rgba(255, 99, 132, 0.8)', // Failed
            'rgba(153, 102, 255, 0.8)' // Martyred
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }]
      };

      setAttendanceChartData(dummyAttendanceData);
      setMissionChartData(dummyMissionData);

    } catch (error) {
      console.error('Error fetching chart data:', error);
      setErrorCharts('Failed to load chart data.');
    } finally {
      setLoadingCharts(false);
    }
  }, [fetchData]);


  // --- useEffect for Data Loading based on Active Section ---
  useEffect(() => {
    switch (activeSection) {
      case 'overview':
        fetchDashboardStats();
        break;
      case 'heroes': // Renamed from 'users' in old JS for consistency with current JSX
        fetchAvengers();
        break;
      case 'payments':
        fetchAvengers(); // Needed for recipient dropdown
        fetchPaymentRecords();
        break;
      case 'missions':
        fetchAvengers(); // Needed for participants dropdown
        fetchMissions();
        break;
      case 'attendance':
        fetchAttendanceRecords();
        break;
      case 'feedback':
        fetchFeedback();
        break;
      case 'announcements': // Renamed from 'posts' in old JS for consistency
        fetchAnnouncements();
        break;
      case 'reports': // Renamed from 'stats' in old JS for consistency
        fetchChartsData();
        break;
      default:
        break;
    }
  }, [activeSection, fetchDashboardStats, fetchAvengers, fetchPaymentRecords, fetchMissions,
    fetchAttendanceRecords, fetchFeedback, fetchAnnouncements, fetchChartsData]);


  // --- Form Handlers ---

  const handlePaymentFormChange = (e) => {
    setPaymentForm({ ...paymentForm, [e.target.name]: e.target.value });
  };

  const handleSendPayment = async (e) => {
    e.preventDefault();
    setPaymentMessage('');
    const recipient = avengersData.find(avenger => avenger.username === paymentForm.recipientUsername);
    if (!recipient) {
      showMessage(setPaymentMessage, 'Please select a valid recipient.', false);
      return;
    }

    const payload = {
      recipientUsername: paymentForm.recipientUsername,
      amount: parseFloat(paymentForm.amount),
      transactionType: paymentForm.transactionType,
      description: `Payment of type ${paymentForm.transactionType}`
    };

    const result = await fetchData('/api/admin/payments/send', 'POST', payload, setPaymentMessage);
    if (result && result.success) {
      showMessage(setPaymentMessage, result.message, true);
      setPaymentForm({ recipientUsername: '', amount: '', transactionType: 'SALARY' }); // Reset form
      fetchPaymentRecords(); // Reload records
      fetchDashboardStats(); // Update stats
    } else if (result) {
      showMessage(setPaymentMessage, result.message || 'Failed to send payment.', false);
    }
  };

  const handleMissionFormChange = (e) => {
    const { name, value, options } = e.target;
    if (name === 'participantUserIds') {
      const selectedOptions = Array.from(options).filter(option => option.selected).map(option => parseInt(option.value));
      setMissionForm({ ...missionForm, [name]: selectedOptions });
    } else {
      setMissionForm({ ...missionForm, [name]: value });
    }
  };

  const handleAssignMission = async (e) => {
    e.preventDefault();
    setMissionMessage('');

    if (missionForm.participantUserIds.length === 0) {
      showMessage(setMissionMessage, 'Please select at least one mission participant.', false);
      return;
    }

    const payload = {
      missionName: missionForm.missionName,
      description: missionForm.description,
      status: missionForm.status,
      participantUserIds: missionForm.participantUserIds
    };

    const result = await fetchData('/api/admin/missions', 'POST', payload, setMissionMessage);
    if (result && result.id) { // Assuming successful creation returns the MissionDTO with an ID
      showMessage(setMissionMessage, 'Mission assigned successfully!', true);
      setMissionForm({ missionName: '', description: '', status: 'ONGOING', participantUserIds: [] }); // Reset form
      fetchMissions(); // Reload missions
      fetchDashboardStats(); // Update stats
    } else if (result) {
      showMessage(setMissionMessage, result.message || 'Failed to assign mission.', false);
    }
  };

  const handleStartAttendanceSession = async () => {
    setAttendanceSessionMessage('');
    const result = await fetchData('/api/admin/attendance/start', 'POST', null, setAttendanceSessionMessage);
    if (result && result.attendanceCode) {
      setAttendanceSession({ code: result.attendanceCode, endTime: result.endTime });
      showMessage(setAttendanceSessionMessage, 'Attendance session started successfully!', true);

      // Start countdown
      const endTime = new Date(result.endTime).getTime();
      const now = new Date().getTime();
      let timeLeft = Math.floor((endTime - now) / 1000); // Time left in seconds

      setCountdown(timeLeft > 0 ? timeLeft : 0);

      const interval = setInterval(() => {
        timeLeft--;
        setCountdown(timeLeft);
        if (timeLeft <= 0) {
          clearInterval(interval);
          setAttendanceSession(null); // Clear session display
          showMessage(setAttendanceSessionMessage, 'Attendance session expired.', false);
          fetchAttendanceRecords(); // Reload records
        }
      }, 1000);

      return () => clearInterval(interval); // Cleanup on unmount/re-render
    } else if (result) {
      showMessage(setAttendanceSessionMessage, result.message || 'Failed to start attendance session.', false);
    }
  };

  const handleMarkFeedbackAsRead = async (feedbackId) => {
    const result = await fetchData(`/api/admin/feedback/${feedbackId}/read`, 'PUT', null, setErrorFeedback);
    if (result && result.success) {
      showMessage(setErrorFeedback, 'Feedback marked as read.', true); // Using errorSetter for general messages
      fetchFeedback(); // Reload feedback list
      fetchDashboardStats(); // Update stats
    } else if (result) {
      showMessage(setErrorFeedback, result.message || 'Failed to mark feedback as read.', false);
    }
  };

  const handleAnnouncementFormChange = (e) => {
    setAnnouncementForm({ ...announcementForm, [e.target.name]: e.target.value });
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setAnnouncementMessage('');

    const payload = {
      title: announcementForm.title,
      content: announcementForm.content
    };

    const result = await fetchData('/api/admin/announcements', 'POST', payload, setAnnouncementMessage);
    if (result && result.id) { // Assuming successful creation returns the AnnouncementDTO with an ID
      showMessage(setAnnouncementMessage, 'Announcement posted successfully!', true);
      setAnnouncementForm({ title: '', content: '' }); // Reset form
      fetchAnnouncements(); // Reload announcements
    } else if (result) {
      showMessage(setAnnouncementMessage, result.message || 'Failed to post announcement.', false);
    }
  };

  const handleToggleAvengerStatus = async (userId, currentStatus) => {
    // This assumes an endpoint like /api/users/{id}/status for toggling
    // Your UserController has /api/users/{id}/status but it's not a PUT/POST for status toggle directly
    // You might need to implement this in UserService and expose it via UserController
    // For now, this is a placeholder. A ProfileUpdateRequest could be used if it includes an 'isAlive' field.
    // Example: await fetchData(`/api/admin/users/${userId}/status`, 'PUT', { isAlive: !currentStatus }, setErrorAvengers);
    showMessage(setErrorAvengers, `Functionality to toggle status for user ${userId} is not yet implemented.`, false);
    // After actual implementation, reload avengers: fetchAvengers();
  };


  // Hardcoded recent activities (can be replaced with backend data later if needed)
  const recentActivities = [
    { icon: 'fas fa-user-plus', text: 'Spider-Man joined the team', time: '2 hours ago' },
    { icon: 'fas fa-crosshairs', text: 'Mission "Operation Thunder" completed', time: '4 hours ago' },
    { icon: 'fas fa-exclamation-triangle', text: 'New threat detected in New York', time: '6 hours ago' },
    { icon: 'fas fa-shield-alt', text: 'Defensive systems upgraded', time: '1 day ago' },
  ];

  // Chart data and options for Chart.js
  const attendanceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Monthly Attendance Percentage',
        color: isDark ? '#fff' : '#333',
      },
      legend: {
        labels: {
          color: isDark ? '#ccc' : '#666',
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: isDark ? '#ccc' : '#666',
        },
        grid: {
          color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        }
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: isDark ? '#ccc' : '#666',
        },
        grid: {
          color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        }
      }
    }
  };

  const missionChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Mission Status Distribution',
        color: isDark ? '#fff' : '#333',
      },
      legend: {
        position: 'top',
        labels: {
          color: isDark ? '#ccc' : '#666',
        }
      }
    }
  };


  return (
    <div className="content-wrapper admin-dashboard">
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
          dotSize={8}
          gap={22}
          baseColor="#2a2a2a"
          activeColor="#ff4757" // Admin dashboard specific color
          proximity={80}
          shockRadius={120}
          shockStrength={4}
          resistance={800}
          returnDuration={1.2}
        />
      </div>

      {/* Dashboard Header */}
      <header className="dashboard-header">
        <h1 className="dashboard-title">Admin Dashboard</h1>
        <nav className="horizontal-nav">
          {/* Navigation Items */}
          {[
            { id: 'overview', label: 'Mission Overview', icon: 'fas fa-chart-line' },
            { id: 'heroes', label: 'Heroes Registry', icon: 'fas fa-users' },
            { id: 'payments', label: 'Payments', icon: 'fas fa-coins' },
            { id: 'missions', label: 'Missions', icon: 'fas fa-crosshairs' },
            { id: 'attendance', label: 'Attendance', icon: 'fas fa-calendar-check' },
            { id: 'feedback', label: 'Feedback', icon: 'fas fa-comment-dots' },
            { id: 'announcements', label: 'Announcements', icon: 'fas fa-bullhorn' },
            { id: 'reports', label: 'Reports', icon: 'fas fa-chart-pie' }, // Changed icon for reports
            { id: 'settings', label: 'System Settings', icon: 'fas fa-cog' }
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
          {/* Logout Button */}
          <button className="logout-nav-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </nav>
      </header>

      {/* Main Dashboard Content */}
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
                {dashboardStats && dashboardStats.map((stat, index) => (
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
              <h3><i className="fas fa-clock"></i> Recent Activities</h3>
              <div className="activity-list">
                {/* This section still uses hardcoded data. Integrate with backend later if needed. */}
                {recentActivities.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <i className={activity.icon + " activity-icon"}></i>
                    <span>{activity.text}</span>
                    <time>{activity.time}</time>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Heroes/Users Section */}
        {activeSection === 'heroes' && (
          <section className="dashboard-section">
            <div className="card">
              <h3><i className="fas fa-users"></i> Avengers Roster</h3>
              {loadingAvengers ? (
                <div className="loading-message">Loading Avengers data...</div>
              ) : errorAvengers ? (
                <div className="error-message">{errorAvengers}</div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {avengersData.length > 0 ? (
                        avengersData.map((avenger) => (
                          <tr key={avenger.id}>
                            <td>{avenger.username}</td>
                            <td>{avenger.email}</td>
                            <td>₹ {avenger.balance.toLocaleString('en-IN')}</td>
                            <td>{avenger.alive ? 'Active' : 'Inactive'}</td>
                            <td>
                              <button className="button small-button edit-avenger-btn">Edit</button>
                              <button
                                className={`button small-button ${avenger.alive ? 'danger-button' : 'success-button'} toggle-status-btn`}
                                onClick={() => handleToggleAvengerStatus(avenger.id, avenger.alive)}
                              >
                                {avenger.alive ? 'Deactivate' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="no-data-message">No Avengers found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Payments Section */}
        {activeSection === 'payments' && (
          <section className="dashboard-section">
            <div className="card">
              <h3><i className="fas fa-money-bill-wave"></i> Send Payment</h3>
              <form onSubmit={handleSendPayment} className="form-section">
                <div className="input-group">
                  <label htmlFor="salary-recipient">Recipient:</label>
                  <select
                    id="salary-recipient"
                    name="recipientUsername"
                    value={paymentForm.recipientUsername}
                    onChange={handlePaymentFormChange}
                    required
                    disabled={loadingAvengers}
                  >
                    <option value="">Select Avenger</option>
                    {avengersData.map(avenger => (
                      <option key={avenger.id} value={avenger.username}>{avenger.username}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label htmlFor="salary-amount">Amount:</label>
                  <input
                    type="number"
                    id="salary-amount"
                    name="amount"
                    value={paymentForm.amount}
                    onChange={handlePaymentFormChange}
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="salary-type">Transaction Type:</label>
                  <select
                    id="salary-type"
                    name="transactionType"
                    value={paymentForm.transactionType}
                    onChange={handlePaymentFormChange}
                    required
                  >
                    <option value="SALARY">SALARY</option>
                    <option value="SEND_MONEY">SEND_MONEY</option>
                    {/* Add other types if your backend supports them */}
                  </select>
                </div>
                <button type="submit">Send Payment</button>
                {paymentMessage && <div className={`message ${paymentMessage.includes('successful') ? 'success' : 'error'}`}>{paymentMessage}</div>}
              </form>
            </div>

            <div className="card">
              <h3><i className="fas fa-history"></i> Payment History</h3>
              {loadingPayments ? (
                <div className="loading-message">Loading payment records...</div>
              ) : errorPayments ? (
                <div className="error-message">{errorPayments}</div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Sender</th>
                        <th>Receiver</th>
                        <th>Amount</th>
                        <th>Type</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentRecords.length > 0 ? (
                        paymentRecords.map(tx => (
                          <tr key={tx.id}>
                            <td>{new Date(tx.transactionDate).toLocaleDateString()}</td>
                            <td>{tx.senderUsername}</td>
                            <td>{tx.receiverUsername}</td>
                            <td>₹ {tx.amount.toLocaleString('en-IN')}</td>
                            <td>{tx.transactionType}</td>
                            <td>{tx.description || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="no-data-message">No payment records found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Missions Section */}
        {activeSection === 'missions' && (
          <section className="dashboard-section">
            <div className="card">
              <h3><i className="fas fa-plus-circle"></i> Assign New Mission</h3>
              <form onSubmit={handleAssignMission} className="form-section">
                <div className="input-group">
                  <label htmlFor="mission-name">Mission Name:</label>
                  <input
                    type="text"
                    id="mission-name"
                    name="missionName"
                    value={missionForm.missionName}
                    onChange={handleMissionFormChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="mission-description">Description:</label>
                  <textarea
                    id="mission-description"
                    name="description"
                    value={missionForm.description}
                    onChange={handleMissionFormChange}
                    required
                  ></textarea>
                </div>
                <div className="input-group">
                  <label htmlFor="mission-status">Status:</label>
                  <select
                    id="mission-status"
                    name="status"
                    value={missionForm.status}
                    onChange={handleMissionFormChange}
                    required
                  >
                    <option value="ONGOING">ONGOING</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="FAILED">FAILED</option>
                    <option value="MARTYRED">MARTYRED</option>
                  </select>
                </div>
                <div className="input-group">
                  <label htmlFor="mission-members">Participants:</label>
                  <select
                    id="mission-members"
                    name="participantUserIds"
                    multiple
                    value={missionForm.participantUserIds.map(String)} // Convert numbers to strings for select value
                    onChange={handleMissionFormChange}
                    required
                    disabled={loadingAvengers}
                  >
                    {avengersData.map(avenger => (
                      <option key={avenger.id} value={avenger.id}>{avenger.username}</option>
                    ))}
                  </select>
                  <small>Hold Ctrl/Cmd to select multiple.</small>
                </div>
                <button type="submit">Assign Mission</button>
                {missionMessage && <div className={`message ${missionMessage.includes('successful') ? 'success' : 'error'}`}>{missionMessage}</div>}
              </form>
            </div>

            <div className="card">
              <h3><i className="fas fa-list"></i> All Missions</h3>
              {loadingMissions ? (
                <div className="loading-message">Loading missions...</div>
              ) : errorMissions ? (
                <div className="error-message">{errorMissions}</div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Participants</th>
                        <th>Status</th>
                        <th>Assigned By</th>
                        <th>Created At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {missionsData.length > 0 ? (
                        missionsData.map(mission => (
                          <tr key={mission.id}>
                            <td>{mission.missionName}</td>
                            <td>{mission.description.substring(0, 50)}{mission.description.length > 50 ? '...' : ''}</td>
                            <td>{mission.participants.map(p => p.username).join(', ')}</td>
                            <td>{mission.status}</td>
                            <td>{mission.assignedByUsername}</td>
                            <td>{new Date(mission.createdAt).toLocaleDateString()}</td>
                            <td>
                              <button className="button small-button">Edit</button>
                              {/* Add more action buttons like Delete, Update Status */}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="no-data-message">No missions assigned yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Attendance Section */}
        {activeSection === 'attendance' && (
          <section className="dashboard-section">
            <div className="card">
              <h3><i className="fas fa-user-check"></i> Manage Attendance Sessions</h3>
              <button className="button primary-button" onClick={handleStartAttendanceSession}>
                Start New Attendance Session
              </button>
              {attendanceSessionMessage && <div className={`message ${attendanceSessionMessage.includes('successful') ? 'success' : 'error'}`}>{attendanceSessionMessage}</div>}

              {attendanceSession && (
                <div className="attendance-code-display">
                  <p>Current Attendance Code: <span className="highlight">{attendanceSession.code}</span></p>
                  <p>Session ends in: <span className="countdown">{countdown}</span> seconds</p>
                </div>
              )}
            </div>

            <div className="card">
              <h3><i className="fas fa-clipboard-list"></i> All Attendance Records</h3>
              {loadingAttendance ? (
                <div className="loading-message">Loading attendance records...</div>
              ) : errorAttendance ? (
                <div className="error-message">{errorAttendance}</div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Session Code</th>
                        <th>Avenger</th>
                        <th>Marked At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.length > 0 ? (
                        attendanceRecords.map(record => (
                          <tr key={record.id}>
                            <td>{record.sessionCode}</td>
                            <td>{record.avengerUsername}</td>
                            <td>{new Date(record.markedAt).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="no-data-message">No attendance records found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Feedback Section */}
        {activeSection === 'feedback' && (
          <section className="dashboard-section">
            <div className="card">
              <h3><i className="fas fa-comment-dots"></i> Avenger Feedback</h3>
              {loadingFeedback ? (
                <div className="loading-message">Loading feedback...</div>
              ) : errorFeedback ? (
                <div className="error-message">{errorFeedback}</div>
              ) : (
                <div className="feedback-list">
                  {feedbackData.length > 0 ? (
                    feedbackData.map(feedback => (
                      <div key={feedback.id} className={`feedback-item card ${!feedback.isRead ? 'unread' : ''}`}>
                        <h4>Feedback from {feedback.avengerUsername} {feedback.isAnonymous ? '(Anonymous)' : ''}</h4>
                        <p>Subject: {feedback.subject || 'No Subject'}</p>
                        <p>Category: {feedback.category || 'GENERAL_FEEDBACK'}</p>
                        {feedback.rating && <p>Rating: {feedback.rating} / 5</p>}
                        <p>Message: "{feedback.feedbackText}"</p>
                        <p>Date: {new Date(feedback.submittedAt).toLocaleDateString()}</p>
                        {!feedback.isRead && (
                          <button
                            className="button small-button"
                            onClick={() => handleMarkFeedbackAsRead(feedback.id)}
                          >
                            Mark as Read
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="no-data-message">No feedback received yet.</p>
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
              <h3><i className="fas fa-bullhorn"></i> Create New Announcement</h3>
              <form onSubmit={handleCreateAnnouncement} className="form-section">
                <div className="input-group">
                  <label htmlFor="announcement-title">Title:</label>
                  <input
                    type="text"
                    id="announcement-title"
                    name="title"
                    value={announcementForm.title}
                    onChange={handleAnnouncementFormChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="announcement-content">Content:</label>
                  <textarea
                    id="announcement-content"
                    name="content"
                    value={announcementForm.content}
                    onChange={handleAnnouncementFormChange}
                    required
                  ></textarea>
                </div>
                <button type="submit">Post Announcement</button>
                {announcementMessage && <div className={`message ${announcementMessage.includes('successful') ? 'success' : 'error'}`}>{announcementMessage}</div>}
              </form>
            </div>

            <div className="card">
              <h3><i className="fas fa-list-alt"></i> All Announcements</h3>
              {loadingAnnouncements ? (
                <div className="loading-message">Loading announcements...</div>
              ) : errorAnnouncements ? (
                <div className="error-message">{errorAnnouncements}</div>
              ) : (
                <div className="announcements-list">
                  {announcementsData.length > 0 ? (
                    announcementsData.map(announcement => (
                      <div key={announcement.id} className="announcement-item card">
                        <h4>{announcement.title}</h4>
                        <p>Posted: {new Date(announcement.postedAt).toLocaleDateString()}</p>
                        <p>{announcement.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="no-data-message">No announcements posted yet.</p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Reports Section (Charts) */}
        {activeSection === 'reports' && (
          <section className="dashboard-section">
            <div className="card">
              <h3><i className="fas fa-chart-bar"></i> Attendance Statistics</h3>
              {loadingCharts ? (
                <div className="loading-message">Loading attendance chart...</div>
              ) : errorCharts ? (
                <div className="error-message">{errorCharts}</div>
              ) : (
                <div style={{ height: '400px', width: '100%' }}>
                  {attendanceChartData ? (
                    <Bar data={attendanceChartData} options={attendanceChartOptions} />
                  ) : (
                    <p className="no-data-message">No attendance chart data available.</p>
                  )}
                </div>
              )}
            </div>

            <div className="card">
              <h3><i className="fas fa-chart-pie"></i> Mission Completion Statistics</h3>
              {loadingCharts ? (
                <div className="loading-message">Loading mission chart...</div>
              ) : errorCharts ? (
                <div className="error-message">{errorCharts}</div>
              ) : (
                <div style={{ height: '400px', width: '100%' }}>
                  {missionChartData ? (
                    <Doughnut data={missionChartData} options={missionChartOptions} />
                  ) : (
                    <p className="no-data-message">No mission chart data available.</p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* System Settings (Placeholder) */}
        {activeSection === 'settings' && (
          <section className="dashboard-section">
            <div className="card">
              <p>System Settings section is under development.</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
