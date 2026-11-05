import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import MainLayout from '../components/MainLayout'


function Home() {
    const { logout } = useContext(AuthContext)
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
    <MainLayout>
        <div>
            <h1>Welcome to Pigeon!</h1>
            <p>You are logged in.</p>

            <button onClick={handleLogout}>
                Logout
            </button>
        </div>
    </MainLayout>
)
}

export default Home