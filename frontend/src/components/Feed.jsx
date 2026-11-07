import PostCard from './PostCard'
import { useState, useEffect } from 'react'
import axios from 'axios'

function Feed({ refreshKey, currentUserId, onPostDeleted }) {
    const [posts, setPosts] = useState([])

    useEffect(() => {
                        const fetchPosts = async () => {
                            try {
                                const token = sessionStorage.getItem('accessToken')

                                const response = await axios.get(
                                    'https://localhost:7151/api/posts',
                                    {
                                        headers: {
                                            Authorization: `Bearer ${token}`
                                        }
                                    }
                                )

                                setPosts(response.data)
                            } catch (error) {
                                console.error('Failed to load posts:', error)
                            }
                        }

                        fetchPosts()
                    }, [refreshKey])

    return (
        <div className="feed">
            {posts.map((post) => (
                <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUserId}
                    onPostDeleted={onPostDeleted}
                />
            ))}
        </div>
    )
}

export default Feed