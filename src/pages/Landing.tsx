import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Check, MessageSquare, Shield, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function Landing() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
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
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-green-100 p-2 rounded-lg">
                            <MessageSquare className="h-6 w-6 text-primary" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">WhisperSend</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/login">
                            <Button variant="ghost">Entrar</Button>
                        </Link>
                        <Link to="/signup">
                            <Button>Criar Conta</Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-20 lg:py-32 overflow-hidden relative">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900">
                            Envie Mensagens Anônimas via WhatsApp
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                            Surpreenda, declare-se ou brinque com seus amigos.
                            Sua identidade está 100% segura conosco.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/signup" className="w-full sm:w-auto">
                                <Button size="lg" className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all">
                                    Começar Agora
                                </Button>
                            </Link>
                            <Link to="#how-it-works" className="w-full sm:w-auto">
                                <Button size="lg" variant="outline" className="w-full h-12 text-lg">
                                    Como Funciona
                                </Button>
                            </Link>
                        </div>
                        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" /> Seguro
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4" /> Rápido
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="h-4 w-4" /> Garantido
                            </div>
                        </div>
                    </div>

                    {/* Decorative Phone Mockup Placeholder */}
                    <div className="relative mx-auto w-[280px] h-[580px] bg-gray-900 rounded-[3rem] border-8 border-gray-900 shadow-2xl p-2 hidden md:block rotate-3 hover:rotate-0 transition-transform duration-500">
                        <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden flex flex-col relative">
                            <div className="bg-[#075E54] p-4 text-white flex items-center gap-2 z-10">
                                <div className="w-8 h-8 rounded-full bg-gray-300"></div>
                                <div>
                                    <div className="text-sm font-bold">WhisperSend</div>
                                    <div className="text-xs opacity-75">online</div>
                                </div>
                            </div>
                            <div className="flex-1 bg-[#ECE5DD] p-4 flex flex-col justify-end gap-2 overflow-hidden bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat opacity-90">
                                <div className="self-start bg-white rounded-lg p-2 shadow-sm max-w-[80%] text-sm rounded-tl-none">
                                    Olá! Alguém te enviou uma mensagem anônima 😉
                                </div>
                                <div className="self-end bg-[#DCF8C6] rounded-lg p-2 shadow-sm max-w-[80%] text-sm rounded-tr-none">
                                    Sério? Quem foi? 😱
                                </div>
                            </div>
                            <div className="h-1 bg-gray-200 mt-auto mx-auto w-1/3 rounded-full mb-2"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section id="how-it-works" className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Como Funciona</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Simples, rápido e totalmente confidencial. Em três passos você envia sua mensagem.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { title: "1. Escolha um Pacote", desc: "Selecione a quantidade de mensagens que deseja enviar. Temos opções para todas as necessidades." },
                            { title: "2. Escreva sua Mensagem", desc: "Digite o texto, o número do destinatário e escolha um apelido divertido." },
                            { title: "3. Nós Enviamos", desc: "Nosso sistema entrega a mensagem instantaneamente no WhatsApp do destinatário." }
                        ].map((step, i) => (
                            <div key={i} className="text-center p-6 rounded-2xl bg-gray-50 border hover:shadow-lg transition-all">
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                                    {i + 1}
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                                <p className="text-gray-600">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Planos e Preços</h2>
                        <p className="text-gray-600">Escolha o pacote ideal para você</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* Pacote 1 */}
                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle>Mensagem Única</CardTitle>
                                <CardDescription>Para um recado pontual</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-4xl font-bold">R$ 2,50</div>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 1 Mensagem</li>
                                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Até 500 caracteres</li>
                                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Anonimato garantido</li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Link to="/signup" className="w-full">
                                    <Button className="w-full">Comprar</Button>
                                </Link>
                            </CardFooter>
                        </Card>

                        {/* Pacote 2 (Popular) */}
                        <Card className="relative border-green-500 shadow-xl scale-105 z-10">
                            <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                                MAIS POPULAR
                            </div>
                            <CardHeader>
                                <CardTitle>Pacote 5</CardTitle>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500 line-through">R$ 12,50</span>
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">5% OFF</span>
                                </div>
                                <CardDescription>Ideal para conversar</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-4xl font-bold text-green-600">R$ 11,90</div>
                                <div className="text-sm text-gray-500">R$ 2,38 por mensagem</div>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 5 Mensagens</li>
                                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Até 500 caracteres</li>
                                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Anonimato garantido</li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Link to="/signup" className="w-full">
                                    <Button className="w-full bg-green-600 hover:bg-green-700">Comprar Agora</Button>
                                </Link>
                            </CardFooter>
                        </Card>

                        {/* Pacote 3 */}
                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle>Pacote 10</CardTitle>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500 line-through">R$ 25,00</span>
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">8% OFF</span>
                                </div>
                                <CardDescription>Melhor custo-benefício</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-4xl font-bold">R$ 22,90</div>
                                <div className="text-sm text-gray-500">R$ 2,29 por mensagem</div>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 10 Mensagens</li>
                                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Até 500 caracteres</li>
                                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Anonimato garantido</li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Link to="/signup" className="w-full">
                                    <Button variant="outline" className="w-full">Comprar</Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4 max-w-3xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Dúvidas Frequentes</h2>
                    </div>
                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <div key={i} className="border rounded-lg overflow-hidden">
                                <button
                                    onClick={() => toggleFaq(i)}
                                    className="w-full text-left p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                    <span className="font-medium">{faq.question}</span>
                                    {openFaq === i ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                </button>
                                <div className={cn("overflow-hidden transition-all duration-300", openFaq === i ? "max-h-40 p-4" : "max-h-0")}>
                                    <p className="text-gray-600">{faq.answer}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-12">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-2 mb-4 text-white">
                                <div className="bg-green-600 p-1.5 rounded-lg">
                                    <MessageSquare className="h-5 w-5" />
                                </div>
                                <span className="text-xl font-bold">WhisperSend</span>
                            </div>
                            <p className="text-sm text-gray-400 max-w-xs">
                                A plataforma mais segura e divertida para enviar mensagens anônimas. Entretenimento garantido com responsabilidade.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/terms" className="hover:text-white">Termos de Uso</Link></li>
                                <li><Link to="/privacy" className="hover:text-white">Privacidade</Link></li>
                                <li><Link to="/cookies" className="hover:text-white">Cookies</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4">Contato</h4>
                            <ul className="space-y-2 text-sm">
                                <li>suporte@whispersend.com</li>
                                <li>Instagram</li>
                                <li>Twitter</li>
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
