import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';
import { ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';

export function TermsModal() {
    const { termsAccepted, acceptTerms, session } = useAuthStore();
    const [loading, setLoading] = useState(false);

    // Don't show if not logged in or already accepted
    if (!session || termsAccepted) return null;

    const handleAccept = async () => {
        setLoading(true);
        try {
            await acceptTerms();
        } catch (error) {
            console.error(error);
            alert("Erro ao aceitar os termos. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={() => { }}>
            <DialogContent className="max-w-xl" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <div className="mx-auto bg-red-100 p-3 rounded-full mb-4">
                        <ShieldAlert className="h-8 w-8 text-red-600" />
                    </div>
                    <DialogTitle className="text-center text-xl font-bold text-gray-900">
                        Política de Uso e Responsabilidade
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-500">
                        Para continuar utilizando o WhisperSend, você precisa concordar com nossos termos de segurança.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                        <p className="font-semibold mb-1">⚠️ Aviso Importante</p>
                        <p>
                            Este sistema monitora atividades suspeitas. O uso indevido da plataforma resultará no
                            <b> bloqueio imediato e permanente</b> da sua conta.
                        </p>
                    </div>

                    <div className="space-y-3 text-sm text-gray-700">
                        <h3 className="font-semibold text-gray-900">É estritamente proibido o envio de mensagens contendo:</h3>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><span className="font-medium text-red-600">Pornografia ou conteúdo sexual explícito</span>;</li>
                            <li><span className="font-medium text-red-600">Discurso de ódio</span>, racismo, homofobia ou qualquer forma de discriminação;</li>
                            <li><span className="font-medium text-red-600">Ameaças</span>, assédio, ou conteúdo que incite violência;</li>
                            <li>Atividades ilegais ou tentativas de golpe/fraude.</li>
                        </ul>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-500">
                        <p>
                            Ao clicar em "Li e Concordo", você declara estar ciente de que o descumprimento destas regras
                            levará à suspensão dos serviços e, se necessário, as informações poderão ser repassadas às autoridades competentes.
                        </p>
                    </div>
                </div>

                <DialogFooter className="sm:justify-center">
                    <Button
                        onClick={handleAccept}
                        className="w-full sm:w-auto bg-[#075E54] hover:bg-[#128C7E] min-w-[200px]"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                        Li e Concordo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
