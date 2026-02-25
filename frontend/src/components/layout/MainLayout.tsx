import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { 
  Home, Pill, Calendar, Package, FileText, ShoppingCart, 
  Settings, User, LogOut, Bell, Menu, X, Heart,
  Stethoscope, Building2, Truck
} from 'lucide-react'
import { useState } from 'react'

export default function MainLayout() {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Verificar tipo de usuário corretamente
  const isAdmin = user?.tipo_usuario === 'admin'
  const isMedico = user?.tipo_usuario === 'medico'
  const isFarmacia = user?.tipo_usuario?.startsWith('farmacia') || user?.tipo_usuario === 'farmaceutico'
  const isHospital = user?.tipo_usuario?.startsWith('hospital')
  const isTransporte = user?.tipo_usuario?.startsWith('transporte') || user?.tipo_usuario === 'motorista' || user?.tipo_usuario === 'entregador'
  
  // Não mostrar navegação na home
  const showNav = location.pathname !== '/'

  const NavLink = ({ to, icon: Icon, children, badge }: { to: string; icon: any; children: React.ReactNode; badge?: number }) => {
    const isActive = location.pathname === to
    return (
      <Link
        to={to}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? 'bg-primary-100 text-primary-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : ''}`} />
        <span>{children}</span>
        {badge !== undefined && badge > 0 && (
          <span className="ml-auto bg-accent-500 text-white text-xs px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </Link>
    )
  }

  const getNavigationItems = () => {
    if (isMedico) {
      return [
        { to: '/dashboard-medico', icon: Stethoscope, label: 'Dashboard' },
        { to: '/consultas', icon: Calendar, label: 'Minhas Consultas' },
        { to: '/historico-medico', icon: FileText, label: 'Histórico' },
      ]
    }
    
    if (isFarmacia) {
      return [
        { to: '/farmacia', icon: Building2, label: 'Dashboard' },
        { to: '/farmacia/pedidos', icon: ShoppingCart, label: 'Pedidos' },
        { to: '/farmacia/estoque', icon: Package, label: 'Estoque' },
      ]
    }

    if (isHospital) {
      return [
        { to: '/hospital', icon: Building2, label: 'Dashboard' },
        { to: '/hospital/consultas', icon: Calendar, label: 'Consultas' },
        { to: '/hospital/medicos', icon: Stethoscope, label: 'Médicos' },
      ]
    }

    if (isTransporte) {
      return [
        { to: '/transporte', icon: Truck, label: 'Dashboard' },
        { to: '/motorista', icon: Package, label: 'Entregas' },
      ]
    }

    // Paciente (default)
    return [
      { to: '/dashboard', icon: Home, label: 'Dashboard' },
      { to: '/medicamentos', icon: Pill, label: 'Medicamentos' },
      { to: '/consultas', icon: Calendar, label: 'Consultas' },
      { to: '/pacotes', icon: Package, label: 'Pacotes' },
      { to: '/minha-assinatura', icon: FileText, label: 'Minha Assinatura' },
      { to: '/pedidos', icon: ShoppingCart, label: 'Meus Pedidos' },
    ]
  }

  const handleLogout = () => {
    logout()
    window.location.href = '/'
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-accent-50/20">
      {showNav && user && (
        <>
          {/* Desktop Navigation */}
          <nav className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm z-40">
            {/* Logo */}
            <div className="px-6 py-5 border-b border-gray-100">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 via-primary-500 to-accent-600 rounded-xl flex items-center justify-center shadow-farma">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold text-farma-gradient">FarmaDom</span>
                  <p className="text-xs text-gray-500">Saúde ao domicílio</p>
                </div>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="px-4 py-6 space-y-1">
              {getNavigationItems().map((item) => (
                <NavLink key={item.to} to={item.to} icon={item.icon}>
                  {item.label}
                </NavLink>
              ))}
              
              {isAdmin && (
                <NavLink to="/admin" icon={Settings}>
                  Administração
                </NavLink>
              )}
            </div>

            {/* User Section */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.nome_completo}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.tipo_usuario?.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/perfil"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  <User className="w-4 h-4" />
                  Perfil
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            </div>
          </nav>

          {/* Mobile Header */}
          <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-lg border-b border-gray-200 z-50">
            <div className="flex items-center justify-between h-full px-4">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-farma-gradient">FarmaDom</span>
              </Link>
              
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Bell className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </header>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
              <div 
                className="absolute right-0 top-16 bottom-0 w-72 bg-white shadow-xl animate-slide-down"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-4 space-y-1">
                  {getNavigationItems().map((item) => (
                    <NavLink key={item.to} to={item.to} icon={item.icon}>
                      {item.label}
                    </NavLink>
                  ))}
                  {isAdmin && (
                    <NavLink to="/admin" icon={Settings}>
                      Administração
                    </NavLink>
                  )}
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user?.nome_completo}</p>
                      <p className="text-xs text-gray-500 capitalize">{user?.tipo_usuario}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-100 rounded-lg transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair da conta
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Main Content */}
      <main className={showNav && user ? 'lg:pl-64 pt-16 lg:pt-0' : ''}>
        <Outlet />
      </main>
    </div>
  )
}
