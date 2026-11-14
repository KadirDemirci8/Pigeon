
import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'
import { Routes, Route } from 'react-router-dom'

import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Profile from './pages/Profile'
import ProtectedRoute from './components/ProtectedRoute'
import Explore from './pages/Explore'
import Notifications from './pages/Notifications'

function App() {
    const [message, setMessage] = useState('Loading...')

    useEffect(() => {
        axios.get('https://localhost:7151/api/hello')
            .then((response) => {
                setMessage(response.data.message)
            })
            .catch((error) => {
                console.error(error)
                setMessage('Could not connect to API')
            })
    }, [])

    return (
        <Routes>
            <Route
                path="/"
                element={
                    <div>
                        <h1>Welcome to Pigeon</h1>
                        <p>{message}</p>
                    </div>
                }
            />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
                path="/home"
                element={
                    <ProtectedRoute>
                        <Home />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/explore"
                element={
                    <ProtectedRoute>
                        <Explore />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/notifications"
                element={
                    <ProtectedRoute>
                        <Notifications />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/profile/:username"
                element={<Profile />}
            />
        </Routes>
    )
}

export default App
