import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import AuthContext from '../context/AuthContext'

function ProtectedRoute({ children }) {
    const { token, isCheckingAuth } = useContext(AuthContext)

    if (isCheckingAuth) {
        return <div>Loading...</div>
    }

    if (!token) {
        return <Navigate to="/login" replace />
    }

    return children
}

export default ProtectedRoute