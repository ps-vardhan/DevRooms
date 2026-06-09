<<<<<<< HEAD
import { useState, useEffect } from 'react';
import './App.css';
import RoomDashboard from './components/RoomDashboard.jsx';
import CodingRoom from './components/CodingRoom.jsx';
import { YjsProvider } from './context/YjsContext.jsx';

function App() {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailId, setEmailId] = useState('');
  const [password, setPassword] = useState('');
  
  const [user, setUser] = useState(null);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [notification, setNotification] = useState(null);

  // Auto-clear notification after 6 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Check active session on initial component load
  useEffect(() => {
    fetch('/api/profile')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("No active session");
      })
      .then(data => {
        setUser(data);
      })
      .catch(() => {
        // Silence session error - user just isn't authenticated yet
      })
      .finally(() => {
        setCheckingSession(false);
      });
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setNotification(null);
    setFirstName('');
    setLastName('');
    setEmailId('');
    setPassword('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId, password })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid login email or password.');
      }

      setUser({
        _id: data._id,
        firstName: data.firstName,
        lastName: data.lastName,
        emailId: data.emailId,
        avatarUrl: data.avatarUrl || ''
      });
      setNotification({ type: 'success', message: `Welcome back, ${data.firstName}!` });
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, emailId, password })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed. Check inputs.');
      }

      setNotification({ type: 'success', message: 'Account registered successfully! Logging you in...' });
      
      const loginResponse = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId, password })
      });
      const loginData = await loginResponse.json();

      if (loginResponse.ok) {
        setUser({
          _id: loginData._id,
          firstName: loginData.firstName,
          lastName: loginData.lastName,
          emailId: loginData.emailId,
          avatarUrl: loginData.avatarUrl || ''
        });
      } else {
        handleTabChange('login');
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/logout', { method: 'POST' });
      if (response.ok) {
        setUser(null);
        setCurrentRoomId(null); // Clear active room on logout
        setNotification({ type: 'success', message: 'Logged out successfully!' });
      } else {
        throw new Error('Logout request failed.');
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="auth-page-wrapper loading-state">
        <div className="spinner" style={{ borderTopColor: '#c084fc', width: '48px', height: '48px' }}></div>
      </div>
    );
  }

  // If user is authenticated, route them to either CodingRoom or RoomDashboard
  if (user) {
    return (
      <div className="auth-page-wrapper">
        {currentRoomId ? (
          <YjsProvider roomId={currentRoomId} currentUser={user}>
            <CodingRoom roomId={currentRoomId} onLeaveRoom={() => setCurrentRoomId(null)} />
          </YjsProvider>
        ) : (
          <RoomDashboard 
            onJoinRoom={(roomId) => setCurrentRoomId(roomId)}
            onLogout={handleLogout}
            currentUser={user}
            onUpdateUser={(updatedUser) => setUser(updatedUser)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="auth-page-wrapper">
      <div className="spline-wrapper">
        <spline-viewer url="https://prod.spline.design/hQiAsHIDku6nuTdW/scene.splinecode"></spline-viewer>
      </div>
      
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Education Platform</h1>
            <p className="auth-subtitle">Elevate your live coding education session</p>
          </div>

          <div className="auth-tabs">
            <button
              onClick={() => handleTabChange('login')}
              className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            >
              Sign In
            </button>
            <button
              onClick={() => handleTabChange('signup')}
              className={`tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
            >
              Register
            </button>
          </div>

          {notification && (
            <div className={`notification ${notification.type}`}>
              {notification.message}
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">Email Address</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    id="login-email"
                    className="form-input"
                    value={emailId}
                    onChange={(e) => setEmailId(e.target.value)}
                    required
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="login-password">Password</label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    id="login-password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? <div className="spinner"></div> : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="auth-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="signup-firstname">First Name</label>
                  <input
                    type="text"
                    id="signup-firstname"
                    className="form-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="Jane"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="signup-lastname">Last Name</label>
                  <input
                    type="text"
                    id="signup-lastname"
                    className="form-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signup-email">Email Address</label>
                <input
                  type="email"
                  id="signup-email"
                  className="form-input"
                  value={emailId}
                  onChange={(e) => setEmailId(e.target.value)}
                  required
                  placeholder="name@example.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signup-password">Password</label>
                <input
                  type="password"
                  id="signup-password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Minimum 6 characters"
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? <div className="spinner"></div> : 'Register Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
=======
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import EditorPage from "./components/EditorPage";
import LoginPage from "./components/LoginPage";
import WhiteboardPage from "./components/WhiteboardPage";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route
          path="/editor/:roomId"
          element={
            <ProtectedRoute>
              <EditorPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/whiteboard/:roomId"
          element={
            <ProtectedRoute>
              <WhiteboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
>>>>>>> a9858fce53e89caf6bc22def26bb1f0522c6343f
  );
}

export default App;
