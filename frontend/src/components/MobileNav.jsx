
import { NavLink } from 'react-router-dom'
import {
    House,
    Compass,
    Bell,
    Bookmark,
    UserRound
} from 'lucide-react'

import './MobileNav.css'
import './NotificationBadge.css'

function MobileNav({ unreadCount = 0 }) {
    return (
        <nav className="mobile-nav">
            <NavLink to="/home" aria-label="Home">
                <House size={23} />
            </NavLink>

            <NavLink to="/explore" aria-label="Explore">
                <Compass size={23} />
            </NavLink>

            <NavLink
                to="/notifications"
                aria-label={
                    unreadCount > 0
                        ? `Notifications, ${unreadCount} unread`
                        : 'Notifications'
                }
            >
                <span className="notification-bell-wrap">
                    <Bell size={23} />

                    {unreadCount > 0 && (
                        <span
                            className="notification-sidebar-badge"
                            aria-hidden="true"
                        >
                            {unreadCount > 99
                                ? '99+'
                                : unreadCount}
                        </span>
                    )}
                </span>
            </NavLink>

            <NavLink to="/bookmarks" aria-label="Bookmarks">
                <Bookmark size={23} />
            </NavLink>

            <NavLink
                to={`/profile/${sessionStorage.getItem('username')}`}
                aria-label="Profile"
            >
                <UserRound size={23} />
            </NavLink>
        </nav>
    )
}

export default MobileNav
