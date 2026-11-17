
import { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import axios from 'axios'
import MainLayout from '../components/MainLayout'
import PostCard from '../components/PostCard'

function PostDetails() {
    const { id } = useParams()
    const location = useLocation()

    const [post, setPost] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const currentUserId = sessionStorage.getItem('userId')

    useEffect(() => {
        let cancelled = false

        const fetchPost = async () => {
            setLoading(true)
            setError('')

            try {
                const token = sessionStorage.getItem('accessToken')

                const response = await axios.get(
                    `https://localhost:7151/api/posts/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                )

                if (!cancelled) {
                    setPost(response.data)
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('Failed to load post:', err)
                    setError('Post not found or could not be loaded.')
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        fetchPost()

        return () => {
            cancelled = true
        }
    }, [id])

    return (
        <MainLayout>
            <div className="post-details-page">
                <h2>Post</h2>

                {loading ? (
                    <p>Loading post...</p>
                ) : error ? (
                    <p>{error}</p>
                ) : post ? (
                    
                    
                <PostCard
                    post={post}
                    currentUserId={currentUserId}
                    onPostDeleted={() => setPost(null)}
                    autoOpenComments={location.state?.openComments === true}
                    targetCommentId={location.state?.commentId ?? null}
                />


                ) : (
                    <p>Post not found.</p>
                )}
            </div>
        </MainLayout>
    )
}

export default PostDetails
