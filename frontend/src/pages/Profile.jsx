import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import PostCard from '../components/PostCard'
import MainLayout from '../components/MainLayout'
import './Profile.css'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera } from 'lucide-react'

function Profile() {
    const { username } = useParams()
    const navigate = useNavigate()

    const [profile, setProfile] = useState(null)
    const [followersCount, setFollowersCount] = useState(0)
    const [followingCount, setFollowingCount] = useState(0)
    const [isFollowing, setIsFollowing] = useState(false)
    const [currentUser, setCurrentUser] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editDisplayName, setEditDisplayName] = useState('')
    const [editBio, setEditBio] = useState('')
    const [editPhoto, setEditPhoto] = useState(null)
    const [photoPreview, setPhotoPreview] = useState(null)
    const [isSaving, setIsSaving] = useState(false)
    const [editError, setEditError] = useState('')
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [posts, setPosts] = useState([])
    const [isFollowLoading, setIsFollowLoading] = useState(false)
    const [followModal, setFollowModal] = useState(null)
    const [followUsers, setFollowUsers] = useState([])
    const [followSearch, setFollowSearch] = useState('')
    const [followUsersLoading, setFollowUsersLoading] = useState(false)
    const [followUsersError, setFollowUsersError] = useState('')
    const [followUserStatuses, setFollowUserStatuses] = useState({})
    const [followListLoadingId, setFollowListLoadingId] = useState(null)
    const [followActionError, setFollowActionError] = useState('')





useEffect(() => {
    if (!followModal) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscape = (event) => {
        if (event.key === 'Escape') {
            setFollowModal(null)
        }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
        document.body.style.overflow = previousOverflow
        document.removeEventListener('keydown', handleEscape)
    }
}, [followModal])



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

            const token = sessionStorage.getItem('accessToken')

            const followResponse = await axios.get(
                `https://localhost:7151/api/follows/${response.data.id}/status`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            setFollowersCount(followResponse.data.followersCount)
            setFollowingCount(followResponse.data.followingCount)
            setIsFollowing(followResponse.data.isFollowing)

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

useEffect(() => {
    const fetchCurrentUser = async () => {
        try {
            const currentUsername = sessionStorage.getItem('username')

            if (!currentUsername) return

            const response = await axios.get(
                `https://localhost:7151/api/users/${currentUsername}`
            )

            setCurrentUser(response.data)
        } catch (error) {
            console.error('Failed to load current user:', error)
        }
    }

    fetchCurrentUser()
}, [])

const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]

    if (!file) return

    // Sadece JPG ve PNG
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setEditError('Only JPG and PNG files are allowed.')
        return
    }

    // Maksimum 5 MB
    if (file.size > 5 * 1024 * 1024) {
        setEditError('Photo must be smaller than 5 MB.')
        return
    }

    setEditError('')
    setEditPhoto(file)

    // Fotoğrafı yüklemeden önce önizle
    const reader = new FileReader()

    reader.onload = () => {
        setPhotoPreview(reader.result)
    }

    reader.readAsDataURL(file)
}


const fetchFollowUsers = async (type) => {
    if (!profile) return

    setFollowUsersLoading(true)
    setFollowUsers([])
    setFollowUsersError('')

    try {
        const token = sessionStorage.getItem('accessToken')

        const response = await axios.get(
            `https://localhost:7151/api/follows/${profile.id}/${type}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        )

        setFollowUsers(response.data)

        const statuses = {}

        await Promise.all(
            response.data.map(async (user) => {
                const statusResponse = await axios.get(
                    `https://localhost:7151/api/follows/${user.id}/status`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                )

                statuses[user.id] = statusResponse.data.isFollowing
            })
        )

        setFollowUserStatuses(statuses)

    } catch (error) {
        console.error('Failed to load follow users:', error)
        setFollowUsersError('Could not load users. Please try again.')
    } finally {
        setFollowUsersLoading(false)
    }
}



const openFollowModal = (type) => {
    setFollowSearch('')
    setFollowActionError('')
    setFollowModal(type)
    fetchFollowUsers(type)
}




const handleListFollow = async (userId) => {
    if (followListLoadingId !== null) return

    setFollowListLoadingId(userId)
    setFollowActionError('')

    const token = sessionStorage.getItem('accessToken')

    const currentlyFollowing = followUserStatuses[userId]

    try {
        if (currentlyFollowing) {
            await axios.delete(
                `https://localhost:7151/api/follows/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )
        } else {
            await axios.post(
                `https://localhost:7151/api/follows/${userId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )
        }

        setFollowUserStatuses(prev => ({
            ...prev,
            [userId]: !currentlyFollowing
        }))




if (
    followModal === 'following' &&
    currentlyFollowing &&
    profile?.id === Number(sessionStorage.getItem('userId'))
) {
    setFollowUsers(prev =>
        prev.filter(user => user.id !== userId)
    )
}


if (profile?.id === Number(sessionStorage.getItem('userId'))) {
    setFollowingCount(prev =>
        Math.max(0, prev + (currentlyFollowing ? -1 : 1))
    )
}



        // Açık olan profilin takipçi sayısını da güncelle
        if (profile?.id === userId) {
            setFollowersCount(prev =>
                prev + (currentlyFollowing ? -1 : 1)
            )
            setIsFollowing(!currentlyFollowing)
        }


        } catch (error) {
            console.error('Failed to update follow:', error)
            setFollowActionError('Could not update follow. Please try again.')
        } finally {
            setFollowListLoadingId(null)
        }


}


const handleFollow = async () => {
    if (!profile || isFollowLoading) return

    setIsFollowLoading(true)

    try {
        const token = sessionStorage.getItem('accessToken')

        if (isFollowing) {
            await axios.delete(
                `https://localhost:7151/api/follows/${profile.id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            setIsFollowing(false)
            setFollowersCount(prev => prev - 1)
        } else {
            await axios.post(
                `https://localhost:7151/api/follows/${profile.id}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            setIsFollowing(true)
            setFollowersCount(prev => prev + 1)
        }
    } catch (error) {
        console.error('Failed to update follow:', error)
    } finally {
        setIsFollowLoading(false)
    }
}

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

        let profileImageUrl = profile.profileImageUrl

            if (editPhoto) {
                const formData = new FormData()
                formData.append('file', editPhoto)

                const photoResponse = await axios.post(
                    'https://localhost:7151/api/users/me/photo',
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                )

                profileImageUrl = photoResponse.data.profileImageUrl
            }

            setProfile(prev => ({
                ...prev,
                displayName: response.data.displayName,
                bio: response.data.bio,
                profileImageUrl
            }))

            setPosts(prev =>
                prev.map(post => ({
                    ...post,
                    displayName: response.data.displayName,
                    profileImageUrl
                }))
            )

            setEditPhoto(null)
            setPhotoPreview(null)
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

                {followModal && (

                        <div
                            className="follow-modal-overlay"
                            onClick={(e) => {
                                if (e.target === e.currentTarget) {
                                    setFollowModal(null)
                                }
                            }}
                        >

                        <div
                            className="follow-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Follow lists"
                        >

<div className="follow-modal-header">
    <h2>Follow Lists</h2>

    <button
        type="button"
        onClick={() => setFollowModal(null)}
        aria-label="Close"
    >
        ×
    </button>
</div>

            <div className="follow-modal-tabs">
                <button
                    type="button"
                    className={followModal === 'followers' ? 'active' : ''}
                    onClick={() => openFollowModal('followers')}
                >
                    Followers ({followersCount})
                </button>

                <button
                    type="button"
                    className={followModal === 'following' ? 'active' : ''}
                    onClick={() => openFollowModal('following')}
                >
                    Following ({followingCount})
                </button>
            </div>



                            <div className="follow-modal-content">

                            {followActionError && (
                                <p className="follow-action-error" role="alert">
                                    {followActionError}
                                </p>
                            )}


                            <div className="follow-modal-search">
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={followSearch}
                                    onChange={(e) => setFollowSearch(e.target.value)}
                                    aria-label="Search follow list"
                                />
                            </div>


                                {followUsersLoading ? (


                                <p>Loading users...</p>

                                ) : followUsersError ? (
                                    <div className="follow-modal-error" role="alert">
                                        <p>{followUsersError}</p>

                                        <button
                                            type="button"
                                            onClick={() => fetchFollowUsers(followModal)}
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                ) : followUsers.length === 0 ? (


                                    <p>No users to show yet.</p>
                                ) : followUsers.filter(user =>
                                    user.displayName?.toLowerCase().includes(followSearch.toLowerCase()) ||
                                    user.username?.toLowerCase().includes(followSearch.toLowerCase())
                                ).length === 0 ? (
                                    <p>No users found.</p>
                                ) : (


                                followUsers
                                    .filter(user =>
                                        user.displayName?.toLowerCase().includes(followSearch.toLowerCase()) ||
                                        user.username?.toLowerCase().includes(followSearch.toLowerCase())
                                    )
                                    .map(user => (


                                    <div
                                        className="follow-user-row"
                                        key={user.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => {
                                            setFollowModal(null)
                                            navigate(`/profile/${user.username}`)
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                setFollowModal(null)
                                                navigate(`/profile/${user.username}`)
                                            }
                                        }}
                                    >

                                            <div className="follow-user-avatar">
                                                {user.profileImageUrl ? (
                                                    <img
                                                        src={`https://localhost:7151${user.profileImageUrl}`}
                                                        alt={user.displayName}
                                                    />
                                                ) : (
                                                    user.displayName?.charAt(0).toUpperCase()
                                                )}
                                            </div>

                                            <div className="follow-user-info">
                                                <strong>{user.displayName}</strong>
                                                <span>@{user.username}</span>
                                            </div>

                                            {Number(sessionStorage.getItem('userId')) !== user.id && (

                                            <button
                                                type="button"
                                                className={`follow-list-button ${
                                                    followUserStatuses[user.id] ? 'is-following' : ''
                                                }`}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleListFollow(user.id)
                                                }}
                                                disabled={followListLoadingId !== null || followUsersLoading}
                                            >
                                                {followListLoadingId === user.id
                                                    ? 'Loading...'
                                                    : followUserStatuses[user.id]
                                                        ? 'Following'
                                                        : 'Follow'}
                                            </button>

                                            )}

                                        </div>
                                    ))
                                )}
                            </div>

                        </div>
                    </div>
                )}

            {isEditing && (
                <div className="edit-modal-overlay">
                    <div className="edit-modal">
                        <h2>Edit Profile</h2>
                        <div className="edit-photo-section">
                        <div className="edit-photo-avatar">
                            {photoPreview || profile?.profileImageUrl ? (
                                <img
                                    src={
                                        photoPreview ||
                                        `https://localhost:7151${profile.profileImageUrl}`
                                    }
                                    alt="Profile preview"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        borderRadius: '50%'
                                    }}
                                />
                            ) : (
                                profile?.displayName?.charAt(0).toUpperCase()
                            )}
                        </div>

                        <label htmlFor="edit-photo-input">
                            <Camera size={16} />
                            Change Photo
                        </label>

                        <input
                            id="edit-photo-input"
                            type="file"
                            accept="image/jpeg,image/png"
                            onChange={handlePhotoChange}
                        />
                    </div>

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
                                disabled={isSaving}
                                onClick={() => {
                                    setEditPhoto(null)
                                    setPhotoPreview(null)
                                    setEditError('')
                                    setIsEditing(false)
                                }}
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
                    {Number(sessionStorage.getItem('userId')) === profile.id ? (
                        <button
                            type="button"
                            className="profile-edit-button"
                            onClick={() => {
                                setEditDisplayName(profile.displayName)
                                setEditBio(profile.bio || '')
                                setEditPhoto(null)
                                setPhotoPreview(null)
                                setEditError('')
                                setIsEditing(true)
                            }}
                        >
                            Edit Profile
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="profile-edit-button"
                            onClick={handleFollow}
                            disabled={isFollowLoading}
                        >
                            {isFollowLoading
                                ? 'Loading...'
                                : isFollowing
                                    ? 'Following'
                                    : 'Follow'}
                        </button>
                    )}

                    <h2>{profile.displayName}</h2>
                    <p className="profile-username">@{profile.username}</p>

                    <p className="profile-bio">
                        {profile.bio || 'No bio yet'}
                    </p>

                    <div className="profile-follow-stats">
                        <button
                            type="button"
                            onClick={() => openFollowModal('following')}
                        >
                            <strong>{followingCount}</strong> Following
                        </button>

                        <button
                            type="button"
                            onClick={() => openFollowModal('followers')}
                        >
                            <strong>{followersCount}</strong> Followers
                        </button>
                    </div>


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
                                currentUser={currentUser}
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