import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthContext from '../context/AuthContext'


function Home() {
    const { logout } = useContext(AuthContext)
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div>
            <h1>Welcome to Pigeon!</h1>
            <p>You are logged in.</p>

            <button onClick={handleLogout}>
                Logout
            </button>
        </div>
    )
}

export default Home