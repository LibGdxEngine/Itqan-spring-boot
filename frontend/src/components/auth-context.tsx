"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { authApi, AuthResponse } from "@/lib/auth"
import api, { getErrorMessage } from "@/lib/api-axios"
import { OpenAPI } from "@/lib/api/core/OpenAPI"
import { clearTokens, getAccessToken, getValidAccessToken, setTokens } from "@/lib/token-store"

// Initialize OpenAPI configuration. TOKEN is a resolver so every generated-client call
// picks up the latest (silently refreshed) access token.
if (typeof window !== "undefined") {
  OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  OpenAPI.TOKEN = async () => (await getValidAccessToken()) ?? "";
}

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'
  superAdmin?: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>
  logout: () => void
  loginWithGoogle: (idToken: string) => Promise<void>
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = React.useState<User | null>(null)
  const [token, setToken] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  // Load auth state from localStorage on mount
  React.useEffect(() => {
    // Ensure Base URL is correct
    OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('auth_user')
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        // Invalid stored user, clear auth state
        clearTokens()
      }
    }
    setIsLoading(false)
  }, [])

  const handleAuthResponse = (response: AuthResponse) => {
    const userData: User = {
      id: response.id,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: response.role,
      superAdmin: response.superAdmin ?? false,
    }
    
    setToken(response.token)
    setUser(userData)
    setTokens(response.token, response.refreshToken)
    localStorage.setItem('auth_user', JSON.stringify(userData))
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password })
      handleAuthResponse(response)
      router.push('/courses')
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  }

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const response = await authApi.register({ email, password, firstName, lastName })
      handleAuthResponse(response)
      router.push('/courses')
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  }

  const loginWithGoogle = async (idToken: string) => {
    try {
      const response = await authApi.googleAuth({ idToken })
      handleAuthResponse(response)
      router.push('/courses')
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  }

  const logout = () => {
    // Revoke refresh tokens server-side; local logout proceeds even if this fails.
    const accessToken = getAccessToken()
    if (accessToken) {
      api.post('/api/auth/logout', null, { headers: { Authorization: `Bearer ${accessToken}` } }).catch(() => {})
    }
    setToken(null)
    setUser(null)
    clearTokens()
    router.push('/login')
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    register,
    logout,
    loginWithGoogle,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
