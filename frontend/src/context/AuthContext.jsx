import { createContext, useState, useEffect, useCallback, useContext } from 'react'
import axios from 'axios'
import { clearCsrfToken } from '../services/apiClient'

const AuthContext = createContext(null)
const API_BASE = 'https://localhost:7151'

export function AuthProvider({ children }) {
    const [isAuthenticated, setAuthenticated] = useState(false)
    const [isCheckingAuth, setIsCheckingAuth] = useState(true)
    const [sessionExpired, setSessionExpired] = useState(false)

    const clearLocalSession = useCallback((expired = false) => {
        sessionStorage.removeItem('accessToken')
        sessionStorage.removeItem('userId')
        sessionStorage.removeItem('username')
        setAuthenticated(false)
        setSessionExpired(expired)
        setIsCheckingAuth(false)
    }, [])

    const logout = useCallback(async () => {
        // Do not claim that logout succeeded unless the backend cleared the cookie.
        await axios.post(`${API_BASE}/api/auth/logout`, {})
        clearCsrfToken()
        clearLocalSession(false)
    }, [clearLocalSession])

    useEffect(() => {
        let cancelled = false
        const restoreSession = async () => {
            try {
                const { data } = await axios.get(`${API_BASE}/api/auth/me`)
                if (cancelled) return
                sessionStorage.removeItem('accessToken')
                sessionStorage.setItem('userId', String(data.userId))
                sessionStorage.setItem('username', data.username)
                setAuthenticated(true)
                setSessionExpired(false)
            } catch (error) {
                if (!cancelled) {
                    if (error.response?.status === 401) {
                        clearLocalSession(Boolean(sessionStorage.getItem('userId')))
                    } else {
                        // Network errors are not proof of a signed-out session.
                        console.error('Session verification failed:', error)
                        clearLocalSession(false)
                    }
                }
            } finally {
                if (!cancelled) setIsCheckingAuth(false)
            }
        }
        restoreSession()
        return () => { cancelled = true }
    }, [clearLocalSession])

    useEffect(() => {
        const interceptorId = axios.interceptors.response.use(
            response => response,
            error => {
                const url = error.config?.url ?? ''
                const isAuthEndpoint = /\/api\/auth\/(login|me|csrf|logout)/i.test(url)
                if (error.response?.status === 401 && !isAuthEndpoint) {
                    clearLocalSession(true)
                }
                return Promise.reject(error)
            }
        )
        return () => axios.interceptors.response.eject(interceptorId)
    }, [clearLocalSession])

    return (
        <AuthContext.Provider value={{
            isAuthenticated, setAuthenticated, logout,
            isCheckingAuth, sessionExpired, setSessionExpired
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
export default AuthContext
