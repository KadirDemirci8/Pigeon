import './PostCard.css'
import { Heart, MessageCircle, Repeat2, Bookmark, Trash2 } from 'lucide-react'
import { useState } from 'react'
import axios from 'axios'

function PostCard({ post, currentUserId, onPostDeleted }) {

    const isOwner = Number(post.userId) === Number(currentUserId)

    const handleDelete = async () => {
    const confirmed = window.confirm(
                'Are you sure you want to delete this post?'
            )

            if (!confirmed) return

            try {
                const token = sessionStorage.getItem('accessToken')

                await axios.delete(
                    `https://localhost:7151/api/posts/${post.id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                )
                onPostDeleted()
                console.log('Post deleted successfully!')
            } catch (error) {
                console.error('Failed to delete post:', error)
            }
        }

        const handleLike = async () => {
    try {
        const token = sessionStorage.getItem('accessToken')

        if (isLiked) {
            await axios.delete(
                `https://localhost:7151/api/posts/${post.id}/like`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            setIsLiked(false)
            setLikeCount(prev => prev - 1)
        } else {
            await axios.post(
                `https://localhost:7151/api/posts/${post.id}/like`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            setIsLiked(true)
            setLikeCount(prev => prev + 1)
        }
    } catch (error) {
        console.error('Failed to update like:', error)
    }
}

    const [isLiked, setIsLiked] = useState(post.isLiked)
    const [likeCount, setLikeCount] = useState(post.likeCount)
    const [isBookmarked, setIsBookmarked] = useState(false)
    const [isReposted, setIsReposted] = useState(false)
    const [isCommentOpen, setIsCommentOpen] = useState(false)
    return (
        <article className="post-card">
            <div className="post-header">
                <div className="post-avatar">
                    {post.displayName.charAt(0)}
                </div>

                <div className="post-user-info">
                    <strong>{post.displayName}</strong>
                    <span> @{post.username}</span>
                </div>
                {isOwner && (
                <button
                    type="button"
                    className="delete-post-button"
                    aria-label="Delete post"
                    onClick={handleDelete}
                >
                    <Trash2 size={18} />
                </button>
                )}
            </div>

            <p>{post.content}</p>
            <div className="post-actions">
                <button
                    type="button"
                    className={`action-like ${isLiked ? 'liked' : ''}`}
                    onClick={handleLike}
                    aria-label={isLiked ? 'Unlike' : 'Like'}
                    aria-pressed={isLiked}
                >
                    <Heart size={19} fill={isLiked ? 'currentColor' : 'none'} />
                    {likeCount > 0 && <span className="like-count">{likeCount}</span>}
                </button>

                <button
                    type="button"
                    className={`action-comment ${isCommentOpen ? 'comment-open' : ''}`}
                    onClick={() => setIsCommentOpen(!isCommentOpen)}
                    aria-label="Comment"
                    aria-expanded={isCommentOpen}
                >
                    <MessageCircle size={19} />
                </button>

                <button
                    type="button"
                    className={`action-repost ${isReposted ? 'reposted' : ''}`}
                    onClick={() => setIsReposted(!isReposted)}
                    aria-label={isReposted ? 'Undo repost' : 'Repost'}
                    aria-pressed={isReposted}
                >
                    <Repeat2 size={19} />
                </button>

                <button
                    type="button"
                    className={`action-bookmark ${isBookmarked ? 'bookmarked' : ''}`}
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                    aria-pressed={isBookmarked}
                >
                    <Bookmark
                        size={19}
                        fill={isBookmarked ? 'currentColor' : 'none'}
                    />
                </button>
            </div>
                            {isCommentOpen && (
                    <div className="comment-section">
                        <textarea placeholder="Write a comment..." />
                        <button type="button">Reply</button>
                    </div>
                )}
        </article>
    )
}

export default PostCard