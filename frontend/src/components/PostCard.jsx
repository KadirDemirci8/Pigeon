import './PostCard.css'
import { Heart, MessageCircle, Repeat2, Bookmark, Trash2, Send, ChevronDown, CornerUpLeft, MoreHorizontal, ChevronLeft, ChevronRight, Pencil, Share2} from 'lucide-react'
import { useState, useEffect, useMemo   } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'


function PostCard({ post, currentUserId, currentUser, onPostDeleted, onBookmarkRemoved, onRepostRemoved, repostedBy, autoOpenComments = false, targetCommentId = null}) {

    const isOwner = Number(post.userId) === Number(currentUserId)
    const [now, setNow] = useState(Date.now())

    useEffect(() => {
        const intervalId = window.setInterval(() => setNow(Date.now()), 10000)
        return () => window.clearInterval(intervalId)
    }, [])

    const parseUtcDate = (dateString) => {
    if (!dateString) return null

    const value = String(dateString)

    const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)

    return new Date(hasTimezone ? value : `${value}Z`)
}

const createdAt = parseUtcDate(post.createdAt)

const canEditPost =
    createdAt !== null &&
    !Number.isNaN(createdAt.getTime()) &&
    Date.now() < createdAt.getTime() + 60 * 60 * 1000

const isAuthenticated = Boolean(sessionStorage.getItem('accessToken'))


const navigate = useNavigate()

const requireLogin = () => {
    if (isAuthenticated) return true

    navigate('/login', {
        state: {
            from: {
                pathname: `/posts/${post.id}`,
                search: '',
                hash: ''
            }
        }
    })

    return false
}


const handleSaveImages = async () => {
    if (removedImageIds.length === 0 && newEditImages.length === 0) {
        return true
    }

    if (isSavingImages) return false

    setIsSavingImages(true)

    try {
        const token = sessionStorage.getItem('accessToken')
        const formData = new FormData()

        removedImageIds.forEach(id => {
            formData.append('RemoveImageIds', id.toString())
        })

        newEditImages.forEach(file => {
            formData.append('NewImages', file)
        })

        const response = await axios.put(
            `https://localhost:7151/api/posts/${post.id}/images`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        )

        const updatedDetails = response.data.images ?? []
        setDisplayUpdatedAt(response.data.updatedAt)

        setDisplayImageDetails(updatedDetails)
        setDisplayImages(updatedDetails.map(image => image.imageUrl))
        setRemovedImageIds([])
        setNewEditImages([])

        return true
    } catch (error) {
        console.error('Failed to update post images:', error)
        alert('Could not update post images. Please try again.')
        return false
    } finally {
        setIsSavingImages(false)
    }
}



const handleSaveEdit = async () => {
    if (isSavingEdit || isSavingImages) return

    const content = editedContent.trim()
    const hasImageChanges =
        removedImageIds.length > 0 || newEditImages.length > 0

    const remainingImages =
        displayImageDetails.length -
        removedImageIds.length +
        newEditImages.length

    if (content.length > 1000) return

    if (!content && remainingImages === 0) {
        alert('A post must contain text or at least one image.')
        return
    }

    if (!content && content !== displayContent.trim()) {
        alert('Removing all post text is not supported yet.')
        return
    }

    setIsSavingEdit(true)

    try {
        if (content !== displayContent.trim()) {
            const token = sessionStorage.getItem('accessToken')

            const response = await axios.put(
                `https://localhost:7151/api/posts/${post.id}`,
                { content },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            setDisplayContent(response.data.content)
            setEditedContent(response.data.content)
            setDisplayUpdatedAt(response.data.updatedAt)
        }

        if (hasImageChanges) {
            const imagesSaved = await handleSaveImages()

            if (!imagesSaved) return
        }

        setIsEditing(false)
    } catch (error) {
        console.error('Failed to update post:', error)
        alert('Could not update post. Please try again.')
    } finally {
        setIsSavingEdit(false)
    }
}



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

            if (!requireLogin()) return
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
    if (!requireLogin()) return

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
    if (!requireLogin()) return

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
    const [activeImageIndex, setActiveImageIndex] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editedContent, setEditedContent] = useState(post.content ?? '')
    const [isSavingEdit, setIsSavingEdit] = useState(false)
    const [displayContent, setDisplayContent] = useState(post.content ?? '')
    const [displayUpdatedAt, setDisplayUpdatedAt] = useState(post.updatedAt ?? null)
    const [removedImageIds, setRemovedImageIds] = useState([])
    const [newEditImages, setNewEditImages] = useState([])
    const [isSavingImages, setIsSavingImages] = useState(false)
    const [displayImages, setDisplayImages] = useState(post.images ?? [])
    const [displayImageDetails, setDisplayImageDetails] = useState(post.imageDetails ?? [])
    const [linkCopied, setLinkCopied] = useState(false)


useEffect(() => {
    if (!linkCopied) return

    const timeoutId = setTimeout(() => {
        setLinkCopied(false)
    }, 2000)

    return () => clearTimeout(timeoutId)
}, [linkCopied])


const newEditImagePreviews = useMemo(
    () => newEditImages.map(file => ({
        file,
        url: URL.createObjectURL(file)
    })),
    [newEditImages]
)

useEffect(() => {
    return () => {
        newEditImagePreviews.forEach(image => {
            URL.revokeObjectURL(image.url)
        })
    }
}, [newEditImagePreviews])



useEffect(() => {
    setDisplayContent(post.content ?? '')
    setDisplayUpdatedAt(post.updatedAt ?? null)
}, [post.id, post.content, post.updatedAt])



useEffect(() => {
    if (activeImageIndex === null) return

    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            setActiveImageIndex(null)
        }

        if (!Array.isArray(displayImages) || displayImages.length < 2) {
            return
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault()

            setActiveImageIndex(prev =>
                (prev + 1) % displayImages.length
            )
        }

        if (event.key === 'ArrowLeft') {
            event.preventDefault()

            setActiveImageIndex(prev =>
                (prev - 1 + displayImages.length) % displayImages.length
            )
        }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
        window.removeEventListener('keydown', handleKeyDown)
    }
}, [activeImageIndex, displayImages])


    const [comments, setComments] = useState([])
    const [commentContent, setCommentContent] = useState('')
    const [replyToComment, setReplyToComment] = useState(null)
    const [replyContent, setReplyContent] = useState('')
    const [isSortOpen, setIsSortOpen] = useState(false)
    const [sortOrder, setSortOrder] = useState('recent')
    const [editingCommentId, setEditingCommentId] = useState(null)
    const [editingCommentContent, setEditingCommentContent] = useState('')
    const [isSavingComment, setIsSavingComment] = useState(false)
    const [commentEditError, setCommentEditError] = useState('')


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
    if (!requireLogin()) return

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
    if (!requireLogin()) return

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


    

const handleSaveCommentEdit = async (commentId) => {
    if (isSavingComment || !requireLogin()) return

    const content = editingCommentContent.trim()
    if (!content || content.length > 500) {
        setCommentEditError('Comment must contain 1–500 characters.')
        return
    }

    setIsSavingComment(true)
    setCommentEditError('')

    try {
        const token = sessionStorage.getItem('accessToken')
        const response = await axios.put(
            `https://localhost:7151/api/posts/comments/${commentId}`,
            { content },
            { headers: { Authorization: `Bearer ${token}` } }
        )

        setComments(prev => prev.map(comment =>
            comment.id === commentId
                ? {
                    ...comment,
                    content: response.data.content,
                    updatedAt: response.data.updatedAt
                }
                : comment
        ))
        setEditingCommentId(null)
        setEditingCommentContent('')
    } catch (error) {
        console.error('Failed to edit comment:', error)
        const message = error.response?.data?.message
        setCommentEditError(
            error.response?.status === 403
                ? (message || 'Comments can only be edited within 60 minutes of creation.')
                : (message || 'Could not edit comment. Please try again.')
        )
    } finally {
        setIsSavingComment(false)
    }
}

const handleDeleteComment = async (commentId) => {
    if (!requireLogin()) return

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
    if (!requireLogin()) return


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
    <>
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
                
                {displayUpdatedAt && (
                <span
                    className="post-edited-label"
                    title={`Last edited: ${new Date(displayUpdatedAt).toLocaleString()}`}
                >
                    (edited)
                </span>
            )}
        {isOwner && (
            <>
                {canEditPost && (
                <button
                    type="button"
                    className="edit-post-button"
                    aria-label="Edit post"
                    onClick={() => {
                        setEditedContent(displayContent)
                        setRemovedImageIds([])
                        setNewEditImages([])
                        setIsEditing(true)
                    }}
                >
                    <Pencil size={18} />
                </button>
            )}

                <button
                    type="button"
                    className="delete-post-button"
                    aria-label="Delete post"
                    onClick={handleDelete}
                >
                    <Trash2 size={18} />
                </button>
            </>
        )}

            </div>

            


{isEditing ? (
    <div className="post-edit-form">
        <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            placeholder="Write or edit your post..."
            maxLength={1000}
            rows={4}
            autoFocus
        />


{displayImageDetails.length > 0 && (
    <div className="post-edit-images">
        {displayImageDetails
            .filter(image => !removedImageIds.includes(image.id))
            .map(image => (
                <div
                    key={image.id}
                    className="post-edit-image-item"
                >
                    <img
                        src={`https://localhost:7151${image.imageUrl}`}
                        alt="Post attachment"
                    />

                    <button
                        type="button"
                        className="post-edit-image-remove"
                        aria-label="Remove image"
                        onClick={() => {
                            setRemovedImageIds(prev => [...prev, image.id])
                        }}
                    >
                        ×
                    </button>
                </div>
            ))}
    </div>
)}


<div className="post-edit-upload">
    <label htmlFor={`edit-images-${post.id}`}>
        + Add photos
    </label>

    <input
        id={`edit-images-${post.id}`}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        multiple
        onChange={(e) => {
            const selectedFiles = Array.from(e.target.files || [])

            const remainingCount =
                displayImageDetails.length -
                removedImageIds.length +
                newEditImages.length

            if (remainingCount + selectedFiles.length > 10) {
                alert('A post can contain up to 10 images.')
                e.target.value = ''
                return
            }

            if (selectedFiles.some(file => file.size > 5 * 1024 * 1024)) {
                alert('Each image must be 5 MB or smaller.')
                e.target.value = ''
                return
            }

            setNewEditImages(prev => [...prev, ...selectedFiles])
            e.target.value = ''
        }}
    />
</div>


{newEditImagePreviews.length > 0 && (
    <div className="post-edit-images">
        {newEditImagePreviews.map((image, index) => (
            <div
                key={image.url}
                className="post-edit-image-item"
            >
                <img
                    src={image.url}
                    alt={`New image ${index + 1}`}
                />

                <button
                    type="button"
                    className="post-edit-image-remove"
                    aria-label={`Remove new image ${index + 1}`}
                    onClick={() => {
                        setNewEditImages(prev =>
                            prev.filter((_, i) => i !== index)
                        )
                    }}
                >
                    ×
                </button>
            </div>
        ))}
    </div>
)}


        
<div className="post-edit-actions">
    <button
        type="button"
        className="post-edit-cancel"
        disabled={isSavingEdit || isSavingImages}
        onClick={() => {
            setIsEditing(false)
            setEditedContent(displayContent)
            setRemovedImageIds([])
            setNewEditImages([])
        }}
    >
        Cancel
    </button>

    <button
        type="button"
        className="post-edit-save"
        onClick={handleSaveEdit}
        disabled={
            isSavingEdit ||
            isSavingImages ||
            editedContent.length > 1000 ||
            (
                !editedContent.trim() &&
                displayImageDetails.length -
                    removedImageIds.length +
                    newEditImages.length === 0
            )
        }
    >
        {isSavingEdit || isSavingImages ? 'Saving...' : 'Save'}
    </button>
</div>

    </div>
) : (
    displayContent && <p>{displayContent}</p>
)}





{!isEditing && Array.isArray(displayImages) && displayImages.length > 0 && (

    <div
        className={`post-images-grid ${
            displayImages.length === 1 ? 'single-image' :
            displayImages.length === 2 ? 'two-images' :
            displayImages.length === 3 ? 'three-images' :
            displayImages.length === 4 ? 'four-images' :
            'many-images'
        }`}
    >
        {displayImages.map((imageUrl, index) => (
            <button
                key={`${imageUrl}-${index}`}
                type="button"
                className="post-image-button"
                onClick={() => setActiveImageIndex(index)}
                aria-label={`Open image ${index + 1} of ${displayImages.length}`}
            >
                <img
                    src={`https://localhost:7151${imageUrl}`}
                    alt={`Post image ${index + 1}`}
                    loading="lazy"
                />
            </button>
        ))}
    </div>
)}


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


                
                <div className="post-share-wrapper">
                    <button
                        type="button"
                        className="action-share"
                        aria-label="Copy post link"
                        onClick={async () => {
                            const postUrl = `${window.location.origin}/posts/${post.id}`

                            try {
                                await navigator.clipboard.writeText(postUrl)
                                setLinkCopied(true)
                            } catch (error) {
                                console.error('Failed to copy post link:', error)
                                alert('Could not copy post link.')
                            }
                        }}
                    >
                        <Share2 size={19} />
                    </button>

                    {linkCopied && (
                        <span className="post-link-copied" role="status">
                            Link copied!
                        </span>
                    )}
                </div>



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
                    {comment.updatedAt && (
                        <span
                            className="comment-edited-label"
                            title={`Last edited: ${new Date(comment.updatedAt).toLocaleString()}`}
                        >
                            {' '}(edited)
                        </span>
                    )}

                    {editingCommentId === comment.id ? (
                        <div className="comment-edit-form">
                            <textarea
                                value={editingCommentContent}
                                onChange={e => setEditingCommentContent(e.target.value)}
                                maxLength={500}
                                rows={3}
                                aria-label="Edit comment"
                            />
                            {commentEditError && (
                                <p className="comment-edit-error" role="alert">
                                    {commentEditError}
                                </p>
                            )}
                            <div className="comment-edit-buttons">
                                <button
                                    type="button"
                                    disabled={isSavingComment}
                                    onClick={() => {
                                        setEditingCommentId(null)
                                        setEditingCommentContent('')
                                        setCommentEditError('')
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={isSavingComment || !editingCommentContent.trim()}
                                    onClick={() => handleSaveCommentEdit(comment.id)}
                                >
                                    {isSavingComment ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p>{comment.content}</p>
                    )}

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

                        
                    {Number(comment.userId) === Number(currentUserId) &&
                        Boolean(comment.createdAt) &&
                        now < parseUtcDate(comment.createdAt).getTime() + 60 * 60 * 1000 && (
                            <button
                                type="button"
                                className="comment-edit-trigger"
                                aria-label="Edit comment"
                                title="Edit comment"
                                onClick={() => {
                                    setEditingCommentId(comment.id)
                                    setEditingCommentContent(comment.content)
                                    setCommentEditError('')
                                }}
                            >
                                <Pencil size={15} />
                            </button>
                        )}


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
                onFocus={(e) => {
                    if (!isAuthenticated) {
                        e.target.blur()
                        requireLogin()
                    }
                }}
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

        {activeImageIndex !== null &&
            Array.isArray(displayImages) &&
            createPortal(
                <div
                    className="post-lightbox"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Post image viewer"
                    onClick={() => setActiveImageIndex(null)}
                >
                    <button
                        type="button"
                        className="post-lightbox-close"
                        onClick={() => setActiveImageIndex(null)}
                        aria-label="Close image"
                    >
                        ×
                    </button>

                    
{displayImages.length > 1 && (
    <button
        type="button"
        className="post-lightbox-prev"
        aria-label="Previous image"
        onClick={(e) => {
            e.stopPropagation()
            setActiveImageIndex(prev =>
                (prev - 1 + displayImages.length) % displayImages.length
            )
        }}
    >
        <ChevronLeft size={28} />
    </button>
)}

        <img
            src={`https://localhost:7151${displayImages[activeImageIndex]}`}
            alt={`Post image ${activeImageIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
        />

        {displayImages.length > 1 && (
            <button
                type="button"
                className="post-lightbox-next"
                aria-label="Next image"
                onClick={(e) => {
                    e.stopPropagation()
                    setActiveImageIndex(prev =>
                        (prev + 1) % displayImages.length
                    )
                }}
            >
                <ChevronRight size={28} />
            </button>
        )}


                    <div className="post-lightbox-counter">
                        {activeImageIndex + 1} / {displayImages.length}
                    </div>
                </div>,
                document.body
            )
        }
    </>
)
}

export default PostCard
