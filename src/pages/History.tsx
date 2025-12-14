import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Loader2, Search, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Quick Badge component inline to save tool calls
const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case 'sent':
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Enviada</span>;
        case 'pending':
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pendente</span>;
        case 'failed':
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Falhou</span>;
        default:
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
}

export default function History() {
    const { user } = useAuthStore();
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user) {
            fetchHistory();
        }
    }, [user]);

    const fetchHistory = async () => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMessages(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredMessages = messages.filter(msg =>
        msg.recipient_phone.includes(searchTerm) ||
        msg.message_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.sender_alias.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Histórico</h1>
                    <p className="text-gray-500">Acompanhe todas as suas mensagens enviadas.</p>
                </div>

                <div className="relative w-full md:w-72 group">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-[#075E54] transition-colors" />
                    <Input
                        type="search"
                        placeholder="Buscar por telefone, mensagem..."
                        className="pl-10 h-10 bg-white border-gray-200 focus:border-[#075E54] focus:ring-[#075E54]/20 rounded-xl transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-20">
                    <Loader2 className="h-8 w-8 animate-spin text-[#075E54]" />
                </div>
            ) : (
                <Card className="border-none shadow-sm overflow-hidden bg-white/80 backdrop-blur-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50/50 text-gray-600 font-semibold border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Data e Hora</th>
                                    <th className="px-6 py-4">Destinatário</th>
                                    <th className="px-6 py-4 max-w-md">Mensagem</th>
                                    <th className="px-6 py-4">Apelido Utilizado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredMessages.length > 0 ? filteredMessages.map((msg) => (
                                    <tr key={msg.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <StatusBadge status={msg.status} />
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">{new Date(msg.created_at).toLocaleDateString()}</span>
                                                <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleTimeString().slice(0, 5)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-700">
                                            {/* Mask phone for privacy in table */}
                                            {msg.recipient_phone.replace(/(\(\d{2}\) \d{2})\d{3}/, '$1***')}
                                        </td>
                                        <td className="px-6 py-4 max-w-md text-gray-600">
                                            <p className="truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                                                {msg.message_text}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {msg.sender_alias}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="bg-gray-100 p-4 rounded-full">
                                                    <MessageSquare className="h-8 w-8 text-gray-400" />
                                                </div>
                                                <p className="font-medium">Nenhuma mensagem encontrada.</p>
                                                {searchTerm && <p className="text-sm">Tente mudar o termo de busca.</p>}
                                                {!searchTerm && (
                                                    <Link to="/dashboard">
                                                        <Button variant="link" className="text-[#075E54]">Enviar nova mensagem</Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
