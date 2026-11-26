import { useState, useContext } from 'react'
import AuthContext from '../context/AuthContext'
import axios from 'axios'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Bird } from 'lucide-react'
import './Login.css'


function Login() {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const navigate = useNavigate()


const location = useLocation()

const destination = location.state?.from
    ? `${location.state.from.pathname}${location.state.from.search ?? ''}${location.state.from.hash ?? ''}`
    : '/home'


    const { setToken } = useContext(AuthContext)    
    const handleSubmit = async (e) => {
    e.preventDefault()
    if (isLoading) return
setIsLoading(true)

    try {
        const response = await axios.post(
            'https://localhost:7151/api/auth/login',
            {
                email: email,
                password: password
            }
        )

        sessionStorage.setItem('accessToken', response.data.accessToken)
        sessionStorage.setItem('userId', response.data.userId)
        sessionStorage.setItem('username', response.data.username)
        
        setToken(response.data.accessToken)
        setMessage(response.data.message)
        const meResponse = await axios.get(
    'https://localhost:7151/api/auth/me',
    {
        headers: {
            Authorization: `Bearer ${response.data.accessToken}`
        }
    }
)

console.log('Authenticated user:', meResponse.data)

navigate(destination, { replace: true })

    } catch (error) {
        console.error('Login failed:', error)
        setMessage('Invalid email or password.')
    }

    finally {
    setIsLoading(false)
}
}
    
    return (
    <div className="login-page">
        <div className="login-layout">

        <div className="login-scenery" aria-hidden="true">

            <img
                src="/flying-pigeon.svg"
                alt=""
                className="login-bird-image login-bird-image-large"
            />

            <img
                src="/flying-pigeon.svg"
                alt=""
                className="login-bird-image login-bird-image-small"
            />


            <div className="login-sun"></div>
            <div className="login-mountains"></div>
            <div className="login-lake"></div>
            <div className="login-sun-reflection"></div>
        </div>

        
<section className="login-hero">
    <img
        className="login-hero-logo"
        src="/pigeon-logo.png"
        alt="Pigeon"
    />

    <div className="login-hero-content">
        <h1>
            Connect, share,
            <span>and explore</span>
        </h1>

        <p>
            A friendly social space to post ideas,
            chat, and stay connected with
            the people who matter.
        </p>
    </div>
</section>

<section className="login-card">        
        
<div className="login-card-header">
    <img
        src="/pigeon-logo.png"
        alt="Pigeon"
        className="login-card-logo"
    />

    <h1>Welcome back</h1>

    <p>
        Log in to your Pigeon account
    </p>
</div>


        <form onSubmit={handleSubmit}>
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
                <label htmlFor="login-password">Password</label>

                <div className="login-password-wrapper">
                    <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button
                        type="button"
                        className="login-password-toggle"
                        onClick={() => setShowPassword(prev => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                </div>
            </div>


            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
            </button>
            <p>{message}</p>
        </form>
                <p>
            Don't have an account? <Link to="/register">Sign up</Link>
        </p>
        </section>
        </div>
    </div>
)
}

export default Login