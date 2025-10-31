import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import * as api from '../services/api';

function Notifications() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await api.getNotifications();
      if (response) {
        const notifs = response.notifications || [];
        setNotifications(notifs);
        setUnreadCount(response.unread_count || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.markNotificationRead(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = () => {
    notifications.forEach(notif => {
      if (!notif.is_read) {
        markAsRead(notif.id);
      }
    });
  };

  const deleteNotification = (notificationId, event) => {
    event.stopPropagation();
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    const deletedNotif = notifications.find(n => n.id === notificationId);
    if (deletedNotif && !deletedNotif.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
    setShowDropdown(false);
    
    // Navigate based on notification type
    navigate('/leave');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'leave_approved':
        return '✅';
      case 'leave_rejected':
        return '❌';
      case 'pending_approval':
        return '⏰';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'leave_approved':
        return '#D1FAE5';
      case 'leave_rejected':
        return '#FEE2E2';
      case 'pending_approval':
        return '#FEF3C7';
      default:
        return '#E5E7EB';
    }
  };

  // Styles
  const containerStyle = {
    position: 'relative',
  };

  const bellButtonStyle = {
    position: 'relative',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '50%',
    transition: 'background-color 0.3s ease',
  };

  const badgeStyle = {
    position: 'absolute',
    top: '2px',
    right: '2px',
    backgroundColor: '#EF4444',
    color: 'white',
    borderRadius: '10px',
    padding: '2px 6px',
    fontSize: '11px',
    fontWeight: '600',
    minWidth: '18px',
    textAlign: 'center',
  };

  const dropdownStyle = {
    position: 'absolute',
    top: '45px',
    right: '0',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
    width: '380px',
    maxHeight: '500px',
    overflowY: 'auto',
    zIndex: 1000,
  };

  const dropdownHeaderStyle = {
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    backgroundColor: 'white',
    zIndex: 1,
  };

  const headerTitleStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  };

  const markAllButtonStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#004aad',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '4px 8px',
  };

  const notificationItemStyle = (isRead) => ({
    padding: '16px',
    borderBottom: '1px solid #f3f4f6',
    cursor: 'pointer',
    backgroundColor: isRead ? 'white' : '#f9fafb',
    transition: 'background-color 0.2s ease',
  });

  const notificationContentStyle = {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  };

  const iconStyle = (type) => ({
    fontSize: '24px',
    flexShrink: 0,
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: getNotificationColor(type),
  });

  const messageStyle = {
    flex: 1,
  };

  const messageTextStyle = {
    fontSize: '14px',
    color: '#333',
    marginBottom: '4px',
    lineHeight: '1.4',
  };

  const timestampStyle = {
    fontSize: '12px',
    color: '#888',
  };

  const emptyStateStyle = {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#9CA3AF',
  };

  if (!user) return null;

  return (
    <div style={containerStyle} ref={dropdownRef}>
      <button
        style={bellButtonStyle}
        onClick={() => setShowDropdown(!showDropdown)}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        🔔
        {unreadCount > 0 && <span style={badgeStyle}>{unreadCount}</span>}
      </button>

      {showDropdown && (
        <div style={dropdownStyle}>
          <div style={dropdownHeaderStyle}>
            <div style={headerTitleStyle}>Notifications</div>
            {unreadCount > 0 && (
              <button style={markAllButtonStyle} onClick={markAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔕</div>
              <p style={{ fontSize: '14px' }}>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                style={notificationItemStyle(notif.is_read)}
                onClick={() => handleNotificationClick(notif)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = notif.is_read ? 'white' : '#f9fafb';
                }}
              >
                <div style={notificationContentStyle}>
                  <div style={iconStyle(notif.type)}>
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div style={messageStyle}>
                    <div style={messageTextStyle}>{notif.message}</div>
                    <div style={timestampStyle}>{notif.created_at}</div>
                  </div>
                  <button
                    onClick={(e) => deleteNotification(notif.id, e)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#9CA3AF',
                      fontSize: '18px',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      flexShrink: 0,
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#EF4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#9CA3AF';
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Notifications;
