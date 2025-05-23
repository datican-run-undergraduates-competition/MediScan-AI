import { createContext, useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const AuthContext = createContext()

export const useAuth = () => {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token')
    if (token) {
      // TODO: Validate token with backend
      setUser({ username: localStorage.getItem('username') })
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    try {
      setError(null)
      const response = await axios.post('/api/auth/token', {
        username,
        password,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      
      const { access_token } = response.data
      localStorage.setItem('token', access_token)
      localStorage.setItem('username', username)
      
      setUser({ username })
      navigate('/dashboard')
      return true
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
      return false
    }
  }

  const register = async (email, username, password, fullName) => {
    try {
      setError(null)
      await axios.post('/api/auth/register', {
        email,
        username,
        password,
        full_name: fullName,
      })
      
      // Auto login after registration
      return login(username, password)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setUser(null)
    navigate('/login')
  }

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
} 
