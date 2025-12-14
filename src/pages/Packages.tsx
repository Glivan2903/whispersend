import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Check, Loader2, QrCode, CreditCard, ArrowLeft, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
// Removed unused Dialog import
import { cn } from '@/lib/utils';

// Since we don't have the Dialog component yet, I will create a simple inline modal or install the Dialog if I can.
// Actually, creating the Dialog component is better for reusability. For now I'll stick to a simple absolute overlay or custom modal structure within this file to save tool calls, or just scaffold the Dialog ui component.
// The user has shadcn/ui. I should probably have installed the dialog component.
// Let's implement a custom overlay for now to be fast.

interface Package {
    id: string;
    name: string;
    quantity: number;
    price: number;
    original_price?: number;
}

export default function Packages() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    const [paymentStep, setPaymentStep] = useState<'method' | 'processing' | 'success'>('method');
    const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const { data, error } = await supabase
                .from('packages')
                .select('*')
                .eq('is_active', true)
                .order('price', { ascending: true });

            if (error) throw error;
            setPackages(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async () => {
        if (!selectedPackage || !user) return;

        setPaymentStep('processing');

        try {
            // 1. Create purchase record
            const { data: purchaseData, error: purchaseError } = await supabase
                .from('purchases')
                .insert({
                    user_id: user.id,
                    package_id: selectedPackage.id,
                    amount_paid: selectedPackage.price,
                    payment_status: 'completed', // In a real app this would be 'pending' then webhook updates it
                    payment_method: paymentMethod
                })
                .select()
                .single();

            if (purchaseError) throw purchaseError;

            // 2. Update user credits
            const { data: creditData } = await supabase
                .from('user_credits')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (creditData) {
                await supabase
                    .from('user_credits')
                    .update({
                        credits_available: creditData.credits_available + selectedPackage.quantity,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', user.id);
            }

            // Simulate network/api delay
            await new Promise(resolve => setTimeout(resolve, 3000));

            setPaymentStep('success');

            // Auto redirect after success
            setTimeout(() => {
                navigate('/dashboard');
            }, 3000);

        } catch (err) {
            console.error(err);
            setPaymentStep('method');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Pacotes de Créditos</h1>
                    <p className="text-gray-500">Escolha o plano ideal para suas necessidades.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-20">
                    <Loader2 className="h-8 w-8 animate-spin text-[#075E54]" />
                </div>
            ) : (
                <div className="grid md:grid-cols-3 gap-8">
                    {packages.map((pkg) => {
                        const discount = pkg.original_price ? Math.round(((pkg.original_price - pkg.price) / pkg.original_price) * 100) : 0;
                        const isBestValue = discount >= 30; // arbitrary flag for styling

                        return (
                            <Card
                                key={pkg.id}
                                className={cn(
                                    "cursor-pointer transition-all duration-300 hover:shadow-xl relative border-2 flex flex-col",
                                    selectedPackage?.id === pkg.id
                                        ? "border-[#075E54] ring-4 ring-[#075E54]/10 transform -translate-y-1"
                                        : "border-transparent hover:border-[#075E54]/30"
                                )}
                                onClick={() => setSelectedPackage(pkg)}
                            >
                                {discount > 0 && (
                                    <div className="absolute top-0 right-0">
                                        <div className={cn(
                                            "text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg shadow-sm text-white",
                                            isBestValue ? "bg-gradient-to-r from-orange-500 to-red-500" : "bg-[#25D366]"
                                        )}>
                                            {discount}% OFF {isBestValue && "🔥"}
                                        </div>
                                    </div>
                                )}

                                <CardHeader className="text-center pb-2">
                                    <CardTitle className="text-xl font-bold">{pkg.name}</CardTitle>
                                    <div className="h-1 w-12 bg-gray-100 mx-auto rounded-full mt-2"></div>
                                </CardHeader>

                                <CardContent className="space-y-6 flex-1 flex flex-col items-center justify-center py-6">
                                    <div className="text-center">
                                        {pkg.original_price && (
                                            <span className="text-sm text-gray-400 line-through block mb-1">
                                                R$ {pkg.original_price.toFixed(2).replace('.', ',')}
                                            </span>
                                        )}
                                        <div className="flex items-start justify-center text-[#075E54]">
                                            <span className="text-2xl font-bold mt-1">R$</span>
                                            <span className="text-5xl font-extrabold tracking-tighter">
                                                {pkg.price.toFixed(2).replace('.', ',')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="w-full bg-gray-50 rounded-xl p-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-gray-600 font-medium">Quantidade</span>
                                            <span className="font-bold text-gray-900 text-lg">{pkg.quantity}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 text-center">mensagens inclusas</p>
                                    </div>

                                    <ul className="space-y-3 text-sm text-gray-600 w-full px-4">
                                        <li className="flex items-center gap-3">
                                            <div className="bg-green-100 p-1 rounded-full"><Check className="h-3 w-3 text-[#075E54]" /></div>
                                            <span>Envio imediato</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <div className="bg-green-100 p-1 rounded-full"><Check className="h-3 w-3 text-[#075E54]" /></div>
                                            <span>Sem data de expiração</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <div className="bg-green-100 p-1 rounded-full"><Check className="h-3 w-3 text-[#075E54]" /></div>
                                            <span>Suporte prioritário</span>
                                        </li>
                                    </ul>
                                </CardContent>

                                <div className="p-6 pt-0 mt-auto">
                                    <Button
                                        className={cn(
                                            "w-full h-12 text-base font-bold shadow-md transition-all",
                                            selectedPackage?.id === pkg.id
                                                ? "bg-[#075E54] hover:bg-[#128C7E] text-white scale-[1.02]"
                                                : "bg-white border-2 border-gray-100 text-gray-900 hover:border-[#075E54] hover:text-[#075E54]"
                                        )}
                                        variant="ghost"
                                    >
                                        {selectedPackage?.id === pkg.id ? "Plano Selecionado" : "Selecionar Plano"}
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Payment Modal Overlay */}
            {selectedPackage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPackage(null)}></div>

                    <Card className="w-full max-w-lg bg-white shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden border-0">
                        {/* Background Pattern */}
                        <div className="absolute top-0 inset-x-0 h-32 bg-[#075E54] opacity-100"></div>
                        <div className="absolute top-0 inset-x-0 h-32 opacity-10 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat"></div>

                        <button
                            onClick={() => {
                                if (paymentStep !== 'processing') {
                                    setSelectedPackage(null);
                                    setPaymentStep('method');
                                }
                            }}
                            className="absolute top-4 right-4 text-white/70 hover:text-white z-10 transition-colors"
                        >
                            <div className="bg-black/20 hover:bg-black/40 p-2 rounded-full">
                                <ArrowLeft className="h-5 w-5 rotate-180" /> {/* Using x icon would be better but keeping ArrowLeft as close/back */}
                            </div>
                        </button>

                        <div className="relative pt-8 px-8 pb-4 text-center z-10">
                            <h2 className="text-2xl font-bold text-white mb-1">Finalizar Compra</h2>
                            <p className="text-white/80 text-sm">Você está a um passo de enviar suas mensagens!</p>
                        </div>

                        <CardContent className="pt-6 px-8 pb-8">
                            {paymentStep === 'method' && (
                                <div className="space-y-6">
                                    <div className="bg-gray-50 p-6 rounded-2xl flex justify-between items-center border border-gray-100">
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Resumo do pedido</p>
                                            <p className="font-bold text-gray-900 text-lg">{selectedPackage.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400 mb-1">Valor Total</p>
                                            <p className="text-3xl font-bold text-[#075E54]">R$ {selectedPackage.price.toFixed(2).replace('.', ',')}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-gray-700 block">Como deseja pagar?</label>

                                        <div
                                            className={cn(
                                                "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md",
                                                paymentMethod === 'pix'
                                                    ? "border-[#075E54] bg-[#E8F5E9]"
                                                    : "border-gray-100 hover:border-gray-300"
                                            )}
                                            onClick={() => setPaymentMethod('pix')}
                                        >
                                            <div className="bg-[#26A69A] p-3 rounded-lg text-white shadow-sm">
                                                <QrCode className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-gray-900">Pix</div>
                                                <div className="text-xs text-gray-500 font-medium">Aprovação imediata + Seguro</div>
                                            </div>
                                            <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center", paymentMethod === 'pix' ? "border-[#075E54]" : "border-gray-300")}>
                                                {paymentMethod === 'pix' && <div className="h-2.5 w-2.5 rounded-full bg-[#075E54]" />}
                                            </div>
                                        </div>

                                        <div
                                            className={cn(
                                                "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md",
                                                paymentMethod === 'card'
                                                    ? "border-[#075E54] bg-[#E8F5E9]"
                                                    : "border-gray-100 hover:border-gray-300"
                                            )}
                                            onClick={() => setPaymentMethod('card')}
                                        >
                                            <div className="bg-[#1E88E5] p-3 rounded-lg text-white shadow-sm">
                                                <CreditCard className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-gray-900">Cartão de Crédito</div>
                                                <div className="text-xs text-gray-500 font-medium">Processamento Seguro</div>
                                            </div>
                                            <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center", paymentMethod === 'card' ? "border-[#075E54]" : "border-gray-300")}>
                                                {paymentMethod === 'card' && <div className="h-2.5 w-2.5 rounded-full bg-[#075E54]" />}
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full h-12 text-lg font-bold bg-[#075E54] hover:bg-[#128C7E] shadow-lg shadow-green-900/20"
                                        onClick={handlePurchase}
                                    >
                                        Pagar Agora
                                    </Button>
                                </div>
                            )}

                            {paymentStep === 'processing' && (
                                <div className="py-12 text-center space-y-6">
                                    <div className="relative mx-auto w-24 h-24">
                                        <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-[#075E54] border-t-transparent rounded-full animate-spin"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Lock className="h-8 w-8 text-[#075E54]" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Processando Pagamento</h3>
                                        <p className="text-gray-500 mt-2">Aguarde, conectando com o banco...</p>
                                    </div>
                                </div>
                            )}

                            {paymentStep === 'success' && (
                                <div className="py-8 text-center space-y-6 animate-in zoom-in duration-300">
                                    <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center shadow-inner">
                                        <Check className="h-12 w-12 text-[#075E54]" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">Sucesso!</h3>
                                        <p className="text-gray-500 mt-2">Créditos adicionados à sua conta.</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-500">
                                        Redirecionando em instantes...
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
