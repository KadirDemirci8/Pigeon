
import { useContext } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import AuthContext from '../context/AuthContext'

function ProtectedRoute({ children }) {
    const { token, isCheckingAuth } = useContext(AuthContext)
    const location = useLocation()

    if (isCheckingAuth) {
        return <div>Loading...</div>
    }

    if (!token) {
        return (
            <Navigate
                to="/login"
                state={{ from: location }}
                replace
            />
        )
    }

    return children
}

export default ProtectedRoute
