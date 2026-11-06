import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import MainLayout from '../components/MainLayout'
import PostComposer from '../components/PostComposer'
import { useState } from 'react'
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

        <PostComposer />

        <Feed />

        <button onClick={handleLogout}>
            Logout
        </button>
    </div>
</MainLayout>
)
}

export default Home