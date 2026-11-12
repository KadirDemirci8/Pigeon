
import { useEffect, useState } from 'react'
import { Search, Users, MessageCircle } from 'lucide-react'
import MainLayout from '../components/MainLayout'
import './Explore.css'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import PostCard from '../components/PostCard'   

function Explore() {
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [activeTab, setActiveTab] = useState('all')
    const [users, setUsers] = useState([])
    const [usersLoading, setUsersLoading] = useState(true)
    const [usersError, setUsersError] = useState('')
    const [posts, setPosts] = useState([])
    const [postsLoading, setPostsLoading] = useState(true)
    const [postsError, setPostsError] = useState('')
    const [followStatuses, setFollowStatuses] = useState({})
    const [followLoadingId, setFollowLoadingId] = useState(null)
    const [currentUser, setCurrentUser] = useState(null)




useEffect(() => {
    let cancelled = false

    const fetchUsers = async () => {
        setUsersLoading(true)
        setUsersError('')

        try {
            const response = await axios.get(
                'https://localhost:7151/api/users/search',
                {
                    
                params: {
                    q: search.trim(),
                    limit: search.trim() || activeTab === 'people' ? 20 : 4
                }

                }
            )

            const token = sessionStorage.getItem('accessToken')
            const currentUserId = Number(sessionStorage.getItem('userId'))

            const statuses = {}

            await Promise.all(
                response.data
                    .filter(user => user.id !== currentUserId)
                    .map(async user => {
                        const statusResponse = await axios.get(
                            `https://localhost:7151/api/follows/${user.id}/status`,
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`
                                }
                            }
                        )

                        statuses[user.id] = statusResponse.data.isFollowing
                    })
            )

            if (!cancelled) {
                
                setUsers(
                    response.data.filter(
                        user => user.id !== currentUserId
                    )
                )

                setFollowStatuses(statuses)
            }
        } catch (error) {
            if (!cancelled) {
                console.error('Failed to search users:', error)
                setUsersError('Could not load users.')
            }
        } finally {
            if (!cancelled) {
                setUsersLoading(false)
            }
        }
    }

    const timeoutId = setTimeout(fetchUsers, 300)

    return () => {
        cancelled = true
        clearTimeout(timeoutId)
    }
}, [search, activeTab])


useEffect(() => {
    let cancelled = false

    const fetchPosts = async () => {
        setPostsLoading(true)
        setPostsError('')

        try {
            const token = sessionStorage.getItem('accessToken')

            const response = await axios.get(
                'https://localhost:7151/api/posts',
                {
                    params: {
                        q: search.trim()
                    },
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            if (!cancelled) {
                setPosts(response.data)
            }
        } catch (error) {
            if (!cancelled) {
                console.error('Failed to load posts:', error)
                setPostsError('Could not load posts.')
            }
        } finally {
            if (!cancelled) {
                setPostsLoading(false)
            }
        }
    }

    const timeoutId = setTimeout(fetchPosts, 300)

    return () => {
        cancelled = true
        clearTimeout(timeoutId)
    }
}, [search])


useEffect(() => {
    const fetchCurrentUser = async () => {
        try {
            const username = sessionStorage.getItem('username')

            if (!username) return

            const response = await axios.get(
                `https://localhost:7151/api/users/${username}`
            )

            setCurrentUser(response.data)
        } catch (error) {
            console.error('Failed to load current user:', error)
        }
    }

    fetchCurrentUser()
}, [])


const handleFollow = async (userId) => {
    if (followLoadingId !== null) return

    setFollowLoadingId(userId)

    const token = sessionStorage.getItem('accessToken')
    const currentlyFollowing = followStatuses[userId]

    try {
        if (currentlyFollowing) {
            await axios.delete(
                `https://localhost:7151/api/follows/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )
        } else {
            await axios.post(
                `https://localhost:7151/api/follows/${userId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )
        }

        setFollowStatuses(prev => ({
            ...prev,
            [userId]: !currentlyFollowing
        }))
    } catch (error) {
        console.error('Failed to update follow:', error)
        alert('Could not update follow. Please try again.')
    } finally {
        setFollowLoadingId(null)
    }
}


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

            {activeTab === 'all' && (
                <button
                    type="button"
                    onClick={() => setActiveTab('people')}
                >
                    See more →
                </button>
            )}
        </div>

        {usersLoading ? (
            <p>Loading users...</p>
        ) : usersError ? (
            <p role="alert">{usersError}</p>
        ) : users.length === 0 ? (
            <p className="explore-empty-message">
                {search.trim()
                    ? `No users found for "${search.trim()}".`
                    : 'No users to discover yet.'}
            </p>
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

                        {Number(sessionStorage.getItem('userId')) !== user.id && (
                            <button
                                type="button"
                                className={`explore-follow-button ${
                                    followStatuses[user.id] ? 'is-following' : ''
                                }`}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleFollow(user.id)
                                }}
                                onKeyDown={(e) => e.stopPropagation()}
                                disabled={followLoadingId !== null || usersLoading}
                            >
                                {followLoadingId === user.id
                                    ? 'Loading...'
                                    : followStatuses[user.id]
                                        ? 'Following'
                                        : 'Follow'}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        )}
    </section>
)}

{/* POSTS SECTION */}

{(activeTab === 'all' || activeTab === 'posts') && (
    <section className="explore-posts">
        <div className="explore-section-header">
            <h2>Posts</h2>

            {activeTab === 'all' && (
                <button
                    type="button"
                    onClick={() => setActiveTab('posts')}
                >
                    See more →
                </button>
            )}
        </div>

        {postsLoading ? (
            <p>Loading posts...</p>
        ) : postsError ? (
            <p role="alert">{postsError}</p>
        ) : posts.length === 0 ? (
            <p className="explore-empty-message">
                {search.trim()
                    ? `No posts found for "${search.trim()}".`
                    : 'No posts yet.'}
            </p>
        ) : (
            <div className="feed">
                
                {(activeTab === 'all' && !search.trim()
                    ? posts.slice(0, 3)
                    : posts
                ).map(post => (

                    <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={Number(sessionStorage.getItem('userId'))}
                        currentUser={currentUser}
                        onPostDeleted={() => {
                            setPosts(prev =>
                                prev.filter(p => p.id !== post.id)
                            )
                        }}
                    />
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
