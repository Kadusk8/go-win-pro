import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Loader2, AlertCircle, Trash2, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type TeamMember = {
  id: string;
  name: string;
  role: string | null;
  created_at: string;
};

type TeamForm = { name: string; role: string };
const EMPTY_FORM: TeamForm = { name: '', role: '' };

const AVATAR_COLORS = [
  'bg-brand-500', 'bg-indigo-500', 'bg-green-500', 'bg-orange-500',
  'bg-pink-500', 'bg-purple-500', 'bg-teal-500', 'bg-red-500',
];

function avatarColor(id: string) {
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<TeamForm>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('team_members')
      .select('*')
      .order('name', { ascending: true });
    if (err) setError('Não foi possível carregar a equipe.');
    else setMembers(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const { data, error: err } = await supabase
      .from('team_members')
      .insert([{ name: form.name.trim(), role: form.role.trim() || null }])
      .select();

    if (err) {
      setSubmitError(`Erro ao salvar: ${err.message}`);
    } else if (data && data.length > 0) {
      setMembers((prev) => [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name)));
      setIsModalOpen(false);
      setForm(EMPTY_FORM);
    }
    setIsSubmitting(false);
  }

  async function handleDelete(id: string) {
    setIsDeleting(true);
    const { error: err } = await supabase.from('team_members').delete().eq('id', id);
    if (!err) setMembers((prev) => prev.filter((m) => m.id !== id));
    setDeleteId(null);
    setIsDeleting(false);
  }

  function handleClose() {
    setIsModalOpen(false);
    setSubmitError(null);
    setForm(EMPTY_FORM);
  }

  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Equipe</h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie os membros da equipe responsáveis pelas visitas</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Novo Membro da Equipe
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-6">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
          <button onClick={fetchMembers} className="ml-auto underline cursor-pointer">Tentar novamente</button>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-dashed border-slate-300 gap-3 text-slate-400">
          <Users className="h-10 w-10 opacity-40" />
          <p className="text-sm">Nenhum membro cadastrado.</p>
          <button onClick={() => setIsModalOpen(true)} className="text-xs text-brand-600 hover:underline cursor-pointer">
            Adicionar primeiro membro
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <div key={member.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start gap-4 hover:border-brand-300 transition-colors group">
              <div className={`h-11 w-11 rounded-full ${avatarColor(member.id)} flex items-center justify-center text-white font-bold text-base shrink-0`}>
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{member.name}</p>
                <p className="text-sm text-slate-500 mt-0.5 truncate">{member.role || 'Sem cargo'}</p>
              </div>
              <div className="shrink-0">
                {deleteId === member.id ? (
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => handleDelete(member.id)}
                      disabled={isDeleting}
                      className="text-xs font-semibold text-white bg-red-600 hover:bg-red-500 px-2 py-1 rounded cursor-pointer transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? '...' : 'Confirmar'}
                    </button>
                    <button
                      onClick={() => setDeleteId(null)}
                      className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteId(member.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 cursor-pointer p-1 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Novo Membro da Equipe</h2>
              <button onClick={handleClose} className="text-slate-400 hover:text-slate-500 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {submitError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {submitError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                <input
                  required
                  type="text"
                  className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Cargo <span className="text-xs font-normal text-slate-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="Ex: Pastor, Líder, Diácono"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={handleClose} className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-colors">
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
