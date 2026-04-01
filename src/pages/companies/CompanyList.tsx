import { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Building, Phone, X, Loader2, AlertCircle,
  ChevronDown, ChevronUp, MapPin, Users, GraduationCap, Pencil, Trash2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CURSOS_OPTIONS, EMPTY_FORM, type Company, type CompanyFormData } from '../../types/company';

function toggleCurso(cursos: string[], curso: string): string[] {
  return cursos.includes(curso) ? cursos.filter((c) => c !== curso) : [...cursos, curso];
}

function companyToFormData(c: Company): CompanyFormData {
  return {
    name: c.name,
    segment: c.segment || '',
    status: c.status,
    phone: c.phone || '',
    email: c.email || '',
    responsible: c.responsible || '',
    campo: c.campo || '',
    gc: c.gc || '',
    cursos: c.cursos || [],
    esposo: c.esposo || '',
    esposa: c.esposa || '',
  };
}

export default function CompanyList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError('Não foi possível carregar os membros. Tente novamente.');
    } else {
      setCompanies(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  function handleOpenNew() {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setSubmitError(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(company: Company) {
    setEditingId(company.id);
    setFormData(companyToFormData(company));
    setSubmitError(null);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setSubmitError(null);
    setFormData(EMPTY_FORM);
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    if (editingId) {
      // UPDATE
      const { data, error: updateError } = await supabase
        .from('companies')
        .update(formData)
        .eq('id', editingId)
        .select();

      if (updateError) {
        console.error('Supabase update error:', updateError);
        setSubmitError(`Erro ao atualizar: ${updateError.message}`);
      } else if (data && data.length > 0) {
        setCompanies(companies.map((c) => (c.id === editingId ? data[0] : c)));
        handleCloseModal();
      } else {
        setSubmitError('Atualização falhou sem mensagem de erro. Verifique as políticas RLS no Supabase.');
      }
    } else {
      // INSERT
      const { data, error: insertError } = await supabase
        .from('companies')
        .insert([formData])
        .select();

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        setSubmitError(`Erro ao salvar: ${insertError.message}`);
      } else if (data && data.length > 0) {
        setCompanies([data[0], ...companies]);
        handleCloseModal();
      } else {
        console.error('Supabase insert retornou vazio (possível bloqueio por RLS):', { data, insertError });
        setSubmitError('Salvar falhou sem mensagem de erro. Verifique as políticas RLS no Supabase (execute: ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY; no SQL Editor).');
      }
    }

    setIsSubmitting(false);
  }

  async function handleDelete(id: string) {
    setIsDeleting(true);
    const { error: deleteError } = await supabase.from('companies').delete().eq('id', id);

    if (deleteError) {
      console.error('Supabase delete error:', deleteError);
    } else {
      setCompanies(companies.filter((c) => c.id !== id));
      setExpandedId(null);
    }
    setDeleteConfirmId(null);
    setIsDeleting(false);
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
    setDeleteConfirmId(null);
  }

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.segment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.campo?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Membros</h1>
          <p className="text-sm text-slate-500 mt-1">Acompanhamento espiritual dos empresários</p>
        </div>
        <button
          onClick={handleOpenNew}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Novo Membro
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <p className="text-sm font-medium leading-6 text-slate-500">Total de Membros</p>
          <p className="mt-2">
            <span className="text-4xl font-bold tracking-tight text-slate-900">{companies.length}</span>
          </p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <p className="text-sm font-medium leading-6 text-slate-500">Campo 85</p>
          <p className="mt-2">
            <span className="text-4xl font-bold tracking-tight text-brand-600">
              {companies.filter((c) => c.campo === '85').length}
            </span>
          </p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <p className="text-sm font-medium leading-6 text-slate-500">Campo 153</p>
          <p className="mt-2">
            <span className="text-4xl font-bold tracking-tight text-green-600">
              {companies.filter((c) => c.campo === '153').length}
            </span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative flex-1 w-full max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-lg border-0 py-2 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6"
              placeholder="Buscar por nome, campo ou segmento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {error ? (
            <div className="flex h-64 items-center justify-center gap-3 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
              <button onClick={fetchCompanies} className="text-sm underline cursor-pointer">Tentar novamente</button>
            </div>
          ) : loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Membro / Empresa</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Campo</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">GC</th>
                  <th className="py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500 text-sm">
                      Nenhum membro encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((company) => (
                    <>
                      <tr
                        key={company.id}
                        onClick={() => toggleExpand(company.id)}
                        className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      >
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-brand-100 flex items-center justify-center border border-brand-200 text-brand-700 font-bold text-sm">
                              {company.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{company.name}</div>
                              <div className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                                <Building className="h-3 w-3" />
                                {company.segment || 'Sem segmento'}
                                {company.phone && (
                                  <> · <Phone className="h-3 w-3" /> {company.phone}</>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                          {company.campo ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              {company.campo}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                          {company.gc ? (
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              {company.gc}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <span className="text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1">
                            {expandedId === company.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            Detalhes
                          </span>
                        </td>
                      </tr>

                      {expandedId === company.id && (
                        <tr key={`${company.id}-details`} className="bg-slate-50/60">
                          <td colSpan={4} className="px-6 py-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              {/* Cursos */}
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                                  <GraduationCap className="h-3.5 w-3.5" /> Cursos
                                </p>
                                {company.cursos?.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {company.cursos.map((c) => (
                                      <span key={c} className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                                        {c}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-400 italic">Nenhum curso registrado.</p>
                                )}
                              </div>

                              {/* Campo, GC e Casal */}
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" /> Campo
                                  </p>
                                  <p className="text-sm text-slate-700">{company.campo || <span className="italic text-slate-400">Não informado</span>}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                                    <Users className="h-3.5 w-3.5" /> GC
                                  </p>
                                  <p className="text-sm text-slate-700">{company.gc || <span className="italic text-slate-400">Não informado</span>}</p>
                                </div>
                                {(company.esposo || company.esposa) && (
                                  <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Casal</p>
                                    <p className="text-sm text-slate-700">
                                      {[company.esposo, company.esposa].filter(Boolean).join(' & ')}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Ações */}
                            <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                              {deleteConfirmId === company.id ? (
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-slate-600">Excluir este membro?</span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                                    className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(company.id); }}
                                    disabled={isDeleting}
                                    className="px-3 py-1.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                  >
                                    {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    Confirmar exclusão
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleOpenEdit(company); }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors border border-slate-200"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Editar
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(company.id); }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors border border-red-200"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Excluir
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal novo / editar */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? 'Editar Membro' : 'Novo Membro'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-500 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
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
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome da empresa"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome do esposo</label>
                  <input
                    type="text"
                    className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm"
                    value={formData.esposo}
                    onChange={(e) => setFormData({ ...formData, esposo: e.target.value })}
                    placeholder="Nome do esposo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome da esposa</label>
                  <input
                    type="text"
                    className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm"
                    value={formData.esposa}
                    onChange={(e) => setFormData({ ...formData, esposa: e.target.value })}
                    placeholder="Nome da esposa"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Empresa / Segmento</label>
                <input
                  type="text"
                  className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm"
                  value={formData.segment}
                  onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                  placeholder="Ex: Padaria, Tecnologia"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Responsável</label>
                  <input
                    type="text"
                    className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm"
                    value={formData.responsible}
                    onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                    placeholder="Líder responsável"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 90000-0000"
                  />
                </div>
              </div>

              {/* Divisor espiritual */}
              <div className="pt-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vida Espiritual</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      Qual campo frequenta?
                    </label>
                    <select
                      className="block w-full rounded-lg border-0 py-2.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-brand-600 sm:text-sm bg-white"
                      value={formData.campo}
                      onChange={(e) => setFormData({ ...formData, campo: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      <option value="85">85</option>
                      <option value="153">153</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      Frequenta algum GC?
                    </label>
                    <input
                      type="text"
                      className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm"
                      value={formData.gc}
                      onChange={(e) => setFormData({ ...formData, gc: e.target.value })}
                      placeholder="Nome do GC ou líder"
                    />
                  </div>
                </div>
              </div>

              {/* Cursos */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                  Quais cursos já fez?
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {CURSOS_OPTIONS.map((curso) => {
                    const checked = formData.cursos.includes(curso);
                    return (
                      <label
                        key={curso}
                        className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                          checked
                            ? 'border-brand-300 bg-brand-50'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600 cursor-pointer"
                          checked={checked}
                          onChange={() => setFormData({ ...formData, cursos: toggleCurso(formData.cursos, curso) })}
                        />
                        <span className={`text-sm ${checked ? 'font-medium text-brand-800' : 'text-slate-700'}`}>
                          {curso}
                        </span>
                        {checked && (
                          <span className="ml-auto text-brand-500">
                            <GraduationCap className="h-4 w-4" />
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
                  {editingId ? 'Salvar alterações' : 'Salvar Membro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
