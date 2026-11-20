
import { useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import axios from 'axios'

import AuthContext from '../context/AuthContext'
import MainLayout from '../components/MainLayout'
import PostComposer from '../components/PostComposer'
import Feed from '../components/Feed'

import './Home.css'

function Home() {
    const { logout } = useContext(AuthContext)
    const navigate = useNavigate()

    const [activeTab, setActiveTab] = useState('forYou')
    const [refreshKey, setRefreshKey] = useState(0)
    const [currentUser, setCurrentUser] = useState(null)
    const [isPostModalOpen, setIsPostModalOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const refreshFeed = () => {
        setRefreshKey(prev => prev + 1)
    }

    const handleModalPostCreated = () => {
        refreshFeed()
        setIsPostModalOpen(false)
    }

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

    useEffect(() => {
        if (!isPostModalOpen) return

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsPostModalOpen(false)
            }
        }

        window.addEventListener('keydown', handleEscape)

        return () => {
            document.body.style.overflow = previousOverflow
            window.removeEventListener('keydown', handleEscape)
        }
    }, [isPostModalOpen])

    return (
        <MainLayout onPostClick={() => setIsPostModalOpen(true)}>
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
                    onPostCreated={refreshFeed}
                />

                <Feed
                    activeTab={activeTab}
                    refreshKey={refreshKey}
                    currentUserId={Number(sessionStorage.getItem('userId'))}
                    currentUser={currentUser}
                    onPostDeleted={refreshFeed}
                />

                <button onClick={handleLogout}>
                    Logout
                </button>
            </div>

            {isPostModalOpen && createPortal(
                <div
                    className="pigeon-post-modal-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setIsPostModalOpen(false)
                        }
                    }}
                >
                    <section
                        className="pigeon-post-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="pigeon-post-modal-title"
                    >
                        <div className="pigeon-post-modal-header">
                            <h2 id="pigeon-post-modal-title">
                                Create a post
                            </h2>

                            <button
                                type="button"
                                className="pigeon-post-modal-close"
                                aria-label="Close post composer"
                                onClick={() => setIsPostModalOpen(false)}
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="pigeon-post-modal-content">
                            <PostComposer
                                currentUser={currentUser}
                                onPostCreated={handleModalPostCreated}
                            />
                        </div>
                    </section>
                </div>,
                document.body
            )}
        </MainLayout>
    )
}

export default Home
