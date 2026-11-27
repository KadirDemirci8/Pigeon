
import { useEffect, useState } from 'react'
import axios from 'axios'
import PostCard from '../components/PostCard'
import './Bookmarks.css'
import MainLayout from '../components/MainLayout'
import { Bookmark } from 'lucide-react'
import { API_BASE } from '../services/apiClient'

function Bookmarks() {
    const [bookmarks, setBookmarks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const currentUserId = sessionStorage.getItem('userId')

    const fetchBookmarks = async () => {
        try {
            setError('')

            const token = sessionStorage.getItem('userId')

            const response = await axios.get(
                `${API_BASE}/api/bookmarks`,
                {
                    headers: {

                    }
                }
            )

            setBookmarks(response.data)
        } catch (error) {
            console.error('Failed to load bookmarks:', error)
            setError('Could not load your bookmarks.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBookmarks()
    }, [])

    return (
    <MainLayout>
        <main className="bookmarks-page">
            <div className="bookmarks-header">
                <h1>Bookmarks</h1>
                <p>Your saved posts, all in one place.</p>
            </div>

            <div className="bookmarks-content">
                {loading ? (
                    <p>Loading bookmarks...</p>
                ) : error ? (
                    <p>{error}</p>
                ) : bookmarks.length === 0 ? (
                    
                    <div className="bookmarks-empty">
                        <Bookmark size={44} strokeWidth={1.5} />
                        <h2>No bookmarks yet</h2>
                        <p>Save posts you love and find them here anytime.</p>
                    </div>

                ) : (
                    bookmarks.map(post => (
                        
                    <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={currentUserId}
                        onPostDeleted={fetchBookmarks}
                        onBookmarkRemoved={(postId) => {
                            setBookmarks(prev =>
                                prev.filter(p => p.id !== postId)
                            )
                        }}
                    />

                    ))
                )}
            </div>
                </main>
    </MainLayout>
)
}

export default Bookmarks
