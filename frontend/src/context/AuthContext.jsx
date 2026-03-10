import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('xauusd_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      localStorage.removeItem('xauusd_user')
      return null
    }
  })

  const login = useCallback((data) => {
    localStorage.setItem('xauusd_token', data.token)
    localStorage.setItem('xauusd_user', JSON.stringify({ username: data.username }))
    setUser({ username: data.username })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('xauusd_token')
    localStorage.removeItem('xauusd_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
