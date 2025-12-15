import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
    MessageSquare,
    LayoutDashboard,
    History,
    User,
    LogOut,
    Menu,
    ChevronRight,
    Send,
    Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TermsModal } from '@/components/auth/TermsModal';

export default function DashboardLayout() {
    const { user, session, isAdmin, isBlocked, signOut } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Redirect if not logged in
    if (!session) {
        return <Navigate to="/login" replace />;
    }

    // Blocked User Modal - Force overlay
    if (isBlocked) {
        return (
            <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 text-center space-y-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <Shield className="h-8 w-8 text-red-600" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-gray-900">Conta Suspensa</h2>
                        <p className="text-gray-500">
                            Sua conta foi temporariamente bloqueada. Para restabelecer o acesso, por favor entre em contato com a administração.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <a
                            href="https://wa.me/5579998130038"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-full gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-3 rounded-lg font-bold transition-all transform hover:scale-[1.02]"
                        >
                            <MessageSquare className="h-5 w-5" />
                            Falar com Suporte
                        </a>

                        <button
                            onClick={() => {
                                signOut();
                                navigate('/login');
                            }}
                            className="w-full text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
                        >
                            Sair da conta
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const navigation = [
        { name: 'Indicadores', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Enviar mensagem', href: '/send', icon: Send },
        { name: 'Histórico', href: '/history', icon: History },
        { name: 'Perfil', href: '/profile', icon: User },
    ];

    if (isAdmin) {
        navigation.push({ name: 'Administração', href: '/admin', icon: Shield });
    }

    return (
        <div className="h-screen bg-gray-50/50 flex overflow-hidden font-sans">
            {/* Background Effects (Subtler version of Auth) */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#128C7E]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#25D366]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            </div>

            <TermsModal />

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 shadow-xl lg:shadow-none transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Logo Area */}
                <div className="h-20 flex items-center px-8 border-b border-gray-50 bg-white/50 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-[#128C7E] to-[#25D366] p-2.5 rounded-xl shadow-lg shadow-green-500/20">
                            <MessageSquare className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-gray-900">WhisperSend</span>
                    </div>
                </div>

                {/* User Info (Mini Profile) */}
                <div className="p-6">
                    <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#075E54] flex items-center justify-center text-white font-bold text-lg">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">
                                {user?.user_metadata?.full_name || 'Usuário'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 space-y-2 py-4 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    "group flex items-center gap-3 px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden",
                                    isActive
                                        ? "text-[#075E54] bg-[#E8F5E9] shadow-sm"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#25D366] rounded-full" />
                                )}
                                <item.icon
                                    className={cn(
                                        "h-5 w-5 transition-colors",
                                        isActive ? "text-[#075E54]" : "text-gray-400 group-hover:text-gray-600"
                                    )}
                                />
                                {item.name}
                                {isActive && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-gray-50 bg-gray-50/30">
                    <Button
                        variant="ghost"
                        onClick={() => {
                            signOut();
                            navigate('/login');
                        }}
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 gap-3 h-11"
                    >
                        <LogOut className="h-5 w-5" />
                        Sair da Conta
                    </Button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative z-10 transition-all duration-300">
                {/* Mobile Header */}
                <header className="lg:hidden h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 sticky top-0 z-30">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="font-bold text-gray-900">WhisperSend</span>
                    <div className="w-10"></div> {/* Spacer for center alignment */}
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-4 sm:p-8 lg:p-10 pb-20 scroll-smooth">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
