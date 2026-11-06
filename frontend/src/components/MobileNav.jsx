import { NavLink } from 'react-router-dom'
import { House, Compass, Bell, Bookmark, UserRound } from 'lucide-react'
import './MobileNav.css'

function MobileNav() {
    return (
        <nav className="mobile-nav">
            <NavLink to="/home" aria-label="Home">
                <House size={23} />
            </NavLink>

            <NavLink to="/explore" aria-label="Explore">
                <Compass size={23} />
            </NavLink>

            <NavLink to="/notifications" aria-label="Notifications">
                <Bell size={23} />
            </NavLink>

            <NavLink to="/bookmarks" aria-label="Bookmarks">
                <Bookmark size={23} />
            </NavLink>

            <NavLink to="/profile" aria-label="Profile">
                <UserRound size={23} />
            </NavLink>
        </nav>
    )
}

export default MobileNav