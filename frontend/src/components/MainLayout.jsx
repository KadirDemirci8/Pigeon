
import './MainLayout.css'
import './NotificationBadge.css'
import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { NavLink, useLocation } from 'react-router-dom'
import { House, Compass, Bell, Bookmark, UserRound } from 'lucide-react'
import RightPanel from './RightPanel'
import MobileNav from './MobileNav'
import { API_BASE } from '../services/apiClient'

const API_URL = API_BASE

function MainLayout({ children, onPostClick }) {
    const [unreadCount, setUnreadCount] = useState(0)
    const location = useLocation()

    const refreshUnreadCount = useCallback(async () => {
        const token = sessionStorage.getItem('userId')

        if (!token) {
            setUnreadCount(0)
            return
        }

        try {
            const response = await axios.get(
                `${API_URL}/api/notifications/unread-count`,
                {
                    headers: {

                    }
                }
            )

            setUnreadCount(
                Math.max(0, Number(response.data.count) || 0)
            )
        } catch (error) {
            if (error.response?.status === 401) {
                setUnreadCount(0)
            } else {
                console.error(
                    'Could not load unread notification count:',
                    error
                )
            }
        }
    }, [])

    useEffect(() => {
        refreshUnreadCount()

        const onVisible = () => {
            if (document.visibilityState === 'visible') {
                refreshUnreadCount()
            }
        }

        const intervalId = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                refreshUnreadCount()
            }
        }, 30000)

        window.addEventListener(
            'pigeon:notifications-changed',
            refreshUnreadCount
        )
        window.addEventListener('focus', refreshUnreadCount)
        document.addEventListener('visibilitychange', onVisible)

        return () => {
            window.clearInterval(intervalId)
            window.removeEventListener(
                'pigeon:notifications-changed',
                refreshUnreadCount
            )
            window.removeEventListener('focus', refreshUnreadCount)
            document.removeEventListener('visibilitychange', onVisible)
        }
    }, [refreshUnreadCount])

    useEffect(() => {
        refreshUnreadCount()
    }, [location.pathname, refreshUnreadCount])

    return (
        <div className="main-layout">
            <aside className="left-sidebar">
                <img
                    src="/pigeon-logo-transparent.png"
                    alt="Pigeon Logo"
                    className="pigeon-logo"
                />

                <nav className="sidebar-nav">
                    <NavLink to="/home">
                        <House size={22} />
                        <span>Home</span>
                    </NavLink>

                    <NavLink to="/explore">
                        <Compass size={22} />
                        <span>Explore</span>
                    </NavLink>

                    <NavLink to="/notifications">
                        <span className="notification-bell-wrap">
                            <Bell size={22} />

                            {unreadCount > 0 && (
                                <span
                                    className="notification-sidebar-badge"
                                    aria-label={`${unreadCount} unread notifications`}
                                >
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </span>

                        <span>Notifications</span>
                    </NavLink>

                    <NavLink to="/bookmarks">
                        <Bookmark size={22} />
                        <span>Bookmarks</span>
                    </NavLink>

                    <NavLink
                        to={`/profile/${sessionStorage.getItem('username')}`}
                    >
                        <UserRound size={22} />
                        <span>Profile</span>
                    </NavLink>
                </nav>

                <button
                    type="button"
                    className="sidebar-post-button"
                    onClick={onPostClick}
                    disabled={!onPostClick}
                >
                    Post
                </button>
            </aside>

            <main className="main-content">
                {children}
            </main>

            <aside className="right-sidebar">
                <RightPanel />
            </aside>

            <MobileNav unreadCount={unreadCount} />
        </div>
    )
}

export default MainLayout
