import { useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, LockKeyhole } from 'lucide-react'
import AuthContext from '../context/AuthContext'
import './Login.css'

const API_BASE = 'https://localhost:7151'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { setAuthenticated, sessionExpired, setSessionExpired } = useContext(AuthContext)
    const navigate = useNavigate()
    const location = useLocation()

    const from = location.state?.from
    const destination = from?.pathname
        ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`
        : '/home'

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (loading) return
        setLoading(true)
        setError('')
        try {
            const response = await axios.post(`${API_BASE}/api/auth/login`, {
                email: email.trim(), password
            })
            const { userId, username } = response.data
            if (!userId || !username) throw new Error('Missing user identity')
            await axios.get(`${API_BASE}/api/auth/me`)
            sessionStorage.removeItem('accessToken')
            sessionStorage.setItem('userId', String(userId))
            sessionStorage.setItem('username', username)
            setAuthenticated(true)
            setSessionExpired(false)
            navigate(destination, { replace: true })
        
            } catch (err) {
                console.error('Login failed:', err)

                if (err.response?.status === 429) {
                    setError(
                        'Çok fazla giriş denemesi yaptınız. Lütfen bir dakika sonra tekrar deneyin.'
                    )
                } else {
                    setError('E-posta veya şifre hatalı. Lütfen tekrar deneyin.')
                }
            } finally {
                setLoading(false)
            }

    }

    const loginForm = (prefix) => (
        <form className="pigeon-card-form" onSubmit={handleSubmit}>
            {(location.state?.sessionExpired || sessionExpired) && (
                <p className="pigeon-card-error" role="alert">
                    Your session has expired. Please log in again.
                </p>
            )}
            <label htmlFor={`${prefix}-email`}>E-posta</label>
            <div className="pigeon-field">
                <Mail aria-hidden="true" size={19} />
                <input id={`${prefix}-email`} type="email" autoComplete="email"
                    placeholder="E-posta adresinizi girin" value={email}
                    onChange={e => setEmail(e.target.value)} required />
            </div>
            <label htmlFor={`${prefix}-password`}>Şifre</label>
            <div className="pigeon-field">
                <LockKeyhole aria-hidden="true" size={19} />
                <input id={`${prefix}-password`} type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password" placeholder="Şifrenizi girin"
                    value={password} onChange={e => setPassword(e.target.value)} required />
                <button className="pigeon-visibility" type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}>
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
            </div>
            {error && <p className="pigeon-card-error" role="alert">{error}</p>}
            <button className="pigeon-card-submit" type="submit" disabled={loading}>
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap →'}
            </button>
        </form>
    )

    const card = (prefix) => (
        <section className="pigeon-real-card" aria-label="Pigeon giriş">
            <img className="pigeon-real-logo" src="/pigeon-logo.png" alt="Pigeon" />
            <h1>Hoş geldiniz</h1>
            <p className="pigeon-card-subtitle">Pigeon'a giriş yaparak paylaşmaya, bağlantı kurmaya ve keşfetmeye devam edin.</p>
            {loginForm(prefix)}
            <p className="pigeon-card-signup">Hesabınız yok mu? <Link to="/register">Hesap Oluştur →</Link></p>
        </section>
    )

    return (
        <main className="pigeon-login-page">
            <div className="pigeon-login-artwork">
                <img src="/pigeon-login-reference.png" alt="" className="pigeon-login-reference" draggable="false" />
                {card('pigeon-desktop')}
            </div>
            <div className="pigeon-login-mobile">
                <div className="pigeon-mobile-brand">
                    <img src="/pigeon-logo.png" alt="Pigeon" />
                    <h2>Connect, share, <span>and explore</span></h2>
                </div>
                {card('pigeon-mobile')}
            </div>
        </main>
    )
}
export default Login
