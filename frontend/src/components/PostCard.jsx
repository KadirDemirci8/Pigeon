import './PostCard.css'
import { Heart, MessageCircle, Repeat2, Bookmark, Trash2, Send, ChevronDown, CornerUpLeft, MoreHorizontal } from 'lucide-react'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'


function PostCard({ post, currentUserId, currentUser, onPostDeleted, onBookmarkRemoved, onRepostRemoved, repostedBy, autoOpenComments = false, targetCommentId = null}) {

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


const handleBookmark = async () => {
    if (bookmarkLoading) return

    setBookmarkLoading(true)

    try {
        const token = sessionStorage.getItem('accessToken')

        if (isBookmarked) {
            await axios.delete(
                `https://localhost:7151/api/bookmarks/${post.id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            setIsBookmarked(false)
            onBookmarkRemoved?.(post.id)
        } else {
            await axios.post(
                `https://localhost:7151/api/bookmarks/${post.id}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            setIsBookmarked(true)
        }
    } catch (error) {
        console.error('Failed to update bookmark:', error)
        alert('Could not update bookmark. Please try again.')
    } finally {
        setBookmarkLoading(false)
    }
}


const handleRepost = async () => {
    if (repostLoading) return

    setRepostLoading(true)

    try {
        const token = sessionStorage.getItem('accessToken')

        if (isReposted) {
            await axios.delete(
                `https://localhost:7151/api/reposts/${post.id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            setIsReposted(false)
            setRepostCount(prev => prev - 1)
            onRepostRemoved?.(post.id)
        } else {
            await axios.post(
                `https://localhost:7151/api/reposts/${post.id}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            setIsReposted(true)
            setRepostCount(prev => prev + 1)
        }
    } catch (error) {
        console.error('Failed to update repost:', error)
        alert('Could not update repost. Please try again.')
    } finally {
        setRepostLoading(false)
    }
}


    const [isLiked, setIsLiked] = useState(post.isLiked)
    const [likeCount, setLikeCount] = useState(post.likeCount)
    const [commentCount, setCommentCount] = useState(post.commentCount ?? 0)
    const [isBookmarked, setIsBookmarked] = useState(
    post.isBookmarked ?? false
    )
    const [bookmarkLoading, setBookmarkLoading] = useState(false)
    const [isReposted, setIsReposted] = useState(
        post.isReposted ?? false
    )

    const [repostCount, setRepostCount] = useState(
        post.repostCount ?? 0
    )

    const [repostLoading, setRepostLoading] = useState(false)
    const [isCommentOpen, setIsCommentOpen] = useState(autoOpenComments)
    const [comments, setComments] = useState([])
    const [commentContent, setCommentContent] = useState('')
    const [replyToComment, setReplyToComment] = useState(null)
    const [replyContent, setReplyContent] = useState('')
    const [isSortOpen, setIsSortOpen] = useState(false)
    const [sortOrder, setSortOrder] = useState('recent')


const mainComments = comments.filter(
    (comment) => comment.parentCommentId == null
)

const replies = comments.filter(
    (comment) => comment.parentCommentId != null
)

const sortedComments = [...mainComments]
    .sort((a, b) =>
        sortOrder === 'recent'
            ? new Date(b.createdAt) - new Date(a.createdAt)
            : new Date(a.createdAt) - new Date(b.createdAt)
    )
    .flatMap((mainComment) => {
        const commentReplies = replies
            .filter(
                (reply) => reply.parentCommentId === mainComment.id
            )
            .sort(
                (a, b) =>
                    new Date(a.createdAt) - new Date(b.createdAt)
            )

        return [mainComment, ...commentReplies]
    })

useEffect(() => {
    setIsReposted(post.isReposted ?? false)
    setRepostCount(post.repostCount ?? 0)
}, [post.isReposted, post.repostCount, post.id])

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
                setCommentCount(response.data.length)
                    
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
                setCommentCount(response.data.length)
            } catch (error) {
                console.error('Failed to load comments:', error)
            }
        }

        fetchComments()
    }, [isCommentOpen, post.id])


useEffect(() => {
    if (!isCommentOpen || targetCommentId == null) return

    const targetExists = comments.some(
        comment => comment.id === Number(targetCommentId)
    )

    if (!targetExists) return

    const element = document.getElementById(
        `comment-${post.id}-${targetCommentId}`
    )

    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        })
    }
}, [comments, isCommentOpen, targetCommentId, post.id])

useEffect(() => {
    if (!isCommentOpen || targetCommentId == null) return

    const targetExists = comments.some(
        comment => comment.id === Number(targetCommentId)
    )

    if (!targetExists) return

    const element = document.getElementById(
        `comment-${post.id}-${targetCommentId}`
    )

    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        })
    }
}, [comments, isCommentOpen, targetCommentId, post.id])



const handleReply = async () => {
    if (!replyContent.trim() || !replyToComment) return

    try {
        const token = sessionStorage.getItem('accessToken')

        await axios.post(
            `https://localhost:7151/api/posts/${post.id}/comments`,
            {
                content: replyContent.trim(),
                parentCommentId: replyToComment.id
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
        setCommentCount(response.data.length)

        setReplyContent('')
        setReplyToComment(null)

    } catch (error) {
        console.error('Error creating reply:', error)
        alert('Failed to send reply.')
    }
}


    
const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment and its replies?')) return

    try {
        await axios.delete(
            `https://localhost:7151/api/posts/comments/${commentId}`,
            {
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`
                }
            }
        )

        setComments(prev => {
            const updatedComments = prev.filter(
                comment =>
                    comment.id !== commentId &&
                    comment.parentCommentId !== commentId
            )

            setCommentCount(updatedComments.length)

            return updatedComments
        })

    } catch (error) {
        console.error('Error deleting comment:', error)
    }
}


const handleCommentLike = async (commentId, isLiked) => {
    try {
        const token = sessionStorage.getItem('accessToken')

        if (isLiked) {
            await axios.delete(
                `https://localhost:7151/api/comments/${commentId}/like`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )
        } else {
            await axios.post(
                `https://localhost:7151/api/comments/${commentId}/like`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )
        }

        setComments(prev =>
            prev.map(comment =>
                comment.id === commentId
                    ? {
                        ...comment,
                        isLiked: !isLiked,
                        likeCount: Math.max(
                            0,
                            (comment.likeCount ?? 0) + (isLiked ? -1 : 1)
                        )
                    }
                    : comment
            )
        )
    } catch (error) {
        console.error('Failed to update comment like:', error)
    }
}

    return (
        <article className="post-card">
            {repostedBy && (
                <div className="post-repost-label">
                    <Repeat2 size={15} />
                    <span>{repostedBy} reposted</span>
                </div>
            )}
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
                    {commentCount > 0 && (
                        <span className="comment-count">{commentCount}</span>
                    )}
                </button>


                
                <button
                    type="button"
                    className={`action-repost ${isReposted ? 'reposted' : ''}`}
                    onClick={handleRepost}
                    disabled={repostLoading}
                    aria-label={isReposted ? 'Undo repost' : 'Repost'}
                    aria-pressed={isReposted}
                >
                    <Repeat2 size={19} />
                    {repostCount > 0 && (
                        <span className="repost-count">{repostCount}</span>
                    )}
                </button>


                
                <button
                    type="button"
                    className={`action-bookmark ${isBookmarked ? 'bookmarked' : ''}`}
                    onClick={handleBookmark}
                    disabled={bookmarkLoading}
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
        
            
            <div
                key={comment.id}
                id={`comment-${post.id}-${comment.id}`}
                
                className={`comment-thread ${
                    comment.parentCommentId != null ? 'is-reply' : ''
                } ${
                    Number(targetCommentId) === comment.id ? 'comment-highlight' : ''
                }`}

            >



            <div className="comment-row">
                <div className="comment-avatar">
                    {comment.profileImageUrl ? (
                        <img
                            src={`https://localhost:7151${comment.profileImageUrl}`}
                            alt={`${comment.displayName}'s profile`}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '50%'
                            }}
                        />
                    ) : (
                        comment.displayName.charAt(0).toUpperCase()
                    )}
                </div>

                <div className="comment-item">
                    <strong>{comment.displayName}</strong>
                    <span> @{comment.username}</span>
                    <p>{comment.content}</p>

                    <div className="comment-actions">

                        <button
                            type="button"
                            className={`comment-like ${comment.isLiked ? 'liked' : ''}`}
                            onClick={() => handleCommentLike(comment.id, comment.isLiked)}
                            aria-label={comment.isLiked ? 'Unlike comment' : 'Like comment'}
                            aria-pressed={comment.isLiked ?? false}
                        >
                            <Heart
                                size={15}
                                fill={comment.isLiked ? 'currentColor' : 'none'}
                            />

                            {comment.likeCount > 0 && (
                                <span className="comment-like-count">
                                    {comment.likeCount}
                                </span>
                            )}
                        </button>

                       
                        {comment.parentCommentId == null && (
                            <button
                                type="button"
                                className="comment-reply"
                                onClick={() => {
                                    if (replyToComment?.id === comment.id) {
                                        setReplyToComment(null)
                                        setReplyContent('')
                                    } else {
                                        setReplyToComment(comment)
                                        setReplyContent('')
                                    }
                                }}
                            >
                                <CornerUpLeft size={15} />
                                <span>Reply</span>
                            </button>
                        )}


                        <button
                            type="button"
                            aria-label="More options"
                        >
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

            {replyToComment?.id === comment.id && (
                <div className="reply-composer">

                    <div className="reply-composer-header">
                        <span>
                            Replying to @{comment.username}
                        </span>

                        <button
                            type="button"
                            onClick={() => {
                                setReplyToComment(null)
                                setReplyContent('')
                            }}
                            aria-label="Cancel reply"
                        >
                            ×
                        </button>
                    </div>

                    <textarea
                        placeholder="Write your reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        maxLength={500}
                    />

                    
                    <button
                        type="button"
                        className="reply-submit"
                        onClick={handleReply}
                        disabled={!replyContent.trim()}
                    >
                        Reply
                    </button>


                </div>
            )}

        </div>
    ))}
</div>

                <div className="comment-composer">
                <div className="comment-composer-avatar">
                {currentUser?.profileImageUrl ? (
                    <img
                        src={`https://localhost:7151${currentUser.profileImageUrl}`}
                        alt="Your profile"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '50%'
                        }}
                    />
                ) : (
                    currentUser?.displayName?.charAt(0).toUpperCase() || '?'
                )}
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