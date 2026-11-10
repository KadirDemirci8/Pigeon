import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import PostCard from '../components/PostCard'
import MainLayout from '../components/MainLayout'
import './Profile.css'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

function Profile() {
    const { username } = useParams()
    const navigate = useNavigate()

    const [profile, setProfile] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editDisplayName, setEditDisplayName] = useState('')
    const [editBio, setEditBio] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [editError, setEditError] = useState('')
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [posts, setPosts] = useState([])

    useEffect(() => {
    const fetchProfile = async () => {
        setLoading(true)
        setNotFound(false)
        setProfile(null)
        setPosts([])

        try {
            const response = await axios.get(
                `https://localhost:7151/api/users/${username}`
            )

            setProfile(response.data)

            const postsResponse = await axios.get(
                `https://localhost:7151/api/posts/user/${username}`
            )

            setPosts(postsResponse.data)

        } catch (error) {
            console.error('Failed to load profile:', error)

            if (error.response?.status === 404) {
                setNotFound(true)
            }

        } finally {
            setLoading(false)
        }
    }

    fetchProfile()
}, [username])

const handleSaveProfile = async () => {
    const displayName = editDisplayName.trim()
    const bio = editBio.trim()

    if (displayName.length < 2 || displayName.length > 50) {
        setEditError('Display name must be between 2 and 50 characters.')
        return
    }

    setIsSaving(true)
    setEditError('')

    try {
        const token = sessionStorage.getItem('accessToken')

        const response = await axios.put(
            'https://localhost:7151/api/users/me',
            {
                displayName,
                bio
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        )

        setProfile(prev => ({
            ...prev,
            displayName: response.data.displayName,
            bio: response.data.bio
        }))

        setIsEditing(false)

    } catch (error) {
        console.error('Failed to update profile:', error)
        setEditError('Could not save profile. Please try again.')
    } finally {
        setIsSaving(false)
    }
}

return (
    <MainLayout>
        <div className="profile-page">
            {isEditing && (
                <div className="edit-modal-overlay">
                    <div className="edit-modal">
                        <h2>Edit Profile</h2>

                        <label htmlFor="edit-display-name">Display Name</label>
                        <input
                            id="edit-display-name"
                            type="text"
                            value={editDisplayName}
                            maxLength={50}
                            onChange={(e) => setEditDisplayName(e.target.value)}
                        />

                        <label htmlFor="edit-bio">Bio</label>
                        <textarea
                            id="edit-bio"
                            value={editBio}
                            maxLength={200}
                            onChange={(e) => setEditBio(e.target.value)}
                            placeholder="Tell us about yourself..."
                            rows={4}
                        />

                        {editError && (
                            <p className="edit-error">{editError}</p>
                        )}
                        <div className="edit-modal-actions">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <button
                type="button"
                className="profile-back-button"
                onClick={() => navigate(-1)}
            >
                <ArrowLeft size={18} />
                <span>Back</span>
            </button>
            {loading && <p>Loading profile...</p>}

                {!loading && notFound && (
                    <p>User not found.</p>
                )}

                {!loading && !notFound && !profile && (
                    <p>Could not load profile. Please try again.</p>
                )}
            {!loading && profile && (
        <>
            <div className="profile-header">
                <div className="profile-cover"></div>

                <div className="profile-info">
                    <div className="profile-avatar">
                    {profile.profileImageUrl ? (
                        <img
                        src={`https://localhost:7151${profile.profileImageUrl}`}
                        alt={`${profile.displayName}'s profile`}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "50%"
                        }}
                        />
                    ) : (
                        profile.displayName?.charAt(0).toUpperCase()
                    )}
                    </div>
                    {Number(sessionStorage.getItem('userId')) === profile.id && (
                        <button
                            type="button"
                            className="profile-edit-button"
                            onClick={() => {
                                setEditDisplayName(profile.displayName)
                                setEditBio(profile.bio || '')
                                setEditError('')
                                setIsEditing(true)
                            }}
                        >
                            Edit Profile
                        </button>
                    )}

                    <h2>{profile.displayName}</h2>
                    <p className="profile-username">@{profile.username}</p>

                    <p className="profile-bio">
                        {profile.bio || 'No bio yet'}
                    </p>
                    <p className="profile-joined">
                        Joined {new Date(profile.createdAt).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric'
                        })}
                    </p>

                </div>
            </div>

                    <div className="profile-tabs">
                        <button type="button" className="profile-tab active">
                            Posts
                        </button>
                    </div>

                    <div className="feed">
                        {posts.length === 0 && (
                        <p className="profile-empty-posts">
                            No posts yet.
                        </p>
                    )}
                    
                        {posts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                currentUserId={Number(sessionStorage.getItem('userId'))}
                                onPostDeleted={() => {
                                    setPosts(prev => prev.filter(p => p.id !== post.id))
                                }}
                            />
                        ))}
                    </div>
                                </>
            )}
        </div>
    </MainLayout>
)
}

export default Profile