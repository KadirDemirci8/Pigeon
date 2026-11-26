import { useContext, useState } from 'react'
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
    const { setToken } = useContext(AuthContext)
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
                email: email.trim(),
                password
            })
            const { accessToken, userId, username } = response.data
            if (!accessToken) throw new Error('Missing access token')

            // Keep the existing authenticated-user check.
            await axios.get(`${API_BASE}/api/auth/me`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })

            sessionStorage.setItem('accessToken', accessToken)
            sessionStorage.setItem('userId', String(userId))
            sessionStorage.setItem('username', username)
            setToken(accessToken)
            navigate(destination, { replace: true })
        } catch (err) {
            console.error('Login failed:', err)
            setError('E-posta veya şifre hatalı. Lütfen tekrar deneyin.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="pigeon-login-page">
            {/* Desktop: the user's EXACT selected artwork is retained as the entire visual canvas.
                Only its input fields and clickable areas are replaced with working HTML. */}
            <div className="pigeon-login-artwork">
                <img
                    src="/pigeon-login-reference.png"
                    alt=""
                    className="pigeon-login-reference"
                    draggable="false"
                />

                <form onSubmit={handleSubmit} className="pigeon-login-hotspots" aria-label="Pigeon giriş formu">
                    <label className="pigeon-login-sr-only" htmlFor="pigeon-desktop-email">E-posta</label>
                    <div className="pigeon-hotspot pigeon-hotspot-email">
                        <Mail aria-hidden="true" />
                        <input
                            id="pigeon-desktop-email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            placeholder="E-posta adresinizi girin"
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />
                    </div>

                    <label className="pigeon-login-sr-only" htmlFor="pigeon-desktop-password">Şifre</label>
                    <div className="pigeon-hotspot pigeon-hotspot-password">
                        <LockKeyhole aria-hidden="true" />
                        <input
                            id="pigeon-desktop-password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            value={password}
                            placeholder="Şifrenizi girin"
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />
                        <button
                            className="pigeon-password-eye"
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                        >
                            {showPassword ? <EyeOff /> : <Eye />}
                        </button>
                    </div>

                    <button
                        className="pigeon-hotspot pigeon-hotspot-submit"
                        type="submit"
                        disabled={loading}
                        aria-label="Giriş Yap"
                    >
                        {loading && <span className="pigeon-submit-loading">Giriş yapılıyor...</span>}
                    </button>
                    <span className="pigeon-hotspot pigeon-hotspot-forgot" title="Şifre sıfırlama henüz kullanıma açık değil" aria-label="Şifre sıfırlama henüz kullanıma açık değil" />
                    <span className="pigeon-hotspot pigeon-hotspot-google" title="Google ile giriş henüz kullanıma açık değil" aria-label="Google ile giriş henüz kullanıma açık değil" />
                    <Link className="pigeon-hotspot pigeon-hotspot-signup" to="/register" aria-label="Hesap oluştur" />
                    {error && <p className="pigeon-login-error" role="alert">{error}</p>}
                </form>
            </div>

            {/* Small screens get a real reflowing, accessible form. */}
            <div className="pigeon-login-mobile">
                <div className="pigeon-mobile-brand">
                    <img src="/pigeon-logo.png" alt="Pigeon" />
                    <h1>Connect, share, <span>and explore</span></h1>
                </div>
                <section className="pigeon-mobile-card">
                    <h2>Hoş geldiniz</h2>
                    <p>Pigeon'a giriş yaparak paylaşmaya ve keşfetmeye devam edin.</p>
                    <form onSubmit={handleSubmit}>
                        <label htmlFor="pigeon-mobile-email">E-posta</label>
                        <input id="pigeon-mobile-email" type="email" autoComplete="email" value={email}
                            placeholder="E-posta adresinizi girin" onChange={(e) => setEmail(e.target.value)} required />
                        <label htmlFor="pigeon-mobile-password">Şifre</label>
                        <div className="pigeon-mobile-password">
                            <input id="pigeon-mobile-password" type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password" value={password} placeholder="Şifrenizi girin"
                                onChange={(e) => setPassword(e.target.value)} required />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}>
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {error && <p className="pigeon-mobile-error" role="alert">{error}</p>}
                        <button className="pigeon-mobile-submit" type="submit" disabled={loading}>
                            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap →'}
                        </button>
                    </form>
                    <p className="pigeon-mobile-signup">Hesabınız yok mu? <Link to="/register">Hesap Oluştur →</Link></p>
                </section>
            </div>
        </main>
    )
}

export default Login
