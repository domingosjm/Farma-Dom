import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { consultasService, Consulta, CreateConsultaData } from '@/services/consultasService';
import VideoCall from '@/components/VideoCall';
import ChatConsulta from '@/components/ChatConsulta';

const Consultas = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'agendar' | 'historico'>('agendar');
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estado do formulário
  const [tipoConsulta, setTipoConsulta] = useState<'presencial' | 'video' | 'audio' | 'chat'>('video');
  const [especialidadeSelecionada, setEspecialidadeSelecionada] = useState('');
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [horarioSelecionado, setHorarioSelecionado] = useState('');
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const [sintomas, setSintomas] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(null);

  // Estado da videochamada
  const [isInCall, setIsInCall] = useState(false);
  const [callConsultaId, setCallConsultaId] = useState<string | null>(null);

  // Estado do chat
  const [showChat, setShowChat] = useState(false);
  const [chatConsultaId, setChatConsultaId] = useState<string | null>(null);
  const [chatNomePaciente, _setChatNomePaciente] = useState<string | null>(null);
  const [chatNomeMedico, _setChatNomeMedico] = useState<string | null>(null);
  
  // Estado do modal de consulta aberta
  const [consultaAberta, setConsultaAberta] = useState<Consulta | null>(null);
  const [modoVisualizacao, setModoVisualizacao] = useState<'chat' | 'video' | 'opcoes'>('opcoes');

  const especialidades = [
    { id: 'clinico-geral', nome: 'Clínico Geral', preco: 5000, icon: '🩺' },
    { id: 'pediatria', nome: 'Pediatria', preco: 6000, icon: '👶' },
    { id: 'cardiologia', nome: 'Cardiologia', preco: 8000, icon: '❤️' },
    { id: 'ginecologia', nome: 'Ginecologia', preco: 7000, icon: '👩‍⚕️' },
    { id: 'dermatologia', nome: 'Dermatologia', preco: 6500, icon: '🔬' },
    { id: 'psicologia', nome: 'Psicologia', preco: 7500, icon: '🧠' },
    { id: 'ortopedia', nome: 'Ortopedia', preco: 7000, icon: '🦴' },
    { id: 'oftalmologia', nome: 'Oftalmologia', preco: 6000, icon: '👁️' },
  ];

  useEffect(() => {
    if (activeTab === 'historico') {
      loadConsultas();
    }
  }, [activeTab]);

  // Abrir consulta automaticamente se vier do Dashboard
  useEffect(() => {
    if (location.state?.abrirConsulta && consultas.length > 0) {
      const consulta = consultas.find(c => c.id === location.state.abrirConsulta);
      if (consulta) {
        setConsultaAberta(consulta);
        setModoVisualizacao('opcoes');
        setActiveTab('historico');
      }
    }
  }, [location.state, consultas]);

  useEffect(() => {
    if (dataSelecionada && especialidadeSelecionada) {
      loadHorariosDisponiveis();
    }
  }, [dataSelecionada, especialidadeSelecionada]);

  const loadConsultas = async () => {
    try {
      setLoading(true);
      const data = await consultasService.getConsultas();
      setConsultas(data);
    } catch (error) {
      console.error('Erro ao carregar consultas:', error);
      alert('Erro ao carregar consultas');
    } finally {
      setLoading(false);
    }
  };

  const loadHorariosDisponiveis = async () => {
    try {
      const horarios = await consultasService.getHorariosDisponiveis(
        dataSelecionada,
        especialidadeSelecionada
      );
      setHorariosDisponiveis(horarios);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
    }
  };

  const handleAgendarConsulta = async () => {
    if (!especialidadeSelecionada || !dataSelecionada || !horarioSelecionado) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      
      const especialidade = especialidades.find(e => e.id === especialidadeSelecionada);
      const dataHora = `${dataSelecionada} ${horarioSelecionado}:00`;
      
      const consultaData: CreateConsultaData = {
        tipo_consulta: tipoConsulta,
        especialidade: especialidade?.nome || '',
        data_hora_agendada: dataHora,
        sintomas: sintomas || undefined,
        valor: especialidade?.preco || 5000,
      };

      await consultasService.createConsulta(consultaData);
      
      alert('✅ Consulta agendada com sucesso!');
      
      // Resetar formulário
      setEspecialidadeSelecionada('');
      setDataSelecionada('');
      setHorarioSelecionado('');
      setSintomas('');
      setHorariosDisponiveis([]);
      
      // Ir para histórico
      setActiveTab('historico');
    } catch (error: any) {
      console.error('Erro ao agendar consulta:', error);
      alert(error.response?.data?.error || 'Erro ao agendar consulta');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarConsulta = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta consulta?')) return;

    try {
      await consultasService.cancelConsulta(id);
      alert('Consulta cancelada com sucesso');
      loadConsultas();
      setShowModal(false);
    } catch (error) {
      console.error('Erro ao cancelar consulta:', error);
      alert('Erro ao cancelar consulta');
    }
  };

  const handleEndCall = async () => {
    if (callConsultaId) {
      try {
        // Calcular duração da chamada (você pode melhorar isso guardando o tempo de início)
        const duracao_minutos = 30; // Placeholder
        
        await consultasService.finalizarConsulta(callConsultaId, {
          duracao_minutos,
        });
        
        alert('Consulta finalizada com sucesso!');
      } catch (error) {
        console.error('Erro ao finalizar consulta:', error);
      }
    }
    
    setIsInCall(false);
    setCallConsultaId(null);
    loadConsultas();
  };

  // Se estiver em chamada, mostrar componente VideoCall
  if (isInCall && callConsultaId) {
    return (
      <VideoCall
        consultaId={callConsultaId}
        isInitiator={true}
        onEnd={handleEndCall}
        onError={(error) => {
          console.error('Erro na videochamada:', error);
          alert(error);
        }}
      />
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      agendada: 'bg-yellow-100 text-yellow-800',
      confirmada: 'bg-primary-100 text-primary-800',
      em_andamento: 'bg-accent-100 text-accent-800',
      concluida: 'bg-green-100 text-green-800',
      cancelada: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      agendada: 'Agendada',
      confirmada: 'Confirmada',
      em_andamento: 'Em Andamento',
      concluida: 'Concluída',
      cancelada: 'Cancelada',
    };
    return labels[status] || status;
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      data: date.toLocaleDateString('pt-AO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      hora: date.toLocaleTimeString('pt-AO', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl flex items-center justify-center shadow-lg">
              <i className="bi bi-hospital text-white text-2xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Consultas Médicas
              </h1>
              <p className="text-gray-600 text-sm">Agende consultas com especialistas qualificados</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-3 mb-8 bg-white p-2 rounded-2xl shadow-lg border border-gray-100 w-fit">
          <button
            onClick={() => setActiveTab('agendar')}
            className={`px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'agendar'
                ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-xl scale-105'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <i className="bi bi-calendar-plus text-xl"></i>
            Agendar Consulta
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'historico'
                ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-xl scale-105'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <i className="bi bi-clock-history text-xl"></i>
            Minhas Consultas
          </button>
        </div>

        {activeTab === 'agendar' ? (
          <div className="space-y-6">
            {/* Tipo de Consulta */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <i className="bi bi-headset text-2xl text-primary-600"></i>
                <h2 className="text-2xl font-bold text-gray-900">Tipo de Atendimento</h2>
              </div>
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { tipo: 'video' as const, label: 'Vídeo Chamada', icon: 'bi-camera-video-fill', desc: 'Consulta por vídeo' },
                  { tipo: 'audio' as const, label: 'Chamada de Áudio', icon: 'bi-telephone-fill', desc: 'Consulta por áudio' },
                  { tipo: 'chat' as const, label: 'Chat', icon: 'bi-chat-dots-fill', desc: 'Consulta por mensagem' },
                  { tipo: 'presencial' as const, label: 'Presencial', icon: 'bi-hospital', desc: 'Na clínica' },
                ].map(({ tipo, label, icon, desc }) => (
                  <button
                    key={tipo}
                    onClick={() => setTipoConsulta(tipo)}
                    className={`p-6 rounded-2xl border-2 transition-all duration-200 hover:scale-105 ${
                      tipoConsulta === tipo
                        ? 'border-primary-600 bg-gradient-to-br from-primary-50 to-accent-50 shadow-xl'
                        : 'border-gray-200 hover:border-indigo-200 hover:shadow-md'
                    }`}
                  >
                    <i className={`${icon} text-4xl ${tipoConsulta === tipo ? 'text-primary-600' : 'text-gray-400'} mb-3 block`}></i>
                    <h3 className="font-bold text-gray-900 mb-1">{label}</h3>
                    <p className="text-xs text-gray-600">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Especialidades */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <i className="bi bi-heart-pulse text-2xl text-primary-600"></i>
                <h2 className="text-2xl font-bold text-gray-900">Escolha a Especialidade</h2>
              </div>
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                {especialidades.map((esp) => (
                  <button
                    key={esp.id}
                    onClick={() => setEspecialidadeSelecionada(esp.id)}
                    className={`p-6 rounded-2xl border-2 transition-all duration-200 text-left hover:scale-105 ${
                      especialidadeSelecionada === esp.id
                        ? 'border-primary-600 bg-gradient-to-br from-primary-50 to-accent-50 shadow-xl'
                        : 'border-gray-200 hover:border-indigo-200 hover:shadow-md'
                    }`}
                  >
                    <div className="text-3xl mb-3">{esp.icon}</div>
                    <h3 className="font-bold text-gray-900 mb-2">{esp.nome}</h3>
                    <div className="flex items-center gap-1 text-primary-600">
                      <i className="bi bi-cash-coin"></i>
                      <span className="text-sm font-bold">
                        {esp.preco.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Data e Horário */}
            {especialidadeSelecionada && (
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <i className="bi bi-calendar-check text-2xl text-primary-600"></i>
                  <h2 className="text-2xl font-bold text-gray-900">Data e Horário</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <i className="bi bi-calendar3 text-primary-600"></i>
                      Escolha a Data
                    </label>
                    <input
                      type="date"
                      min={getMinDate()}
                      value={dataSelecionada}
                      onChange={(e) => {
                        setDataSelecionada(e.target.value);
                        setHorarioSelecionado('');
                      }}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-lg"
                    />
                  </div>

                  {dataSelecionada && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <i className="bi bi-clock text-primary-600"></i>
                        Horários Disponíveis
                      </label>
                      {horariosDisponiveis.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2">
                          {horariosDisponiveis.map((horario) => (
                            <button
                              key={horario}
                              onClick={() => setHorarioSelecionado(horario)}
                              className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                horarioSelecionado === horario
                                  ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg scale-105'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                              }`}
                            >
                              <i className="bi bi-clock mr-1"></i>
                              {horario}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-8 text-gray-500">
                          <i className="bi bi-hourglass-split animate-pulse text-2xl mr-2"></i>
                          <span className="text-sm">Carregando horários...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sintomas */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <i className="bi bi-file-text text-primary-600"></i>
                    Descreva seus sintomas (opcional)
                  </label>
                  <textarea
                    value={sintomas}
                    onChange={(e) => setSintomas(e.target.value)}
                    rows={4}
                    placeholder="Descreva brevemente o que está sentindo..."
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Botão Agendar */}
                <button
                  onClick={handleAgendarConsulta}
                  disabled={!especialidadeSelecionada || !dataSelecionada || !horarioSelecionado || loading}
                  className="w-full bg-gradient-to-r from-primary-600 to-accent-600 text-white py-5 rounded-xl font-bold text-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 hover:scale-105 duration-200"
                >
                  {loading ? (
                    <>
                      <i className="bi bi-hourglass-split animate-spin"></i>
                      Agendando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle text-2xl"></i>
                      Confirmar Agendamento
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Histórico de Consultas */
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <i className="bi bi-hourglass-split animate-spin text-5xl text-primary-600 mb-4"></i>
                <p className="text-gray-600">Carregando consultas...</p>
              </div>
            ) : consultas.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center shadow-xl">
                <i className="bi bi-calendar-x text-gray-300 text-8xl mb-6 block"></i>
                <h3 className="text-2xl font-bold text-gray-700 mb-3">Nenhuma consulta encontrada</h3>
                <p className="text-gray-600 mb-8">Você ainda não agendou nenhuma consulta</p>
                <button
                  onClick={() => setActiveTab('agendar')}
                  className="bg-gradient-to-r from-primary-600 to-accent-600 text-white px-8 py-4 rounded-xl hover:shadow-xl transition-all duration-200 font-semibold inline-flex items-center gap-2 hover:scale-105"
                >
                  <i className="bi bi-calendar-plus text-xl"></i>
                  Agendar Primeira Consulta
                </button>
              </div>
            ) : (
              consultas.map((consulta) => {
                const { data, hora } = formatDateTime(consulta.data_hora_agendada);
                const iconMap: Record<string, string> = {
                  video: 'bi-camera-video-fill',
                  audio: 'bi-telephone-fill',
                  chat: 'bi-chat-dots-fill',
                  presencial: 'bi-hospital'
                };
                return (
                  <div
                    key={consulta.id}
                    className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                    onClick={() => {
                      setSelectedConsulta(consulta);
                      setShowModal(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center text-white shadow-lg">
                          <i className={`${iconMap[consulta.tipo_consulta]} text-2xl`}></i>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-xl text-gray-900 mb-1">{consulta.especialidade}</h3>
                          {consulta.nome_medico && (
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <i className="bi bi-person-badge"></i>
                              Dr(a). {consulta.nome_medico}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                            <span className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                              <i className="bi bi-calendar3 text-primary-600"></i>
                              {data}
                            </span>
                            <span className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                              <i className="bi bi-clock text-primary-600"></i>
                              {hora}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-4 py-2 rounded-xl text-xs font-bold ${getStatusColor(consulta.status)}`}>
                          {getStatusLabel(consulta.status)}
                        </span>
                        <p className="text-xl font-bold text-primary-600 mt-3 flex items-center justify-end gap-1">
                          <i className="bi bi-cash-coin"></i>
                          {consulta.valor.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {showModal && selectedConsulta && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center">
                  <i className="bi bi-file-medical text-white text-lg"></i>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Detalhes da Consulta</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 w-10 h-10 rounded-xl flex items-center justify-center"
              >
                <i className="bi bi-x-lg text-2xl"></i>
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Status */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                  <i className="bi bi-info-circle"></i>
                  Status
                </h3>
                <span className={`inline-block px-5 py-2.5 rounded-xl text-sm font-bold ${getStatusColor(selectedConsulta.status)}`}>
                  {getStatusLabel(selectedConsulta.status)}
                </span>
              </div>

              {/* Informações */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-2">
                    <i className="bi bi-heart-pulse text-primary-600"></i>
                    Especialidade
                  </h3>
                  <p className="font-bold text-gray-900 text-lg">{selectedConsulta.especialidade}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-2">
                    <i className="bi bi-headset text-primary-600"></i>
                    Tipo de Consulta
                  </h3>
                  <p className="font-bold text-gray-900 text-lg capitalize">{selectedConsulta.tipo_consulta}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-2">
                    <i className="bi bi-calendar3 text-primary-600"></i>
                    Data
                  </h3>
                  <p className="font-bold text-gray-900 text-lg">{formatDateTime(selectedConsulta.data_hora_agendada).data}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-2">
                    <i className="bi bi-clock text-primary-600"></i>
                    Horário
                  </h3>
                  <p className="font-bold text-gray-900 text-lg">{formatDateTime(selectedConsulta.data_hora_agendada).hora}</p>
                </div>
              </div>

              {/* Sintomas */}
              {selectedConsulta.sintomas && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                    <i className="bi bi-file-text text-primary-600"></i>
                    Sintomas Relatados
                  </h3>
                  <p className="text-gray-900 bg-gray-50 p-4 rounded-xl leading-relaxed">{selectedConsulta.sintomas}</p>
                </div>
              )}

              {/* Valor */}
              <div className="border-t-2 border-gray-100 pt-6">
                <div className="flex justify-between items-center bg-gradient-to-r from-primary-50 to-accent-50 p-6 rounded-2xl">
                  <span className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                    <i className="bi bi-cash-coin text-2xl text-primary-600"></i>
                    Valor da Consulta
                  </span>
                  <span className="text-3xl font-bold text-primary-600">
                    {selectedConsulta.valor.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                  </span>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-4 pt-6 border-t-2 border-gray-100">
                {/* Botão Entrar na Consulta */}
                {(selectedConsulta.status === 'confirmada' || selectedConsulta.status === 'em_andamento') && (
                  <button
                    onClick={() => {
                      setConsultaAberta(selectedConsulta);
                      setModoVisualizacao('opcoes');
                      setShowModal(false);
                    }}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-4 rounded-xl hover:shadow-xl transition-all font-bold flex items-center justify-center gap-2 hover:scale-105 duration-200"
                  >
                    <i className="bi bi-box-arrow-in-right text-xl"></i>
                    Entrar na Consulta
                  </button>
                )}
                
                {(selectedConsulta.status === 'agendada' || selectedConsulta.status === 'confirmada') && (
                  <button
                    onClick={() => handleCancelarConsulta(selectedConsulta.id)}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-xl hover:shadow-xl transition-all font-bold flex items-center justify-center gap-2 hover:scale-105 duration-200"
                  >
                    <i className="bi bi-x-circle text-xl"></i>
                    Cancelar Consulta
                  </button>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-4 rounded-xl hover:bg-gray-300 transition-all font-bold flex items-center justify-center gap-2 hover:scale-105 duration-200"
                >
                  <i className="bi bi-arrow-left text-xl"></i>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Consulta com Opções */}
      {consultaAberta && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col">
            {/* Header do Modal */}
            <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="bi bi-hospital text-2xl"></i>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{consultaAberta.especialidade}</h2>
                  <p className="text-white/80 text-sm">
                    {consultaAberta.nome_medico ? `Dr(a). ${consultaAberta.nome_medico}` : 'Aguardando médico'} • {consultaAberta.tipo_consulta}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setConsultaAberta(null);
                  setModoVisualizacao('opcoes');
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <i className="bi bi-x-lg text-xl"></i>
              </button>
            </div>

            {/* Navegação de Tabs */}
            <div className="flex border-b border-gray-200 px-6 bg-gray-50">
              <button
                onClick={() => setModoVisualizacao('opcoes')}
                className={`px-6 py-4 font-medium transition-colors relative ${
                  modoVisualizacao === 'opcoes'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <i className="bi bi-grid text-lg"></i>
                  <span>Opções</span>
                </div>
              </button>
              <button
                onClick={() => setModoVisualizacao('chat')}
                className={`px-6 py-4 font-medium transition-colors relative ${
                  modoVisualizacao === 'chat'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <i className="bi bi-chat-dots text-lg"></i>
                  <span>Chat</span>
                </div>
              </button>
              <button
                onClick={() => setModoVisualizacao('video')}
                className={`px-6 py-4 font-medium transition-colors relative ${
                  modoVisualizacao === 'video'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <i className="bi bi-camera-video text-lg"></i>
                  <span>Videochamada</span>
                </div>
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="flex-1 overflow-hidden">
              {modoVisualizacao === 'opcoes' && (
                <div className="h-full p-8 overflow-y-auto">
                  <div className="max-w-4xl mx-auto">
                    {/* Informações da Consulta */}
                    <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-6 mb-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Informações da Consulta</h3>
                      {consultaAberta.sintomas && (
                        <div className="bg-white rounded-lg p-4 mb-4">
                          <p className="text-sm font-semibold text-gray-700 mb-2">
                            <i className="bi bi-file-text text-primary-600 mr-2"></i>
                            Seus Sintomas:
                          </p>
                          <p className="text-gray-900">{consultaAberta.sintomas}</p>
                        </div>
                      )}
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Data</p>
                          <p className="font-medium">{formatDateTime(consultaAberta.data_hora_agendada).data}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Horário</p>
                          <p className="font-medium">{formatDateTime(consultaAberta.data_hora_agendada).hora}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">Status</p>
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(consultaAberta.status)}`}>
                            {getStatusLabel(consultaAberta.status)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Opções de Comunicação */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <button
                        onClick={() => setModoVisualizacao('chat')}
                        className="bg-white border-2 border-indigo-500 rounded-2xl p-8 hover:shadow-xl transition-all text-left group"
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <i className="bi bi-chat-dots text-white text-3xl"></i>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Chat</h3>
                        <p className="text-gray-600">
                          Converse com seu médico por mensagens de texto em tempo real
                        </p>
                      </button>

                      <button
                        onClick={() => setModoVisualizacao('video')}
                        className="bg-white border-2 border-purple-500 rounded-2xl p-8 hover:shadow-xl transition-all text-left group"
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <i className="bi bi-camera-video text-white text-3xl"></i>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Videochamada</h3>
                        <p className="text-gray-600">
                          Realize sua consulta por vídeo ao vivo com seu médico
                        </p>
                      </button>

                      <button
                        className="bg-white border-2 border-green-500 rounded-2xl p-8 hover:shadow-xl transition-all text-left group opacity-60 cursor-not-allowed"
                        disabled
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                          <i className="bi bi-file-medical text-white text-3xl"></i>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Prontuário</h3>
                        <p className="text-gray-600">
                          Visualizar seu histórico médico e prescrições
                        </p>
                      </button>

                      <button
                        className="bg-white border-2 border-orange-500 rounded-2xl p-8 hover:shadow-xl transition-all text-left group opacity-60 cursor-not-allowed"
                        disabled
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4">
                          <i className="bi bi-file-earmark-text text-white text-3xl"></i>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Documentos</h3>
                        <p className="text-gray-600">
                          Receitas e atestados da sua consulta
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {modoVisualizacao === 'chat' && (
                <div className="h-full">
                  <ChatConsulta
                    consultaId={consultaAberta.id}
                    nomeMedico={consultaAberta.nome_medico}
                  />
                </div>
              )}

              {modoVisualizacao === 'video' && (
                <div className="h-full bg-gray-900">
                  <VideoCall
                    consultaId={consultaAberta.id}
                    isInitiator={false}
                    onEnd={() => setModoVisualizacao('opcoes')}
                    onError={(error) => {
                      alert(error);
                      setModoVisualizacao('opcoes');
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Chat (mantido para compatibilidade) */}
      {showChat && chatConsultaId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl h-[80vh] overflow-hidden">
            <ChatConsulta
              consultaId={chatConsultaId}
              nomePaciente={chatNomePaciente || undefined}
              nomeMedico={chatNomeMedico || undefined}
              onClose={() => {
                setShowChat(false);
                setChatConsultaId(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Consultas;
