import apiClient from '@/lib/apiClient'
import type { TipoUsuario, StatusConta, TipoEntidade } from '@/types/database'

export interface RegisterData {
  email: string
  senha: string
  nome_completo: string
  telefone: string
  data_nascimento?: string
  tipo_usuario?: TipoUsuario
  nif?: string
  genero?: string
  // Entity-specific fields
  nome_entidade?: string      // farmacia/hospital/transporte name
  endereco?: string
  cidade?: string
  provincia?: string
  zona?: string               // farmacia zone
  alvara?: string             // farmacia license
  especialidade?: string      // medico
  numero_ordem?: string       // medico
  especialidades?: string[]   // hospital
  tipo_hospital?: string      // hospital
}

export interface LoginData {
  email: string
  senha: string
}

export interface User {
  id: string
  nome_completo: string
  email: string
  telefone: string
  tipo_usuario: TipoUsuario
  status_conta: StatusConta
  entidade_id?: string | null
  entidade_tipo?: TipoEntidade | null
  nif?: string
  data_nascimento?: string
  genero?: string
  foto_perfil?: string
  endereco_completo?: string
  cidade?: string
  provincia?: string
  is_ativo: boolean
  created_at: string
}

export interface AuthResponse {
  user: User
  access_token: string
  token: string
  token_type: string
}

export const authService = {
  // Registrar novo usuário
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/registrar', data)
    
    const token = response.access_token || response.token
    if (token) {
      apiClient.setToken(token)
      localStorage.setItem('user', JSON.stringify(response.user))
    }
    
    return response
  },

  // Login
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data)
    
    const token = response.access_token || response.token
    if (token) {
      apiClient.setToken(token)
      localStorage.setItem('user', JSON.stringify(response.user))
    }
    
    return response
  },

  // Logout
  async logout() {
    apiClient.setToken(null)
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  },

  // Obter usuário atual
  async getCurrentUser(): Promise<User> {
    return await apiClient.get<User>('/auth/me')
  },

  // Atualizar perfil
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>('/auth/me', data)
    
    // Atualizar cache local
    localStorage.setItem('user', JSON.stringify(response))
    
    return response
  },

  // Obter usuário do cache
  getCachedUser(): User | null {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },

  // Verificar se está autenticado
  isAuthenticated(): boolean {
    return !!apiClient.getToken()
  },
}
