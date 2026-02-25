import { useState } from 'react';
import { Search, ShieldCheck, ShieldX, CheckCircle, FileText, Pill } from 'lucide-react';
import { receitasService, ReceitaVerificacao } from '@/services/receitasService';
import { useAuthStore } from '@/stores/authStore';

export default function VerificarReceita() {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [dispensando, setDispensando] = useState(false);
  const [result, setResult] = useState<ReceitaVerificacao | null>(null);
  const [error, setError] = useState('');
  const [dispensed, setDispensed] = useState(false);

  const { user } = useAuthStore();
  const isFarmacia = user?.tipo_usuario === 'farmacia_admin' || user?.tipo_usuario === 'farmacia_funcionario';

  const handleVerificar = async () => {
    const trimmed = codigo.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    setResult(null);
    setDispensed(false);
    try {
      const res = await receitasService.verificarReceita(trimmed);
      setResult(res);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Erro ao verificar receita.');
    } finally {
      setLoading(false);
    }
  };

  const handleDispensar = async () => {
    if (!result?.id) return;
    setDispensando(true);
    try {
      await receitasService.dispensarReceita(result.id);
      setDispensed(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Erro ao dispensar receita.');
    } finally {
      setDispensando(false);
    }
  };

  const handleReset = () => {
    setCodigo('');
    setResult(null);
    setError('');
    setDispensed(false);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const isValid = result ? (result.is_valida ?? false) : false;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-7 h-7 text-green-600" />
        <h1 className="text-2xl font-bold text-gray-800">Verificar Receita</h1>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Código de Verificação
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleVerificar()}
            placeholder="Insira o código UUID da receita"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
          <button
            onClick={handleVerificar}
            disabled={!codigo.trim() || loading}
            className="inline-flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="w-4 h-4" />
            {loading ? 'A verificar...' : 'Verificar'}
          </button>
        </div>

        {(result || error) && (
          <button
            onClick={handleReset}
            className="mt-3 text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
          <ShieldX className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`bg-white rounded-2xl shadow overflow-hidden border-2 ${isValid && !dispensed ? 'border-green-400' : 'border-red-300'}`}>
          {/* Status Header */}
          <div className={`px-6 py-4 flex items-center gap-3 ${isValid && !dispensed ? 'bg-green-50' : 'bg-red-50'}`}>
            {isValid && !dispensed ? (
              <ShieldCheck className="w-8 h-8 text-green-600" />
            ) : (
              <ShieldX className="w-8 h-8 text-red-500" />
            )}
            <div>
              <p className={`text-lg font-bold ${isValid && !dispensed ? 'text-green-800' : 'text-red-800'}`}>
                {dispensed
                  ? 'Receita Dispensada'
                  : isValid
                  ? 'Receita Válida'
                  : 'Receita Inválida'}
              </p>
              {result.motivo_invalida && <p className="text-sm text-gray-600">{result.motivo_invalida}</p>}
            </div>
          </div>

          {/* Details */}
          {result && (
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Médico</span>
                  <p className="text-gray-800">Dr(a). {result.medico_nome ?? '—'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Paciente</span>
                  <p className="text-gray-800">{result.paciente_nome ?? '—'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Data de Emissão</span>
                  <p className="text-gray-800">{formatDate(result.created_at)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Data de Validade</span>
                  <p className="text-gray-800">{formatDate(result.validade)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Status</span>
                  <p className="text-gray-800 capitalize">{dispensed ? 'dispensada' : result.status}</p>
                </div>
              </div>

              {/* Items */}
              {result.itens && result.itens.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Pill className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-gray-800">Medicamentos ({result.itens.length})</h3>
                  </div>
                  <div className="space-y-3">
                    {result.itens.map((item, idx) => (
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

              {/* Dispense button */}
              {isFarmacia && isValid && !dispensed && (
                <div className="border-t border-gray-100 pt-4">
                  <button
                    onClick={handleDispensar}
                    disabled={dispensando}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {dispensando ? 'A dispensar...' : 'Dispensar Receita'}
                  </button>
                </div>
              )}

              {/* Dispensed confirmation */}
              {dispensed && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Receita dispensada com sucesso.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
