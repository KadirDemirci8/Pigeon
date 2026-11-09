import { useState, useContext } from 'react'
import AuthContext from '../context/AuthContext'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'


function Login() {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('')
    const navigate = useNavigate()
    const { setToken } = useContext(AuthContext)    
    const handleSubmit = async (e) => {
    e.preventDefault()

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
navigate('/home')
    } catch (error) {
        console.error('Login failed:', error)
        setMessage('Invalid email or password.')
    }
}
    
    return (
    <div>
        <h1>Login to Pigeon</h1>

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
                <label>Password</label>
                <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <button type="submit">Login</button>
            <p>{message}</p>
        </form>
        <p>
            Don't have an account? <Link to="/register">Sign up</Link>
        </p>
    </div>
)
}

export default Login