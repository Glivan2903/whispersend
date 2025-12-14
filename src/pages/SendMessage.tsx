import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Send, Phone, User as UserIcon, Loader2, AlertCircle, MessageSquare, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

// ---- ZOD SCHEMA ----
const messageSchema = z.object({
    phone: z.string().min(14, "Número incompleto").max(15, "Número inválido"), // (XX) XXXXX-XXXX
    alias: z.string().max(30, "Máximo 30 caracteres").optional(),
    message: z.string().min(1, "Mensagem não pode ser vazia").max(500, "Máximo 500 caracteres"),
});

type MessageForm = z.infer<typeof messageSchema>;

interface UserCredits {
    credits_available: number;
    credits_used: number;
}

export default function SendMessage() {
    const { user, signOut } = useAuthStore();
    const navigate = useNavigate();
    const [credits, setCredits] = useState<UserCredits | null>(null);
    const [loadingCredits, setLoadingCredits] = useState(true);
    const [sendState, setSendState] = useState<'idle' | 'sending' | 'success' | 'error' | 'user_not_found'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<MessageForm>({
        resolver: zodResolver(messageSchema),
        defaultValues: {
            alias: "Um admirador secreto"
        }
    });

    const messageText = watch('message', '');

    // ---- EFFECTS ----
    useEffect(() => {
        if (user) {
            fetchCredits(user.id);
        }
    }, [user]);

    // ---- FUNCTIONS ----
    const fetchCredits = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('user_credits')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                console.error('Error fetching credits:', error);
            }
            if (data) setCredits(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingCredits(false);
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);

        // Mask: (XX) XXXXX-XXXX
        let formatted = value;
        if (value.length > 2) {
            formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        }
        if (value.length > 7) {
            formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
        }
        setValue('phone', formatted);
    };

    const handleSendFlow = async (data: MessageForm) => {
        if (!credits || credits.credits_available <= 0) return;

        setSendState('sending');
        setErrorMessage('');

        let messageId: string | null = null;
        let shouldRefund = false;

        try {
            // 1. RPC Call: Reserve Credit & Create Message
            const { data: rpcData, error: rpcError } = await supabase.rpc('send_new_message', {
                p_recipient_phone: data.phone,
                p_message_text: data.message,
                p_sender_alias: data.alias || "Um admirador secreto"
            });

            if (rpcError) throw rpcError;
            if (rpcData && !rpcData.success) throw new Error(rpcData.error || 'Erro inicial');

            messageId = rpcData.message_id;

            // Update Credits UI (Optimistic deduction)
            if (rpcData && rpcData.new_credits !== undefined) {
                setCredits(prev => prev ? ({ ...prev, credits_available: rpcData.new_credits, credits_used: (prev.credits_used || 0) + 1 }) : null);
            }

            // 2. Webhook Call
            const webhookResponse = await fetch('https://n8nconectajuse.conectajuse.shop/webhook/whispersend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telefone: data.phone.replace(/\D/g, ''),
                    mensagem: data.message,
                    user_id: user?.id,
                    sender_alias: data.alias || "Um admirador secreto",
                    id_mensagem: messageId
                })
            });

            const webhookResult = await webhookResponse.json();
            const responseCode = String(webhookResult.response).toLowerCase();

            // 3. Logic: ONLY keep credit if response is "true"
            if (responseCode === "true") {
                // SUCCESS -> Confirm Status in DB
                await supabase.rpc('confirm_message_sent', { p_message_id: messageId });

                setSendState('success');
                reset();
                setTimeout(() => setSendState('idle'), 3000);
            }
            else {
                // FAILURE Case (includes "false", "user_not_found", or anything else)
                shouldRefund = true; // Mark for refund

                if (responseCode.includes("usuario não encontrado") || responseCode.includes("não encontrado")) {
                    setSendState('user_not_found');
                    setTimeout(async () => { await signOut(); navigate('/login'); }, 2000);
                } else {
                    throw new Error("O servidor recusou o envio.");
                }
            }

        } catch (error: any) {
            console.error(error);
            setErrorMessage(error.message);
            // Only show error state if we didn't already switch to 'user_not_found'
            if (sendState !== 'user_not_found') {
                setSendState('error');
            }
            shouldRefund = true;
        } finally {
            // 4. Refund Execution (Atomic catch-all for any failure path)
            if (shouldRefund && messageId) {
                try {
                    await supabase.rpc('refund_message_credit', { p_message_id: messageId });

                    // Restore UI credits
                    setCredits(prev => prev ? ({ ...prev, credits_available: prev.credits_available + 1, credits_used: prev.credits_used - 1 }) : null);

                    console.log("Crédito estornado com sucesso.");
                } catch (refundError) {
                    console.error("Critical: Refund failed", refundError);
                    // In a real app, you might log this to Sentry
                }
            }
        }
    };

    return (
        <div className="space-y-8">
            <Dialog open={sendState !== 'idle'} onOpenChange={(open) => {
                // Prevent closing if sending or critical error
                if (!open && (sendState === 'sending' || sendState === 'user_not_found')) return;
                if (!open) setSendState('idle');
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center">
                            {sendState === 'sending' && "Enviando Mensagem..."}
                            {sendState === 'success' && "Sucesso!"}
                            {sendState === 'error' && "Ops, algo deu errado"}
                            {sendState === 'user_not_found' && "Sessão Expirada"}
                        </DialogTitle>
                        <DialogDescription className="text-center pt-4">
                            {sendState === 'sending' && (
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="h-10 w-10 text-[#075E54] animate-spin" />
                                    <p>Estamos entregando seu segredo...</p>
                                </div>
                            )}
                            {sendState === 'success' && (
                                <div className="flex flex-col items-center gap-4 text-green-600">
                                    <CheckCircle2 className="h-12 w-12" />
                                    <p>Mensagem entregue com sucesso!</p>
                                </div>
                            )}
                            {sendState === 'error' && (
                                <div className="flex flex-col items-center gap-4 text-red-500">
                                    <XCircle className="h-12 w-12" />
                                    <p>{errorMessage}</p>
                                    <Button variant="outline" onClick={() => setSendState('idle')}>Tentar Novamente</Button>
                                </div>
                            )}
                            {sendState === 'user_not_found' && (
                                <div className="flex flex-col items-center gap-4 text-orange-500">
                                    <AlertCircle className="h-12 w-12" />
                                    <p>Sua conta precisa de atenção. Redirecionando...</p>
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>

            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Enviar Mensagem</h1>
                <p className="text-gray-500">Escreva e envie sua mensagem anônima agora.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Send Form */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-lg shadow-gray-200/50 bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Send className="h-5 w-5 text-[#075E54]" />
                                Nova Mensagem
                            </CardTitle>
                            <CardDescription>
                                Seus dados nunca serão compartilhados com o destinatário.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {credits && credits.credits_available <= 0 && (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-md">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <AlertCircle className="h-5 w-5 text-yellow-400" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-yellow-700">
                                                Você não tem créditos suficientes. <a href="https://wa.me/5579998130038" target="_blank" rel="noreferrer" className="font-bold underline hover:text-yellow-600">Compre um pacote</a> para enviar.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit(handleSendFlow)} className="space-y-6">
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Número do WhatsApp</label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-3 bg-gray-100 p-0.5 rounded text-gray-400 group-focus-within:text-[#075E54] transition-colors">
                                                <Phone className="h-4 w-4" />
                                            </div>
                                            <Input
                                                placeholder="(11) 99999-9999"
                                                className={cn("pl-11 h-11 transition-all border-gray-200 focus:border-[#075E54] focus:ring-[#075E54]/20", errors.phone && "border-red-500")}
                                                {...register('phone')}
                                                onChange={(e) => {
                                                    handlePhoneChange(e);
                                                }}
                                            />
                                        </div>
                                        {errors.phone && <p className="text-xs text-red-500 font-medium">{errors.phone.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">
                                            Seu Apelido
                                            <span className="text-xs font-normal text-gray-400 ml-1">(Opcional)</span>
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-3 bg-gray-100 p-0.5 rounded text-gray-400 group-focus-within:text-[#075E54] transition-colors">
                                                <UserIcon className="h-4 w-4" />
                                            </div>
                                            <Input
                                                placeholder="Ex: Admirador Secreto"
                                                className="pl-11 h-11 transition-all border-gray-200 focus:border-[#075E54] focus:ring-[#075E54]/20"
                                                {...register('alias')}
                                            />
                                        </div>
                                        {errors.alias && <p className="text-xs text-red-500 font-medium">{errors.alias.message}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 flex justify-between items-center">
                                        <span>Sua Mensagem</span>
                                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100", messageText.length > 500 ? "text-red-500 bg-red-50" : "text-gray-500")}>
                                            {messageText.length}/500
                                        </span>
                                    </label>
                                    <textarea
                                        className={cn(
                                            "flex min-h-[150px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm ring-offset-background placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075E54]/20 focus-visible:border-[#075E54] disabled:cursor-not-allowed disabled:opacity-50 resize-y transition-all",
                                            errors.message && "border-red-500 focus-visible:ring-red-500/20 focus-visible:border-red-500"
                                        )}
                                        placeholder="Escreva algo misterioso... Use sua criatividade!"
                                        {...register('message')}
                                    />
                                    {errors.message && <p className="text-xs text-red-500 font-medium">{errors.message.message}</p>}
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button
                                        type="submit"
                                        className="w-full sm:w-auto min-w-[180px] h-11 bg-[#075E54] hover:bg-[#128C7E] text-white shadow-lg shadow-green-900/10 transition-all hover:scale-[1.02]"
                                        disabled={loadingCredits || (credits?.credits_available || 0) <= 0 || sendState === 'sending'}
                                    >
                                        {sendState === 'sending' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                        {sendState === 'sending' ? 'Enviando...' : 'Enviar Mensagem'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Preview & Status - Hidden on mobile, visible on lg screens */}
                <div className="hidden lg:block space-y-6">
                    {/* WhatsApp Preview */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Prévia Real</label>
                        <Card className="bg-[#E5DDD5] border-none shadow-lg overflow-hidden relative">
                            {/* Chat Background Pattern */}
                            <div className="absolute inset-0 opacity-40 mix-blend-multiply bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat pointer-events-none"></div>

                            <div className="relative z-10">
                                <CardHeader className="bg-[#075E54] text-white p-3 py-4 shadow-md">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 bg-white">
                                            <UserIcon className="h-6 w-6" />
                                        </div>
                                        <div className="leading-tight">
                                            <div className="text-base font-bold">{watch('alias') || "Um admirador secreto"}</div>
                                            <div className="text-xs opacity-80">online agora</div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 min-h-[350px] flex flex-col justify-end">
                                    {messageText ? (
                                        <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-[90%] mb-2 break-words text-sm relative self-start animate-in zoom-in-95 duration-200">
                                            <p className="text-gray-800 whitespace-pre-wrap">{messageText}</p>
                                            <span className="text-[10px] text-gray-400 block text-right mt-1 ml-4 select-none">
                                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {/* Triangle */}
                                            <div className="absolute top-0 -left-2 w-0 h-0 border-[8px] border-transparent border-t-white"></div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full opacity-30 select-none">
                                            <MessageSquare className="h-12 w-12 mb-2" />
                                            <p className="text-sm font-medium text-center">Digite sua mensagem para visualizar</p>
                                        </div>
                                    )}
                                </CardContent>
                            </div>
                        </Card>
                    </div>

                    <div className="bg-[#075E54]/5 rounded-xl p-4 border border-[#075E54]/10">
                        <div className="flex items-start gap-3">
                            <div className="bg-[#075E54]/10 p-2 rounded-lg">
                                <ShieldCheck className="h-5 w-5 text-[#075E54]" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-[#075E54]">Sua segurança é prioridade</h4>
                                <p className="text-xs text-gray-600 mt-1">
                                    Nós utilizamos criptografia de ponta a ponta. Seus dados de pagamento e identidade nunca são expostos.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
