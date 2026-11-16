
import PostCard from './PostCard'
import { useState, useEffect } from 'react'
import axios from 'axios'

function Feed({
    activeTab,
    refreshKey,
    currentUserId,
    currentUser,
    onPostDeleted
}) {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false

        const fetchPosts = async () => {
            setLoading(true)
            setPosts([])

            try {
                const token = sessionStorage.getItem('accessToken')

                const endpoint = activeTab === 'following'
                    ? 'https://localhost:7151/api/posts/following'
                    : 'https://localhost:7151/api/posts'

                const response = await axios.get(endpoint, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })

                if (!cancelled) {
                    setPosts(response.data)
                }
            } catch (error) {
                if (!cancelled) {
                    console.error('Failed to load posts:', error)
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        fetchPosts()

        return () => {
            cancelled = true
        }
    }, [activeTab, refreshKey])

    if (loading) {
        return <div className="feed"><p>Loading posts...</p></div>
    }

    return (
        <div className="feed">
            {posts.length === 0 ? (
                <p>
                    {activeTab === 'following'
                        ? 'No posts from people you follow yet.'
                        : 'No posts yet.'}
                </p>
            ) : (
                posts.map((post) => (
                    <div
                        key={`${post.id}-${post.repostedByUsername ?? 'original'}`}
                    >
                    

                        <PostCard
                            post={post}
                            repostedBy={post.repostedBy}
                            currentUserId={currentUserId}
                            currentUser={currentUser}
                            onPostDeleted={onPostDeleted}
                        />
                    </div>
                ))
            )}
        </div>
    )
}

export default Feed
