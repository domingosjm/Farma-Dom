import { Link } from 'react-router-dom'
import { 
  Heart, Shield, Star, ArrowRight, Phone, MapPin, 
  Package, Video, Pill, Truck, CheckCircle, 
  Smartphone, Home as HomeIcon, Stethoscope, Calendar
} from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-700 via-primary-500 to-accent-600 rounded-xl flex items-center justify-center shadow-farma">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-primary-700">Farma</span>
                <span className="text-2xl font-bold text-accent-600">Dom</span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#servicos" className="text-gray-600 hover:text-primary-600 font-medium transition">Serviços</a>
              <a href="#como-funciona" className="text-gray-600 hover:text-primary-600 font-medium transition">Como Funciona</a>
              <a href="#pacotes" className="text-gray-600 hover:text-primary-600 font-medium transition">Pacotes</a>
              <Link to="/login" className="text-gray-600 hover:text-primary-600 font-medium transition">Entrar</Link>
              <Link 
                to="/register" 
                className="btn-gradient px-6 py-2 rounded-xl"
              >
                Começar Agora
              </Link>
            </div>
            <Link to="/login" className="md:hidden btn-primary px-4 py-2 rounded-lg text-sm">
              Entrar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 lg:pt-32 lg:pb-24 bg-gradient-to-br from-primary-50 via-white to-accent-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-semibold">
                <Star className="w-4 h-4 fill-current" />
                <span>Saúde de Qualidade em Angola</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Saúde ao Seu
                <span className="block mt-2">
                  <span className="text-primary-600">Domi</span>
                  <span className="text-accent-600">cílio</span>
                </span>
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                Consultas médicas online, farmácia com entrega express, 
                monitoramento de saúde e muito mais. Tudo na palma da sua mão.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/register"
                  className="btn-gradient px-8 py-4 rounded-xl text-lg"
                >
                  <span>Criar Conta Grátis</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a 
                  href="#como-funciona"
                  className="btn-secondary px-8 py-4 rounded-xl text-lg"
                >
                  Ver Como Funciona
                </a>
              </div>
              
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm">Médicos certificados</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Shield className="w-5 h-5 text-primary-500" />
                  <span className="text-sm">100% Seguro</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-400/20 to-accent-400/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-white rounded-3xl shadow-farma-lg p-8 space-y-5 border border-gray-100">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center shadow-farma">
                      <Stethoscope className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Próxima Consulta</p>
                      <p className="font-semibold text-gray-900">Dr. João Silva</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Hoje</p>
                    <p className="font-semibold text-primary-600">14:30</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-2xl border border-primary-100">
                    <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center mb-3">
                      <Video className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">24/7</p>
                    <p className="text-sm text-gray-600">Telemedicina</p>
                  </div>
                  <div className="p-5 bg-gradient-to-br from-accent-50 to-accent-100/50 rounded-2xl border border-accent-100">
                    <div className="w-10 h-10 bg-accent-600 rounded-xl flex items-center justify-center mb-3">
                      <Truck className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">30min</p>
                    <p className="text-sm text-gray-600">Entrega Express</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-emerald-700">Pedido entregue!</p>
                      <p className="text-xs text-emerald-600">Paracetamol 500mg</p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-600 font-medium">Agora</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicos" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="badge badge-primary mb-4">Nossos Serviços</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Tudo para cuidar da sua saúde
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Soluções completas de saúde ao seu alcance, onde quer que esteja
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Video,
                title: 'Consultas Online',
                desc: 'Fale com médicos especialistas por vídeo, áudio ou chat, 24 horas por dia',
                gradient: 'from-primary-500 to-primary-600',
              },
              {
                icon: Pill,
                title: 'Farmácia Express',
                desc: 'Medicamentos entregues em até 30 minutos na sua porta',
                gradient: 'from-accent-500 to-accent-600',
              },
              {
                icon: HomeIcon,
                title: 'Atendimento Domiciliar',
                desc: 'Enfermeiros e médicos vão até você para consultas e procedimentos',
                gradient: 'from-emerald-500 to-emerald-600',
              },
              {
                icon: Calendar,
                title: 'Agendamentos',
                desc: 'Agende consultas presenciais em hospitais e clínicas parceiras',
                gradient: 'from-amber-500 to-amber-600',
              },
              {
                icon: Package,
                title: 'Pacotes de Saúde',
                desc: 'Planos mensais com consultas ilimitadas e descontos em medicamentos',
                gradient: 'from-rose-500 to-rose-600',
              },
              {
                icon: Shield,
                title: 'Histórico Médico',
                desc: 'Seu histórico completo sempre à mão, sincronizado em todos os dispositivos',
                gradient: 'from-farma-cyan-500 to-farma-cyan-600',
              },
            ].map((service, idx) => (
              <div 
                key={idx}
                className="group card-elevated p-8 hover:border-primary-100"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${service.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <service.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-20 lg:py-28 bg-gradient-to-br from-primary-50 via-white to-accent-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="badge badge-accent mb-4">Como Funciona</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Simples e rápido
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Em apenas 3 passos você tem acesso a toda nossa rede de saúde
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: '01',
                title: 'Crie sua conta',
                desc: 'Cadastre-se gratuitamente em menos de 2 minutos',
                icon: Smartphone,
              },
              {
                step: '02',
                title: 'Escolha o serviço',
                desc: 'Consulta online, entrega de medicamentos ou atendimento domiciliar',
                icon: Stethoscope,
              },
              {
                step: '03',
                title: 'Pronto!',
                desc: 'Receba atendimento de qualidade onde você estiver',
                icon: CheckCircle,
              },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                {idx < 2 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary-300 to-transparent"></div>
                )}
                <div className="text-center">
                  <div className="relative inline-flex mb-6">
                    <div className="w-20 h-20 bg-white rounded-2xl shadow-farma flex items-center justify-center">
                      <item.icon className="w-10 h-10 text-primary-600" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-primary-700 via-primary-600 to-accent-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: '10.000+', label: 'Pacientes' },
              { value: '500+', label: 'Médicos' },
              { value: '50+', label: 'Farmácias' },
              { value: '24/7', label: 'Disponibilidade' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <p className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-primary-100">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages Preview */}
      <section id="pacotes" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="badge badge-success mb-4">Pacotes</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Escolha o melhor plano para você
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Planos flexíveis que cabem no seu bolso
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Básico',
                price: '5.000',
                features: ['2 consultas online/mês', 'Histórico médico digital', 'Suporte por chat'],
                popular: false,
              },
              {
                name: 'Família',
                price: '12.000',
                features: ['Consultas ilimitadas', 'Até 4 dependentes', '10% desconto em medicamentos', 'Atendimento prioritário'],
                popular: true,
              },
              {
                name: 'Premium',
                price: '25.000',
                features: ['Tudo do Família', 'Atendimento domiciliar', '20% desconto em medicamentos', 'Gestor de saúde dedicado'],
                popular: false,
              },
            ].map((plan, idx) => (
              <div 
                key={idx}
                className={`relative rounded-3xl p-8 ${
                  plan.popular 
                    ? 'bg-gradient-to-br from-primary-600 to-accent-600 text-white shadow-farma-lg scale-105' 
                    : 'bg-white border-2 border-gray-100 hover:border-primary-200'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 px-4 py-1 rounded-full text-sm font-semibold">
                    Mais Popular
                  </span>
                )}
                <h3 className={`text-xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  <span className={plan.popular ? 'text-primary-100' : 'text-gray-500'}> Kz/mês</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center gap-3">
                      <CheckCircle className={`w-5 h-5 ${plan.popular ? 'text-primary-200' : 'text-emerald-500'}`} />
                      <span className={plan.popular ? 'text-primary-50' : 'text-gray-600'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`block w-full py-3 rounded-xl text-center font-semibold transition ${
                    plan.popular
                      ? 'bg-white text-primary-600 hover:bg-primary-50'
                      : 'bg-gradient-to-r from-primary-600 to-accent-600 text-white hover:opacity-90'
                  }`}
                >
                  Começar Agora
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Pronto para cuidar da sua saúde?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Junte-se a milhares de angolanos que já confiam no FarmaDom
          </p>
          <Link 
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold hover:bg-primary-50 transition shadow-lg"
          >
            <span>Criar Conta Gratuita</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold text-white">Farma</span>
                  <span className="text-xl font-bold text-accent-400">Dom</span>
                </div>
              </div>
              <p className="text-gray-400 mb-4 max-w-sm">
                Saúde de qualidade ao seu domicílio. Conectando pacientes a médicos 
                e farmácias em toda Angola.
              </p>
              <div className="flex items-center gap-4">
                <Phone className="w-5 h-5 text-primary-400" />
                <span>+244 923 456 789</span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <MapPin className="w-5 h-5 text-primary-400" />
                <span>Luanda, Angola</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Serviços</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-primary-400 transition">Consultas Online</a></li>
                <li><a href="#" className="hover:text-primary-400 transition">Farmácia</a></li>
                <li><a href="#" className="hover:text-primary-400 transition">Atendimento Domiciliar</a></li>
                <li><a href="#" className="hover:text-primary-400 transition">Pacotes de Saúde</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-primary-400 transition">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-primary-400 transition">Carreiras</a></li>
                <li><a href="#" className="hover:text-primary-400 transition">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-primary-400 transition">Privacidade</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2026 FarmaDom. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
