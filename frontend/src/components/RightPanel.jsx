
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import axios from 'axios'
import './RightPanel.css'
import { API_BASE } from '../services/apiClient'

const API_URL = API_BASE

function RightPanel() {
    const [trends, setTrends] = useState([])
    const [trendsLoading, setTrendsLoading] = useState(true)
    const [suggestions, setSuggestions] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [followingId, setFollowingId] = useState(null)

    const fetchSuggestions = useCallback(async () => {
        try {
            setError('')

            const token = sessionStorage.getItem('userId')

            const response = await axios.get(
                `${API_URL}/api/users/suggestions`,
                {
                    headers: {

                    }
                }
            )

            setSuggestions(response.data)
        } catch (err) {
            console.error('Failed to load suggestions:', err)
            setError('Could not load suggestions.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchSuggestions()
    }, [fetchSuggestions])


useEffect(() => {
    const fetchTrends = async () => {
        try {
            const token = sessionStorage.getItem('userId')

            const response = await axios.get(
                `${API_URL}/api/posts/trending`,
                {
                    headers: {

                    }
                }
            )

            setTrends(response.data)
        } catch (error) {
            console.error('Failed to load trends:', error)
        } finally {
            setTrendsLoading(false)
        }
    }

    fetchTrends()
}, [])


    const handleFollow = async (userId) => {
        if (followingId !== null) return

        setFollowingId(userId)

        try {
            const token = sessionStorage.getItem('userId')

            await axios.post(
                `${API_URL}/api/follows/${userId}`,
                {},
                {
                    headers: {

                    }
                }
            )

            setSuggestions(prev =>
                prev.filter(user => user.id !== userId)
            )

            await fetchSuggestions()
        } catch (err) {
            console.error('Failed to follow user:', err)
            setError('Could not follow user. Please try again.')
        } finally {
            setFollowingId(null)
        }
    }

    return (
        <div className="right-panel">
            <div className="search-box">
                <Search size={20} />
                <input
                    type="text"
                    placeholder="Search Pigeon..."
                />
            </div>

            
            <section className="trending-section">
                <h3>Trending</h3>

                {trendsLoading ? (
                    <p>Loading trends...</p>
                ) : trends.length === 0 ? (
                    <p>No trending topics yet.</p>
                ) : (
                    trends.map(trend => (
                        <div className="trend-item" key={trend.hashtag}>
                            <span>Trending · Last 48 hours</span>
                            <strong>{trend.hashtag}</strong>
                            <small>
                                {trend.postCount} {trend.postCount === 1 ? 'post' : 'posts'}
                            </small>
                        </div>
                    ))
                )}
            </section>


            <section className="follow-section">
                <h3>Who to follow</h3>

                {loading && (
                    <p>Loading suggestions...</p>
                )}

                {!loading && error && (
                    <p className="follow-error">{error}</p>
                )}

                {!loading && suggestions.length === 0 && !error && (
                    <p>No new users to suggest yet.</p>
                )}

                {!loading && suggestions.map(user => (
                    <div className="follow-user" key={user.id}>
                        <Link
                            to={`/profile/${user.username}`}
                            className="follow-avatar"
                            aria-label={`View ${user.displayName}'s profile`}
                        >
                            {user.profileImageUrl ? (
                                <img
                                    src={`${API_URL}${user.profileImageUrl}`}
                                    alt={user.displayName}
                                />
                            ) : (
                                user.displayName?.charAt(0).toUpperCase() || '?'
                            )}
                        </Link>

                        <div className="follow-info">
                            <Link to={`/profile/${user.username}`}>
                                <strong>{user.displayName}</strong>
                                <span>@{user.username}</span>
                            </Link>
                        </div>

                        <button
                            type="button"
                            onClick={() => handleFollow(user.id)}
                            disabled={followingId !== null}
                        >
                            {followingId === user.id
                                ? 'Following...'
                                : 'Follow'}
                        </button>
                    </div>
                ))}
            </section>
        </div>
    )
}

export default RightPanel
