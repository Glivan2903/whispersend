import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    Unlock,
    Users,
    UserCheck,
    UserX,
    Plus
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Setup secondary client for creating users without logging out admin
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const secondaryClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false, // Important: Do not persist session to avoid overwriting admin session
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});

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
    const { isAdmin } = useAuthStore();
    const [users, setUsers] = useState<UserStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Stats
    const totalUsers = users.length;
    const activeUsers = users.filter(u => !u.is_blocked).length;
    const blockedUsers = users.filter(u => u.is_blocked).length;

    // Actions State
    const [selectedUser, setSelectedUser] = useState<UserStats | null>(null);

    // Modals
    const [creditModalOpen, setCreditModalOpen] = useState(false);
    const [blockModalOpen, setBlockModalOpen] = useState(false);
    const [createUserModalOpen, setCreateUserModalOpen] = useState(false);

    // Inputs
    const [creditAmount, setCreditAmount] = useState<number>(0);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserName, setNewUserName] = useState('');

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

    const handleToggleBlock = async () => {
        if (!selectedUser) return;

        try {
            setActionLoading(true);
            const newStatus = !selectedUser.is_blocked;
            const { error } = await supabase.rpc('admin_toggle_block', {
                p_user_id: selectedUser.id,
                p_block_status: newStatus
            });

            if (error) throw error;

            setUsers(users.map(u =>
                u.id === selectedUser.id ? { ...u, is_blocked: newStatus } : u
            ));
            setBlockModalOpen(false);
        } catch (err) {
            console.error(err);
            alert('Erro ao alterar status de bloqueio');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateUser = async () => {
        try {
            setActionLoading(true);

            // 1. Create Auth User using secondary client
            const { data: authData, error: authError } = await secondaryClient.auth.signUp({
                email: newUserEmail,
                password: newUserPassword,
                options: {
                    data: {
                        full_name: newUserName
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Falha ao criar usuário");

            // 2. Refresh list (Trigger will handle Profile creation usually, but we fetch fresh stats)
            // Wait a bit for trigger
            await new Promise(r => setTimeout(r, 1000));
            await fetchUsers();

            setCreateUserModalOpen(false);
            setNewUserEmail('');
            setNewUserPassword('');
            setNewUserName('');
            alert('Usuário criado com sucesso!');

        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Erro ao criar usuário');
        } finally {
            setActionLoading(false);
        }
    }

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
                <Button onClick={() => setCreateUserModalOpen(true)} className="bg-[#075E54] hover:bg-[#128C7E]">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Cliente
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
                        <UserCheck className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeUsers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clientes Bloqueados</CardTitle>
                        <UserX className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{blockedUsers}</div>
                    </CardContent>
                </Card>
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
                                                            onClick={() => {
                                                                setSelectedUser(u);
                                                                setBlockModalOpen(true);
                                                            }}
                                                        >
                                                            <Unlock className="h-4 w-4" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => {
                                                                setSelectedUser(u);
                                                                setBlockModalOpen(true);
                                                            }}
                                                            disabled={u.is_admin}
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
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Gerenciar Créditos</DialogTitle>
                        <DialogDescription>
                            Ajuste o saldo de créditos para <b>{selectedUser?.full_name}</b>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-6">
                        {/* Current Balance */}
                        <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-500">Saldo Atual</span>
                            <span className="text-2xl font-bold text-gray-900">{selectedUser?.credits_available}</span>
                        </div>

                        {/* Action Type Tabs */}
                        <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-lg">
                            <button
                                className={cn(
                                    "py-2 text-sm font-medium rounded-md transition-all",
                                    creditAmount >= 0
                                        ? "bg-white text-[#075E54] shadow-sm"
                                        : "text-gray-500 hover:text-gray-900"
                                )}
                                onClick={() => setCreditAmount(Math.abs(creditAmount))}
                            >
                                Adicionar
                            </button>
                            <button
                                className={cn(
                                    "py-2 text-sm font-medium rounded-md transition-all",
                                    creditAmount < 0
                                        ? "bg-white text-red-600 shadow-sm"
                                        : "text-gray-500 hover:text-gray-900"
                                )}
                                onClick={() => setCreditAmount(-Math.abs(creditAmount || 10))}
                            >
                                Remover
                            </button>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-700">
                                Quantidade a {creditAmount >= 0 ? 'adicionar' : 'remover'}
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    value={Math.abs(creditAmount)}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setCreditAmount(creditAmount >= 0 ? val : -val);
                                    }}
                                    className="text-lg font-bold"
                                />
                            </div>

                            {/* Standard Presets */}
                            <div className="flex gap-2 justify-center">
                                {[10, 50, 100, 500].map((amount) => (
                                    <button
                                        key={amount}
                                        onClick={() => setCreditAmount(creditAmount >= 0 ? amount : -amount)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                                            Math.abs(creditAmount) === amount
                                                ? (creditAmount >= 0 ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700")
                                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                        )}
                                    >
                                        {amount}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Projected Balance */}
                        <div className="pt-4 border-t border-gray-100 flex justify-between items-center opacity-70">
                            <span className="text-sm">Novo Saldo Estimado:</span>
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "font-bold transition-colors",
                                    (selectedUser?.credits_available || 0) + creditAmount < 0 ? "text-red-500" : "text-gray-900"
                                )}>
                                    {(selectedUser?.credits_available || 0) + creditAmount}
                                </span>
                                {creditAmount !== 0 && (
                                    <span className={cn(
                                        "text-xs font-semibold",
                                        creditAmount > 0 ? "text-green-600" : "text-red-600"
                                    )}>
                                        ({creditAmount > 0 ? '+' : ''}{creditAmount})
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreditModalOpen(false)}>Cancelar</Button>
                        <Button
                            onClick={handleAddCredits}
                            disabled={actionLoading || creditAmount === 0}
                            className={cn(
                                "min-w-[120px]",
                                creditAmount >= 0
                                    ? "bg-[#075E54] hover:bg-[#128C7E]"
                                    : "bg-red-600 hover:bg-red-700"
                            )}
                        >
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                creditAmount >= 0 ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Ban className="h-4 w-4 mr-2" />
                            )}
                            {creditAmount >= 0 ? 'Adicionar' : 'Remover'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Block Confirmation Modal */}
            <Dialog open={blockModalOpen} onOpenChange={setBlockModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedUser?.is_blocked ? 'Desbloquear Usuário' : 'Bloquear Usuário'}</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja <b>{selectedUser?.is_blocked ? 'liberar o acesso' : 'suspender o acesso'}</b> de {selectedUser?.full_name}?
                            {selectedUser?.is_blocked ? '' : ' O usuário perderá acesso imediato ao painel.'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBlockModalOpen(false)}>Cancelar</Button>
                        <Button
                            variant={selectedUser?.is_blocked ? "default" : "destructive"}
                            onClick={handleToggleBlock}
                            disabled={actionLoading}
                            className={selectedUser?.is_blocked ? "bg-[#075E54] hover:bg-[#128C7E]" : "bg-red-600 hover:bg-red-700"}
                        >
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (selectedUser?.is_blocked ? <Unlock className="h-4 w-4 mr-2" /> : <Ban className="h-4 w-4 mr-2" />)}
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create User Modal */}
            <Dialog open={createUserModalOpen} onOpenChange={setCreateUserModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Novo Cliente</DialogTitle>
                        <DialogDescription>
                            Crie uma conta para um novo cliente. Ele poderá fazer login com este email e senha.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nome Completo</label>
                            <Input
                                placeholder="João Silva"
                                value={newUserName}
                                onChange={(e) => setNewUserName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                type="email"
                                placeholder="joao@email.com"
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Senha</label>
                            <Input
                                type="password"
                                placeholder="******"
                                value={newUserPassword}
                                onChange={(e) => setNewUserPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateUserModalOpen(false)}>Cancelar</Button>
                        <Button
                            onClick={handleCreateUser}
                            disabled={actionLoading || !newUserEmail || !newUserPassword || !newUserName}
                            className="bg-[#075E54] hover:bg-[#128C7E]"
                        >
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                            Criar Conta
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
