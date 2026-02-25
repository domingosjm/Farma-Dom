import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService, type User, type RegisterData } from '@/services/authService'
import type { TipoUsuario } from '@/types/database'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  login: (email: string, senha: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  signOut: () => Promise<void>
  logout: () => Promise<void>
  initialize: () => Promise<void>
  // Role helpers
  isAdmin: () => boolean
  isMedico: () => boolean
  isPaciente: () => boolean
  isFarmacia: () => boolean
  isHospital: () => boolean
  isTransporte: () => boolean
  isMotorista: () => boolean
  hasRole: (role: TipoUsuario) => boolean
  isApproved: () => boolean
  getDashboardPath: () => string
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: true,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setLoading: (loading) => set({ loading }),

      login: async (email: string, senha: string) => {
        try {
          set({ loading: true })
          const response = await authService.login({ email, senha })
          
          set({
            user: response.user,
            token: response.access_token || response.token,
          })
        } catch (error: any) {
          console.error('Erro ao fazer login:', error)
          throw new Error(error.message || 'Erro ao fazer login')
        } finally {
          set({ loading: false })
        }
      },

      register: async (data: RegisterData) => {
        try {
          set({ loading: true })
          const response = await authService.register(data)
          
          set({
            user: response.user,
            token: response.access_token || response.token,
          })
        } catch (error: any) {
          console.error('Erro ao registrar:', error)
          throw new Error(error.message || 'Erro ao criar conta')
        } finally {
          set({ loading: false })
        }
      },

      signOut: async () => {
        await authService.logout()
        set({ user: null, token: null })
      },

      logout: async () => {
        await authService.logout()
        set({ user: null, token: null })
      },

      initialize: async () => {
        try {
          set({ loading: true })
          
          if (authService.isAuthenticated()) {
            const user = await authService.getCurrentUser()
            set({ user })
          }
        } catch (error) {
          console.error('Erro ao inicializar autenticação:', error)
          await authService.logout()
          set({ user: null, token: null })
        } finally {
          set({ loading: false })
        }
      },

      // Role helper methods
      isAdmin: () => get().user?.tipo_usuario === 'admin',
      isMedico: () => get().user?.tipo_usuario === 'medico',
      isPaciente: () => get().user?.tipo_usuario === 'paciente',
      isFarmacia: () => ['farmacia_admin', 'farmacia_funcionario'].includes(get().user?.tipo_usuario || ''),
      isHospital: () => get().user?.tipo_usuario === 'hospital_gerente',
      isTransporte: () => get().user?.tipo_usuario === 'transporte_gerente',
      isMotorista: () => get().user?.tipo_usuario === 'motorista',
      hasRole: (role: TipoUsuario) => get().user?.tipo_usuario === role,
      isApproved: () => ['ativo', 'aprovada'].includes(get().user?.status_conta || ''),
      
      // Helper para obter o dashboard correto de cada tipo de usuário
      getDashboardPath: () => {
        const user = get().user
        if (!user) return '/dashboard'
        
        switch (user.tipo_usuario) {
          case 'admin':
            return '/admin'
          case 'medico':
            return '/dashboard-medico'
          case 'enfermeiro':
            // Enfermeiros podem usar o dashboard de médico ou ter seu próprio
            return '/dashboard-medico'
          case 'farmacia_admin':
          case 'farmacia_funcionario':
          case 'farmaceutico':
            return '/farmacia'
          case 'hospital_gerente':
            return '/hospital'
          case 'transporte_gerente':
            return '/transporte'
          case 'motorista':
          case 'entregador':
            return '/motorista'
          case 'paciente':
          default:
            return '/dashboard'
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
)
