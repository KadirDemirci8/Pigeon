import { Search } from 'lucide-react'
import './RightPanel.css'
import { useState } from 'react'

function RightPanel() {
    
    const [isFollowingAlex, setIsFollowingAlex] = useState(false)
    const [isFollowingElif, setIsFollowingElif] = useState(false)
    return (
        <div className="right-panel">
            <div className="search-box">
                <Search size={20} />
                <input
                    type="text"
                    placeholder="Search Pigeon..."
                />
            </div>

            <section className="trending-section">
                <h3>Trending</h3>

                <div className="trend-item">
                    <span>Technology · Trending</span>
                    <strong>#ArtificialIntelligence</strong>
                    <small>2.4K posts</small>
                </div>

                <div className="trend-item">
                    <span>Development · Trending</span>
                    <strong>#BuildInPublic</strong>
                    <small>1.2K posts</small>
                </div>

                <div className="trend-item">
                    <span>Lifestyle · Trending</span>
                    <strong>#CoffeeTime</strong>
                    <small>856 posts</small>
                </div>
            </section>

            <section className="follow-section">
                <h3>Who to follow</h3>

                <div className="follow-user">
                    <div className="follow-avatar">A</div>

                    <div className="follow-info">
                        <strong>Alex Carter</strong>
                        <span>@alexcarter</span>
                    </div>

                    <button
                        type="button"
                        className={isFollowingAlex ? 'following' : ''}
                        onClick={() => setIsFollowingAlex(!isFollowingAlex)}
                    >
                        {isFollowingAlex ? 'Following' : 'Follow'}
                    </button>
                </div>

                <div className="follow-user">
                    <div className="follow-avatar">E</div>

                    <div className="follow-info">
                        <strong>Elif Kaya</strong>
                        <span>@elifkaya</span>
                    </div>

                    <button
                        type="button"
                        className={isFollowingElif ? 'following' : ''}
                        onClick={() => setIsFollowingElif(!isFollowingElif)}
                    >
                        {isFollowingElif ? 'Following' : 'Follow'}
                    </button>
                </div>
            </section>
        </div>
    )
}

export default RightPanel