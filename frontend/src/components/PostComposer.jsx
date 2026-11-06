import { useState } from 'react'
import './PostComposer.css'
import { Image, Smile, BarChart3 } from 'lucide-react'

function PostComposer() {
    const [content, setContent] = useState('')

    return (
        <div className="post-composer">

            <div className="composer-top">
                <div className="composer-avatar">P</div>

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

                <button type="button" className="composer-submit">
                    Post
                </button>
            </div>

        </div>
    )
}

export default PostComposer