import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, CalendarDays, MessageSquareText, LogOut, KanbanSquare, Users } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Membros', href: '/companies', icon: Building2 },
  { name: 'Agendamentos', href: '/appointments', icon: CalendarDays },
  { name: 'Kanban', href: '/kanban', icon: KanbanSquare },
  { name: 'Equipe', href: '/team', icon: Users },
  { name: 'Chat AI', href: '/chat', icon: MessageSquareText },
];

function classNames(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AppLayout({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col border-r border-slate-200 bg-white">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6 pb-4 pt-6">
          <div className="flex shrink-0 items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white font-bold shadow-sm">
                GW
              </div>
              <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">Go Win Pro</span>
            </div>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Módulos</div>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          className={classNames(
                            isActive
                              ? 'bg-brand-50 text-brand-600'
                              : 'text-slate-600 hover:text-brand-600 hover:bg-slate-50',
                            'group flex gap-x-3 rounded-lg p-2.5 text-sm font-semibold transition-all duration-200'
                          )}
                        >
                          <item.icon
                            className={classNames(
                              isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-brand-600',
                              'h-5 w-5 shrink-0 transition-colors duration-200'
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </nav>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="flex items-center gap-3 rounded-lg p-2.5 text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 cursor-pointer -mx-2"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Sair
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto w-full">
        <main className="flex-1 w-full bg-slate-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
