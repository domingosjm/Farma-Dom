import { useState } from 'react';
import { PlusCircle, Trash2, FileText, Send, Copy, CheckCircle } from 'lucide-react';
import { receitasService } from '@/services/receitasService';

interface ItemForm {
  medicamento_id: string;
  dosagem: string;
  quantidade: number | '';
  instrucoes: string;
}

const emptyItem = (): ItemForm => ({
  medicamento_id: '',
  dosagem: '',
  quantidade: '',
  instrucoes: '',
});

export default function CriarReceita() {
  const [pacienteId, setPacienteId] = useState('');
  const [consultaId, setConsultaId] = useState('');
  const [itens, setItens] = useState<ItemForm[]>([emptyItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successCode, setSuccessCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const addItem = () => setItens([...itens, emptyItem()]);

  const removeItem = (index: number) => {
    if (itens.length === 1) return;
    setItens(itens.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ItemForm, value: string | number) => {
    const updated = [...itens];
    updated[index] = { ...updated[index], [field]: value };
    setItens(updated);
  };

  const isValid = () => {
    if (!pacienteId.trim()) return false;
    return itens.every(
      (item) =>
        item.medicamento_id.trim() &&
        item.dosagem.trim() &&
        item.quantidade !== '' &&
        Number(item.quantidade) > 0
    );
  };

  const handleSubmit = async () => {
    if (!isValid()) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        paciente_id: pacienteId,
        consulta_id: consultaId || undefined,
        itens: itens.map((item) => ({
          medicamento_id: item.medicamento_id,
          dosagem: item.dosagem,
          quantidade: Number(item.quantidade),
          instrucoes: item.instrucoes || undefined,
        })),
      };
      const res = await receitasService.criarReceita(payload);
      const code = res.codigo_verificacao ?? '';
      setSuccessCode(code);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Erro ao criar receita.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(successCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback */
    }
  };

  const resetForm = () => {
    setPacienteId('');
    setConsultaId('');
    setItens([emptyItem()]);
    setSuccessCode('');
    setError('');
    setShowPreview(false);
  };

  // Success screen
  if (successCode) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl shadow p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Receita Criada com Sucesso!</h2>
          <p className="text-gray-600 mb-6">A receita foi emitida. Partilhe o código abaixo com o paciente.</p>

          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <p className="text-sm font-medium text-green-700 mb-2">Código de Verificação</p>
            <p className="text-lg font-mono font-bold text-green-900 break-all">{successCode}</p>
            <button
              onClick={handleCopy}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar Código'}
            </button>
          </div>

          <button
            onClick={resetForm}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Criar Nova Receita
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-7 h-7 text-green-600" />
        <h1 className="text-2xl font-bold text-gray-800">Criar Receita Digital</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Informações Gerais</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID do Paciente <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={pacienteId}
              onChange={(e) => setPacienteId(e.target.value)}
              placeholder="Ex: 12"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID da Consulta <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={consultaId}
              onChange={(e) => setConsultaId(e.target.value)}
              placeholder="Ex: 5"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
          </div>
        </div>

      </div>

      {/* Itens */}
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Itens da Receita</h2>
          <button
            onClick={addItem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Adicionar Item
          </button>
        </div>

        <div className="space-y-4">
          {itens.map((item, idx) => (
            <div key={idx} className="bg-gray-50 rounded-xl p-4 relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Item {idx + 1}</span>
                {itens.length > 1 && (
                  <button
                    onClick={() => removeItem(idx)}
                    className="inline-flex items-center gap-1 text-red-500 hover:text-red-700 text-sm transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remover
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    ID do Medicamento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={item.medicamento_id}
                    onChange={(e) => updateItem(idx, 'medicamento_id', e.target.value)}
                    placeholder="ID do medicamento"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Dosagem <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={item.dosagem}
                    onChange={(e) => updateItem(idx, 'dosagem', e.target.value)}
                    placeholder="Ex: 500mg"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Quantidade <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={item.quantidade}
                    onChange={(e) => updateItem(idx, 'quantidade', e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ex: 14"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Instruções <span className="text-gray-400">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={item.instrucoes}
                    onChange={(e) => updateItem(idx, 'instrucoes', e.target.value)}
                    placeholder="Ex: Tomar após as refeições"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 text-lg font-semibold text-gray-800"
        >
          Pré-visualização
          {showPreview ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </button>

        {showPreview && (
          <div className="mt-4 space-y-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Paciente ID:</span> {pacienteId || '—'}
            </div>
            {consultaId && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Consulta ID:</span> {consultaId}
              </div>
            )}
            <div className="border-t border-gray-100 pt-3">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                {itens.length} {itens.length === 1 ? 'item' : 'itens'}
              </p>
              {itens.map((item, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3 mb-2">
                  <p className="font-medium text-gray-800">{item.medicamento_id || '(sem ID)'}</p>
                  <p className="text-sm text-gray-600">
                    {item.dosagem} · Qtd: {item.quantidade}
                  </p>
                  {item.instrucoes && <p className="text-sm text-gray-500 italic">{item.instrucoes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!isValid() || submitting}
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'A criar...' : 'Emitir Receita'}
        </button>
      </div>
    </div>
  );
}

/* Small inline chevron helpers to avoid extra imports */
function ChevronDownIcon() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
function ChevronUpIcon() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  );
}
