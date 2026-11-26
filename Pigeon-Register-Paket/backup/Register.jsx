import { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import './Register.css'

function Register() {
    const [username, setUsername] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
    e.preventDefault()


if (password !== confirmPassword) {
    setMessage('Passwords do not match.')
    return
}

setMessage('')

if (isLoading) return
setIsLoading(true)


    try {
        const response = await axios.post(
            'https://localhost:7151/api/auth/register',
            {
                username,
                displayName,
                email,
                password
            }
        )

        setMessage(response.data.message)
        navigate('/login')
    } catch (error) {
        console.error('Registration failed:', error)
        setMessage(error.response?.data?.message || 'Registration failed. Please check your information.')
    }
    finally {
    setIsLoading(false)
}
}

    return (
    <div className="register-page">
    <div className="register-layout">

<section className="register-hero">
    <div className="register-hero-content">
        <h1>
            Your journey begins
            <span> with Pigeon.</span>
        </h1>

        <p>
            Share your thoughts, discover new voices,
            and connect with people around the world.
        </p>
    </div>
</section>
        
        <section className="register-card">
        
<div className="register-card-header">
    <img
        src="/pigeon-logo.png"
        alt="Pigeon"
        className="register-card-logo"
    />

    <h1>Join Pigeon</h1>

    <p>
        Create your account and start sharing!
    </p>
</div>


        <form onSubmit={handleSubmit}>  
            <div>
                <label>Username</label>
                <input
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
            </div>

            <div>
                <label>Display Name</label>
                <input
                    type="text"
                    placeholder="Your display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                />
            </div>

            <div>
                <label>Email</label>
                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <div>
                <label>Password</label>
                <input
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>


            <div>
                <label htmlFor="register-confirm-password">
                    Confirm Password
                </label>

                <input
                    id="register-confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
            </div>


            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
            <p>{message}</p>
        </form>
        <p>
            Already have an account? <Link to="/login">Log in</Link>
        </p>
        </section>
        </div>
    </div>
)
}

export default Register