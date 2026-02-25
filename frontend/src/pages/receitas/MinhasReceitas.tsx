import { useState, useEffect } from 'react';
import {
  FileText,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { receitasService, ReceitaDigital } from '@/services/receitasService';

type StatusFilter = 'todas' | 'ativa' | 'dispensada' | 'cancelada' | 'expirada';

const statusConfig: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  ativa: { label: 'Ativa', bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="w-4 h-4" /> },
  dispensada: { label: 'Dispensada', bg: 'bg-blue-100', text: 'text-blue-700', icon: <Clock className="w-4 h-4" /> },
  cancelada: { label: 'Cancelada', bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle className="w-4 h-4" /> },
  expirada: { label: 'Expirada', bg: 'bg-gray-100', text: 'text-gray-700', icon: <AlertCircle className="w-4 h-4" /> },
};

export default function MinhasReceitas() {
  const [receitas, setReceitas] = useState<ReceitaDigital[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('todas');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const limit = 10;

  useEffect(() => {
    fetchReceitas();
  }, [filter, page]);

  const fetchReceitas = async () => {
    setLoading(true);
    try {
      const params: { status?: string; page: number; limit: number } = { page, limit };
      if (filter !== 'todas') params.status = filter;
      const res = await receitasService.getMinhasReceitas(params);
      setReceitas(res.items ?? []);
      setTotalPages(Math.ceil((res.total ?? 0) / limit) || 1);
    } catch (err) {
      console.error('Erro ao carregar receitas:', err);
      setReceitas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (codigo: string, id: string) => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* fallback */
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const filters: { value: StatusFilter; label: string }[] = [
    { value: 'todas', label: 'Todas' },
    { value: 'ativa', label: 'Ativas' },
    { value: 'dispensada', label: 'Dispensadas' },
    { value: 'cancelada', label: 'Canceladas' },
    { value: 'expirada', label: 'Expiradas' },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-7 h-7 text-green-600" />
        <h1 className="text-2xl font-bold text-gray-800">Minhas Receitas</h1>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setPage(1); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
        </div>
      )}

      {/* No results */}
      {!loading && receitas.length === 0 && (
        <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Nenhuma receita encontrada.</p>
        </div>
      )}

      {/* Cards */}
      {!loading && receitas.length > 0 && (
        <div className="space-y-4">
          {receitas.map((receita) => {
            const status = statusConfig[receita.status] ?? statusConfig.expirada;
            const isExpanded = expandedId === receita.id;

            return (
              <div key={receita.id} className="bg-white rounded-2xl shadow overflow-hidden">
                {/* Card header */}
                <button
                  onClick={() => toggleExpand(receita.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                        {status.icon}
                        {status.label}
                      </span>
                      <span className="text-sm text-gray-500">
                        {receita.itens?.length ?? 0} {(receita.itens?.length ?? 0) === 1 ? 'item' : 'itens'}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-800 truncate">
                      Dr(a). {receita.medico_nome ?? '—'}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-500">
                      <span>Emissão: {formatDate(receita.created_at)}</span>
                      <span>Validade: {formatDate(receita.validade)}</span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {/* Verification code bar (for active) */}
                {receita.status === 'ativa' && (
                  <div className="mx-5 mb-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                    <span className="text-xs font-medium text-green-700">Código:</span>
                    <span className="text-sm font-mono text-green-800 truncate flex-1">
                      {receita.codigo_verificacao}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopy(receita.codigo_verificacao, receita.id); }}
                      className="flex items-center gap-1 text-green-700 hover:text-green-900 transition-colors"
                      title="Copiar código"
                    >
                      {copiedId === receita.id ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span className="text-xs">{copiedId === receita.id ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                )}

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Itens da Receita</h4>
                    <div className="space-y-3">
                      {receita.itens?.map((item, idx) => (
                        <div key={item.id ?? idx} className="bg-gray-50 rounded-lg p-3">
                          <p className="font-medium text-gray-800">{item.nome}</p>
                          <div className="grid grid-cols-2 gap-2 mt-1 text-sm text-gray-600">
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
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
