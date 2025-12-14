import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import {
    Search,
    ShieldAlert,
    Coins,
    Loader2,
    CheckCircle2,
    Ban,
    Unlock
} from 'lucide-react';

interface UserStats {
    id: string;
    email: string;
    full_name: string;
    is_admin: boolean;
    is_blocked: boolean;
    created_at: string;
    credits_available: number;
    credits_used: number;
}

export default function Admin() {
    const { user, isAdmin } = useAuthStore();
    const [users, setUsers] = useState<UserStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Actions State
    const [selectedUser, setSelectedUser] = useState<UserStats | null>(null);
    const [creditModalOpen, setCreditModalOpen] = useState(false);
    const [creditAmount, setCreditAmount] = useState<number>(0);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.rpc('get_all_users_stats');

            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCredits = async () => {
        if (!selectedUser) return;

        try {
            setActionLoading(true);
            const { error } = await supabase.rpc('admin_add_credits', {
                p_user_id: selectedUser.id,
                p_amount: creditAmount
            });

            if (error) throw error;

            // Update local state
            setUsers(users.map(u =>
                u.id === selectedUser.id
                    ? { ...u, credits_available: u.credits_available + creditAmount }
                    : u
            ));

            setCreditModalOpen(false);
            setCreditAmount(0);
        } catch (err) {
            console.error(err);
            alert('Erro ao adicionar créditos');
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleBlock = async (userId: string, currentStatus: boolean) => {
        if (!confirm(`Tem certeza que deseja ${currentStatus ? 'desbloquear' : 'bloquear'} este usuário?`)) return;

        try {
            setActionLoading(true);
            const { error } = await supabase.rpc('admin_toggle_block', {
                p_user_id: userId,
                p_block_status: !currentStatus
            });

            if (error) throw error;

            setUsers(users.map(u =>
                u.id === userId ? { ...u, is_blocked: !currentStatus } : u
            ));
        } catch (err) {
            console.error(err);
            alert('Erro ao alterar status de bloqueio');
        } finally {
            setActionLoading(false);
        }
    };

    // Correct Access Check using isAdmin from store
    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900">Acesso Negado</h1>
                <p className="text-gray-500">Esta área é restrita para administradores.</p>
            </div>
        );
    }

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Administração</h1>
                    <p className="text-gray-500">Gerenciamento de usuários e créditos.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <CardTitle className="text-xl">Usuários ({filteredUsers.length})</CardTitle>
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar por nome ou email..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-[#075E54]" />
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <div className="relative w-full overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Usuário</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Créditos</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.map((u) => (
                                            <TableRow key={u.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{u.full_name || 'Sem nome'}</span>
                                                        <span className="text-xs text-gray-500">{u.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {u.is_blocked ? (
                                                        <span className="inline-flex items-center rounded-full border border-red-200 px-2.5 py-0.5 text-xs font-semibold text-red-500 bg-red-50">
                                                            Bloqueado
                                                        </span>
                                                    ) : u.is_admin ? (
                                                        <span className="inline-flex items-center rounded-full border border-blue-200 px-2.5 py-0.5 text-xs font-semibold text-blue-500 bg-blue-50">
                                                            Admin
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full border border-green-200 px-2.5 py-0.5 text-xs font-semibold text-green-500 bg-green-50">
                                                            Ativo
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{u.credits_available} disp.</span>
                                                        <span className="text-xs text-gray-500">{u.credits_used} usados</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedUser(u);
                                                            setCreditAmount(0);
                                                            setCreditModalOpen(true);
                                                        }}
                                                    >
                                                        <Coins className="h-4 w-4 mr-1" /> Créditos
                                                    </Button>

                                                    {u.is_blocked ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            onClick={() => handleToggleBlock(u.id, u.is_blocked)}
                                                            disabled={actionLoading}
                                                        >
                                                            <Unlock className="h-4 w-4" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => handleToggleBlock(u.id, u.is_blocked)}
                                                            disabled={actionLoading || u.is_admin}
                                                        >
                                                            <Ban className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Credit Modal */}
            <Dialog open={creditModalOpen} onOpenChange={setCreditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Gerenciar Créditos</DialogTitle>
                        <DialogDescription>
                            Adicionar ou remover créditos para <b>{selectedUser?.full_name}</b>.
                            Use valores negativos para remover.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <label className="text-sm font-medium mb-2 block">Quantidade</label>
                        <Input
                            type="number"
                            value={creditAmount}
                            onChange={(e) => setCreditAmount(Number(e.target.value))}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Saldo atual: {selectedUser?.credits_available}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreditModalOpen(false)}>Cancelar</Button>
                        <Button
                            onClick={handleAddCredits}
                            disabled={actionLoading || creditAmount === 0}
                            className="bg-[#075E54] hover:bg-[#128C7E]"
                        >
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
