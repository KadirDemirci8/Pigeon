
import { useEffect, useRef, useState } from 'react'
import './PostComposer.css'
import { Image, Smile, BarChart3, X } from 'lucide-react'
import axios from 'axios'

function PostComposer({ onPostCreated, currentUser }) {
    const [content, setContent] = useState('')
    const [isPosting, setIsPosting] = useState(false)
    const postingRef = useRef(false)
    const [selectedImages, setSelectedImages] = useState([])
    const [imagePreviews, setImagePreviews] = useState([])

    const fileInputRef = useRef(null)

    useEffect(() => {
        const previews = selectedImages.map(file => ({
            file,
            url: URL.createObjectURL(file)
        }))

        setImagePreviews(previews)

        return () => {
            previews.forEach(preview => {
                URL.revokeObjectURL(preview.url)
            })
        }
    }, [selectedImages])

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files || [])

        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp'
        ]

        const maxSize = 5 * 1024 * 1024

        if (selectedImages.length + files.length > 10) {
            alert('You can upload up to 10 images.')
            e.target.value = ''
            return
        }

        for (const file of files) {
            if (!allowedTypes.includes(file.type)) {
                alert('Only JPG, PNG and WEBP images are allowed.')
                e.target.value = ''
                return
            }

            if (file.size === 0 || file.size > maxSize) {
                alert('Each image must be between 1 byte and 5 MB.')
                e.target.value = ''
                return
            }
        }

        
        setSelectedImages(prev => {
            const uniqueFiles = files.filter(file =>
                !prev.some(existing =>
                    existing.name === file.name &&
                    existing.size === file.size &&
                    existing.lastModified === file.lastModified
                )
            )

            return [...prev, ...uniqueFiles]
        })

        e.target.value = ''
    }

    const handleRemoveImage = (index) => {
        setSelectedImages(prev =>
            prev.filter((_, i) => i !== index)
        )
    }

    


const handlePost = async () => {
    if (
        postingRef.current ||
        (!content.trim() && selectedImages.length === 0)
    ) {
        return
    }

    postingRef.current = true
    setIsPosting(true)

    try {

        const token = sessionStorage.getItem('userId')

        const formData = new FormData()
        formData.append('Content', content.trim())

        selectedImages.forEach(file => {
            formData.append('Images', file)
        })

        await axios.post(
            'https://localhost:7151/api/posts/with-images',
            formData,
            {
                headers: {

                }
            }
        )

        setContent('')
        setSelectedImages([])
        onPostCreated()

    } catch (error) {
        console.error('Failed to create post:', error)
        alert('Failed to create post. Please try again.')
    } finally {
    postingRef.current = false
    setIsPosting(false)
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
                    maxLength={1000}
                />
            </div>

            {imagePreviews.length > 0 && (
                <div className="composer-image-previews">
                    {imagePreviews.map((preview, index) => (
                        <div
                            key={preview.url}
                            className="composer-image-preview"
                        >
                            <img
                                src={preview.url}
                                alt={`Selected image ${index + 1}`}
                            />

                            <button
                                type="button"
                                className="composer-remove-image"
                                onClick={() => handleRemoveImage(index)}
                                aria-label="Remove image"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="composer-bottom">
                <div className="composer-actions">

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleImageSelect}
                        style={{ display: 'none' }}
                    />

                    <button
                        type="button"
                        className="composer-icon"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Add images"
                    >
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
                    disabled={isPosting || (!content.trim() && selectedImages.length === 0)}
                >
                    {isPosting ? 'Posting...' : 'Post'}
                </button>

            </div>

        </div>
    )
}

export default PostComposer
