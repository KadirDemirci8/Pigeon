
import { createContext, useState, useEffect, useCallback, useContext } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [token, setToken] = useState(
        () => sessionStorage.getItem('accessToken')
    )

    const [isCheckingAuth, setIsCheckingAuth] = useState(true)
    const [sessionExpired, setSessionExpired] = useState(false)

    const logout = useCallback((expired = false) => {
        sessionStorage.removeItem('accessToken')
        sessionStorage.removeItem('userId')
        sessionStorage.removeItem('username')

        setToken(null)
        setSessionExpired(expired)
        setIsCheckingAuth(false)
    }, [])

    useEffect(() => {
        if (!token) {
            setIsCheckingAuth(false)
            return
        }

        let cancelled = false

        const validateToken = async () => {
            setIsCheckingAuth(true)

            try {
                await axios.get(
                    'https://localhost:7151/api/auth/me',
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                )
            } catch (error) {
                if (
                    !cancelled &&
                    error.response?.status === 401 &&
                    sessionStorage.getItem('accessToken') === token
                ) {
                    logout(true)
                } else if (!cancelled) {
                    console.error('Token validation failed:', error)
                }
            } finally {
                if (!cancelled) {
                    setIsCheckingAuth(false)
                }
            }
        }

        validateToken()

        return () => {
            cancelled = true
        }
    }, [token, logout])

    useEffect(() => {
        const interceptorId = axios.interceptors.response.use(
            response => response,
            error => {
                const currentToken =
                    sessionStorage.getItem('accessToken')

                const requestAuthorization =
                    error.config?.headers?.Authorization

                const isAuthenticatedRequest =
                    currentToken &&
                    requestAuthorization === `Bearer ${currentToken}`

                if (
                    error.response?.status === 401 &&
                    isAuthenticatedRequest
                ) {
                    logout(true)
                }

                return Promise.reject(error)
            }
        )

        return () => {
            axios.interceptors.response.eject(interceptorId)
        }
    }, [logout])

    return (
        <AuthContext.Provider
            value={{
                token,
                setToken,
                logout,
                isCheckingAuth,
                sessionExpired,
                setSessionExpired
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
export default AuthContext
