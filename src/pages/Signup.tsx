import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Loader2, Mail, Lock, User, Check, MessageCircle } from 'lucide-react';
import { Typewriter } from '@/components/ui/typewriter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const signupSchema = z.object({
    fullName: z.string().min(3, "Nome muito curto"),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function Signup() {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { signUp, initialize } = useAuthStore();

    const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>({
        resolver: zodResolver(signupSchema),
    });

    const onSubmit = async (data: SignupForm) => {
        setError(null);
        setLoading(true);
        try {
            const authData = await signUp(data.email, data.password, data.fullName);

            if (authData.session) {
                await initialize();
                navigate('/dashboard');
            } else {
                // Registration successful but needs email verification
                setSuccess(true);
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-green-100 p-3 rounded-full w-fit mb-4">
                            <MessageCircle className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Verifique seu Email</CardTitle>
                        <CardDescription className="text-base mt-2">
                            Enviamos um link de confirmação para <strong>seu email</strong>.
                            Por favor, clique no link para ativar sua conta.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500">
                            Após confirmar, você poderá fazer login e começar a usar o WhisperSend.
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <Link to="/login">
                            <Button variant="outline">Ir para Login</Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex w-full bg-white font-sans">
            {/* Left Column - Hero */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#128C7E] relative overflow-hidden flex-col justify-between p-12 text-white">
                <div className="absolute inset-0 opacity-10 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat"></div>
                {/* Blobs */}
                <div className="absolute bottom-20 right-20 w-80 h-80 bg-[#25D366] rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
                <div className="absolute top-20 left-20 w-60 h-60 bg-[#34B7F1] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <MessageSquare className="h-6 w-6" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">WhisperSend</span>
                    </div>

                    <div className="mt-20">
                        <h1 className="text-5xl font-extrabold leading-tight mb-6">
                            Comece a enviar <br />
                            <span className="text-[#25D366]">
                                <Typewriter
                                    texts={['mensagens secretas', 'confissões', 'elogios', 'brincadeiras']}
                                    speed={80}
                                    delay={2000}
                                />
                            </span>
                            <br />
                            minutos.
                        </h1>
                        <p className="text-white/80 text-lg max-w-md">
                            Crie sua conta gratuitamente e ganhe créditos para testar agora mesmo.
                        </p>
                    </div>
                </div>
                <div className="relative z-10">
                    <div className="flex gap-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-[#25D366] w-full" style={{ width: i === 1 ? '100%' : '0%' }}></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md space-y-6">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Crie sua conta</h2>
                        <p className="text-gray-500 mt-2">Junte-se a milhares de usuários enviando whispers.</p>
                    </div>

                    <div className="bg-white p-0 sm:p-8 rounded-2xl">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
                                    <span className="font-bold">Erro:</span> {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input placeholder="Seu Nome" className="pl-10 h-10" {...register('fullName')} />
                                </div>
                                {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input placeholder="seu@email.com" className="pl-10 h-10" {...register('email')} />
                                </div>
                                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input type="password" placeholder="••••••••" className="pl-10 h-10" {...register('password')} />
                                </div>
                                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Confirmar Senha</label>
                                <div className="relative">
                                    <Check className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input type="password" placeholder="••••••••" className="pl-10 h-10" {...register('confirmPassword')} />
                                </div>
                                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
                            </div>

                            <Button type="submit" className="w-full h-11 bg-[#128C7E] hover:bg-[#075E54] text-lg font-medium shadow-md transition-all" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? 'Criando conta...' : 'Cadastrar Grátis'}
                            </Button>
                        </form>
                    </div>

                    <div className="text-center text-sm text-gray-500">
                        Já tem uma conta?{' '}
                        <Link to="/login" className="font-bold text-[#128C7E] hover:underline">
                            Fazer login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
