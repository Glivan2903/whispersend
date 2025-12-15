import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Loader2, Lock, Mail, ArrowRight, ShieldCheck, Zap, Eye, EyeOff } from 'lucide-react';
import { Typewriter } from '@/components/ui/typewriter';

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { signIn } = useAuthStore();

    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setError(null);
        setLoading(true);
        try {
            await signIn(data.email, data.password);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Falha ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex w-full bg-white font-sans">
            {/* Left Column - Hero/Effects */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#075E54] relative overflow-hidden flex-col justify-between p-12 text-white">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat"></div>

                {/* Animated blobs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#128C7E] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#25D366] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <MessageSquare className="h-6 w-6" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">WhisperSend</span>
                    </div>

                    <div className="mt-20">
                        <h1 className="text-5xl font-extrabold leading-tight mb-6">
                            O jeito mais <br />
                            <span className="text-[#25D366]">
                                <Typewriter
                                    texts={['seguro', 'anônimo', 'rápido', 'divertido']}
                                    speed={100}
                                    delay={1500}
                                />
                            </span>
                            <br />
                            de enviar mensagens.
                        </h1>
                        <p className="text-white/80 text-lg max-w-md">
                            Surpreenda seus amigos, declare seu amor ou faça brincadeiras sem revelar sua identidade. Totalmente seguro e privado.
                        </p>
                    </div>
                </div>

                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-4 text-sm font-medium text-white/70">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-[#25D366]" /> Criptografia Ponta-a-Ponta
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-[#25D366]" /> Entrega Instantânea
                        </div>
                    </div>
                    <p className="text-xs text-white/50">© 2025 WhisperSend Inc.</p>
                </div>
            </div>

            {/* Right Column - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50/50">
                <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="text-center">
                        <div className="lg:hidden flex justify-center mb-4">
                            <div className="bg-[#075E54] p-3 rounded-xl">
                                <MessageSquare className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Bem-vindo de volta!</h2>
                        <p className="text-gray-500 mt-2">Digite suas credenciais para acessar sua conta.</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
                                    <span className="font-bold">Erro:</span> {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="seu@email.com"
                                        className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                        {...register('email')}
                                    />
                                </div>
                                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-gray-700">Senha</label>
                                    <Link to="/forgot-password" className="text-xs font-medium text-[#075E54] hover:underline">
                                        Esqueceu a senha?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="pl-10 pr-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                        {...register('password')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                            </div>

                            <Button type="submit" className="w-full h-11 text-base bg-[#075E54] hover:bg-[#128C7E] transition-all duration-300 shadow-lg shadow-[#075E54]/20" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? 'Entrando...' : 'Entrar'}
                                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                            </Button>
                        </form>
                    </div>

                    <div className="text-center text-sm text-gray-500">
                        Não tem uma conta?{' '}
                        <Link to="/signup" className="font-bold text-[#075E54] hover:underline hover:text-[#128C7E] transition-colors">
                            Crie sua conta agora
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
