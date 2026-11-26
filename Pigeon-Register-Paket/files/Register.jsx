import { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import './Register.css'

function Register() {
    const [username, setUsername] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (isLoading) return

        if (password !== confirmPassword) {
            setMessage('Passwords do not match.')
            return
        }

        setMessage('')
        setIsLoading(true)

        try {
            const response = await axios.post('https://localhost:7151/api/auth/register', {
                username,
                displayName,
                email,
                password
            })

            setMessage(response.data.message)
            navigate('/login')
        } catch (error) {
            console.error('Registration failed:', error)
            setMessage(error.response?.data?.message || 'Registration failed. Please check your information.')
        } finally {
            setIsLoading(false)
        }
    }

    const registrationForm = (prefix) => (
        <form className="register-live-form" onSubmit={handleSubmit}>
            <div className="register-input-row">
                <label htmlFor={`${prefix}-username`}>Username</label>
                <input
                    id={`${prefix}-username`}
                    type="text"
                    autoComplete="username"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
            </div>
            <div className="register-input-row">
                <label htmlFor={`${prefix}-display-name`}>Display Name</label>
                <input
                    id={`${prefix}-display-name`}
                    type="text"
                    autoComplete="nickname"
                    placeholder="Your display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                />
            </div>
            <div className="register-input-row">
                <label htmlFor={`${prefix}-email`}>Email</label>
                <input
                    id={`${prefix}-email`}
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div className="register-input-row">
                <label htmlFor={`${prefix}-password`}>Password</label>
                <div className="register-password-field">
                    <input
                        id={`${prefix}-password`}
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button
                        className="register-password-eye"
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>
            <div className="register-input-row">
                <label htmlFor={`${prefix}-confirm-password`}>Confirm Password</label>
                <div className="register-password-field">
                    <input
                        id={`${prefix}-confirm-password`}
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <button
                        className="register-password-eye"
                        type="button"
                        onClick={() => setShowConfirmPassword((current) => !current)}
                        aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                    >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>
            <button className="register-primary-button" type="submit" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
            {message && <p className="register-feedback" role="alert">{message}</p>}
        </form>
    )

    const cardContent = (prefix) => (
        <>
            <div className="register-card-heading">
                <img src="/pigeon-logo.png" alt="Pigeon" className="register-card-logo" />
                <h2>Join Pigeon</h2>
                <p>Create your account and start sharing!</p>
            </div>
            {registrationForm(prefix)}
            <p className="register-login-link">
                Already have an account? <Link to="/login">Log in</Link>
            </p>
        </>
    )

    return (
        <main className="pigeon-register-page">
            <div className="pigeon-register-artwork">
                <img
                    className="pigeon-register-reference"
                    src="/pigeon-register-reference.png"
                    alt=""
                    aria-hidden="true"
                    draggable="false"
                />
                <section className="pigeon-register-hero" aria-label="Welcome to Pigeon">
                    <h1>Your journey begins <span>with Pigeon.</span></h1>
                    <p>Share your thoughts, discover new voices, and connect with people around the world.</p>
                </section>
                <section className="pigeon-register-card" aria-label="Create your Pigeon account">
                    {cardContent('desktop-register')}
                </section>
            </div>
            <div className="pigeon-register-mobile">
                <div className="pigeon-register-mobile-hero">
                    <img src="/pigeon-logo.png" alt="Pigeon" />
                    <h1>Your journey begins <span>with Pigeon.</span></h1>
                </div>
                <section className="pigeon-register-mobile-card" aria-label="Create your Pigeon account">
                    {cardContent('mobile-register')}
                </section>
            </div>
        </main>
    )
}

export default Register
