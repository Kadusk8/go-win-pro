import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, X, Loader2, AlertCircle, Trash2, Pencil, Check, Settings2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type TeamMember = { id: string; name: string; role: string | null };

type Column = { id: string; name: string; position: number };

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  responsible_id: string | null;
  created_at: string;
  team_members?: { name: string; role: string | null };
};

type TaskForm = { title: string; description: string; responsible_id: string };
const EMPTY_TASK_FORM: TaskForm = { title: '', description: '', responsible_id: '' };

const AVATAR_COLORS = [
  'bg-brand-500', 'bg-indigo-500', 'bg-green-500', 'bg-orange-500',
  'bg-pink-500', 'bg-purple-500', 'bg-teal-500', 'bg-red-500',
];

const COL_DOTS = [
  'bg-slate-400', 'bg-blue-500', 'bg-green-500', 'bg-orange-500',
  'bg-purple-500', 'bg-pink-500', 'bg-teal-500', 'bg-red-500',
];

function avatarColor(id: string) {
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function colDot(idx: number) {
  return COL_DOTS[idx % COL_DOTS.length];
}

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Task create/edit
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState<TaskForm>(EMPTY_TASK_FORM);
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);
  const [taskSubmitError, setTaskSubmitError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskForm, setEditTaskForm] = useState<TaskForm>(EMPTY_TASK_FORM);
  const [isEditTaskSubmitting, setIsEditTaskSubmitting] = useState(false);
  const [editTaskError, setEditTaskError] = useState<string | null>(null);

  // Task delete
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  // Column create
  const [newColName, setNewColName] = useState('');
  const [isAddingCol, setIsAddingCol] = useState(false);
  const [isColSubmitting, setIsColSubmitting] = useState(false);

  // Column edit (inline)
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingColName, setEditingColName] = useState('');
  const colEditRef = useRef<HTMLInputElement>(null);

  // Column delete
  const [deleteColId, setDeleteColId] = useState<string | null>(null);
  const [isColDeleting, setIsColDeleting] = useState(false);

  // Drag
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [tasksRes, teamRes, colsRes] = await Promise.all([
      supabase.from('tasks').select('*, team_members(name, role)').order('created_at', { ascending: true }),
      supabase.from('team_members').select('id, name, role').order('name', { ascending: true }),
      supabase.from('kanban_columns').select('*').order('position', { ascending: true }),
    ]);

    if (tasksRes.error || colsRes.error) {
      setError('Não foi possível carregar os dados.');
    } else {
      setTasks((tasksRes.data ?? []) as Task[]);
      setTeam(teamRes.data ?? []);
      setColumns((colsRes.data ?? []) as Column[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (editingColId && colEditRef.current) colEditRef.current.focus();
  }, [editingColId]);

  // ── Task handlers ──────────────────────────────────────────────
  async function handleTaskSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setIsTaskSubmitting(true);
    setTaskSubmitError(null);
    const firstCol = columns[0]?.name ?? 'A fazer';
    const { data, error: err } = await supabase
      .from('tasks')
      .insert([{ title: taskForm.title.trim(), description: taskForm.description.trim() || null, responsible_id: taskForm.responsible_id || null, status: firstCol }])
      .select('*, team_members(name, role)');
    if (err) { setTaskSubmitError(`Erro: ${err.message}`); }
    else if (data?.length) { setTasks((p) => [...p, data[0] as Task]); closeTaskModal(); }
    setIsTaskSubmitting(false);
  }

  function openEditTask(task: Task) {
    setEditingTask(task);
    setEditTaskForm({ title: task.title, description: task.description ?? '', responsible_id: task.responsible_id ?? '' });
    setEditTaskError(null);
  }

  async function handleEditTaskSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!editingTask) return;
    setIsEditTaskSubmitting(true);
    setEditTaskError(null);
    const { data, error: err } = await supabase
      .from('tasks')
      .update({ title: editTaskForm.title.trim(), description: editTaskForm.description.trim() || null, responsible_id: editTaskForm.responsible_id || null })
      .eq('id', editingTask.id)
      .select('*, team_members(name, role)');
    if (err) { setEditTaskError(`Erro: ${err.message}`); }
    else if (data?.length) { setTasks((p) => p.map((t) => t.id === editingTask.id ? (data[0] as Task) : t)); setEditingTask(null); }
    setIsEditTaskSubmitting(false);
  }

  async function handleDeleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id);
    setTasks((p) => p.filter((t) => t.id !== id));
    setDeleteTaskId(null);
  }

  function closeTaskModal() { setIsTaskModalOpen(false); setTaskForm(EMPTY_TASK_FORM); setTaskSubmitError(null); }

  // ── Column handlers ────────────────────────────────────────────
  async function handleAddColumn(e: { preventDefault(): void }) {
    e.preventDefault();
    const name = newColName.trim();
    if (!name) return;
    setIsColSubmitting(true);
    const position = columns.length > 0 ? Math.max(...columns.map((c) => c.position)) + 1 : 0;
    const { data, error: err } = await supabase.from('kanban_columns').insert([{ name, position }]).select();
    if (!err && data?.length) {
      setColumns((p) => [...p, data[0] as Column]);
      setNewColName('');
      setIsAddingCol(false);
    }
    setIsColSubmitting(false);
  }

  function startEditCol(col: Column) {
    setEditingColId(col.id);
    setEditingColName(col.name);
  }

  async function confirmEditCol(col: Column) {
    const name = editingColName.trim();
    if (!name || name === col.name) { setEditingColId(null); return; }
    const { error: err } = await supabase.from('kanban_columns').update({ name }).eq('id', col.id);
    if (!err) {
      // Rename tasks with old status
      await supabase.from('tasks').update({ status: name }).eq('status', col.name);
      setColumns((p) => p.map((c) => c.id === col.id ? { ...c, name } : c));
      setTasks((p) => p.map((t) => t.status === col.name ? { ...t, status: name } : t));
    }
    setEditingColId(null);
  }

  async function handleDeleteColumn(col: Column) {
    setIsColDeleting(true);
    const colTasks = tasks.filter((t) => t.status === col.name);
    if (colTasks.length > 0) {
      // Move tasks to first other column
      const fallback = columns.find((c) => c.id !== col.id);
      if (fallback) {
        await supabase.from('tasks').update({ status: fallback.name }).eq('status', col.name);
        setTasks((p) => p.map((t) => t.status === col.name ? { ...t, status: fallback.name } : t));
      }
    }
    await supabase.from('kanban_columns').delete().eq('id', col.id);
    setColumns((p) => p.filter((c) => c.id !== col.id));
    setDeleteColId(null);
    setIsColDeleting(false);
  }

  // ── Drag handlers ──────────────────────────────────────────────
  async function moveTaskToColumn(taskId: string, newStatus: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    setTasks((p) => p.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
  }

  function handleDragStart(e: React.DragEvent, taskId: string) {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(taskId);
  }

  function handleDragEnd() { setDraggingId(null); setDragOverCol(null); }

  function handleDragOver(e: React.DragEvent, colName: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colName);
  }

  function handleDrop(e: React.DragEvent, colName: string) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) moveTaskToColumn(taskId, colName);
    setDraggingId(null);
    setDragOverCol(null);
  }

  return (
    <div className="p-8 max-w-full mx-auto h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kanban de Tarefas</h1>
          <p className="text-sm text-slate-500 mt-1">Arraste os cards para mover entre colunas</p>
        </div>
        <button
          onClick={() => setIsTaskModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Nova Tarefa
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-6 max-w-7xl mx-auto">
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
        <div className="flex gap-5 overflow-x-auto pb-4 items-start">
          {columns.map((col, idx) => {
            const colTasks = tasks.filter((t) => t.status === col.name);
            const isOver = dragOverCol === col.name;
            const isConfirmingDelete = deleteColId === col.id;
            return (
              <div
                key={col.id}
                className="flex flex-col gap-3 min-w-[280px] w-[280px] shrink-0"
                onDragOver={(e) => handleDragOver(e, col.name)}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={(e) => handleDrop(e, col.name)}
              >
                {/* Column header */}
                <div className="flex items-center gap-2 group/header">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${colDot(idx)}`} />

                  {editingColId === col.id ? (
                    <input
                      ref={colEditRef}
                      className="flex-1 text-sm font-semibold text-slate-700 bg-white border border-brand-400 rounded-md px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={editingColName}
                      onChange={(e) => setEditingColName(e.target.value)}
                      onBlur={() => confirmEditCol(col)}
                      onKeyDown={(e) => { if (e.key === 'Enter') confirmEditCol(col); if (e.key === 'Escape') setEditingColId(null); }}
                    />
                  ) : (
                    <h2 className="text-sm font-semibold text-slate-700 flex-1 truncate">{col.name}</h2>
                  )}

                  <span className="text-xs font-semibold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5 shrink-0">{colTasks.length}</span>

                  {/* Column actions */}
                  {isConfirmingDelete ? (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleDeleteColumn(col)}
                        disabled={isColDeleting}
                        className="text-xs text-white bg-red-500 hover:bg-red-600 rounded px-1.5 py-0.5 cursor-pointer disabled:opacity-50"
                      >
                        {isColDeleting ? '...' : '✓'}
                      </button>
                      <button onClick={() => setDeleteColId(null)} className="text-xs text-slate-500 hover:text-slate-700 rounded px-1.5 py-0.5 cursor-pointer">✕</button>
                    </div>
                  ) : (
                    <div className="flex gap-0.5 shrink-0 opacity-0 group-hover/header:opacity-100 transition-opacity">
                      <button onClick={() => startEditCol(col)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-brand-500 cursor-pointer transition-colors" title="Renomear coluna">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteColId(col.id)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500 cursor-pointer transition-colors" title="Excluir coluna">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Drop zone */}
                <div className={`flex flex-col gap-3 min-h-[120px] rounded-xl transition-all ${isOver ? 'bg-brand-50/60 ring-2 ring-brand-300 ring-dashed p-2' : ''}`}>
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
                              <button onClick={() => openEditTask(task)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-brand-500 cursor-pointer" title="Editar">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              {deleteTaskId === task.id ? (
                                <>
                                  <button onClick={() => handleDeleteTask(task.id)} className="text-xs text-white bg-red-500 hover:bg-red-600 rounded px-1.5 py-0.5 cursor-pointer">✓</button>
                                  <button onClick={() => setDeleteTaskId(null)} className="text-xs text-slate-500 hover:text-slate-700 rounded px-1.5 py-0.5 cursor-pointer">✕</button>
                                </>
                              ) : (
                                <button onClick={() => setDeleteTaskId(task.id)} className="p-1 rounded hover:bg-slate-100 text-slate-300 hover:text-red-500 cursor-pointer">
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

          {/* Add column */}
          <div className="min-w-[240px] w-[240px] shrink-0">
            {isAddingCol ? (
              <form onSubmit={handleAddColumn} className="bg-white rounded-xl border border-brand-300 shadow-sm p-3 flex flex-col gap-2">
                <input
                  autoFocus
                  required
                  className="block w-full rounded-lg border-0 py-2 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm"
                  placeholder="Nome da coluna"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') { setIsAddingCol(false); setNewColName(''); } }}
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={isColSubmitting} className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50 cursor-pointer">
                    {isColSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Criar
                  </button>
                  <button type="button" onClick={() => { setIsAddingCol(false); setNewColName(''); }} className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingCol(true)}
                className="w-full flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-400 hover:border-brand-400 hover:text-brand-500 hover:bg-brand-50/40 transition-all cursor-pointer"
              >
                <Settings2 className="h-4 w-4" />
                Nova coluna
              </button>
            )}
          </div>
        </div>
      )}

      {/* Create task modal */}
      {isTaskModalOpen && (
        <TaskModal title="Nova Tarefa" form={taskForm} team={team} isSubmitting={isTaskSubmitting} submitError={taskSubmitError}
          onSubmit={handleTaskSubmit} onChange={setTaskForm} onClose={closeTaskModal} submitLabel="Criar Tarefa" />
      )}

      {/* Edit task modal */}
      {editingTask && (
        <TaskModal title="Editar Tarefa" form={editTaskForm} team={team} isSubmitting={isEditTaskSubmitting} submitError={editTaskError}
          onSubmit={handleEditTaskSubmit} onChange={setEditTaskForm} onClose={() => setEditingTask(null)} submitLabel="Salvar alterações" />
      )}
    </div>
  );
}

function TaskModal({ title, form, team, isSubmitting, submitError, onSubmit, onChange, onClose, submitLabel }: {
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
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500 cursor-pointer"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />{submitError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
            <input required type="text"
              className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm"
              value={form.title} onChange={(e) => onChange({ ...form, title: e.target.value })} placeholder="Descreva a tarefa" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descrição <span className="text-xs font-normal text-slate-400">(opcional)</span>
            </label>
            <textarea rows={3}
              className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm resize-none"
              value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} placeholder="Detalhes adicionais..." />
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
                value={form.responsible_id} onChange={(e) => onChange({ ...form, responsible_id: e.target.value })}>
                <option value="">Selecione um responsável...</option>
                {team.map((m) => <option key={m.id} value={m.id}>{m.name}{m.role ? ` — ${m.role}` : ''}</option>)}
              </select>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">Cancelar</button>
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
