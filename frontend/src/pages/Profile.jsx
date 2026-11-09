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

return (
    <MainLayout>
        <div className="profile-page">
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
                        {profile.displayName.charAt(0)}
                    </div>
                    {Number(sessionStorage.getItem('userId')) === profile.id && (
                        <button type="button" className="profile-edit-button">
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