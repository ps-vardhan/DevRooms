import React, { useState, useEffect, useRef } from 'react';
import { Avatar } from '@mui/material';

export default function RoomDashboard({ onJoinRoom, onLogout, currentUser, onUpdateUser }) {
    const [rooms, setRooms] = useState([]);
    const [newRoomName, setNewRoomName] = useState('');
    const [directRoomId, setDirectRoomId] = useState('');
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);

    // Profile Customization Modal States
    const [customizingProfile, setCustomizingProfile] = useState(false);
    const [roomToJoin, setRoomToJoin] = useState(null);
    const [profileFirstName, setProfileFirstName] = useState('');
    const [profileLastName, setProfileLastName] = useState('');
    const [profileAvatarUrl, setProfileAvatarUrl] = useState('');

    const roomNameInputRef = useRef(null);

    const fetchRooms = async () => {
        try {
            const response = await fetch('/api/rooms');
            const data = await response.json();
            if (response.ok) {
                setRooms(data.data || []);
            }
        } catch (err) {
            console.error("Error fetching rooms:", err);
        }
    };

    useEffect(() => {
        fetchRooms();
        const interval = setInterval(fetchRooms, 8000);
        return () => clearInterval(interval);
    }, []);

    // QoL: Auto-focus Session name input
    useEffect(() => {
        if (roomNameInputRef.current) {
            roomNameInputRef.current.focus();
        }
    }, []);

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        const trimmedName = newRoomName.trim();
        
        // Zod-like Frontend Validation (min 5, max 50 characters)
        if (trimmedName.length < 5) {
            setNotification({
                type: 'error',
                message: "Session name is too short. It must be at least 5 characters long."
            });
            return;
        }
        if (trimmedName.length > 50) {
            setNotification({
                type: 'error',
                message: "Session name is too long. It must be under 50 characters."
            });
            return;
        }

        setLoading(true);
        setNotification(null);

        try {
            const response = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: trimmedName })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to create room.");
            }
            setNewRoomName('');
            
            // Intercept create and join to customize profile
            setRoomToJoin(data.data.roomId);
            setProfileFirstName(currentUser.firstName || '');
            setProfileLastName(currentUser.lastName || '');
            setProfileAvatarUrl(currentUser.avatarUrl || '');
            setCustomizingProfile(true);
        } catch (err) {
            setNotification({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleJoinClick = (roomId) => {
        setRoomToJoin(roomId);
        setProfileFirstName(currentUser.firstName || '');
        setProfileLastName(currentUser.lastName || '');
        setProfileAvatarUrl(currentUser.avatarUrl || '');
        setNotification(null);
        setCustomizingProfile(true);
    };

    const handleJoinDirect = (e) => {
        e.preventDefault();
        if (!directRoomId.trim()) return;
        setRoomToJoin(directRoomId.trim());
        setProfileFirstName(currentUser.firstName || '');
        setProfileLastName(currentUser.lastName || '');
        setProfileAvatarUrl(currentUser.avatarUrl || '');
        setNotification(null);
        setCustomizingProfile(true);
    };

    const handleSaveProfileAndJoin = async (e) => {
        e.preventDefault();
        const trimmedFirst = profileFirstName.trim();
        const trimmedLast = profileLastName.trim();

        if (trimmedFirst.length < 2) {
            setNotification({ type: 'error', message: "First name must be at least 2 characters." });
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: trimmedFirst,
                    lastName: trimmedLast,
                    avatarUrl: profileAvatarUrl
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to update profile.");
            }

            if (onUpdateUser) {
                onUpdateUser(data.data);
            }

            setCustomizingProfile(false);
            onJoinRoom(roomToJoin);
        } catch (err) {
            setNotification({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRoom = async (roomId) => {
        if (!window.confirm("Are you sure you want to delete this room?")) return;
        try {
            const response = await fetch(`/api/rooms/${roomId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (response.ok) {
                setNotification({ type: 'success', message: "Room deleted successfully." });
                fetchRooms();
            } else {
                throw new Error(data.message || "Failed to delete room.");
            }
        } catch (err) {
            setNotification({ type: 'error', message: err.message });
        }
    };

    // Calculate active session counts
    const activeSessionCount = rooms.filter(room => room.status !== 'finished').length;

    // Helper to extract initials for avatar
    const getInitials = (user) => {
        if (!user) return 'U';
        const first = user.firstName ? user.firstName[0].toUpperCase() : '';
        const last = user.lastName ? user.lastName[0].toUpperCase() : '';
        return first + last || first || 'U';
    };

    // Helper to format ISO time
    const formatTime = (isoString) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="devroom-dashboard" style={{ width: '100%', maxWidth: '1080px', margin: '0 auto', padding: '30px 20px', boxSizing: 'border-box' }}>
            
            {/* Top Navigation Bar */}
            <div className="devroom-navbar" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '40px',
                paddingBottom: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#c084fc' }}></span>
                    <span style={{ fontSize: '20px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' }}>DevRoom</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        padding: '6px 16px 6px 6px',
                        borderRadius: '30px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                        <Avatar 
                            src={currentUser.avatarUrl} 
                            alt={currentUser.firstName}
                            sx={{ 
                                width: 28, 
                                height: 28, 
                                fontSize: '11px', 
                                fontWeight: '700', 
                                bgcolor: '#7c3aed',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                        >
                            {getInitials(currentUser)}
                        </Avatar>
                        <span style={{ fontSize: '13.5px', color: '#fff', fontWeight: '500' }}>
                            {currentUser.firstName} {currentUser.lastName || ''}
                        </span>
                    </div>
                    <button onClick={onLogout} className="navbar-logout-btn" style={{
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '30px',
                        padding: '7px 18px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}>
                        Log out
                    </button>
                </div>
            </div>

            {/* Sub-Header Area */}
            <div className="devroom-intro" style={{ textAlign: 'left', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '38px', fontWeight: '700', color: '#fff', margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>
                    DevRoom
                </h1>
                <p style={{ fontSize: '15px', color: '#9CA3AF', margin: '0 0 20px 0' }}>
                    Step into a live session. Code together, learn faster.
                </p>
                
                {/* Active Sessions Badge with CSS Live Pulse */}
                <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(16, 185, 129, 0.08)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.15)',
                        borderRadius: '20px',
                        padding: '5px 14px',
                        fontSize: '12px',
                        fontWeight: '600'
                    }}>
                        <span className="pulse-indicator"></span>
                        {activeSessionCount} active {activeSessionCount === 1 ? 'session' : 'sessions'}
                    </span>
                </div>
            </div>

            {notification && (
                <div className={`notification ${notification.type}`} style={{ marginBottom: '24px', textAlign: 'left' }}>
                    {notification.message}
                </div>
            )}

            {/* Two-Column Workspace Layout */}
            <div className="dashboard-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.9fr', gap: '28px', alignItems: 'start' }}>
                
                {/* Left Column: Create & Join Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Create Room Card */}
                    <div className="devroom-card" style={{ padding: '28px', textAlign: 'left' }}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: '800', background: 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                            CREATE
                        </h4>
                        <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div className="form-group" style={{ gap: '8px' }}>
                                <label className="form-label" style={{ fontSize: '13px', color: '#9ca3af', fontWeight: '500' }}>Session name</label>
                                <input
                                    ref={roomNameInputRef}
                                    type="text"
                                    className="form-input"
                                    style={{
                                        background: 'rgba(0, 0, 0, 0.2)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: '#fff',
                                        fontSize: '14.5px',
                                        padding: '12px 14px'
                                    }}
                                    value={newRoomName}
                                    onChange={(e) => setNewRoomName(e.target.value)}
                                    required
                                    placeholder="e.g. Algorithms"
                                />
                            </div>
                            <button type="submit" className="submit-btn" disabled={loading} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                fontSize: '14.5px',
                                padding: '12px 0',
                                borderRadius: '12px',
                                width: '100%',
                                cursor: 'pointer',
                                border: 'none',
                                boxShadow: '0 4px 15px rgba(170, 59, 255, 0.25)'
                            }}>
                                {loading ? <div className="spinner"></div> : '+ Create room'}
                            </button>
                        </form>
                    </div>

                    {/* Join with ID Card */}
                    <div className="devroom-card" style={{ padding: '28px', textAlign: 'left' }}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: '800', background: 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                            JOIN
                        </h4>
                        <form onSubmit={handleJoinDirect} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div className="form-group" style={{ gap: '8px' }}>
                                <label className="form-label" style={{ fontSize: '13px', color: '#9ca3af', fontWeight: '500' }}>Room ID</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    style={{
                                        background: 'rgba(0, 0, 0, 0.2)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: '#fff',
                                        fontSize: '14.5px',
                                        padding: '12px 14px'
                                    }}
                                    value={directRoomId}
                                    onChange={(e) => setDirectRoomId(e.target.value)}
                                    required
                                    placeholder="Paste room ID here"
                                />
                            </div>
                            <button type="submit" className="submit-btn" style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                fontSize: '14.5px',
                                padding: '12px 0',
                                borderRadius: '12px',
                                width: '100%',
                                cursor: 'pointer',
                                border: 'none',
                                boxShadow: '0 4px 15px rgba(170, 59, 255, 0.25)'
                            }}>
                                ➔ Join session
                            </button>
                        </form>
                    </div>

                </div>

                {/* Right Column: Sessions Card */}
                <div className="devroom-card" style={{
                    padding: '28px',
                    minHeight: '410px',
                    display: 'flex',
                    flexDirection: 'column',
                    textAlign: 'left'
                }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', background: 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                            SESSIONS
                        </h4>
                        <button onClick={fetchRooms} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                            </svg>
                        </button>
                    </div>

                    {/* Room list layout */}
                    {rooms.length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', gap: '16px', padding: '40px 0' }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.25, color: '#c084fc' }}>
                                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                                <path d="m10 13 2 2 4-4" />
                            </svg>
                            <div style={{ textAlign: 'center' }}>
                                <span style={{ fontSize: '14.5px', fontWeight: '600', color: '#f3f4f6', display: 'block', marginBottom: '4px' }}>No active rooms yet</span>
                                <span style={{ fontSize: '13px', color: '#9ca3af' }}>Create a session to begin live coding.</span>
                            </div>
                        </div>
                    ) : (
                        <div className="rooms-list-scroll" style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
                            {rooms.map(room => {
                                const isUserHost = room.hostId && currentUser && room.hostId._id === currentUser._id;
                                return (
                                    <div key={room.roomId} className="room-item-row" style={{
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center', 
                                        padding: '16px 20px', 
                                        background: 'rgba(255, 255, 255, 0.02)', 
                                        borderRadius: '12px', 
                                        border: room.status !== 'finished' ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(255, 255, 255, 0.05)',
                                        transition: 'all 0.2s ease',
                                        boxSizing: 'border-box'
                                    }}>
                                        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <div style={{ fontWeight: '600', color: '#fff', fontSize: '15px' }}>
                                                {room.name}
                                            </div>
                                            
                                            <div style={{ fontSize: '12.5px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                {/* Small Avatar icon */}
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                                                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                                    <circle cx="12" cy="7" r="4" />
                                                </svg>
                                                <span>{room.hostId ? room.hostId.firstName : 'Unknown'}</span>
                                                <span style={{ opacity: 0.3 }}>•</span>
                                                {room.status === 'finished' ? (
                                                    <span>Ended {formatTime(room.updatedAt)}</span>
                                                ) : (
                                                    <span>Started {formatTime(room.createdAt)}</span>
                                                )}
                                                
                                                {/* Finished Badge Stats */}
                                                {room.status === 'finished' && (
                                                    <>
                                                        <span style={{ opacity: 0.3 }}>•</span>
                                                        <span style={{
                                                            fontSize: '11px',
                                                            background: 'rgba(192, 132, 252, 0.1)',
                                                            color: '#c084fc',
                                                            padding: '2px 8px',
                                                            borderRadius: '4px',
                                                            fontWeight: '600'
                                                        }}>
                                                            {(room.sessionMetadata && room.sessionMetadata.language) || 'JavaScript'}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action buttons on right */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {room.status === 'finished' ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{
                                                        fontSize: '11px',
                                                        color: '#9ca3af',
                                                        background: 'rgba(255, 255, 255, 0.06)',
                                                        padding: '4px 10px',
                                                        borderRadius: '6px',
                                                        fontWeight: '600'
                                                    }}>
                                                        Finished
                                                    </span>

                                                    {/* Hover Trash Button for Host */}
                                                    {isUserHost && (
                                                        <button 
                                                            onClick={() => handleDeleteRoom(room.roomId)}
                                                            className="delete-room-btn"
                                                            title="Delete Room"
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                padding: '6px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M3 6h18" />
                                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => handleJoinClick(room.roomId)}
                                                    className="join-session-btn"
                                                    style={{
                                                        background: 'rgba(16, 185, 129, 0.08)',
                                                        border: '1px solid rgba(16, 185, 129, 0.25)',
                                                        borderRadius: '8px',
                                                        padding: '6px 14px',
                                                        color: '#10b981',
                                                        fontSize: '12px',
                                                        fontWeight: '700',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    <span>▷</span> Live
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Profile Customization Glassmorphic Overlay Modal */}
            {customizingProfile && (
                <div className="customization-modal-overlay">
                    <div className="customization-modal-content devroom-card">
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', textAlign: 'center' }}>
                            Customize Your Profile
                        </h3>

                        {notification && (
                            <div className={`notification ${notification.type}`} style={{ marginBottom: '16px' }}>
                                {notification.message}
                            </div>
                        )}
                        
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                            <Avatar 
                                src={profileAvatarUrl} 
                                alt={profileFirstName}
                                sx={{ 
                                    width: 80, 
                                    height: 80, 
                                    fontSize: '32px', 
                                    fontWeight: '700', 
                                    bgcolor: '#7c3aed',
                                    border: '2px solid rgba(255, 255, 255, 0.2)',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
                                }}
                            >
                                {getInitials({ firstName: profileFirstName, lastName: profileLastName })}
                            </Avatar>
                            
                            <span style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center' }}>
                                Preview your avatar appearance in this session
                            </span>
                        </div>

                        <form onSubmit={handleSaveProfileAndJoin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontSize: '13px', color: '#9ca3af' }}>First Name</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    value={profileFirstName}
                                    onChange={(e) => setProfileFirstName(e.target.value)}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label" style={{ fontSize: '13px', color: '#9ca3af' }}>Last Name</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    value={profileLastName}
                                    onChange={(e) => setProfileLastName(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ fontSize: '13px', color: '#9ca3af' }}>Profile Photo URL</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="https://example.com/avatar.jpg"
                                    value={profileAvatarUrl}
                                    onChange={(e) => setProfileAvatarUrl(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ fontSize: '13px', color: '#9ca3af' }}>Or Upload File</label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    className="form-input"
                                    style={{ fontSize: '13px', padding: '8px' }}
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setProfileAvatarUrl(reader.result); // Base64 encoding
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setCustomizingProfile(false)}
                                    style={{
                                        flex: 1,
                                        background: 'transparent',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        color: '#fff',
                                        padding: '12px 0',
                                        borderRadius: '12px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                
                                <button 
                                    type="submit" 
                                    className="submit-btn" 
                                    style={{ 
                                        flex: 1, 
                                        margin: 0, 
                                        padding: '12px 0', 
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 4px 15px rgba(170, 59, 255, 0.25)' 
                                    }}
                                >
                                    Save & Join
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
