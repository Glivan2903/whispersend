import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MessageSquare, Plus, Loader2, Send, BarChart2, CheckCircle2, XCircle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UserCredits {
    credits_available: number;
    credits_used: number;
}

export default function Dashboard() {
    const { user } = useAuthStore();
    const [credits, setCredits] = useState<UserCredits | null>(null);
    const [stats, setStats] = useState<{ date: string; count: number }[]>([]);
    const [recentMessages, setRecentMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPageVisible, setIsPageVisible] = useState(true);

    // ---- EFFECTS ----
    useEffect(() => {
        if (user) {
            fetchDashboardData(user.id);
        }

        let visibilityTimeout: ReturnType<typeof setTimeout>;

        // Auto-refresh when tab becomes visible again and manage chart visibility
        const handleVisibilityChange = () => {
            const visible = document.visibilityState === 'visible';

            if (visible) {
                // Delay showing the chart to ensure layout is ready (fixes width=-1 error)
                if (visibilityTimeout) clearTimeout(visibilityTimeout);
                visibilityTimeout = setTimeout(() => {
                    setIsPageVisible(true);
                    if (user) {
                        console.log("Dashboard visible (stable), refreshing data...");
                        fetchDashboardData(user.id, true);
                    }
                }, 800); // 800ms delay to let browser repaint
            } else {
                // Hide immediately
                if (visibilityTimeout) clearTimeout(visibilityTimeout);
                setIsPageVisible(false);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (visibilityTimeout) clearTimeout(visibilityTimeout);
        };
    }, [user]);

    // ---- FUNCTIONS ----
    const fetchDashboardData = async (userId: string, isBackgroundRefresh = false) => {
        try {
            if (!isBackgroundRefresh) {
                setLoading(true);
            }

            // 1. Fetch Credits
            const { data: creditData } = await supabase
                .from('user_credits')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (creditData) setCredits(creditData);

            // 2. Fetch Recent Messages (Limit 5)
            const { data: messages } = await supabase
                .from('messages')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(5);

            if (messages) setRecentMessages(messages);

            // 3. Fetch Stats (Last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data: allRecent } = await supabase
                .from('messages')
                .select('created_at')
                .eq('user_id', userId)
                .gte('created_at', sevenDaysAgo.toISOString());

            if (allRecent) {
                const chartMap = new Map<string, number>();
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    chartMap.set(d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), 0);
                }

                allRecent.forEach(msg => {
                    const dateKey = new Date(msg.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    if (chartMap.has(dateKey)) {
                        chartMap.set(dateKey, (chartMap.get(dateKey) || 0) + 1);
                    }
                });

                const chartData = Array.from(chartMap.entries()).map(([date, count]) => ({ date, count }));
                setStats(chartData);
            }

        } catch (err) {
            console.error(err);
        } finally {
            if (!isBackgroundRefresh) {
                setLoading(false);
            }
        }
    };

    // Lazy load Recharts to avoid SSR issues if any (standard React import)
    // Note: Recharts needs to be installed.
    // We will assume Recharts components are available via import at top, 
    // but since I'm rewriting the whole file in this block, I need to add the imports too.
    // See top of file for imports addition.

    // ---- RENDER ----
    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">Visão geral da sua conta.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Available Credits Card */}
                <Card className="border-none shadow-md bg-gradient-to-br from-[#075E54] to-[#128C7E] text-white overflow-hidden relative group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                    <CardHeader className="relative z-10 pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg font-medium text-white/90">
                            <MessageSquare className="h-5 w-5" />
                            Créditos Disponíveis
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-4xl font-bold mb-4">
                            {loading ? <Loader2 className="h-8 w-8 animate-spin text-white/50" /> : credits?.credits_available || 0}
                        </div>
                        <a href="https://wa.me/5579998130038" target="_blank" rel="noopener noreferrer">
                            <Button className="w-full bg-white text-[#075E54] hover:bg-gray-100 font-bold shadow-sm border-0">
                                <Plus className="h-4 w-4 mr-2" /> Comprar Mais
                            </Button>
                        </a>
                    </CardContent>
                </Card>

                {/* Used Credits Card */}
                <Card className="border-none shadow-md bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-medium text-gray-600">
                            <Send className="h-5 w-5 text-blue-500" />
                            Mensagens Enviadas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-gray-900 mb-1">
                            {loading ? <Loader2 className="h-8 w-8 animate-spin text-gray-300" /> : credits?.credits_used || 0}
                        </div>
                        <p className="text-sm text-gray-500">Total de envios realizados</p>
                    </CardContent>
                </Card>

                {/* Quick Action Card */}
                <Card className="border-none shadow-md bg-white flex flex-col justify-center">
                    <CardHeader>
                        <CardTitle className="text-lg font-medium text-gray-900">Acesso Rápido</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <Link to="/send" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-green-50 hover:text-[#075E54] transition-colors group cursor-pointer text-center">
                            <div className="bg-[#075E54]/10 p-2.5 rounded-full mb-2 group-hover:bg-[#075E54] group-hover:text-white transition-colors">
                                <Send className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-semibold">Nova Mensagem</span>
                        </Link>
                        <Link to="/history" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors group cursor-pointer text-center">
                            <div className="bg-blue-100 p-2.5 rounded-full mb-2 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <BarChart2 className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-semibold">Relatórios</span>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Chart Section */}
                <Card className="border-none shadow-md bg-white">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-gray-800">Envios nos Últimos 7 Dias</CardTitle>
                        <CardDescription>Volume de mensagens enviadas por dia.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-[300px] w-full min-h-[300px]" style={{ width: '100%', minWidth: 0 }}>
                            {/* Only render chart if visible to prevent background tab crash (width=-1) */}
                            {stats.length > 0 && isPageVisible ? (
                                <ResponsiveContainer width="100%" height="100%" debounce={300}>
                                    <BarChart data={stats}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6b7280', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6b7280', fontSize: 12 }}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#f3f4f6' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar
                                            dataKey="count"
                                            fill="#075E54"
                                            radius={[4, 4, 0, 0]}
                                            barSize={40}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full w-full flex flex-col items-center justify-center text-gray-400">
                                    {stats.length === 0 ? (
                                        <>
                                            <BarChart2 className="h-10 w-10 mb-2 opacity-20" />
                                            <p className="text-sm">Sem dados recentes para exibir</p>
                                        </>
                                    ) : (
                                        <Loader2 className="h-8 w-8 animate-spin text-[#075E54]" />
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity List */}
                <Card className="border-none shadow-md bg-white">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-gray-800">Últimos Envios</CardTitle>
                        <CardDescription>As 5 mensagens mais recentes.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            </div>
                        ) : recentMessages.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {recentMessages.map((msg) => (
                                    <div key={msg.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`p-2 rounded-full flex-shrink-0 ${msg.status === 'sent' ? 'bg-green-100 text-green-600' :
                                                msg.status === 'failed' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                                                }`}>
                                                {msg.status === 'sent' ? <CheckCircle2 className="h-4 w-4" /> :
                                                    msg.status === 'failed' ? <XCircle className="h-4 w-4" /> : <Loader2 className="h-4 w-4" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {msg.recipient_phone}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                                    {msg.message_text}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-4">
                                            <p className="text-xs font-medium text-gray-900">
                                                {new Date(msg.created_at).toLocaleDateString()}
                                            </p>
                                            <p className="text-[10px] text-gray-500">
                                                {new Date(msg.created_at).toLocaleTimeString().slice(0, 5)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <p>Nenhum envio recente.</p>
                            </div>
                        )}

                        <div className="p-4 border-t border-gray-100">
                            <Link to="/history" className="text-sm font-semibold text-[#075E54] hover:text-[#128C7E] flex items-center justify-center">
                                Ver hitórico completo <ArrowUpRight className="ml-1 h-3 w-3" />
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
