import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import MainLayout from '../components/MainLayout'
import PostComposer from '../components/PostComposer'
import { useState, useEffect } from 'react'
import axios from 'axios'
import './Home.css'
import Feed from '../components/Feed'



function Home() {
    const { logout } = useContext(AuthContext)
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }
    const [activeTab, setActiveTab] = useState('forYou')
    const [refreshKey, setRefreshKey] = useState(0)

    const [currentUser, setCurrentUser] = useState(null)

useEffect(() => {
    const fetchCurrentUser = async () => {
        try {
            const username = sessionStorage.getItem('username')

            if (!username) return

            const response = await axios.get(
                `https://localhost:7151/api/users/${username}`
            )

            setCurrentUser(response.data)
        } catch (error) {
            console.error('Failed to load current user:', error)
        }
    }

    fetchCurrentUser()
}, [])

    return (
    <MainLayout>
    <div className="home-page">
        <h1>Home</h1>
            <div className="feed-tabs">
                <button
                    type="button"
                    className={activeTab === 'forYou' ? 'active' : ''}
                    onClick={() => setActiveTab('forYou')}
                >
                    For You
                </button>

                <button
                    type="button"
                    className={activeTab === 'following' ? 'active' : ''}
                    onClick={() => setActiveTab('following')}
                >
                    Following
                </button>
            </div>

        <PostComposer
            currentUser={currentUser}
            onPostCreated={() => setRefreshKey(prev => prev + 1)}
        />

       <Feed
            refreshKey={refreshKey}
            currentUserId={Number(sessionStorage.getItem('userId'))}
            currentUser={currentUser}
            onPostDeleted={() => setRefreshKey(prev => prev + 1)}
        />

        <button onClick={handleLogout}>
            Logout
        </button>
    </div>
</MainLayout>
)
}

export default Home