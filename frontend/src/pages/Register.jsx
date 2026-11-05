import { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'

function Register() {
    const [username, setUsername] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
    e.preventDefault()

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
}

    return (
    <div>
        <h1>Create your Pigeon account</h1>

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

            <button type="submit">Create Account</button>
            <p>{message}</p>
        </form>
        <p>
            Already have an account? <Link to="/login">Log in</Link>
        </p>
    </div>
)
}

export default Register