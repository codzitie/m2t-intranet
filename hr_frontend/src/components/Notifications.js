import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { LeaveService } from '../services/mockLeaveService';

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
      const mockNotifications = [];

      // Get employee's own leave updates
      const historyResponse = await LeaveService.getLeaveHistory(user.id);
      if (historyResponse.success) {
        historyResponse.data.forEach((leave) => {
          if (leave.status === 'Approved') {
            mockNotifications.push({
              id: `notif-${leave.id}`,
              type: 'leave_approved',
              message: `Your ${leave.leaveType} (${leave.startDate} to ${leave.endDate}) was approved`,
              timestamp: leave.approvedOn || leave.appliedOn,
              read: false,
            });
          } else if (leave.status === 'Rejected') {
            mockNotifications.push({
              id: `notif-${leave.id}`,
              type: 'leave_rejected',
              message: `Your ${leave.leaveType} (${leave.startDate} to ${leave.endDate}) was rejected`,
              timestamp: leave.approvedOn || leave.appliedOn,
              read: false,
            });
          }
        });
      }

      // If supervisor, get pending approval notifications
      if (user.permissions.includes('approve_team_leaves')) {
        const approvalsResponse = await LeaveService.getPendingApprovals(user.id);
        if (approvalsResponse.success) {
          approvalsResponse.data.forEach((leave) => {
            mockNotifications.push({
              id: `notif-pending-${leave.id}`,
              type: 'pending_approval',
              message: `${leave.employeeName} requested ${leave.leaveType} (${leave.startDate} to ${leave.endDate})`,
              timestamp: leave.appliedOn,
              read: false,
            });
          });
        }
      }

      // Sort by timestamp (most recent first)
      mockNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Limit to 10 most recent
      const recentNotifications = mockNotifications.slice(0, 10);
      
      setNotifications(recentNotifications);
      setUnreadCount(recentNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = (notificationId, event) => {
    event.stopPropagation(); // Prevent the click from triggering navigation
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    setUnreadCount(prev => {
      const deletedNotif = notifications.find(n => n.id === notificationId);
      return deletedNotif && !deletedNotif.read ? Math.max(0, prev - 1) : prev;
    });
  };

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);
    setShowDropdown(false);
    
    // Navigate based on notification type
    if (notif.type === 'pending_approval') {
      // For supervisors - go to leave page
      navigate('/leave');
    } else if (notif.type === 'leave_approved' || notif.type === 'leave_rejected') {
      // For employees - go to leave page
      navigate('/leave');
    }
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
                style={notificationItemStyle(notif.read)}
                onClick={() => handleNotificationClick(notif)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = notif.read ? 'white' : '#f9fafb';
                }}
              >
                <div style={notificationContentStyle}>
                  <div style={iconStyle(notif.type)}>
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div style={messageStyle}>
                    <div style={messageTextStyle}>{notif.message}</div>
                    <div style={timestampStyle}>{notif.timestamp}</div>
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
