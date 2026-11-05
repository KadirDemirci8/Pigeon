import './MainLayout.css'
import { NavLink } from 'react-router-dom'
import { House, Compass, Bell, Bookmark, UserRound } from 'lucide-react'

function MainLayout({ children }) {
    return (
        <div className="main-layout">
            <aside className="left-sidebar">
                <img
                        src="/pigeon-logo.png"
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
                        <Bell size={22} />
                        <span>Notifications</span>
                    </NavLink>

                    <NavLink to="/bookmarks">
                        <Bookmark size={22} />
                        <span>Bookmarks</span>
                    </NavLink>

                    <NavLink to="/profile">
                        <UserRound size={22} />
                        <span>Profile</span>
                    </NavLink>
                </nav>

                <button className="sidebar-post-button">
                    Post
                </button>
            </aside>

            <main className="main-content">
                {children}
            </main>

            <aside className="right-sidebar">
                <p>Search & Suggestions</p>
            </aside>
        </div>
    )   
}

export default MainLayout