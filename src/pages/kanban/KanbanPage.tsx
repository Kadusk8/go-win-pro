import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Loader2, AlertCircle, Trash2, Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type TeamMember = { id: string; name: string; role: string | null };

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  responsible_id: string | null;
  created_at: string;
  team_members?: { name: string; role: string | null };
};

type TaskForm = {
  title: string;
  description: string;
  responsible_id: string;
};

const EMPTY_FORM: TaskForm = { title: '', description: '', responsible_id: '' };

const COLUMNS = [
  { key: 'A fazer',      label: 'A fazer',      dot: 'bg-slate-400' },
  { key: 'Em andamento', label: 'Em andamento',  dot: 'bg-blue-500' },
  { key: 'Concluído',    label: 'Concluído',     dot: 'bg-green-500' },
];

const AVATAR_COLORS = [
  'bg-brand-500', 'bg-indigo-500', 'bg-green-500', 'bg-orange-500',
  'bg-pink-500', 'bg-purple-500', 'bg-teal-500', 'bg-red-500',
];

function avatarColor(id: string) {
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<TaskForm>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Edit modal
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState<TaskForm>(EMPTY_FORM);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [tasksRes, teamRes] = await Promise.all([
      supabase.from('tasks').select('*, team_members(name, role)').order('created_at', { ascending: true }),
      supabase.from('team_members').select('id, name, role').order('name', { ascending: true }),
    ]);

    if (tasksRes.error || teamRes.error) {
      setError('Não foi possível carregar os dados.');
    } else {
      setTasks((tasksRes.data ?? []) as Task[]);
      setTeam(teamRes.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const { data, error: err } = await supabase
      .from('tasks')
      .insert([{
        title: form.title.trim(),
        description: form.description.trim() || null,
        responsible_id: form.responsible_id || null,
        status: 'A fazer',
      }])
      .select('*, team_members(name, role)');

    if (err) {
      setSubmitError(`Erro ao salvar: ${err.message}`);
    } else if (data && data.length > 0) {
      setTasks((prev) => [...prev, data[0] as Task]);
      setIsModalOpen(false);
      setForm(EMPTY_FORM);
    }
    setIsSubmitting(false);
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description ?? '',
      responsible_id: task.responsible_id ?? '',
    });
    setEditError(null);
  }

  async function handleEditSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!editingTask) return;
    setIsEditSubmitting(true);
    setEditError(null);

    const { data, error: err } = await supabase
      .from('tasks')
      .update({
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
        responsible_id: editForm.responsible_id || null,
      })
      .eq('id', editingTask.id)
      .select('*, team_members(name, role)');

    if (err) {
      setEditError(`Erro ao salvar: ${err.message}`);
    } else if (data && data.length > 0) {
      setTasks((prev) => prev.map((t) => t.id === editingTask.id ? (data[0] as Task) : t));
      setEditingTask(null);
    }
    setIsEditSubmitting(false);
  }

  async function handleDelete(id: string) {
    const { error: err } = await supabase.from('tasks').delete().eq('id', id);
    if (!err) setTasks((prev) => prev.filter((t) => t.id !== id));
    setDeleteId(null);
  }

  async function moveTaskToColumn(taskId: string, newStatus: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    const { error: err } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    if (!err) {
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    }
  }

  function handleDragStart(e: React.DragEvent, taskId: string) {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(taskId);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverCol(null);
  }

  function handleDragOver(e: React.DragEvent, colKey: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colKey);
  }

  function handleDrop(e: React.DragEvent, colKey: string) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) moveTaskToColumn(taskId, colKey);
    setDraggingId(null);
    setDragOverCol(null);
  }

  function handleCloseCreate() {
    setIsModalOpen(false);
    setSubmitError(null);
    setForm(EMPTY_FORM);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kanban de Tarefas</h1>
          <p className="text-sm text-slate-500 mt-1">Arraste os cards para mover entre colunas</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Nova Tarefa
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-6">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
          <button onClick={fetchAll} className="ml-auto underline cursor-pointer">Tentar novamente</button>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);
            const isOver = dragOverCol === col.key;
            return (
              <div
                key={col.key}
                className="flex flex-col gap-3"
                onDragOver={(e) => handleDragOver(e, col.key)}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={(e) => handleDrop(e, col.key)}
              >
                {/* Column header */}
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                  <h2 className="text-sm font-semibold text-slate-700">{col.label}</h2>
                  <span className="ml-auto text-xs font-semibold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards drop zone */}
                <div className={`flex flex-col gap-3 min-h-[120px] rounded-xl transition-colors ${isOver ? 'bg-brand-50/60 ring-2 ring-brand-300 ring-dashed p-2' : ''}`}>
                  {colTasks.length === 0 ? (
                    <div className="flex items-center justify-center h-24 rounded-xl border border-dashed border-slate-200 text-slate-300 text-xs">
                      {isOver ? 'Soltar aqui' : 'Nenhuma tarefa'}
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const member = Array.isArray(task.team_members) ? task.team_members[0] : task.team_members;
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onDragEnd={handleDragEnd}
                          className={`bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-brand-300 transition-all group select-none cursor-grab active:cursor-grabbing ${draggingId === task.id ? 'opacity-40 scale-95' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-sm font-semibold text-slate-900 leading-snug flex-1">{task.title}</p>
                            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEdit(task)}
                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-brand-500 cursor-pointer transition-colors"
                                title="Editar"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              {deleteId === task.id ? (
                                <>
                                  <button onClick={() => handleDelete(task.id)} className="text-xs text-white bg-red-500 hover:bg-red-600 rounded px-1.5 py-0.5 cursor-pointer">✓</button>
                                  <button onClick={() => setDeleteId(null)} className="text-xs text-slate-500 hover:text-slate-700 rounded px-1.5 py-0.5 cursor-pointer">✕</button>
                                </>
                              ) : (
                                <button onClick={() => setDeleteId(task.id)} className="p-1 rounded hover:bg-slate-100 text-slate-300 hover:text-red-500 cursor-pointer transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {task.description && (
                            <p className="text-xs text-slate-500 mb-3 leading-relaxed line-clamp-2">{task.description}</p>
                          )}

                          {member && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <div className={`h-5 w-5 rounded-full ${task.responsible_id ? avatarColor(task.responsible_id) : 'bg-slate-300'} flex items-center justify-center text-white text-[10px] font-bold`}>
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-xs text-slate-500 truncate max-w-[120px]">{member.name}</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create task modal */}
      {isModalOpen && (
        <TaskModal
          title="Nova Tarefa"
          form={form}
          team={team}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onSubmit={handleSubmit}
          onChange={setForm}
          onClose={handleCloseCreate}
          submitLabel="Criar Tarefa"
        />
      )}

      {/* Edit task modal */}
      {editingTask && (
        <TaskModal
          title="Editar Tarefa"
          form={editForm}
          team={team}
          isSubmitting={isEditSubmitting}
          submitError={editError}
          onSubmit={handleEditSubmit}
          onChange={setEditForm}
          onClose={() => setEditingTask(null)}
          submitLabel="Salvar alterações"
        />
      )}
    </div>
  );
}

function TaskModal({
  title, form, team, isSubmitting, submitError, onSubmit, onChange, onClose, submitLabel,
}: {
  title: string;
  form: TaskForm;
  team: TeamMember[];
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (e: { preventDefault(): void }) => void;
  onChange: (f: TaskForm) => void;
  onClose: () => void;
  submitLabel: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {submitError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
            <input
              required type="text"
              className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm"
              value={form.title}
              onChange={(e) => onChange({ ...form, title: e.target.value })}
              placeholder="Descreva a tarefa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descrição <span className="text-xs font-normal text-slate-400">(opcional)</span>
            </label>
            <textarea
              rows={3}
              className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm resize-none"
              value={form.description}
              onChange={(e) => onChange({ ...form, description: e.target.value })}
              placeholder="Detalhes adicionais..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Responsável <span className="text-xs font-normal text-slate-400">(opcional)</span>
            </label>
            {team.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Cadastre membros na aba Equipe primeiro.</p>
            ) : (
              <select
                className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm bg-white"
                value={form.responsible_id}
                onChange={(e) => onChange({ ...form, responsible_id: e.target.value })}
              >
                <option value="">Selecione um responsável...</option>
                {team.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}{m.role ? ` — ${m.role}` : ''}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-colors">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
