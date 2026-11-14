
import { useEffect, useState } from 'react'
import axios from 'axios'
import MainLayout from '../components/MainLayout'
import './Notifications.css'
import { useNavigate } from 'react-router-dom'

function Notifications() {
    const [activeTab, setActiveTab] = useState('all')
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')


const navigate = useNavigate()

const handleNotificationClick = async (notification) => {
    try {
        const token = sessionStorage.getItem('accessToken')

        if (!notification.isRead) {
            await axios.patch(
                `https://localhost:7151/api/notifications/${notification.id}/read`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            setNotifications(prev =>
                prev.map(n =>
                    n.id === notification.id
                        ? { ...n, isRead: true }
                        : n
                )
            )
        }

        if (notification.type === 'Follow') {
            navigate(`/profile/${notification.actorUsername}`)
        } else {
            navigate('/home')
        }
    } catch (error) {
        console.error('Failed to open notification:', error)
        setError('Could not open notification. Please try again.')
    }
}


    useEffect(() => {
        let cancelled = false

        const fetchNotifications = async () => {
            setLoading(true)
            setError('')

            try {
                const token = sessionStorage.getItem('accessToken')

                const response = await axios.get(
                    'https://localhost:7151/api/notifications',
                    {
                        params: {
                            unreadOnly: activeTab === 'unread'
                        },
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                )

                if (!cancelled) {
                    setNotifications(response.data)
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('Failed to load notifications:', err)
                    setError('Could not load notifications.')
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        fetchNotifications()

        return () => {
            cancelled = true
        }
    }, [activeTab])

    return (
        <MainLayout>
            <div className="notifications-page">
                <h1>Notifications</h1>
                <p>Stay up to date with your activity.</p>

                <div className="notifications-tabs">
                    <button
                        className={activeTab === 'all' ? 'active' : ''}
                        onClick={() => setActiveTab('all')}
                    >
                        All
                    </button>

                    <button
                        className={activeTab === 'unread' ? 'active' : ''}
                        onClick={() => setActiveTab('unread')}
                    >
                        Unread
                    </button>
                </div>

                <div className="notifications-list">
                    {loading ? (
                        <p>Loading notifications...</p>
                    ) : error ? (
                        <p>{error}</p>
                    ) : notifications.length === 0 ? (
                        <p>No notifications found.</p>
                    ) : (
                        
<div className="notification-cards">
    {notifications.map(notification => {
        const displayName =
            notification.actorDisplayName ||
            notification.actorUsername

        const notificationText = {
            Follow: 'started following you.',
            Like: 'liked your post.',
            Comment: 'commented on your post.'
        }

        const typeIcon = {
            Follow: '👤',
            Like: '❤️',
            Comment: '💬'
        }

        return (
            
                <div
                    key={notification.id}
                    className={`notification-card ${
                        !notification.isRead ? 'unread' : ''
                    }`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNotificationClick(notification)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleNotificationClick(notification)
                        }
                    }}
                >

                <div className="notification-avatar">
                    {notification.actorProfileImageUrl ? (
                        <img
                            src={`https://localhost:7151${notification.actorProfileImageUrl}`}
                            alt={displayName}
                        />
                    ) : (
                        <span>
                            {displayName?.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>

                <div className="notification-content">
                    <p>
                        <strong>{displayName}</strong>{' '}
                        {notificationText[notification.type] ||
                            'interacted with you.'}
                    </p>

                    <span className="notification-time">
                        {new Date(notification.createdAt)
                            .toLocaleString()}
                    </span>
                </div>

                <div className="notification-action-icon">
                    {typeIcon[notification.type] || '🔔'}
                </div>

                {!notification.isRead && (
                    <span className="notification-unread-dot" />
                )}
                    </div>
                     )
                })}
            </div>

                    )}
                </div>
            </div>
        </MainLayout>
    )
}

export default Notifications
