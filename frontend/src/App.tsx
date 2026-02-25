import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import type { TipoUsuario } from '@/types/database'

// Layouts
import MainLayout from '@/components/layout/MainLayout'
import AuthLayout from '@/components/layout/AuthLayout'

// Pages
import Home from '@/pages/Home'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import Dashboard from '@/pages/Dashboard'
import Consultas from '@/pages/Consultas'
import Medicamentos from '@/pages/Medicamentos'
import HistoricoMedico from '@/pages/HistoricoMedico'
import Pacotes from '@/pages/Pacotes'
import Perfil from '@/pages/Perfil'
import Pedidos from '@/pages/Pedidos'
import Admin from '@/pages/Admin'
import MinhaAssinatura from '@/pages/MinhaAssinatura'
import DashboardMedico from '@/pages/DashboardMedico'

// Pharmacy pages
import DashboardFarmacia from '@/pages/farmacia/DashboardFarmacia'
import GestaoEstoque from '@/pages/farmacia/GestaoEstoque'
import GerirPedidos from '@/pages/farmacia/GerirPedidos'
import RelatoriosFarmacia from '@/pages/farmacia/RelatoriosFarmacia'
import FuncionariosFarmacia from '@/pages/farmacia/FuncionariosFarmacia'

// Hospital pages
import DashboardHospital from '@/pages/hospital/DashboardHospital'
import GerirMedicos from '@/pages/hospital/GerirMedicos'
import ConsultasHospital from '@/pages/hospital/ConsultasHospital'
import RelatoriosHospital from '@/pages/hospital/RelatoriosHospital'

// Transport pages
import DashboardTransporte from '@/pages/transporte/DashboardTransporte'
import GerirEntregas from '@/pages/transporte/GerirEntregas'
import GerirMotoristas from '@/pages/transporte/GerirMotoristas'
import GerirVeiculos from '@/pages/transporte/GerirVeiculos'
import DashboardMotorista from '@/pages/transporte/DashboardMotorista'

// Prescription pages
import MinhasReceitas from '@/pages/receitas/MinhasReceitas'
import CriarReceita from '@/pages/receitas/CriarReceita'
import VerificarReceita from '@/pages/receitas/VerificarReceita'
import ReceitasEmitidas from '@/pages/receitas/ReceitasEmitidas'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Role-based route guard
function RoleRoute({ children, roles }: { children: React.ReactNode; roles: TipoUsuario[] }) {
  const { user } = useAuthStore()

  if (!user || !roles.includes(user.tipo_usuario)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// Pending approval gate
function ApprovedRoute({ children }: { children: React.ReactNode }) {
  const { user, isApproved, isPaciente } = useAuthStore()

  // Patients are auto-approved; others need approval
  if (user && !isPaciente() && !isApproved()) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <div className="text-6xl mb-4">⏳</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Conta Pendente de Aprovação</h2>
        <p className="text-gray-600 max-w-md">
          A sua conta está sendo analisada pela equipa FarmaDom. 
          Receberá uma notificação assim que for aprovada.
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Status: <span className="font-semibold text-yellow-600">{user.status_conta}</span>
        </p>
      </div>
    )
  }

  return <>{children}</>
}

function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
          </Route>

          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Common routes */}
            <Route path="/dashboard" element={<ApprovedRoute><Dashboard /></ApprovedRoute>} />
            <Route path="/perfil" element={<Perfil />} />

            {/* Patient routes */}
            <Route path="/consultas" element={<ApprovedRoute><Consultas /></ApprovedRoute>} />
            <Route path="/medicamentos" element={<ApprovedRoute><Medicamentos /></ApprovedRoute>} />
            <Route path="/historico-medico" element={<ApprovedRoute><HistoricoMedico /></ApprovedRoute>} />
            <Route path="/pacotes" element={<ApprovedRoute><Pacotes /></ApprovedRoute>} />
            <Route path="/minha-assinatura" element={<ApprovedRoute><MinhaAssinatura /></ApprovedRoute>} />
            <Route path="/pedidos" element={<ApprovedRoute><Pedidos /></ApprovedRoute>} />

            {/* Doctor routes */}
            <Route path="/dashboard-medico" element={
              <RoleRoute roles={['medico']}>
                <ApprovedRoute><DashboardMedico /></ApprovedRoute>
              </RoleRoute>
            } />

            {/* Pharmacy routes */}
            <Route path="/farmacia" element={
              <RoleRoute roles={['farmacia_admin', 'farmacia_funcionario']}>
                <ApprovedRoute><DashboardFarmacia /></ApprovedRoute>
              </RoleRoute>
            } />
            <Route path="/farmacia/estoque" element={
              <RoleRoute roles={['farmacia_admin', 'farmacia_funcionario']}>
                <ApprovedRoute><GestaoEstoque /></ApprovedRoute>
              </RoleRoute>
            } />
            <Route path="/farmacia/pedidos" element={
              <RoleRoute roles={['farmacia_admin', 'farmacia_funcionario']}>
                <ApprovedRoute><GerirPedidos /></ApprovedRoute>
              </RoleRoute>
            } />
            <Route path="/farmacia/relatorios" element={
              <RoleRoute roles={['farmacia_admin', 'farmacia_funcionario']}>
                <ApprovedRoute><RelatoriosFarmacia /></ApprovedRoute>
              </RoleRoute>
            } />
            <Route path="/farmacia/funcionarios" element={
              <RoleRoute roles={['farmacia_admin']}>
                <ApprovedRoute><FuncionariosFarmacia /></ApprovedRoute>
              </RoleRoute>
            } />

            {/* Hospital routes */}
            <Route path="/hospital" element={
              <RoleRoute roles={['hospital_gerente']}>
                <ApprovedRoute><DashboardHospital /></ApprovedRoute>
              </RoleRoute>
            } />
            <Route path="/hospital/medicos" element={
              <RoleRoute roles={['hospital_gerente']}>
                <ApprovedRoute><GerirMedicos /></ApprovedRoute>
              </RoleRoute>
            } />
            <Route path="/hospital/consultas" element={
              <RoleRoute roles={['hospital_gerente']}>
                <ApprovedRoute><ConsultasHospital /></ApprovedRoute>
              </RoleRoute>
            } />
            <Route path="/hospital/relatorios" element={
              <RoleRoute roles={['hospital_gerente']}>
                <ApprovedRoute><RelatoriosHospital /></ApprovedRoute>
              </RoleRoute>
            } />

            {/* Transport routes */}
            <Route path="/transporte" element={
              <RoleRoute roles={['transporte_gerente']}>
                <ApprovedRoute><DashboardTransporte /></ApprovedRoute>
              </RoleRoute>
            } />
            <Route path="/transporte/entregas" element={
              <RoleRoute roles={['transporte_gerente']}>
                <ApprovedRoute><GerirEntregas /></ApprovedRoute>
              </RoleRoute>
            } />
            <Route path="/transporte/motoristas" element={
              <RoleRoute roles={['transporte_gerente']}>
                <ApprovedRoute><GerirMotoristas /></ApprovedRoute>
              </RoleRoute>
            } />
            <Route path="/transporte/veiculos" element={
              <RoleRoute roles={['transporte_gerente']}>
                <ApprovedRoute><GerirVeiculos /></ApprovedRoute>
              </RoleRoute>
            } />

            {/* Motorista routes */}
            <Route path="/motorista" element={
              <RoleRoute roles={['motorista']}>
                <ApprovedRoute><DashboardMotorista /></ApprovedRoute>
              </RoleRoute>
            } />

            {/* Prescription routes */}
            <Route path="/receitas" element={<ApprovedRoute><MinhasReceitas /></ApprovedRoute>} />
            <Route path="/receitas/criar" element={
              <RoleRoute roles={['medico']}>
                <ApprovedRoute><CriarReceita /></ApprovedRoute>
              </RoleRoute>
            } />
            <Route path="/receitas/verificar" element={<ApprovedRoute><VerificarReceita /></ApprovedRoute>} />
            <Route path="/receitas/emitidas" element={
              <RoleRoute roles={['medico']}>
                <ApprovedRoute><ReceitasEmitidas /></ApprovedRoute>
              </RoleRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin/*" element={
              <RoleRoute roles={['admin']}>
                <Admin />
              </RoleRoute>
            } />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
