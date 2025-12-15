import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Check, MessageSquare, Shield, Zap, ChevronDown, ChevronUp, Lock, EyeOff, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function Landing() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [typedText, setTypedText] = useState('');
    const fullText = "O segredo fica entre nós...";
    const [showMessages, setShowMessages] = useState(false);

    // Typing effect
    useEffect(() => {
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex <= fullText.length) {
                setTypedText(fullText.slice(0, currentIndex));
                currentIndex++;
            } else {
                clearInterval(interval);
                setTimeout(() => setShowMessages(true), 500);
            }
        }, 100);
        return () => clearInterval(interval);
    }, []);

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    // Smooth scroll handler
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const faqs = [
        {
            question: "É realmente anônimo?",
            answer: "Sim! O destinatário receberá a mensagem vinda do nosso número oficial, sem nenhuma identificação sua. Nós apenas armazenamos os logs por questões de segurança e termos de uso."
        },
        {
            question: "Como funciona o envio?",
            answer: "Você escolhe um pacote, escreve sua mensagem e o número do destinatário. Nosso sistema processa e envia via WhatsApp em segundos."
        },
        {
            question: "Posso usar para qualquer número?",
            answer: "Sim, enviamos para qualquer número de WhatsApp válido no Brasil."
        },
        {
            question: "O que acontece se a mensagem não chegar?",
            answer: "Se a mensagem falhar por erro nosso, seus créditos não são descontados. Se o número for inválido, avisaremos você."
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans overflow-x-hidden">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 transition-all">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 transform hover:scale-105 transition-transform duration-300">
                        <div className="bg-[#075E54] p-2 rounded-lg shadow-lg">
                            <MessageSquare className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-[#075E54]">WhisperSend</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/login">
                            <Button variant="ghost" className="hover:bg-green-50 hover:text-green-700">Entrar</Button>
                        </Link>
                        <Link to="/signup">
                            <Button className="bg-[#075E54] hover:bg-[#128C7E] shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5">
                                Criar Conta
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-20 lg:py-32 overflow-hidden relative bg-gradient-to-br from-gray-900 via-[#0a1f1c] to-black text-white">
                {/* Floating Icons Background Animation */}
                <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
                    <div className="absolute top-10 left-10 animate-pulse delay-75 duration-[3000ms]"><Lock className="w-12 h-12" /></div>
                    <div className="absolute top-40 right-20 animate-bounce delay-150 duration-[4000ms]"><MessageSquare className="w-8 h-8" /></div>
                    <div className="absolute bottom-20 left-1/4 animate-pulse delay-300 duration-[5000ms]"><EyeOff className="w-16 h-16" /></div>
                    <div className="absolute top-1/3 right-1/3 animate-ping delay-500 duration-[4000ms]"><Zap className="w-6 h-6" /></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

                        {/* Text Content */}
                        <div className="flex-1 text-center lg:text-left">
                            <div className="inline-block bg-[#075E54]/20 border border-[#075E54]/50 rounded-full px-4 py-1.5 mb-6 animate-in slide-in-from-bottom-5 fade-in duration-700">
                                <span className="text-[#25D366] text-sm font-semibold tracking-wide uppercase flex items-center gap-2">
                                    <Shield className="w-4 h-4" /> 100% Anônimo e Seguro
                                </span>
                            </div>

                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                                Envie mensagens secretas via <span className="text-[#25D366] underline decoration-4 underline-offset-4">WhatsApp</span>
                            </h1>

                            <div className="h-8 mb-8 text-xl sm:text-2xl text-gray-300 font-mono">
                                {typedText}<span className="animate-pulse">|</span>
                            </div>

                            <p className="text-lg text-gray-400 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                                Surpreenda quem você gosta, faça uma brincadeira ou declare-se sem revelar sua identidade.
                                Nós garantimos o sigilo total.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                                <Link to="/signup" className="w-full sm:w-auto">
                                    <Button size="lg" className="w-full h-14 text-lg bg-[#25D366] hover:bg-[#128C7E] text-white shadow-[0_0_20px_rgba(37,211,102,0.4)] hover:shadow-[0_0_30px_rgba(37,211,102,0.6)] transition-all transform hover:-translate-y-1">
                                        Enviar Mensagem Agora <Send className="ml-2 w-5 h-5" />
                                    </Button>
                                </Link>
                                <button onClick={() => scrollToSection('how-it-works')} className="w-full sm:w-auto">
                                    <Button size="lg" variant="outline" className="w-full h-14 text-lg border-white/30 text-white hover:bg-white/10 hover:text-white transition-colors bg-white/5 backdrop-blur-sm">
                                        Como Funciona
                                    </Button>
                                </button>
                            </div>

                            <div className="mt-10 flex items-center justify-center lg:justify-start gap-8 text-sm text-gray-400">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></div> +10k Mensagens
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse delay-75"></div> Entrega Imediata
                                </div>
                            </div>
                        </div>

                        {/* Animated Phone Mockup */}
                        <div className="relative mx-auto w-[300px] h-[600px] bg-gray-900 rounded-[3rem] border-[10px] border-gray-800 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-700 ease-out lg:mr-10">
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-[25px] bg-black rounded-b-3xl z-20"></div>
                            <div className="absolute -right-1 top-20 w-1 h-12 bg-gray-700 rounded transition-all"></div>
                            <div className="absolute -left-1 top-20 w-1 h-6 bg-gray-700 rounded transition-all"></div>

                            <div className="w-full h-full bg-[#0b141a] rounded-[2.2rem] overflow-hidden flex flex-col relative z-10">
                                {/* WhatsApp Header */}
                                <div className="bg-[#202c33] p-4 pt-10 text-gray-100 flex items-center gap-3 shadow-md z-10">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00A884] to-[#075E54] flex items-center justify-center text-white font-bold text-lg">W</div>
                                    <div>
                                        <div className="font-semibold text-lg">WhisperSend</div>
                                        <div className="text-xs text-[#00A884]">online</div>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat opacity-90 p-4 flex flex-col justify-end space-y-3 pb-8">

                                    <div className={cn(
                                        "bg-[#202c33] text-white p-3 rounded-lg rounded-tl-none max-w-[85%] shadow-sm self-start transform transition-all duration-700 ease-out",
                                        showMessages ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                                    )}>
                                        <p className="text-sm">Alguém te mandou uma mensagem secreta... 🤫</p>
                                        <span className="text-[10px] text-gray-400 block text-right mt-1">19:42</span>
                                    </div>

                                    <div className={cn(
                                        "bg-[#202c33] text-white p-3 rounded-lg rounded-tl-none max-w-[85%] shadow-sm self-start transform transition-all duration-700 delay-500 ease-out",
                                        showMessages ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                                    )}>
                                        <p className="text-sm">"Admiro você de longe há muito tempo. Seu sorriso ilumina meu dia! ❤️"</p>
                                        <span className="text-[10px] text-gray-400 block text-right mt-1">19:42</span>
                                    </div>

                                    <div className={cn(
                                        "bg-[#005c4b] text-white p-3 rounded-lg rounded-tr-none max-w-[85%] shadow-sm self-end transform transition-all duration-700 delay-1000 ease-out",
                                        showMessages ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                                    )}>
                                        <p className="text-sm">Nossa!! Quem é?? 😍</p>
                                        <div className="flex items-center justify-end gap-1 mt-1">
                                            <span className="text-[10px] text-green-200">19:43</span>
                                            <div className="flex"><Check className="w-3 h-3 text-[#53bdeb]" /><Check className="w-3 h-3 text-[#53bdeb] -ml-1" /></div>
                                        </div>
                                    </div>

                                </div>

                                {/* Input Area Simulation */}
                                <div className="bg-[#202c33] p-2 flex items-center gap-2">
                                    <div className="bg-[#2a3942] h-9 flex-1 rounded-full"></div>
                                    <div className="bg-[#00A884] w-9 h-9 rounded-full flex items-center justify-center">
                                        <Send className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section id="how-it-works" className="py-24 bg-white relative">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <span className="text-[#075E54] font-semibold text-sm tracking-wide uppercase">Simples e Rápido</span>
                        <h2 className="text-3xl md:text-4xl font-bold mt-2 text-gray-900">Como Funciona</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto mt-4 text-lg">
                            Em menos de 1 minuto sua mensagem será entregue.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {[
                            {
                                icon: <Zap className="w-8 h-8 text-white" />,
                                title: "1. Escolha o Pacote",
                                desc: "Selecione quantas mensagens deseja enviar. Temos opções super acessíveis a partir de R$ 2,50.",
                                color: "bg-blue-500"
                            },
                            {
                                icon: <MessageSquare className="w-8 h-8 text-white" />,
                                title: "2. Escreva",
                                desc: "Digite sua mensagem anonimamente. Use sua criatividade para surpreender.",
                                color: "bg-purple-500"
                            },
                            {
                                icon: <Send className="w-8 h-8 text-white" />,
                                title: "3. Receba a Reação",
                                desc: "Nós enviamos instantaneamente. Você só precisa aguardar a repercussão!",
                                color: "bg-green-500"
                            }
                        ].map((step, i) => (
                            <div key={i} className="relative group p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mb-6 transform group-hover:scale-110 transition-transform duration-300", step.color)}>
                                    {step.icon}
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-gray-900">{step.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{step.desc}</p>

                                <div className="absolute top-6 right-8 text-6xl font-black text-gray-200/50 -z-10 select-none">
                                    {i + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section className="py-24 bg-gray-50 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>

                {/* Decorative blobs */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-16">
                        <span className="text-[#075E54] font-semibold text-sm tracking-wide uppercase">Preços Acessíveis</span>
                        <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">Planos e Preços</h2>
                        <p className="text-gray-600">Comece agora mesmo com o melhor custo-benefício do mercado.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
                        {/* Pacote 1 */}
                        <Card className="hover:shadow-xl transition-all duration-300 border-gray-200 hover:-translate-y-1">
                            <CardHeader className="text-center">
                                <CardTitle className="text-xl">Plano Sussurro</CardTitle>
                                <CardDescription>Para quem quer começar</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 text-center">
                                <div className="text-5xl font-extrabold text-gray-900">R$ 10,00</div>
                                <ul className="space-y-3 text-sm text-gray-600 text-left px-4">
                                    <li className="flex items-center gap-3"><div className="bg-green-100 p-1 rounded-full"><Check className="h-3 w-3 text-green-600" /></div> 5 Mensagens</li>
                                    <li className="flex items-center gap-3"><div className="bg-green-100 p-1 rounded-full"><Check className="h-3 w-3 text-green-600" /></div> Entrega Instantânea</li>
                                    <li className="flex items-center gap-3"><div className="bg-green-100 p-1 rounded-full"><Check className="h-3 w-3 text-green-600" /></div> Sigilo Absoluto</li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Link to="/signup" className="w-full">
                                    <Button variant="outline" className="w-full h-12 border-2 text-md font-semibold hover:bg-gray-50">Comprar Pacote</Button>
                                </Link>
                            </CardFooter>
                        </Card>

                        {/* Pacote 2 (Popular) */}
                        <Card className="relative border-2 border-[#075E54] shadow-2xl scale-110 z-10 bg-white">
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#075E54] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg tracking-wide uppercase">
                                Mais Popular
                            </div>
                            <CardHeader className="text-center pb-2">
                                <CardTitle className="text-2xl text-[#075E54]">🔸 Plano Voz Oculta</CardTitle>
                                <CardDescription>O equilíbrio perfeito</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 text-center">
                                <div className="text-6xl font-black text-gray-900 tracking-tight">R$ 45,00</div>


                                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                                    <ul className="space-y-3 text-sm text-gray-700 text-left">
                                        <li className="flex items-center gap-3"><Check className="h-5 w-5 text-[#075E54]" /> <strong>30 Mensagens</strong></li>
                                        <li className="flex items-center gap-3"><Check className="h-5 w-5 text-[#075E54]" /> Prioridade de Envio</li>
                                        <li className="flex items-center gap-3"><Check className="h-5 w-5 text-[#075E54]" /> Suporte VIP</li>
                                    </ul>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Link to="/signup" className="w-full">
                                    <Button className="w-full h-12 text-md font-bold bg-[#075E54] hover:bg-[#128C7E] shadow-lg shadow-green-900/20">
                                        Garanta Agora
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>

                        {/* Pacote 3 */}
                        <Card className="hover:shadow-xl transition-all duration-300 border-gray-200 hover:-translate-y-1">
                            <CardHeader className="text-center">
                                <CardTitle className="text-xl">🔥 Plano Anônimo Pro</CardTitle>
                                <CardDescription>Para Heavy Users</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 text-center">
                                <div className="text-5xl font-extrabold text-gray-900">R$ 80,00</div>
                                <ul className="space-y-3 text-sm text-gray-600 text-left px-4">
                                    <li className="flex items-center gap-3"><div className="bg-green-100 p-1 rounded-full"><Check className="h-3 w-3 text-green-600" /></div> 100 Mensagens</li>
                                    <li className="flex items-center gap-3"><div className="bg-green-100 p-1 rounded-full"><Check className="h-3 w-3 text-green-600" /></div> Nunca Expira</li>
                                    <li className="flex items-center gap-3"><div className="bg-green-100 p-1 rounded-full"><Check className="h-3 w-3 text-green-600" /></div> Painel Completo</li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Link to="/signup" className="w-full">
                                    <Button variant="outline" className="w-full h-12 border-2 text-md font-semibold hover:bg-gray-50">Comprar Pacote</Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4 max-w-3xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4 text-gray-900">Dúvidas Frequentes</h2>
                        <p className="text-gray-500">Tire suas dúvidas antes de começar.</p>
                    </div>
                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:border-gray-300">
                                <button
                                    onClick={() => toggleFaq(i)}
                                    className="w-full text-left p-6 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                                >
                                    <span className="font-semibold text-lg text-gray-800">{faq.question}</span>
                                    {openFaq === i ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                                </button>
                                <div className={cn("overflow-hidden transition-all duration-300 bg-gray-50", openFaq === i ? "max-h-40 px-6 pb-6" : "max-h-0")}>
                                    <p className="text-gray-600 leading-relaxed border-t border-gray-100 pt-4">{faq.answer}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#0b141a] text-gray-300 py-16">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-2">
                            <div className="absolute top-6 left-6 flex items-center gap-3">
                                <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/20">
                                    <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain" />
                                </div>
                                <span className="text-xl font-bold text-white tracking-tight">WhisperSend</span>
                            </div>
                            <p className="text-gray-400 max-w-md leading-relaxed mb-6">
                                A plataforma mais segura e divertida para enviar mensagens anônimas.
                                Nós levamos sua privacidade a sério, proporcionando entretenimento com responsabilidade.
                            </p>
                            <div className="flex gap-4">
                                {/* Social Icons Placeholders */}
                                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#075E54] transition-colors cursor-pointer">
                                    <span className="font-bold text-white">Ig</span>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#075E54] transition-colors cursor-pointer">
                                    <span className="font-bold text-white">Tw</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-6 text-lg">Legal</h4>
                            <ul className="space-y-4 text-sm text-gray-400">
                                <li><Link to="/terms" className="hover:text-[#25D366] transition-colors">Termos de Uso</Link></li>
                                <li><Link to="/privacy" className="hover:text-[#25D366] transition-colors">Política de Privacidade</Link></li>
                                <li><Link to="/cookies" className="hover:text-[#25D366] transition-colors">Política de Cookies</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-6 text-lg">Suporte</h4>
                            <ul className="space-y-4 text-sm text-gray-400">
                                <li className="flex items-center gap-2"><div className="w-2 h-2 bg-[#25D366] rounded-full"></div> conectajuse@gmail.com</li>
                                <li className="flex items-center gap-2"><div className="w-2 h-2 bg-[#25D366] rounded-full"></div> Seg-Sex: 9h às 18h</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
                        &copy; {new Date().getFullYear()} WhisperSend. Todos os direitos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
}
