import { useState, useEffect } from 'react'
import { Store, MapPin, Clock, CheckCircle, Sparkles, Loader2 } from 'lucide-react'

interface Farmacia {
  id: number
  nome: string
  distancia: string
  tempo: string
  avaliacao: number
}

interface BuscaFarmaciaAnimationProps {
  isOpen: boolean
  onComplete: () => void
  onFarmaciaSelected: (farmacia: Farmacia) => void
}

const farmaciasSimuladas: Farmacia[] = [
  { id: 1, nome: 'Farmácia Central', distancia: '1.2 km', tempo: '15 min', avaliacao: 4.8 },
  { id: 2, nome: 'Farmácia Popular', distancia: '2.5 km', tempo: '25 min', avaliacao: 4.5 },
  { id: 3, nome: 'Farmácia Saúde+', distancia: '3.1 km', tempo: '30 min', avaliacao: 4.7 },
  { id: 4, nome: 'Farmácia Nova', distancia: '1.8 km', tempo: '20 min', avaliacao: 4.6 },
  { id: 5, nome: 'Farmácia Express', distancia: '2.0 km', tempo: '18 min', avaliacao: 4.9 },
  { id: 6, nome: 'Farmácia BemEstar', distancia: '2.8 km', tempo: '28 min', avaliacao: 4.4 },
]

export default function BuscaFarmaciaAnimation({ isOpen, onComplete, onFarmaciaSelected }: BuscaFarmaciaAnimationProps) {
  const [fase, setFase] = useState<'buscando' | 'rodizio' | 'selecionada'>('buscando')
  const [farmaciaAtiva, setFarmaciaAtiva] = useState(0)
  const [farmaciaSelecionada, setFarmaciaSelecionada] = useState<Farmacia | null>(null)
  const [progresso, setProgresso] = useState(0)
  const [rodizioCount, setRodizioCount] = useState(0)

  useEffect(() => {
    if (!isOpen) {
      // Reset state when closed
      setFase('buscando')
      setFarmaciaAtiva(0)
      setFarmaciaSelecionada(null)
      setProgresso(0)
      setRodizioCount(0)
      return
    }

    // Fase 1: Buscando farmácias (2 segundos)
    const buscaTimer = setTimeout(() => {
      setFase('rodizio')
    }, 2000)

    // Progress bar durante busca
    const progressInterval = setInterval(() => {
      setProgresso(prev => {
        if (prev >= 100) return 100
        return prev + 5
      })
    }, 100)

    return () => {
      clearTimeout(buscaTimer)
      clearInterval(progressInterval)
    }
  }, [isOpen])

  // Fase 2: Rodízio de farmácias
  useEffect(() => {
    if (fase !== 'rodizio') return

    // Resetar progresso para rodízio
    setProgresso(0)

    // Ciclar pelas farmácias
    const rodizioInterval = setInterval(() => {
      setFarmaciaAtiva(prev => {
        const next = (prev + 1) % farmaciasSimuladas.length
        return next
      })
      setRodizioCount(prev => prev + 1)
    }, 200)

    // Aumentar velocidade progressivamente e depois selecionar
    const selecaoTimer = setTimeout(() => {
      clearInterval(rodizioInterval)
      
      // Selecionar farmácia aleatória (simulando o resultado do rodízio)
      const indiceSelecionado = Math.floor(Math.random() * farmaciasSimuladas.length)
      const farmacia = farmaciasSimuladas[indiceSelecionado]
      
      setFarmaciaAtiva(indiceSelecionado)
      setFarmaciaSelecionada(farmacia)
      setFase('selecionada')
      
      // Callback após seleção
      setTimeout(() => {
        onFarmaciaSelected(farmacia)
        onComplete()
      }, 2500)
    }, 3000)

    return () => {
      clearInterval(rodizioInterval)
      clearTimeout(selecaoTimer)
    }
  }, [fase, onComplete, onFarmaciaSelected])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-accent-600 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            {fase === 'selecionada' ? (
              <CheckCircle className="w-10 h-10 text-white animate-bounce" />
            ) : (
              <Store className="w-10 h-10 text-white animate-pulse" />
            )}
          </div>
          <h2 className="text-xl font-bold">
            {fase === 'buscando' && 'Procurando farmácias próximas...'}
            {fase === 'rodizio' && 'Sistema de rodízio em andamento...'}
            {fase === 'selecionada' && 'Farmácia selecionada!'}
          </h2>
          <p className="text-white/80 mt-2 text-sm">
            {fase === 'buscando' && 'Identificando farmácias disponíveis na sua região'}
            {fase === 'rodizio' && 'Selecionando a melhor opção para você'}
            {fase === 'selecionada' && 'Seu pedido será enviado para esta farmácia'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Fase Busca - Progress */}
          {fase === 'buscando' && (
            <div className="space-y-6">
              <div className="flex items-center justify-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent-500 rounded-full animate-ping" />
                </div>
                <div className="flex-1 max-w-xs">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-100"
                      style={{ width: `${progresso}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-center">Localizando farmácias...</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className="bg-gray-100 rounded-xl p-3 animate-pulse"
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    <div className="w-8 h-8 bg-gray-300 rounded-full mx-auto mb-2" />
                    <div className="h-2 bg-gray-300 rounded w-3/4 mx-auto mb-1" />
                    <div className="h-2 bg-gray-200 rounded w-1/2 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fase Rodízio */}
          {fase === 'rodizio' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Sparkles className="w-5 h-5 text-accent-500 animate-spin" />
                <span className="text-sm font-medium text-gray-600">
                  Verificando {rodizioCount} farmácias...
                </span>
                <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {farmaciasSimuladas.map((farmacia, index) => (
                  <div 
                    key={farmacia.id}
                    className={`relative rounded-xl p-4 transition-all duration-150 border-2 ${
                      index === farmaciaAtiva 
                        ? 'bg-gradient-to-br from-primary-50 to-accent-50 border-primary-500 scale-105 shadow-lg' 
                        : 'bg-gray-50 border-transparent opacity-50'
                    }`}
                  >
                    {index === farmaciaAtiva && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                      </div>
                    )}
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        index === farmaciaAtiva ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        <Store className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{farmacia.nome}</p>
                        <p className="text-xs text-gray-500">{farmacia.distancia} • {farmacia.tempo}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 rounded-full animate-pulse w-full" />
              </div>
            </div>
          )}

          {/* Fase Selecionada */}
          {fase === 'selecionada' && farmaciaSelecionada && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Farmácia encontrada!</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary-50 via-white to-accent-50 border-2 border-primary-500 rounded-2xl p-6 animate-scale-in shadow-farma">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Store className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{farmaciaSelecionada.nome}</h3>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4 text-primary-500" />
                        <span>{farmaciaSelecionada.distancia}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-accent-500" />
                        <span>{farmaciaSelecionada.tempo}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Avaliação</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-lg font-bold text-amber-500">{farmaciaSelecionada.avaliacao}</span>
                      <span className="text-amber-500">★</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                <span>Enviando pedido para a farmácia...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
