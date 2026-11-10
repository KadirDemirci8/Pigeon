import './PostCard.css'
import { Heart, MessageCircle, Repeat2, Bookmark, Trash2, Send, ChevronDown, CornerUpLeft, MoreHorizontal } from 'lucide-react'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'


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
    const [comments, setComments] = useState([])
    const [commentContent, setCommentContent] = useState('')
    const [isSortOpen, setIsSortOpen] = useState(false)
    const [sortOrder, setSortOrder] = useState('recent')

    const sortedComments = [...comments].sort((a, b) => {
    if (sortOrder === 'recent') {
        return new Date(b.createdAt) - new Date(a.createdAt)
    }

    return new Date(a.createdAt) - new Date(b.createdAt)
})

    const handleComment = async () => {
                if (!commentContent.trim()) return

                try {
                    const token = sessionStorage.getItem('accessToken')

                    await axios.post(
                        `https://localhost:7151/api/posts/${post.id}/comments`,
                        {
                            content: commentContent.trim()
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        }
                    )

                    const response = await axios.get(
                    `https://localhost:7151/api/posts/${post.id}/comments`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                )

                setComments(response.data)
                    
                    setCommentContent('')

                } catch (error) {
                    console.error('Failed to create comment:', error)
                }
            }

    useEffect(() => {
        if (!isCommentOpen) return

        const fetchComments = async () => {
            try {
                const token = sessionStorage.getItem('accessToken')

                const response = await axios.get(
                    `https://localhost:7151/api/posts/${post.id}/comments`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                )

                setComments(response.data)
            } catch (error) {
                console.error('Failed to load comments:', error)
            }
        }

        fetchComments()
    }, [isCommentOpen, post.id])

    const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return

    try {
        await axios.delete(
            `https://localhost:7151/api/posts/comments/${commentId}`,
            {
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`
                }
            }
        )

        setComments(prev =>
            prev.filter(comment => comment.id !== commentId)
        )
    } catch (error) {
        console.error('Error deleting comment:', error)
    }
}

    return (
        <article className="post-card">
            <div className="post-header">
                <Link
                    to={`/profile/${post.username}`}
                    className="post-avatar post-avatar-link"
                >
                    {post.profileImageUrl ? (
                        <img
                            src={`https://localhost:7151${post.profileImageUrl}`}
                            alt={`${post.displayName}'s profile`}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '50%'
                            }}
                        />
                    ) : (
                        post.displayName.charAt(0)
                    )}
                </Link>

                <div className="post-user-info">
                    <Link
                        to={`/profile/${post.username}`}
                        className="post-profile-link"
                    >
                        <strong>{post.displayName}</strong>
                        <span> @{post.username}</span>
                    </Link>
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

                
                <div className="comments-header">
                    <div className="comments-title">
                        <img
                            className="comments-bird"
                            src="/Pigeon-Logo-Bird.png"
                            alt=""
                        />
                        <h3>Comments ({comments.length})</h3>
                    </div>

                    <div className="comments-sort-wrapper">
                        <button
                            type="button"
                            className="comments-sort-trigger"
                            onClick={() => setIsSortOpen(!isSortOpen)}
                        >
                            {sortOrder === 'recent' ? 'Most recent' : 'Oldest first'}
                                <ChevronDown size={16} />
                        </button>

                        {isSortOpen && (
                    <div className="comments-sort-menu">
                        <button
                            type="button"
                            onClick={() => {
                                setSortOrder('recent')
                                setIsSortOpen(false)
                            }}
                        >
                            Most recent
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setSortOrder('oldest')
                                setIsSortOpen(false)
                            }}
                        >
                            Oldest first
                        </button>
                    </div>
                )}
                    </div>
                </div>
                
                <div className="comments-list">
                    {sortedComments.map((comment) => (
                    <div key={comment.id} className="comment-row">
                        <div className="comment-avatar">
                            {comment.displayName.charAt(0)}
                        </div>

                        <div className="comment-item">
                            <strong>{comment.displayName}</strong>
                            <span> @{comment.username}</span>
                            <p>{comment.content}</p>
                            
                            <div className="comment-actions">
                                <button type="button" aria-label="Like comment">
                                    <Heart size={15} />
                                </button>

                                <button type="button" className="comment-reply">
                                    <CornerUpLeft size={15} />
                                    <span>Reply</span>
                                </button>

                                <button type="button" aria-label="More options">
                                    <MoreHorizontal size={18} />
                                </button>
                                {Number(comment.userId) === Number(currentUserId) && (
                                    <button
                                        type="button"
                                        className="comment-delete"
                                        onClick={() => handleDeleteComment(comment.id)}
                                        aria-label="Delete comment"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                </div>

                <div className="comment-composer">
    <div className="comment-composer-avatar">
        {post.displayName.charAt(0)}
    </div>

    <textarea
                placeholder="Write a comment..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
            />

            <button
                type="button"
                onClick={handleComment}
                disabled={!commentContent.trim()}
                aria-label="Send comment"
            >
                <Send size={20} />
            </button>
        </div>

            </div>
        )}
        </article>
    )
}

export default PostCard