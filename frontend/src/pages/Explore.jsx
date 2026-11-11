
import { useEffect, useState } from 'react'
import { Search, Users, MessageCircle } from 'lucide-react'
import MainLayout from '../components/MainLayout'
import './Explore.css'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function Explore() {
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [activeTab, setActiveTab] = useState('all')
    const [users, setUsers] = useState([])
    const [usersLoading, setUsersLoading] = useState(true)
    const [usersError, setUsersError] = useState('')



useEffect(() => {
    const fetchUsers = async () => {
        setUsersLoading(true)
        setUsersError('')

        try {
            const response = await axios.get(
                'https://localhost:7151/api/users/search?limit=4'
            )

            setUsers(response.data)
        } catch (error) {
            console.error('Failed to load users:', error)
            setUsersError('Could not load users.')
        } finally {
            setUsersLoading(false)
        }
    }

    fetchUsers()
}, [])


    return (
        <MainLayout>
            <div className="explore-page">
                <h1>Explore</h1>
                <p>Discover people and posts on Pigeon.</p>

                <div className="explore-search">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search people or posts..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="explore-tabs">
                    <button
                        type="button"
                        className={activeTab === 'all' ? 'active' : ''}
                        onClick={() => setActiveTab('all')}
                    >
                        All
                    </button>

                    <button
                        type="button"
                        className={activeTab === 'people' ? 'active' : ''}
                        onClick={() => setActiveTab('people')}
                    >
                        <Users size={17} />
                        People
                    </button>

                    <button
                        type="button"
                        className={activeTab === 'posts' ? 'active' : ''}
                        onClick={() => setActiveTab('posts')}
                    >
                        <MessageCircle size={17} />
                        Posts
                    </button>
                </div>

                {(activeTab === 'all' || activeTab === 'people') && (
                    <section className="explore-people">
                        <div className="explore-section-header">
                            <h2>People</h2>
                            <button
                                type="button"
                                onClick={() => setActiveTab('people')}
                            >
                                See more →
                            </button>
                        </div>

                        {usersLoading ? (
                            <p>Loading users...</p>
                        ) : usersError ? (
                            <p role="alert">{usersError}</p>
                        ) : users.length === 0 ? (
                            <p>No users found.</p>
                        ) : (
                            <div className="explore-users-list">
                                {users.map(user => (
                                    <div
                                        className="explore-user-card"
                                        key={user.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => navigate(`/profile/${user.username}`)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                navigate(`/profile/${user.username}`)
                                            }
                                        }}
                                    >
                                        <div className="explore-user-avatar">
                                            {user.profileImageUrl ? (
                                                <img
                                                    src={`https://localhost:7151${user.profileImageUrl}`}
                                                    alt={user.displayName}
                                                />
                                            ) : (
                                                user.displayName?.charAt(0).toUpperCase()
                                            )}
                                        </div>

                                        <div className="explore-user-info">
                                            <strong>{user.displayName}</strong>
                                            <span>@{user.username}</span>
                                            {user.bio && <p>{user.bio}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

            </div>
        </MainLayout>
    )
}

export default Explore
