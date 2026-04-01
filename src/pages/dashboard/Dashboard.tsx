import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  CalendarDays,
  Users,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileWarning,
  MapPin,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { type Company } from '../../types/company';

type Appointment = {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
  responsible: string;
  status: string;
  relatorio: string | null;
  companies?: { name: string };
};

type DashboardData = {
  companies: Company[];
  upcomingAppointments: Appointment[];
  allAppointments: Appointment[];
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  if (dateStr === today) return 'Hoje';
  if (dateStr === tomorrowStr) return 'Amanhã';
  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
}

const APPOINTMENT_TYPE_CLASS: Record<string, string> = {
  Presencial: 'bg-green-50 text-green-700 ring-green-600/20',
  Remota: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  Telefone: 'bg-orange-50 text-orange-700 ring-orange-600/20',
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({ companies: [], upcomingAppointments: [], allAppointments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const today = new Date().toISOString().split('T')[0];

    const [companiesRes, upcomingRes, allApptRes] = await Promise.all([
      supabase.from('companies').select('*').order('created_at', { ascending: false }),
      supabase
        .from('appointments')
        .select('id, title, date, time, type, responsible, status, relatorio, companies(name)')
        .gte('date', today)
        .eq('status', 'Agendado')
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(5),
      supabase
        .from('appointments')
        .select('id, status, relatorio'),
    ]);

    if (companiesRes.error || upcomingRes.error || allApptRes.error) {
      setError('Não foi possível carregar os dados. Tente novamente.');
    } else {
      setData({
        companies: companiesRes.data ?? [],
        upcomingAppointments: upcomingRes.data ?? [],
        allAppointments: allApptRes.data ?? [],
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { companies, upcomingAppointments, allAppointments } = data;

  const realizados = allAppointments.filter((a) => a.status === 'Realizado').length;
  const semRelatorio = allAppointments.filter((a) => a.status === 'Realizado' && !a.relatorio).length;
  const todayStr = new Date().toISOString().split('T')[0];
  const hoje = allAppointments.filter((a) => a.status === 'Agendado').length;

  const segmentCounts = companies.reduce<Record<string, number>>((acc, c) => {
    const seg = c.segment?.trim() || 'Sem segmento';
    acc[seg] = (acc[seg] ?? 0) + 1;
    return acc;
  }, {});
  const topSegments = Object.entries(segmentCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const recentCompanies = companies.slice(0, 5);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center gap-3 text-red-600">
        <AlertCircle className="h-5 w-5" />
        <span className="text-sm">{error}</span>
        <button onClick={fetchData} className="text-sm underline cursor-pointer">Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Visão geral dos membros e visitas</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          label="Total de Membros"
          value={companies.length}
          icon={<Building2 className="h-5 w-5 text-slate-500" />}
          bg="bg-slate-100"
        />
        <MetricCard
          label="Campo 85"
          value={companies.filter((c) => c.campo === '85').length}
          icon={<Users className="h-5 w-5 text-brand-600" />}
          bg="bg-brand-50"
          valueClass="text-brand-700"
        />
        <MetricCard
          label="Campo 153"
          value={companies.filter((c) => c.campo === '153').length}
          icon={<MapPin className="h-5 w-5 text-indigo-600" />}
          bg="bg-indigo-50"
          valueClass="text-indigo-700"
        />
        <MetricCard
          label="Agendados"
          value={hoje}
          icon={<CalendarDays className="h-5 w-5 text-sky-600" />}
          bg="bg-sky-50"
          valueClass="text-sky-700"
          sublabel="pendentes"
        />
        <MetricCard
          label="Visitas Realizadas"
          value={realizados}
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          bg="bg-green-50"
          valueClass="text-green-700"
        />
        <MetricCard
          label="Sem Relatório"
          value={semRelatorio}
          icon={<FileWarning className="h-5 w-5 text-orange-500" />}
          bg="bg-orange-50"
          valueClass={semRelatorio > 0 ? 'text-orange-600' : 'text-slate-400'}
          sublabel={semRelatorio > 0 ? 'visitas sem registro' : 'tudo em dia'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Próximos agendamentos */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-brand-500" />
              <h2 className="text-sm font-semibold text-slate-900">Próximos Agendamentos</h2>
            </div>
            <Link to="/appointments" className="text-xs text-brand-600 hover:text-brand-800 flex items-center gap-1 transition-colors">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {upcomingAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <CalendarDays className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">Nenhum agendamento futuro.</p>
                <Link to="/appointments" className="text-xs text-brand-600 mt-2 hover:underline">Criar agendamento</Link>
              </div>
            ) : (
              upcomingAppointments.map((appt) => (
                <div key={appt.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col items-center justify-center min-w-[48px] rounded-lg bg-brand-50 border border-brand-100 px-2 py-2 text-center shrink-0">
                    <span className="text-[10px] font-bold uppercase text-brand-400 leading-none">
                      {new Date(appt.date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                    </span>
                    <span className="text-lg font-bold text-brand-700 leading-tight">
                      {new Date(appt.date + 'T00:00:00').getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{appt.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {appt.companies?.name ?? '—'} · {formatDate(appt.date)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {appt.time?.slice(0, 5)}
                    </span>
                    {appt.type && (
                      <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${APPOINTMENT_TYPE_CLASS[appt.type] ?? 'bg-slate-50 text-slate-600 ring-slate-500/10'}`}>
                        {appt.type}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Coluna direita */}
        <div className="flex flex-col gap-6">
          {/* Membros por campo */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
              <Users className="h-4 w-4 text-brand-500" />
              <h2 className="text-sm font-semibold text-slate-900">Membros por Campo</h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <StatusBar label="Campo 85" count={companies.filter((c) => c.campo === '85').length} total={companies.length} color="bg-brand-500" />
              <StatusBar label="Campo 153" count={companies.filter((c) => c.campo === '153').length} total={companies.length} color="bg-indigo-500" />
              <StatusBar label="Não informado" count={companies.filter((c) => !c.campo).length} total={companies.length} color="bg-slate-300" />
            </div>
          </div>

          {/* Top segmentos */}
          {topSegments.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
                <Building2 className="h-4 w-4 text-brand-500" />
                <h2 className="text-sm font-semibold text-slate-900">Top Segmentos</h2>
              </div>
              <ul className="divide-y divide-slate-100">
                {topSegments.map(([seg, count]) => (
                  <li key={seg} className="flex items-center justify-between px-6 py-3">
                    <span className="text-sm text-slate-700 truncate">{seg}</span>
                    <span className="text-xs font-semibold text-brand-600 bg-brand-50 rounded-full px-2 py-0.5 ml-2 shrink-0">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Membros recentes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-brand-500" />
            <h2 className="text-sm font-semibold text-slate-900">Membros Recentes</h2>
          </div>
          <Link to="/companies" className="text-xs text-brand-600 hover:text-brand-800 flex items-center gap-1 transition-colors">
            Ver todos <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentCompanies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Building2 className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">Nenhum membro cadastrado.</p>
            </div>
          ) : (
            recentCompanies.map((company) => (
              <div key={company.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="h-9 w-9 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center shrink-0 text-brand-700 font-bold text-sm">
                  {company.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{company.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{company.segment || 'Sem segmento'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {company.campo && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-700/10">
                      <MapPin className="h-3 w-3" />
                      {company.campo}
                    </span>
                  )}
                  {company.gc && (
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                      <Users className="h-3 w-3" />
                      {company.gc}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label, value, icon, bg, valueClass = 'text-slate-900', sublabel,
}: {
  label: string; value: number; icon: React.ReactNode; bg: string; valueClass?: string; sublabel?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start gap-4">
      <div className={`${bg} rounded-lg p-2.5 shrink-0`}>{icon}</div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className={`text-3xl font-bold tracking-tight mt-1 ${valueClass}`}>{value}</p>
        {sublabel && <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-700">{count} <span className="font-normal text-slate-400">({pct}%)</span></span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100">
        <div className={`h-1.5 rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
