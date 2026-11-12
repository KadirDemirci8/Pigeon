import { createContext, useState, useEffect } from 'react'
import axios from 'axios'


const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [token, setToken] = useState(
        () => sessionStorage.getItem('accessToken')
    )
    const [isCheckingAuth, setIsCheckingAuth] = useState(true)
    
    const logout = () => {
    sessionStorage.removeItem('accessToken')
    setToken(null)

    }

    useEffect(() => {
    if (!token) {
    setIsCheckingAuth(false)
    return
}

    const validateToken = async () => {
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
            if (error.response?.status === 401) {
                logout()
            } else {
                console.error('Token validation failed:', error)
            }
        }
            finally {
            setIsCheckingAuth(false)
        }
    }

    validateToken()
}, [token])


useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
        response => response,
        error => {
            if (
                error.response?.status === 401 &&
                sessionStorage.getItem('accessToken')
            ) {
                logout()
            }

            return Promise.reject(error)
        }
    )

    return () => {
        axios.interceptors.response.eject(interceptorId)
    }
}, [])


    return (
        <AuthContext.Provider value={{ token, setToken, logout, isCheckingAuth }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext