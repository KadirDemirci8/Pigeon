import './PostCard.css'
import { Heart, MessageCircle, Repeat2, Bookmark } from 'lucide-react'
import { useState } from 'react'

function PostCard({ post }) {

    const [isLiked, setIsLiked] = useState(false)
    const [isBookmarked, setIsBookmarked] = useState(false)
    const [isReposted, setIsReposted] = useState(false)
    const [isCommentOpen, setIsCommentOpen] = useState(false)
    return (
        <article className="post-card">
            <div className="post-header">
                <div className="post-avatar">
                    {post.displayName.charAt(0)}
                </div>

                <div>
                    <strong>{post.displayName}</strong>
                    <span> @{post.username}</span>
                </div>
            </div>

            <p>{post.content}</p>
            <div className="post-actions">
                <button
                    type="button"
                    className={`action-like ${isLiked ? 'liked' : ''}`}
                    onClick={() => setIsLiked(!isLiked)}
                    aria-label={isLiked ? 'Unlike' : 'Like'}
                    aria-pressed={isLiked}
                >
                    <Heart size={19} fill={isLiked ? 'currentColor' : 'none'} />
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