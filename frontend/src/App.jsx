
import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import ProtectedRoute from './components/ProtectedRoute'

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
    <Route path="/" element={
      <div>
        <h1>Welcome to Pigeon</h1>
        <p>{message}</p>
      </div>
    } />

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
  </Routes>
  )
}

export default App
