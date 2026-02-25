import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { adminService, AprovacoesPendentes } from '../services/adminService';
import {
  LayoutDashboard,
  Pill,
  Package,
  Users,
  ShoppingCart,
  Settings,
  DollarSign,
  Activity,
  AlertCircle,
  ChevronRight,
  Search,
  Filter,
  Download,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Building2,
  Truck,
  Building,
  Bell
} from 'lucide-react';

interface TabProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon: React.ReactNode;
}

const Tab = ({ active, onClick, children, icon }: TabProps) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-2.5 font-medium text-sm rounded-xl transition-all ${
      active
        ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-farma transform scale-105'
        : 'text-gray-600 hover:text-gray-900 hover:bg-primary-50'
    }`}
  >
    {icon}
    {children}
  </button>
);

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'aprovacoes' | 'medicamentos' | 'pacotes' | 'usuarios' | 'pedidos' | 'configuracoes'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total_usuarios: 0,
    total_pedidos: 0,
    receita_total: 0,
    usuarios_ativos: 0,
    consultas_hoje: 0,
    total_consultas: 0,
    total_pendentes: 0,
    farmacias_pendentes: 0,
    hospitais_pendentes: 0,
    transportes_pendentes: 0
  });
  const [atividades, setAtividades] = useState<any[]>([]);

  // Estados para Medicamentos
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [showMedicamentoModal, setShowMedicamentoModal] = useState(false);
  const [editingMedicamento, setEditingMedicamento] = useState<any>(null);

  // Estados para Pacotes
  const [pacotes, setPacotes] = useState<any[]>([]);
  const [showPacoteModal, setShowPacoteModal] = useState(false);
  const [editingPacote, setEditingPacote] = useState<any>(null);

  // Estados para Usuários
  const [usuarios, setUsuarios] = useState<any[]>([]);

  // Estados para Pedidos
  const [pedidos, setPedidos] = useState<any[]>([]);

  // Estados para Aprovações
  const [aprovacoes, setAprovacoes] = useState<AprovacoesPendentes>({
    farmacias: [],
    hospitais: [],
    transportes: [],
    usuarios: [],
    total: 0
  });

  useEffect(() => {
    const userType = user?.tipo_usuario;
    
    if (userType !== 'admin') {
      navigate('/dashboard');
      return;
    }

    loadData();
  }, [user, navigate, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'dashboard':
          // Carregar estatísticas reais e atividades
          const [statsData, atividadesData] = await Promise.all([
            adminService.getStats(),
            adminService.getAtividades(10)
          ]);
          setStats(statsData);
          setAtividades(atividadesData);
          break;
        case 'aprovacoes':
          const aprovacoesData = await adminService.getAprovacoesPendentes();
          setAprovacoes(aprovacoesData);
          break;
        case 'medicamentos':
          const medsData = await adminService.getMedicamentos();
          setMedicamentos(medsData as any[]);
          break;
        case 'pacotes':
          const pacotesData = await adminService.getPacotes();
          setPacotes(pacotesData as any[]);
          break;
        case 'usuarios':
          const usersData = await adminService.getUsuarios();
          setUsuarios(usersData as any[]);
          break;
        case 'pedidos':
          const pedidosData = await adminService.getPedidos();
          setPedidos(pedidosData as any[]);
          break;
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMedicamento = async (data: any) => {
    try {
      if (editingMedicamento) {
        await adminService.updateMedicamento(editingMedicamento.id, data);
      } else {
        await adminService.createMedicamento(data);
      }
      setShowMedicamentoModal(false);
      setEditingMedicamento(null);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar medicamento:', error);
      alert('Erro ao salvar medicamento');
    }
  };

  const handleDeleteMedicamento = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este medicamento?')) return;
    
    try {
      await adminService.deleteMedicamento(id);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir medicamento:', error);
      alert('Erro ao excluir medicamento');
    }
  };

  const handleSavePacote = async (data: any) => {
    try {
      if (editingPacote) {
        await adminService.updatePacote(editingPacote.id, data);
      } else {
        await adminService.createPacote(data);
      }
      setShowPacoteModal(false);
      setEditingPacote(null);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar pacote:', error);
      alert('Erro ao salvar pacote');
    }
  };

  const handleDeletePacote = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este pacote?')) return;
    
    try {
      await adminService.deletePacote(id);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir pacote:', error);
      alert('Erro ao excluir pacote');
    }
  };

  const handleToggleUsuario = async (id: string, isAtivo: boolean) => {
    try {
      await adminService.toggleUsuario(id, !isAtivo);
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      alert('Erro ao atualizar usuário');
    }
  };

  const handleUpdatePedidoStatus = async (id: string, status: string) => {
    try {
      await adminService.updatePedidoStatus(id, status);
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      alert('Erro ao atualizar pedido');
    }
  };

  // Handlers para Aprovações
  const handleAprovar = async (tipo: 'farmacia' | 'hospital' | 'transporte' | 'usuario', id: string) => {
    try {
      switch (tipo) {
        case 'farmacia':
          await adminService.aprovarFarmacia(id);
          break;
        case 'hospital':
          await adminService.aprovarHospital(id);
          break;
        case 'transporte':
          await adminService.aprovarTransporte(id);
          break;
        case 'usuario':
          await adminService.aprovarUsuario(id);
          break;
      }
      loadData();
      alert('Aprovado com sucesso!');
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      alert('Erro ao aprovar');
    }
  };

  const handleRejeitar = async (tipo: 'farmacia' | 'hospital' | 'transporte' | 'usuario', id: string) => {
    const motivo = prompt('Informe o motivo da rejeição (opcional):');
    try {
      switch (tipo) {
        case 'farmacia':
          await adminService.rejeitarFarmacia(id, motivo || undefined);
          break;
        case 'hospital':
          await adminService.rejeitarHospital(id, motivo || undefined);
          break;
        case 'transporte':
          await adminService.rejeitarTransporte(id, motivo || undefined);
          break;
        case 'usuario':
          await adminService.rejeitarUsuario(id, motivo || undefined);
          break;
      }
      loadData();
      alert('Rejeitado com sucesso!');
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      alert('Erro ao rejeitar');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header Moderno */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <LayoutDashboard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Painel Administrativo
                  </h1>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Gestão completa do sistema FarmaDom
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-2xl shadow-lg p-2">
          <div className="flex flex-wrap gap-2">
            <Tab 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')}
              icon={<LayoutDashboard className="w-4 h-4" />}
            >
              Dashboard
            </Tab>
            <Tab 
              active={activeTab === 'aprovacoes'} 
              onClick={() => setActiveTab('aprovacoes')}
              icon={<Bell className="w-4 h-4" />}
            >
              Aprovações {stats.total_pendentes > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {stats.total_pendentes}
                </span>
              )}
            </Tab>
            <Tab 
              active={activeTab === 'medicamentos'} 
              onClick={() => setActiveTab('medicamentos')}
              icon={<Pill className="w-4 h-4" />}
            >
              Medicamentos
            </Tab>
            <Tab 
              active={activeTab === 'pacotes'} 
              onClick={() => setActiveTab('pacotes')}
              icon={<Package className="w-4 h-4" />}
            >
              Pacotes
            </Tab>
            <Tab 
              active={activeTab === 'usuarios'} 
              onClick={() => setActiveTab('usuarios')}
              icon={<Users className="w-4 h-4" />}
            >
              Usuários
            </Tab>
            <Tab 
              active={activeTab === 'pedidos'} 
              onClick={() => setActiveTab('pedidos')}
              icon={<ShoppingCart className="w-4 h-4" />}
            >
              Pedidos
            </Tab>
            <Tab 
              active={activeTab === 'configuracoes'} 
              onClick={() => setActiveTab('configuracoes')}
              icon={<Settings className="w-4 h-4" />}
            >
              Configurações
            </Tab>
          </div>
        </div>

        {/* Content */}
        <div className="mt-6">
          {loading ? (
            <div className="flex justify-center items-center h-96 bg-white rounded-2xl shadow-lg">
              <div className="text-center">
                <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Carregando dados...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && <DashboardTab stats={stats} atividades={atividades} />}

              {/* Aprovações Tab */}
              {activeTab === 'aprovacoes' && (
                <AprovacoesTab
                  aprovacoes={aprovacoes}
                  onAprovar={handleAprovar}
                  onRejeitar={handleRejeitar}
                />
              )}

              {/* Medicamentos Tab */}
              {activeTab === 'medicamentos' && (
                <MedicamentosTab
                  medicamentos={medicamentos}
                  onAdd={() => {
                    setEditingMedicamento(null);
                    setShowMedicamentoModal(true);
                  }}
                  onEdit={(med: any) => {
                    setEditingMedicamento(med);
                    setShowMedicamentoModal(true);
                  }}
                  onDelete={handleDeleteMedicamento}
                />
              )}

              {/* Pacotes Tab */}
              {activeTab === 'pacotes' && (
                <PacotesTab
                  pacotes={pacotes}
                  onAdd={() => {
                    setEditingPacote(null);
                    setShowPacoteModal(true);
                  }}
                  onEdit={(pac: any) => {
                    setEditingPacote(pac);
                    setShowPacoteModal(true);
                  }}
                  onDelete={handleDeletePacote}
                />
              )}

              {/* Usuários Tab */}
              {activeTab === 'usuarios' && (
                <UsuariosTab usuarios={usuarios} onToggle={handleToggleUsuario} />
              )}

              {/* Pedidos Tab */}
              {activeTab === 'pedidos' && (
                <PedidosTab pedidos={pedidos} onUpdateStatus={handleUpdatePedidoStatus} />
              )}

              {/* Configurações Tab */}
              {activeTab === 'configuracoes' && <ConfiguracoesTab />}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {showMedicamentoModal && (
        <MedicamentoModal
          medicamento={editingMedicamento}
          onClose={() => {
            setShowMedicamentoModal(false);
            setEditingMedicamento(null);
          }}
          onSave={handleSaveMedicamento}
        />
      )}

      {showPacoteModal && (
        <PacoteModal
          pacote={editingPacote}
          onClose={() => {
            setShowPacoteModal(false);
            setEditingPacote(null);
          }}
          onSave={handleSavePacote}
        />
      )}
    </div>
  );
}

// Componente DashboardTab
function DashboardTab({ stats, atividades }: any) {
  const statCards = [
    {
      title: 'Total de Usuários',
      value: stats.total_usuarios || 0,
      icon: <Users className="w-8 h-8" />,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      subtitle: `${stats.usuarios_ativos || 0} ativos`
    },
    {
      title: 'Total de Consultas',
      value: stats.total_consultas || 0,
      icon: <Activity className="w-8 h-8" />,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      subtitle: `${stats.consultas_hoje || 0} hoje`
    },
    {
      title: 'Receita Total',
      value: `${(stats.receita_total || 0).toLocaleString('pt-AO')} Kz`,
      icon: <DollarSign className="w-8 h-8" />,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      subtitle: 'Pedidos entregues'
    },
    {
      title: 'Total de Pedidos',
      value: stats.total_pedidos || 0,
      icon: <ShoppingCart className="w-8 h-8" />,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      subtitle: 'Todos os pedidos'
    }
  ];

  const getAtividadeIcon = (tipo: string) => {
    switch (tipo) {
      case 'pedido':
        return <ShoppingCart className="w-4 h-4" />;
      case 'usuario':
        return <Users className="w-4 h-4" />;
      case 'consulta':
        return <Activity className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getAtividadeColor = (tipo: string) => {
    switch (tipo) {
      case 'pedido':
        return 'text-blue-600';
      case 'usuario':
        return 'text-purple-600';
      case 'consulta':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTempoDecorrido = (dataStr: string) => {
    const data = new Date(dataStr);
    const agora = new Date();
    const diff = agora.getTime() - data.getTime();
    
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return 'Agora mesmo';
    if (minutos < 60) return `Há ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    if (horas < 24) return `Há ${horas} hora${horas > 1 ? 's' : ''}`;
    return `Há ${dias} dia${dias > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <div className={stat.textColor}>{stat.icon}</div>
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${stat.textColor}`}>
                {stat.subtitle}
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-600" />
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all group">
            <div className="p-2 bg-blue-600 rounded-lg group-hover:scale-110 transition-transform">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Adicionar Medicamento</p>
              <p className="text-sm text-gray-600">Cadastrar novo produto</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all group">
            <div className="p-2 bg-purple-600 rounded-lg group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Criar Pacote</p>
              <p className="text-sm text-gray-600">Novo plano de saúde</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all group">
            <div className="p-2 bg-green-600 rounded-lg group-hover:scale-110 transition-transform">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Exportar Relatório</p>
              <p className="text-sm text-gray-600">Dados do sistema</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-blue-600" />
          Atividade Recente
        </h2>
        <div className="space-y-3">
          {atividades.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Nenhuma atividade recente</p>
            </div>
          ) : (
            atividades.map((atividade: any, index: number) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className={getAtividadeColor(atividade.tipo)}>
                  {getAtividadeIcon(atividade.tipo)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{atividade.texto}</p>
                  <p className="text-xs text-gray-500">{atividade.detalhes}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{getTempoDecorrido(atividade.created_at)}</p>
                  {atividade.status && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      {atividade.status}
                    </span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Componente MedicamentosTab
function MedicamentosTab({ medicamentos, onAdd, onEdit, onDelete }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Pill className="w-6 h-6 text-blue-600" />
            Gerenciar Medicamentos
          </h2>
          <p className="text-gray-600 text-sm mt-1">Total: {medicamentos.length} medicamentos</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Search className="w-4 h-4" />
            Buscar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Categoria</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Preço</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estoque</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {medicamentos.map((med: any) => (
              <tr key={med.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <Pill className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{med.nome}</p>
                      <p className="text-xs text-gray-500">{med.fabricante}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                    {med.categoria}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">{med.preco} Kz</td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-medium ${med.estoque < 10 ? 'text-red-600' : 'text-green-600'}`}>
                    {med.estoque} un.
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${
                    med.is_ativo 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {med.is_ativo ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {med.is_ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => onEdit(med)} 
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(med.id)} 
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Componente PacotesTab
function PacotesTab({ pacotes, onAdd, onEdit, onDelete }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-purple-600" />
              Gerenciar Pacotes de Saúde
            </h2>
            <p className="text-gray-600 text-sm mt-1">Total: {pacotes.length} pacotes</p>
          </div>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Adicionar Pacote
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pacotes.map((pac: any) => (
            <div key={pac.id} className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border-2 border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  pac.tipo === 'premium' 
                    ? 'bg-yellow-100 text-yellow-700' 
                    : pac.tipo === 'familiar'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {pac.tipo}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{pac.nome}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{pac.descricao}</p>
              <div className="space-y-2 mb-4 pt-4 border-t border-gray-200">
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {pac.preco_mensal}
                  </p>
                  <span className="text-gray-600 text-sm">Kz/mês</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  Duração: {pac.duracao_meses} meses
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(pac)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => onDelete(pac.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Componente UsuariosTab
function UsuariosTab({ usuarios, onToggle }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-green-600" />
          Gerenciar Usuários
        </h2>
        <p className="text-gray-600 text-sm mt-1">Total: {usuarios.length} usuários</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Usuário</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.map((user: any) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {user.nome_completo?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{user.nome_completo}</p>
                      <p className="text-xs text-gray-500">{user.telefone || 'Sem telefone'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    user.tipo_usuario === 'admin' 
                      ? 'bg-red-100 text-red-700'
                      : user.tipo_usuario === 'medico'
                      ? 'bg-blue-100 text-blue-700'
                      : user.tipo_usuario === 'farmaceutico'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {user.tipo_usuario}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${
                    user.is_ativo 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {user.is_ativo ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {user.is_ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onToggle(user.id, user.is_ativo)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      user.is_ativo 
                        ? 'bg-red-50 text-red-700 hover:bg-red-100' 
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {user.is_ativo ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    {user.is_ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Componente PedidosTab
function PedidosTab({ pedidos, onUpdateStatus }: any) {
  const statusOptions = ['pendente', 'confirmado', 'em_preparacao', 'enviado', 'entregue', 'cancelado'];
  
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pendente: 'bg-yellow-100 text-yellow-700',
      confirmado: 'bg-blue-100 text-blue-700',
      em_preparacao: 'bg-purple-100 text-purple-700',
      enviado: 'bg-indigo-100 text-indigo-700',
      entregue: 'bg-green-100 text-green-700',
      cancelado: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-orange-600" />
          Gerenciar Pedidos
        </h2>
        <p className="text-gray-600 text-sm mt-1">Total: {pedidos.length} pedidos</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pedido</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Data</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pedidos.map((pedido: any) => (
              <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">#{pedido.numero_pedido}</p>
                      <p className="text-xs text-gray-500">{pedido.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">{pedido.usuario_nome || 'N/A'}</p>
                  <p className="text-xs text-gray-500">{pedido.usuario_email || ''}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-gray-900">{parseFloat(pedido.total).toLocaleString('pt-AO')} Kz</p>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={pedido.status}
                    onChange={(e) => onUpdateStatus(pedido.id, e.target.value)}
                    className={`text-xs font-medium px-3 py-1 rounded-full border-0 cursor-pointer ${getStatusColor(pedido.status)}`}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(pedido.created_at).toLocaleDateString('pt-AO', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                    <Eye className="w-4 h-4" />
                    Ver Detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Componente AprovacoesTab
function AprovacoesTab({ aprovacoes, onAprovar, onRejeitar }: { 
  aprovacoes: AprovacoesPendentes; 
  onAprovar: (tipo: 'farmacia' | 'hospital' | 'transporte' | 'usuario', id: string) => void;
  onRejeitar: (tipo: 'farmacia' | 'hospital' | 'transporte' | 'usuario', id: string) => void;
}) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-6 h-6 text-orange-600" />
              Aprovações Pendentes
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Total de {aprovacoes.total} entidades aguardando aprovação
            </p>
          </div>
        </div>
      </div>

      {/* Farmácias Pendentes */}
      {aprovacoes.farmacias.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-green-600" />
            Farmácias ({aprovacoes.farmacias.length})
          </h3>
          <div className="space-y-4">
            {aprovacoes.farmacias.map((farmacia: any) => (
              <div key={farmacia.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{farmacia.nome}</h4>
                    <div className="text-sm text-gray-600">
                      <p>{farmacia.endereco || 'Sem endereço'}, {farmacia.cidade} - {farmacia.provincia}</p>
                      <p className="flex items-center gap-4">
                        <span>Tel: {farmacia.telefone || 'N/A'}</span>
                        <span>Email: {farmacia.email || 'N/A'}</span>
                        <span>Licença: {farmacia.licenca || 'N/A'}</span>
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Cadastrado em: {formatDate(farmacia.created_at)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAprovar('farmacia', farmacia.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => onRejeitar('farmacia', farmacia.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hospitais Pendentes */}
      {aprovacoes.hospitais.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            Hospitais ({aprovacoes.hospitais.length})
          </h3>
          <div className="space-y-4">
            {aprovacoes.hospitais.map((hospital: any) => (
              <div key={hospital.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Building className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{hospital.nome}</h4>
                    <div className="text-sm text-gray-600">
                      <p>{hospital.endereco || 'Sem endereço'}, {hospital.cidade} - {hospital.provincia}</p>
                      <p className="flex items-center gap-4">
                        <span>Tel: {hospital.telefone || 'N/A'}</span>
                        <span>Email: {hospital.email || 'N/A'}</span>
                        <span>Tipo: {hospital.tipo || 'N/A'}</span>
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Cadastrado em: {formatDate(hospital.created_at)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAprovar('hospital', hospital.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => onRejeitar('hospital', hospital.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empresas de Transporte Pendentes */}
      {aprovacoes.transportes.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-purple-600" />
            Empresas de Transporte ({aprovacoes.transportes.length})
          </h3>
          <div className="space-y-4">
            {aprovacoes.transportes.map((transporte: any) => (
              <div key={transporte.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Truck className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{transporte.nome}</h4>
                    <div className="text-sm text-gray-600">
                      <p>{transporte.endereco || 'Sem endereço'}, {transporte.cidade} - {transporte.provincia}</p>
                      <p className="flex items-center gap-4">
                        <span>Tel: {transporte.telefone || 'N/A'}</span>
                        <span>Email: {transporte.email || 'N/A'}</span>
                        <span>CNPJ: {transporte.cnpj || 'N/A'}</span>
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Cadastrado em: {formatDate(transporte.created_at)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAprovar('transporte', transporte.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => onRejeitar('transporte', transporte.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usuários Pendentes */}
      {aprovacoes.usuarios.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-600" />
            Usuários ({aprovacoes.usuarios.length})
          </h3>
          <div className="space-y-4">
            {aprovacoes.usuarios.map((usuario: any) => (
              <div key={usuario.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
                    {usuario.nome_completo?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{usuario.nome_completo}</h4>
                    <div className="text-sm text-gray-600">
                      <p className="flex items-center gap-4">
                        <span>Email: {usuario.email}</span>
                        <span>Tel: {usuario.telefone || 'N/A'}</span>
                      </p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                        usuario.tipo_usuario === 'medico' ? 'bg-blue-100 text-blue-700' :
                        usuario.tipo_usuario === 'farmacia_admin' ? 'bg-green-100 text-green-700' :
                        usuario.tipo_usuario === 'hospital_gerente' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {usuario.tipo_usuario}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Cadastrado em: {formatDate(usuario.created_at)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAprovar('usuario', usuario.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => onRejeitar('usuario', usuario.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensagem quando não há pendentes */}
      {aprovacoes.total === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-12 border border-gray-100 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Tudo em dia!</h3>
          <p className="text-gray-600">Não há aprovações pendentes no momento.</p>
        </div>
      )}
    </div>
  );
}

// Componente ConfiguracoesTab
function ConfiguracoesTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Settings className="w-6 h-6 text-gray-600" />
          Configurações do Sistema
        </h2>
        
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Configurações Gerais
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Sistema</label>
                <input
                  type="text"
                  defaultValue="FarmaDom"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Taxa de Entrega Padrão (Kz)</label>
                  <input
                    type="number"
                    defaultValue="500"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valor Mínimo para Frete Grátis (Kz)</label>
                  <input
                    type="number"
                    defaultValue="5000"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-green-600" />
              Notificações
            </h3>
            <div className="space-y-3">
              <label className="flex items-center p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded mr-3" />
                <div>
                  <span className="text-sm font-medium text-gray-900">Notificações de novos pedidos</span>
                  <p className="text-xs text-gray-500">Receba alertas quando um novo pedido for criado</p>
                </div>
              </label>
              <label className="flex items-center p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded mr-3" />
                <div>
                  <span className="text-sm font-medium text-gray-900">Notificações de pagamentos</span>
                  <p className="text-xs text-gray-500">Alertas sobre confirmações de pagamento</p>
                </div>
              </label>
              <label className="flex items-center p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <input type="checkbox" className="w-5 h-5 text-blue-600 rounded mr-3" />
                <div>
                  <span className="text-sm font-medium text-gray-900">Relatórios diários</span>
                  <p className="text-xs text-gray-500">Receba um resumo diário das atividades</p>
                </div>
              </label>
              <label className="flex items-center p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <input type="checkbox" className="w-5 h-5 text-blue-600 rounded mr-3" />
                <div>
                  <span className="text-sm font-medium text-gray-900">Alertas de estoque baixo</span>
                  <p className="text-xs text-gray-500">Notificações quando o estoque estiver acabando</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 shadow-lg transition-all">
              <CheckCircle className="w-5 h-5" />
              Salvar Configurações
            </button>
            <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal para Medicamento
function MedicamentoModal({ medicamento, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    nome: medicamento?.nome || '',
    principio_ativo: medicamento?.principio_ativo || '',
    fabricante: medicamento?.fabricante || '',
    categoria: medicamento?.categoria || '',
    preco: medicamento?.preco || '',
    estoque: medicamento?.estoque || '',
    prescricao_necessaria: medicamento?.prescricao_necessaria || false,
    descricao: medicamento?.descricao || '',
    is_ativo: medicamento?.is_ativo !== false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform animate-scale-in">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Pill className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">
                {medicamento ? 'Editar Medicamento' : 'Adicionar Medicamento'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nome do Medicamento *</label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Ex: Paracetamol 500mg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Princípio Ativo *</label>
              <input
                type="text"
                required
                value={formData.principio_ativo}
                onChange={(e) => setFormData({ ...formData, principio_ativo: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Ex: Acetaminofeno"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fabricante *</label>
              <input
                type="text"
                required
                value={formData.fabricante}
                onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Ex: Bayer"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Categoria *</label>
              <input
                type="text"
                required
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Ex: Analgésico"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Preço (Kz) *</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.preco}
                onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Estoque *</label>
              <input
                type="number"
                required
                value={formData.estoque}
                onChange={(e) => setFormData({ ...formData, estoque: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Quantidade"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Descrição</label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Informações adicionais sobre o medicamento..."
            />
          </div>
          
          <div className="flex gap-6">
            <label className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors flex-1">
              <input
                type="checkbox"
                checked={formData.prescricao_necessaria}
                onChange={(e) => setFormData({ ...formData, prescricao_necessaria: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <div>
                <span className="text-sm font-semibold text-gray-900">Prescrição Necessária</span>
                <p className="text-xs text-gray-600">Requer receita médica</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors flex-1">
              <input
                type="checkbox"
                checked={formData.is_ativo}
                onChange={(e) => setFormData({ ...formData, is_ativo: e.target.checked })}
                className="w-5 h-5 text-green-600 rounded"
              />
              <div>
                <span className="text-sm font-semibold text-gray-900">Medicamento Ativo</span>
                <p className="text-xs text-gray-600">Disponível para venda</p>
              </div>
            </label>
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 shadow-lg transition-all font-semibold"
            >
              <CheckCircle className="w-5 h-5" />
              Salvar Medicamento
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal para Pacote
function PacoteModal({ pacote, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    nome: pacote?.nome || '',
    descricao: pacote?.descricao || '',
    tipo: pacote?.tipo || 'individual',
    preco_mensal: pacote?.preco_mensal || '',
    duracao_meses: pacote?.duracao_meses || 1,
    limite_consultas: pacote?.limite_consultas || '',
    desconto_medicamentos: pacote?.desconto_medicamentos || '',
    is_ativo: pacote?.is_ativo !== false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform animate-scale-in">
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">
                {pacote ? 'Editar Pacote' : 'Adicionar Pacote'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nome do Pacote *</label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                placeholder="Ex: Pacote Familiar Premium"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Pacote *</label>
              <select
                required
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              >
                <option value="individual">Individual</option>
                <option value="familiar">Familiar</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Duração (meses) *</label>
              <input
                type="number"
                required
                value={formData.duracao_meses}
                onChange={(e) => setFormData({ ...formData, duracao_meses: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                placeholder="1"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Preço Mensal (Kz) *</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.preco_mensal}
                onChange={(e) => setFormData({ ...formData, preco_mensal: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Limite de Consultas</label>
              <input
                type="number"
                value={formData.limite_consultas}
                onChange={(e) => setFormData({ ...formData, limite_consultas: e.target.value })}
                placeholder="Ilimitado"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">Deixe vazio para ilimitado</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Desconto em Medicamentos (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.desconto_medicamentos}
                onChange={(e) => setFormData({ ...formData, desconto_medicamentos: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                placeholder="0"
                min="0"
                max="100"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Descrição do Pacote *</label>
            <textarea
              required
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              placeholder="Descreva os benefícios e recursos incluídos neste pacote..."
            />
          </div>
          
          <label className="flex items-center gap-3 p-4 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors">
            <input
              type="checkbox"
              checked={formData.is_ativo}
              onChange={(e) => setFormData({ ...formData, is_ativo: e.target.checked })}
              className="w-5 h-5 text-green-600 rounded"
            />
            <div>
              <span className="text-sm font-semibold text-gray-900">Pacote Ativo</span>
              <p className="text-xs text-gray-600">Disponível para contratação</p>
            </div>
          </label>
          
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 shadow-lg transition-all font-semibold"
            >
              <CheckCircle className="w-5 h-5" />
              Salvar Pacote
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
