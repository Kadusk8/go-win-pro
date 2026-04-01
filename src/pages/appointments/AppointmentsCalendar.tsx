import { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon, Clock, Users, Plus, Loader2,
  AlertCircle, X, Building, CheckCircle2, FileText, ClipboardList, Pencil,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Appointment = {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
  responsible: string;
  description: string;
  company_id: string | null;
  status: 'Agendado' | 'Realizado' | 'Cancelado';
  relatorio: string | null;
  companies?: { name: string };
};

type Company = { id: string; name: string };
type TeamMember = { id: string; name: string; role: string | null };

type AppointmentForm = {
  title: string;
  date: string;
  time: string;
  responsible: string[];
  description: string;
  company_id: string;
};

const EMPTY_FORM: AppointmentForm = {
  title: '',
  date: new Date().toISOString().split('T')[0],
  time: '09:00',
  responsible: [],
  description: '',
  company_id: '',
};

function apptToForm(appt: Appointment): AppointmentForm {
  return {
    title: appt.title,
    date: appt.date,
    time: appt.time,
    responsible: appt.responsible ? appt.responsible.split(', ').filter(Boolean) : [],
    description: appt.description ?? '',
    company_id: appt.company_id ?? '',
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  });
}

function formatCurrentMonth() {
  return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function isToday(dateStr: string) {
  return dateStr === new Date().toISOString().split('T')[0];
}

function isPast(dateStr: string) {
  return dateStr < new Date().toISOString().split('T')[0];
}

export default function AppointmentsCalendar() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState<AppointmentForm>(EMPTY_FORM);

  const [reportAppt, setReportAppt] = useState<Appointment | null>(null);
  const [reportText, setReportText] = useState('');
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [apptRes, compRes, teamRes] = await Promise.all([
      supabase.from('appointments').select('*, companies(name)').order('date', { ascending: true }).order('time', { ascending: true }),
      supabase.from('companies').select('id, name').order('name', { ascending: true }),
      supabase.from('team_members').select('id, name, role').order('name', { ascending: true }),
    ]);

    if (apptRes.error || compRes.error) {
      setError('Não foi possível carregar os dados. Tente novamente.');
    } else {
      setAppointments((apptRes.data ?? []) as Appointment[]);
      setCompanies(compRes.data ?? []);
      setTeam(teamRes.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSubmitError(null);
    setIsModalOpen(true);
  }

  function openEdit(appt: Appointment) {
    setEditingId(appt.id);
    setForm(apptToForm(appt));
    setSubmitError(null);
    setIsModalOpen(true);
  }

  function handleClose() {
    setIsModalOpen(false);
    setSubmitError(null);
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      title: form.title,
      date: form.date,
      time: form.time,
      type: 'Presencial',
      responsible: form.responsible.join(', '),
      description: form.description,
      company_id: form.company_id || null,
    };

    if (editingId) {
      const { data, error: err } = await supabase
        .from('appointments')
        .update(payload)
        .eq('id', editingId)
        .select('*, companies(name)');
      if (err) {
        setSubmitError('Erro ao salvar. Tente novamente.');
      } else if (data) {
        setAppointments((prev) =>
          prev.map((a) => a.id === editingId ? (data[0] as Appointment) : a)
            .sort((a, b) => a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)),
        );
        handleClose();
      }
    } else {
      const { data, error: err } = await supabase
        .from('appointments')
        .insert([payload])
        .select('*, companies(name)');
      if (err) {
        setSubmitError('Erro ao salvar o agendamento. Tente novamente.');
      } else if (data) {
        setAppointments((prev) =>
          [...prev, data[0] as Appointment].sort((a, b) =>
            a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date),
          ),
        );
        handleClose();
      }
    }
    setIsSubmitting(false);
  }

  async function handleSaveReport() {
    if (!reportAppt) return;
    setIsSavingReport(true);
    setReportError(null);

    const { data, error: updateError } = await supabase
      .from('appointments')
      .update({ relatorio: reportText, status: 'Realizado' })
      .eq('id', reportAppt.id)
      .select('*, companies(name)');

    if (updateError) {
      setReportError('Erro ao salvar o relatório. Tente novamente.');
    } else if (data) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === reportAppt.id ? (data[0] as Appointment) : a)),
      );
      setReportAppt(null);
      setReportText('');
    }
    setIsSavingReport(false);
  }

  function openReport(appt: Appointment) {
    setReportAppt(appt);
    setReportText(appt.relatorio ?? '');
    setReportError(null);
  }

  function toggleMember(name: string) {
    setForm((prev) => ({
      ...prev,
      responsible: prev.responsible.includes(name)
        ? prev.responsible.filter((n) => n !== name)
        : [...prev.responsible, name],
    }));
  }

  const today = new Date().toISOString().split('T')[0];
  const upcoming = appointments.filter((a) => a.date >= today && a.status !== 'Cancelado');
  const past = appointments.filter((a) => isPast(a.date) || a.status === 'Realizado');
  const todayCount = appointments.filter((a) => isToday(a.date)).length;

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Agendamentos</h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie visitas e registre relatórios pós-visita</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Novo Agendamento
        </button>
      </div>

      {error ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-6">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
          <button onClick={fetchAll} className="ml-auto underline cursor-pointer">Tentar novamente</button>
        </div>
      ) : loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="col-span-1 space-y-4">
            <div className="border border-slate-200 bg-white rounded-xl shadow-sm p-6 flex flex-col items-center">
              <CalendarIcon className="h-10 w-10 text-brand-500 mb-3" />
              <h3 className="text-lg font-bold text-slate-900 capitalize">{formatCurrentMonth()}</h3>
              <div className="mt-6 w-full p-4 rounded-lg bg-brand-50 border border-brand-100 flex items-start gap-4">
                <div className="bg-brand-600 rounded-md text-white px-3 py-2 flex flex-col items-center shrink-0">
                  <span className="text-xs font-semibold uppercase">
                    {new Date().toLocaleDateString('pt-BR', { month: 'short' })}
                  </span>
                  <span className="text-xl font-bold leading-none mt-1">{new Date().getDate()}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Hoje</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    {todayCount === 0 ? 'Sem compromissos hoje' : `${todayCount} compromisso${todayCount > 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 bg-white rounded-xl shadow-sm p-5 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Resumo</p>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Agendados</span>
                <span className="font-semibold text-slate-800">{upcoming.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Realizados</span>
                <span className="font-semibold text-green-700">{appointments.filter((a) => a.status === 'Realizado').length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Sem relatório</span>
                <span className="font-semibold text-orange-600">{past.filter((a) => a.status !== 'Realizado').length}</span>
              </div>
            </div>
          </div>

          {/* Main list */}
          <div className="col-span-1 lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-brand-500" />
                Próximos Agendamentos
              </h2>
              {upcoming.length === 0 ? (
                <EmptyState icon={<CalendarIcon className="h-8 w-8 opacity-40" />} label="Nenhum agendamento futuro." onAdd={openCreate} />
              ) : (
                <div className="space-y-3">
                  {upcoming.map((appt) => (
                    <AppointmentCard key={appt.id} appt={appt} onReport={() => openReport(appt)} onEdit={() => openEdit(appt)} />
                  ))}
                </div>
              )}
            </section>

            {past.filter((a) => a.status !== 'Realizado').length > 0 && (
              <section>
                <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-orange-500" />
                  Aguardando Relatório
                  <span className="ml-1 inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
                    {past.filter((a) => a.status !== 'Realizado').length}
                  </span>
                </h2>
                <div className="space-y-3">
                  {past.filter((a) => a.status !== 'Realizado').map((appt) => (
                    <AppointmentCard key={appt.id} appt={appt} onReport={() => openReport(appt)} onEdit={() => openEdit(appt)} showReportCta />
                  ))}
                </div>
              </section>
            )}

            {appointments.filter((a) => a.status === 'Realizado').length > 0 && (
              <section>
                <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Visitas Realizadas
                </h2>
                <div className="space-y-3">
                  {appointments.filter((a) => a.status === 'Realizado').map((appt) => (
                    <AppointmentCard key={appt.id} appt={appt} onReport={() => openReport(appt)} onEdit={() => openEdit(appt)} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      {/* New / Edit appointment modal */}
      {isModalOpen && (
        <Modal title={editingId ? 'Editar Agendamento' : 'Novo Agendamento'} onClose={handleClose}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && <ErrorBanner message={submitError} />}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
              <input required type="text"
                className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Visita ao escritório"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Building className="h-3.5 w-3.5 text-slate-400" /> Membro
                <span className="text-xs font-normal text-slate-400 ml-1">(opcional)</span>
              </label>
              <select className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm bg-white"
                value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })}>
                <option value="">Selecione um membro...</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                <input required type="date" className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm"
                  value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Horário</label>
                <input required type="time" className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm"
                  value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Equipe <span className="text-xs font-normal text-slate-400">(opcional)</span>
              </label>
              {team.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Cadastre membros na aba Equipe primeiro.</p>
              ) : (
                <div className="rounded-lg border border-slate-300 max-h-36 overflow-y-auto divide-y divide-slate-100">
                  {team.map((m) => (
                    <label key={m.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.responsible.includes(m.name)}
                        onChange={() => toggleMember(m.name)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                      />
                      <span className="text-sm text-slate-900 flex-1">{m.name}</span>
                      {m.role && <span className="text-xs text-slate-400">{m.role}</span>}
                    </label>
                  ))}
                </div>
              )}
              {form.responsible.length > 0 && (
                <p className="text-xs text-slate-500 mt-1.5">
                  Selecionados: {form.responsible.join(', ')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Descrição <span className="text-xs font-normal text-slate-400">(opcional)</span>
              </label>
              <textarea rows={3} className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm resize-none"
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detalhes do compromisso..." />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={handleClose} className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg disabled:opacity-50 cursor-pointer transition-colors">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
                {editingId ? 'Salvar alterações' : 'Salvar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Report modal */}
      {reportAppt && (
        <Modal
          title={reportAppt.status === 'Realizado' ? 'Relatório da Visita' : 'Registrar Relatório'}
          onClose={() => { setReportAppt(null); setReportText(''); }}
        >
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-700 space-y-1">
              <p className="font-semibold">{reportAppt.title}</p>
              {reportAppt.companies?.name && (
                <p className="text-slate-500 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> {reportAppt.companies.name}
                </p>
              )}
              <p className="text-slate-500">{formatDate(reportAppt.date)} · {reportAppt.time.slice(0, 5)}</p>
            </div>

            {reportError && <ErrorBanner message={reportError} />}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-slate-400" /> Relatório da visita
              </label>
              <textarea
                rows={6}
                className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm resize-none"
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Descreva como foi a visita, pontos discutidos, próximos passos..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button onClick={() => { setReportAppt(null); setReportText(''); }} className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                Cancelar
              </button>
              <button onClick={handleSaveReport} disabled={isSavingReport || !reportText.trim()} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg disabled:opacity-50 cursor-pointer transition-colors">
                {isSavingReport && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
                <CheckCircle2 className="h-4 w-4" />
                Marcar como Realizada
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AppointmentCard({ appt, onReport, onEdit, showReportCta }: {
  appt: Appointment;
  onReport: () => void;
  onEdit: () => void;
  showReportCta?: boolean;
}) {
  const done = appt.status === 'Realizado';
  const members = appt.responsible ? appt.responsible.split(', ').filter(Boolean) : [];
  return (
    <div className={`rounded-xl border bg-white p-5 shadow-sm transition-colors ${done ? 'border-green-200 bg-green-50/30' : 'border-slate-200 hover:border-brand-300'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${done ? 'bg-green-50 ring-green-200' : 'bg-brand-50 ring-brand-200'}`}>
            {done ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Clock className="h-5 w-5 text-brand-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{appt.title}</p>
            {appt.companies?.name && (
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <Users className="h-3 w-3" /> {appt.companies.name}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-1">{formatDate(appt.date)} · {appt.time.slice(0, 5)}</p>
            {members.length > 0 && (
              <div className="mt-2 flex gap-1.5 flex-wrap">
                {members.map((name) => (
                  <span key={name} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    {name}
                  </span>
                ))}
              </div>
            )}
            {appt.relatorio && (
              <p className="mt-2 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 leading-relaxed whitespace-pre-wrap line-clamp-3">
                {appt.relatorio}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <Pencil className="h-3 w-3" />
            Editar
          </button>
          <button
            onClick={onReport}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              done
                ? 'bg-green-50 text-green-700 hover:bg-green-100 ring-1 ring-inset ring-green-600/20'
                : showReportCta
                ? 'bg-orange-50 text-orange-700 hover:bg-orange-100 ring-1 ring-inset ring-orange-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="h-3 w-3" />
            {done ? 'Relatório' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500 cursor-pointer"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
      <AlertCircle className="h-4 w-4 shrink-0" />{message}
    </div>
  );
}

function EmptyState({ icon, label, onAdd }: { icon: React.ReactNode; label: string; onAdd: () => void }) {
  return (
    <div className="flex flex-col h-36 items-center justify-center rounded-xl border border-dashed border-slate-300 gap-2 text-slate-400">
      {icon}
      <p className="text-sm">{label}</p>
      <button onClick={onAdd} className="text-xs text-brand-600 hover:underline cursor-pointer">Criar agendamento</button>
    </div>
  );
}
