import { useState, useEffect } from 'react'

export default function App() {
  const [message, setMessage] = useState('Loading...')

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api')
      const text = await res.text()
      setMessage(text)
    }
    fetchData()
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold underline">Lessgoo Bhrr!</h1>
      <p>Message from server: {message}</p>
    </div>
  )
}