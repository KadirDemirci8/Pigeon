import PostCard from './PostCard'

function Feed() {
    const posts = [
        {
            id: 1,
            displayName: 'Alex Carter',
            username: 'alexcarter',
            content: 'Sunset views never get old!'
        },
        {
            id: 2,
            displayName: 'Elif Kaya',
            username: 'elifkaya',
            content: 'Coffee, code and a little progress on Pigeon!'
        }
    ]

    return (
        <div className="feed">
            {posts.map((post) => (
                <PostCard key={post.id} post={post} />
            ))}
        </div>
    )
}

export default Feed