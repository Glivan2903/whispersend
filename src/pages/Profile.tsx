import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { User, Mail, Shield, Check, LogOut, ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';

export default function Profile() {
    const { user, signOut } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [purchases, setPurchases] = useState<any[]>([]);

    const { register, handleSubmit } = useForm({
        defaultValues: {
            email: user?.email,
            fullName: user?.user_metadata?.full_name
        }
    });

    useEffect(() => {
        fetchPurchases();
    }, []);

    const fetchPurchases = async () => {
        const { data } = await supabase
            .from('purchases')
            .select(`
            *,
            packages (name)
        `)
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false });
        setPurchases(data || []);
    };

    const onUpdate = async (data: any) => {
        setLoading(true);
        setSuccess(false);

        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: data.fullName }
            });

            if (error) throw error;

            // Also update public.users table if we were keeping it in sync manually or rely on triggers
            await supabase.from('users').update({ full_name: data.fullName }).eq('id', user?.id);

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Meu Perfil</h1>
                <p className="text-gray-500">Gerencie seus dados e veja seu histórico de compras.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Profile Edit Card */}
                <div className="md:col-span-2 space-y-8">
                    <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-xl">Dados Pessoais</CardTitle>
                            <CardDescription>Suas informações de contato.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit(onUpdate)} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            {...register('email')}
                                            className="pl-10 bg-gray-50/50 cursor-not-allowed border-gray-200"
                                            disabled
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400">O email não pode ser alterado.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Nome Completo</label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-3 bg-gray-100 p-0.5 rounded text-gray-400 group-focus-within:text-[#075E54] transition-colors">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <Input
                                            {...register('fullName')}
                                            className="pl-11 border-gray-200 focus:border-[#075E54] focus:ring-[#075E54]/20 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-[#075E54] hover:bg-[#128C7E] text-white"
                                    >
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        {loading ? "Salvando..." : "Salvar Alterações"}
                                    </Button>

                                    {success && (
                                        <span className="text-sm text-green-600 flex items-center animate-in fade-in slide-in-from-left-2 font-medium">
                                            <Check className="h-4 w-4 mr-1.5" /> Salvo com sucesso!
                                        </span>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-xl">Segurança</CardTitle>
                            <CardDescription>Mantenha sua conta segura.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-100">
                                <div className="flex items-center gap-4">
                                    <div className="bg-orange-100 p-2 rounded-full">
                                        <Shield className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">Senha de Acesso</p>
                                        <p className="text-xs text-gray-500">Recomendamos trocar periodicamente.</p>
                                    </div>
                                </div>
                                <Link to="/forgot-password">
                                    <Button variant="outline" size="sm" className="hover:bg-orange-100 hover:text-orange-700 hover:border-orange-200">
                                        Alterar Senha
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Purchases History */}
                <div>
                    <Card className="h-full border-none shadow-sm bg-white/80 backdrop-blur-sm flex flex-col">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl">Compras Recentes</CardTitle>
                            <CardDescription>Seus pacotes adquiridos.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                            {purchases.length > 0 ? (
                                <div className="space-y-4">
                                    {purchases.map((p) => (
                                        <div key={p.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-green-100 p-2 rounded-full">
                                                    <Check className="h-4 w-4 text-[#075E54]" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-gray-900">{p.packages?.name || 'Pacote'}</div>
                                                    <div className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-sm text-[#075E54]">
                                                    R$ {p.amount_paid.toFixed(2).replace('.', ',')}
                                                </div>
                                                <div className="text-[10px] uppercase font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                                    {p.payment_status}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 px-4">
                                    <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <CreditCard className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <p className="text-gray-900 font-medium">Nenhuma compra ainda</p>
                                    <p className="text-xs text-gray-500 mt-1">Adquira créditos para começar a enviar mensagens.</p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="pt-4 border-t border-gray-50">
                            <Link to="/packages" className="w-full">
                                <Button className="w-full bg-[#075E54] hover:bg-[#128C7E] text-white shadow-sm">
                                    Comprar Novos Pacotes
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
