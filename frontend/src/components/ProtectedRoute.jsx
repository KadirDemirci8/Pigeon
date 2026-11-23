
import { useContext } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import AuthContext from '../context/AuthContext'

function ProtectedRoute({ children }) {
    const {
        isAuthenticated,
        isCheckingAuth,
        sessionExpired
    } = useContext(AuthContext)

    const location = useLocation()

    if (isCheckingAuth) {
        return <div>Loading...</div>
    }

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                state={{
                    from: location,
                    sessionExpired
                }}
                replace
            />
        )
    }

    return children
}

export default ProtectedRoute
