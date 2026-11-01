
import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

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
    <div>
      <h1>Welcome to Pigeon</h1>
      <p>{message}</p>
    </div>
  )
}

export default App
