import { useState, useEffect } from 'react';
import {
  FileText,
  Eye,
  XCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
} from 'lucide-react';
import { receitasService, ReceitaDigital } from '@/services/receitasService';

const statusConfig: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  ativa: { label: 'Ativa', bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  dispensada: { label: 'Dispensada', bg: 'bg-blue-100', text: 'text-blue-700', icon: <Clock className="w-3.5 h-3.5" /> },
  cancelada: { label: 'Cancelada', bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle className="w-3.5 h-3.5" /> },
  expirada: { label: 'Expirada', bg: 'bg-gray-100', text: 'text-gray-700', icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

export default function ReceitasEmitidas() {
  const [receitas, setReceitas] = useState<ReceitaDigital[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReceita, setSelectedReceita] = useState<ReceitaDigital | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const limit = 10;

  useEffect(() => {
    fetchReceitas();
  }, [page]);

  const fetchReceitas = async () => {
    setLoading(true);
    try {
      const res = await receitasService.getReceitasEmitidas({ page, limit });
      setReceitas(res.items ?? []);
      setTotalPages(Math.ceil((res.total ?? 0) / limit) || 1);
    } catch (err) {
      console.error('Erro ao carregar receitas emitidas:', err);
      setReceitas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async (id: string) => {
    setCancelling(true);
    try {
      await receitasService.cancelarReceita(id);
      setCancelConfirmId(null);
      fetchReceitas();
    } catch (err) {
      console.error('Erro ao cancelar receita:', err);
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-7 h-7 text-green-600" />
        <h1 className="text-2xl font-bold text-gray-800">Receitas Emitidas</h1>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
        </div>
      )}

      {/* Empty */}
      {!loading && receitas.length === 0 && (
        <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Nenhuma receita emitida encontrada.</p>
        </div>
      )}

      {/* Table */}
      {!loading && receitas.length > 0 && (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Paciente</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Emissão</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Validade</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-600">Itens</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {receitas.map((receita) => {
                  const status = statusConfig[receita.status] ?? statusConfig.expirada;
                  return (
                    <tr key={receita.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-800">
                        {receita.paciente_nome ?? `Paciente #${receita.paciente_id}`}
                      </td>
                      <td className="px-5 py-3 text-gray-600">{formatDate(receita.created_at)}</td>
                      <td className="px-5 py-3 text-gray-600">{formatDate(receita.validade)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center text-gray-600">
                        {receita.itens?.length ?? 0}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedReceita(receita)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-green-700 bg-green-50 hover:bg-green-100 rounded-lg text-xs font-medium transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Ver
                          </button>
                          {receita.status === 'ativa' && (
                            <button
                              onClick={() => setCancelConfirmId(receita.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors"
                              title="Cancelar receita"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedReceita && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">Detalhes da Receita</h2>
              <button
                onClick={() => setSelectedReceita(null)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Paciente</span>
                  <p className="text-gray-800">{selectedReceita.paciente_nome ?? `#${selectedReceita.paciente_id}`}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Status</span>
                  <p className="text-gray-800 capitalize">{selectedReceita.status}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Emissão</span>
                  <p className="text-gray-800">{formatDate(selectedReceita.created_at)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Validade</span>
                  <p className="text-gray-800">{formatDate(selectedReceita.validade)}</p>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-gray-500">Código de Verificação</span>
                  <p className="text-gray-800 font-mono text-xs break-all">{selectedReceita.codigo_verificacao}</p>
                </div>
              </div>

              {selectedReceita.itens && selectedReceita.itens.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="font-semibold text-gray-700 mb-3">
                    Medicamentos ({selectedReceita.itens.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedReceita.itens.map((item, idx) => (
                      <div key={item.id ?? idx} className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium text-gray-800">{item.nome}</p>
                        <div className="grid grid-cols-2 gap-1 mt-1 text-sm text-gray-600">
                          <span>Dosagem: {item.dosagem}</span>
                          <span>Qtd: {item.quantidade}</span>
                        </div>
                        {item.instrucoes && (
                          <p className="text-sm text-gray-500 mt-1 italic">{item.instrucoes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">Cancelar Receita?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Esta ação não pode ser desfeita. A receita será marcada como cancelada e não poderá mais ser dispensada.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setCancelConfirmId(null)}
                disabled={cancelling}
                className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => handleCancelar(cancelConfirmId)}
                disabled={cancelling}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {cancelling ? 'A cancelar...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
