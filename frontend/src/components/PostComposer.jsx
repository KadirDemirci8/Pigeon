import { useState } from 'react'
import './PostComposer.css'
import { Image, Smile, BarChart3 } from 'lucide-react'
import axios from 'axios'

function PostComposer({ onPostCreated, currentUser }) {
    const [content, setContent] = useState('')
    const handlePost = async () => {
        if (!content.trim()) return

        try {
            const token = sessionStorage.getItem('accessToken')

            await axios.post(
                'https://localhost:7151/api/posts',
                { content: content.trim() },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            setContent('')
            onPostCreated()
        } catch (error) {
            console.error('Failed to create post:', error)
        }
    }

    return (
        <div className="post-composer">

            <div className="composer-top">
                <div className="composer-avatar">
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
                        currentUser?.displayName?.charAt(0) || 'P'
                    )}
                </div>

                <textarea
                    placeholder="What's on your mind?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
            </div>

            <div className="composer-bottom">
                <div className="composer-actions">
                    <button type="button" className="composer-icon">
                        <Image size={20} />
                    </button>

                    <button type="button" className="composer-icon">
                        <Smile size={20} />
                    </button>

                    <button type="button" className="composer-icon">
                        <BarChart3 size={20} />
                    </button>
                </div>

                <button
                    type="button"
                    className="composer-submit"
                    onClick={handlePost}
                    disabled={!content.trim()}
                >
                    Post
                </button>
            </div>

        </div>
    )
}

export default PostComposer