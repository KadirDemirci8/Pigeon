
import { useEffect, useState } from 'react'
import axios from 'axios'
import MainLayout from '../components/MainLayout'
import { useNavigate } from 'react-router-dom'
import './Notifications.css'
import { API_BASE } from '../services/apiClient'

function formatNotificationTime(dateString) {
    const utcDate = /(?:Z|[+-]\d{2}:\d{2})$/i.test(dateString)
        ? dateString
        : `${dateString}Z`

    const date = new Date(utcDate)
    const seconds = Math.floor(
        (Date.now() - date.getTime()) / 1000
    )

    if (Number.isNaN(seconds)) return ''

    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    })
}

function Notifications() {
    const [activeTab, setActiveTab] = useState('all')
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [followStatuses, setFollowStatuses] = useState({})
    const [followLoadingId, setFollowLoadingId] = useState(null)

    const navigate = useNavigate()

    // MARK ALL AS READ
    const handleMarkAllAsRead = async () => {
        try {
            const token = sessionStorage.getItem('userId')

            await axios.patch(
                `${API_BASE}/api/notifications/read-all`,
                {},
                {
                    headers: {

                    }
                }
            )

            setNotifications(prev =>
                activeTab === 'unread'
                    ? []
                    : prev.map(n => ({
                        ...n,
                        isRead: true
                    }))
            )

            window.dispatchEvent(
                new Event('pigeon:notifications-changed')
            )

        } catch (error) {
            console.error('Failed to mark all as read:', error)
            setError('Could not mark notifications as read.')
        }
    }

    // FOLLOW BACK
    const handleFollowBack = async (e, actorId) => {
        e.stopPropagation()

        if (followLoadingId !== null) return
        if (followStatuses[actorId] !== false) return

        setFollowLoadingId(actorId)

        try {
            const token = sessionStorage.getItem('userId')

            await axios.post(
                `${API_BASE}/api/follows/${actorId}`,
                {},
                {
                    headers: {

                    }
                }
            )

            setFollowStatuses(prev => ({
                ...prev,
                [actorId]: true
            }))

        } catch (error) {
            console.error('Failed to follow user:', error)
            alert('Could not follow user. Please try again.')
        } finally {
            setFollowLoadingId(null)
        }
    }

    // NOTIFICATION CLICK
    const handleNotificationClick = async (notification) => {
        try {
            const token = sessionStorage.getItem('userId')

            if (!notification.isRead) {
                await axios.patch(
                    `${API_BASE}/api/notifications/${notification.id}/read`,
                    {},
                    {
                        headers: {

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

                window.dispatchEvent(
                    new Event('pigeon:notifications-changed')
                )
            }

            if (notification.type === 'Follow') {
                navigate(
                    `/profile/${notification.actorUsername}`
                )
            } else if (notification.postId != null) {
                navigate(
                    `/posts/${notification.postId}`,
                    {
                        state: {
                            openComments:
                                notification.type === 'Comment' ||
                                notification.type === 'Reply',
                            commentId:
                                notification.commentId ?? null
                        }
                    }
                )
            } else {
                navigate('/home')
            }

        } catch (error) {
            console.error(
                'Failed to open notification:',
                error
            )
            setError(
                'Could not open notification. Please try again.'
            )
        }
    }

    // FETCH NOTIFICATIONS
    useEffect(() => {
        let cancelled = false

        const fetchNotifications = async () => {
            setLoading(true)
            setError('')

            try {
                const token = sessionStorage.getItem('userId')

                const response = await axios.get(
                    `${API_BASE}/api/notifications`,
                    {
                        params: {
                            unreadOnly: activeTab === 'unread'
                        },
                        headers: {

                        }
                    }
                )

                if (!cancelled) {
                    setNotifications(response.data)
                }

            } catch (err) {
                if (!cancelled) {
                    console.error(
                        'Failed to load notifications:',
                        err
                    )
                    setError(
                        'Could not load notifications.'
                    )
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

    // FETCH FOLLOW STATUSES
    useEffect(() => {
        const actorIds = [
            ...new Set(
                notifications
                    .filter(n => n.type === 'Follow')
                    .map(n => n.actorId)
            )
        ]

        if (actorIds.length === 0) return

        let cancelled = false

        const fetchFollowStatuses = async () => {
            const token = sessionStorage.getItem('userId')

            const results = await Promise.allSettled(
                actorIds.map(async actorId => {
                    const response = await axios.get(
                        `${API_BASE}/api/follows/${actorId}/status`,
                        {
                            headers: {

                            }
                        }
                    )

                    return {
                        actorId,
                        isFollowing:
                            response.data.isFollowing
                    }
                })
            )

            if (cancelled) return

            const statuses = {}

            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    statuses[result.value.actorId] =
                        result.value.isFollowing
                } else {
                    console.error(
                        'Failed to load follow status:',
                        result.reason
                    )
                }
            })

            setFollowStatuses(prev => ({
                ...prev,
                ...statuses
            }))
        }

        fetchFollowStatuses()

        return () => {
            cancelled = true
        }
    }, [notifications])

    return (
        <MainLayout>
            <div className="notifications-page">
                <h1>Notifications</h1>
                <p>Stay up to date with your activity.</p>

                <div className="notifications-tabs">
                    <button
                        className={
                            activeTab === 'all' ? 'active' : ''
                        }
                        onClick={() => setActiveTab('all')}
                    >
                        All
                    </button>

                    <button
                        className={
                            activeTab === 'unread' ? 'active' : ''
                        }
                        onClick={() => setActiveTab('unread')}
                    >
                        Unread
                    </button>

                    <button
                        className="notifications-mark-all"
                        onClick={handleMarkAllAsRead}
                    >
                        Mark all as read
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
                                    Comment: 'commented on your post.',
                                    Reply: 'replied to your comment.'
                                }

                                const typeIcon = {
                                    Follow: '👤',
                                    Like: '❤️',
                                    Comment: '💬',
                                    Reply: '↩️'
                                }

                                return (
                                    <div
                                        key={notification.id}
                                        className={`notification-card ${
                                            !notification.isRead
                                                ? 'unread'
                                                : ''
                                        }`}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() =>
                                            handleNotificationClick(
                                                notification
                                            )
                                        }
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === 'Enter' ||
                                                e.key === ' '
                                            ) {
                                                e.preventDefault()
                                                handleNotificationClick(
                                                    notification
                                                )
                                            }
                                        }}
                                    >
                                        <div className="notification-avatar">
                                            {notification.actorProfileImageUrl ? (
                                                <img
                                                    src={`${API_BASE}${notification.actorProfileImageUrl}`}
                                                    alt={displayName}
                                                />
                                            ) : (
                                                <span>
                                                    {displayName
                                                        ?.charAt(0)
                                                        .toUpperCase()}
                                                </span>
                                            )}
                                        </div>

                                        <div className="notification-content">
                                            <p>
                                                <strong>
                                                    {displayName}
                                                </strong>{' '}
                                                {notificationText[
                                                    notification.type
                                                ] ||
                                                    'interacted with you.'}
                                            </p>

                                            <span className="notification-time">
                                                {formatNotificationTime(
                                                    notification.createdAt
                                                )}
                                            </span>
                                        </div>

                                        {notification.type === 'Follow' ? (
                                            <div className="notification-follow-action">
                                                {followStatuses[
                                                    notification.actorId
                                                ] === undefined ? (
                                                    <span className="notification-follow-loading">
                                                        Loading...
                                                    </span>
                                                ) : followStatuses[
                                                    notification.actorId
                                                ] ? (
                                                    <button
                                                        type="button"
                                                        className="notification-follow-button following"
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        onKeyDown={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        disabled
                                                    >
                                                        Following
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="notification-follow-button"
                                                        onClick={(e) =>
                                                            handleFollowBack(
                                                                e,
                                                                notification.actorId
                                                            )
                                                        }
                                                        onKeyDown={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        disabled={
                                                            followLoadingId !== null
                                                        }
                                                    >
                                                        {followLoadingId ===
                                                        notification.actorId
                                                            ? 'Following...'
                                                            : 'Follow Back'}
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="notification-action-icon">
                                                {typeIcon[
                                                    notification.type
                                                ] || '🔔'}
                                            </div>
                                        )}

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
