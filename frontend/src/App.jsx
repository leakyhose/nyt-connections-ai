import { useState, useEffect } from 'react'

function App() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setMessage(data.status))
      .catch(err => console.error(err))
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">
          NYT Connections AI
        </h1>
        <p className="text-gray-700">
          Backend Status: <span className="font-semibold">{message || 'Loading...'}</span>
        </p>
      </div>
    </div>
  )
}

export default App
