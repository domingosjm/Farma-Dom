import { useEffect, useState } from 'react';
import { pedidosService, Pedido } from '@/services/pedidosService';

const Pedidos = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadPedidos();
  }, []);

  const loadPedidos = async () => {
    try {
      setLoading(true);
      const data = await pedidosService.getPedidos();
      setPedidos(data);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPedidoDetails = async (id: string) => {
    try {
      const data = await pedidosService.getPedidoById(id);
      setSelectedPedido(data);
      setShowDetails(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes do pedido:', error);
    }
  };

  const handleCancelar = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar este pedido?')) return;

    try {
      await pedidosService.cancelPedido(id);
      loadPedidos();
      setShowDetails(false);
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      alert('Erro ao cancelar pedido');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pendente: 'bg-yellow-100 text-yellow-800',
      confirmado: 'bg-primary-100 text-primary-800',
      em_preparacao: 'bg-accent-100 text-accent-800',
      enviado: 'bg-farma-cyan-100 text-farma-cyan-800',
      entregue: 'bg-emerald-100 text-emerald-800',
      cancelado: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pendente: 'Pendente',
      confirmado: 'Confirmado',
      em_preparacao: 'Em Preparação',
      enviado: 'Enviado',
      entregue: 'Entregue',
      cancelado: 'Cancelado',
    };
    return labels[status] || status;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Meus Pedidos</h1>
        <p className="text-gray-600 mt-2">Acompanhe o status dos seus pedidos</p>
      </div>

      {pedidos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">🛒</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Nenhum pedido encontrado</h2>
          <p className="text-gray-600 mb-6">Você ainda não realizou nenhum pedido</p>
          <a
            href="/medicamentos"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Explorar Medicamentos
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => (
            <div key={pedido.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Pedido #{pedido.numero_pedido}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        pedido.status
                      )}`}
                    >
                      {getStatusLabel(pedido.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>📅 Realizado em: {formatDate(pedido.created_at)}</p>
                    <p>💳 Pagamento: {pedido.metodo_pagamento}</p>
                    <p>📍 Endereço: {pedido.endereco_entrega}</p>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 md:text-right">
                  <div className="text-2xl font-bold text-gray-900 mb-3">
                    {pedido.total.toLocaleString('pt-AO', {
                      style: 'currency',
                      currency: 'AOA',
                    })}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => loadPedidoDetails(pedido.id)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                    >
                      Ver Detalhes
                    </button>
                    {pedido.status === 'pendente' && (
                      <button
                        onClick={() => handleCancelar(pedido.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        Cancelar Pedido
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Linha do tempo de status */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs">
                  {['pendente', 'confirmado', 'em_preparacao', 'enviado', 'entregue'].map((status, index) => {
                    const isCurrent = pedido.status === status;
                    const isPast = ['pendente', 'confirmado', 'em_preparacao', 'enviado', 'entregue'].indexOf(pedido.status) >= index;

                    return (
                      <div key={status} className="flex-1 flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isCurrent
                              ? 'bg-primary-600 text-white'
                              : isPast
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-300 text-gray-600'
                          }`}
                        >
                          {isPast && !isCurrent ? '✓' : index + 1}
                        </div>
                        <div className="text-center mt-2">
                          <p className={`font-medium ${isCurrent ? 'text-primary-600' : isPast ? 'text-emerald-600' : 'text-gray-500'}`}>
                            {getStatusLabel(status)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalhes */}
      {showDetails && selectedPedido && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Pedido #{selectedPedido.numero_pedido}
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Status do Pedido</h3>
                <span
                  className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                    selectedPedido.status
                  )}`}
                >
                  {getStatusLabel(selectedPedido.status)}
                </span>
              </div>

              {/* Informações */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Informações</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>📅 Realizado: {formatDate(selectedPedido.created_at)}</p>
                    <p>🔄 Atualizado: {formatDate(selectedPedido.updated_at)}</p>
                    <p>💳 Pagamento: {selectedPedido.metodo_pagamento}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Entrega</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>📍 {selectedPedido.endereco_entrega}</p>
                  </div>
                </div>
              </div>

              {/* Itens */}
              {selectedPedido.itens && selectedPedido.itens.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Itens do Pedido</h3>
                  <div className="space-y-2">
                    {selectedPedido.itens.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.medicamento_nome}</p>
                          <p className="text-sm text-gray-600">Quantidade: {item.quantidade}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {(item.preco_unitario * item.quantidade).toLocaleString('pt-AO', {
                              style: 'currency',
                              currency: 'AOA',
                            })}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.preco_unitario.toLocaleString('pt-AO', {
                              style: 'currency',
                              currency: 'AOA',
                            })}{' '}
                            cada
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumo de Valores */}
              <div className="border-t border-gray-200 pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">
                      {selectedPedido.subtotal.toLocaleString('pt-AO', {
                        style: 'currency',
                        currency: 'AOA',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taxa de Entrega:</span>
                    <span className="font-medium">
                      {selectedPedido.taxa_entrega.toLocaleString('pt-AO', {
                        style: 'currency',
                        currency: 'AOA',
                      })}
                    </span>
                  </div>
                  {selectedPedido.desconto > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Desconto:</span>
                      <span className="font-medium">
                        -{selectedPedido.desconto.toLocaleString('pt-AO', {
                          style: 'currency',
                          currency: 'AOA',
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                    <span>Total:</span>
                    <span className="text-primary-600">
                      {selectedPedido.total.toLocaleString('pt-AO', {
                        style: 'currency',
                        currency: 'AOA',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {selectedPedido.observacoes && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Observações</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedPedido.observacoes}
                  </p>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {selectedPedido.status === 'pendente' && (
                  <button
                    onClick={() => handleCancelar(selectedPedido.id)}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Cancelar Pedido
                  </button>
                )}
                <button
                  onClick={() => setShowDetails(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pedidos;
