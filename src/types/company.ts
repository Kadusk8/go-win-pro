export const COMPANY_STATUS = {
  ACTIVE: 'Ativo',
  PROSPECT: 'Prospecto',
  INACTIVE: 'Inativo',
} as const;

export type CompanyStatus = (typeof COMPANY_STATUS)[keyof typeof COMPANY_STATUS];

export const CURSOS_OPTIONS = [
  'Escola de Líderes',
  'Escola de Servos',
  'DNA',
  'Escola de Casais',
  'Imperfeito e Felizes',
] as const;

export type CursoOption = (typeof CURSOS_OPTIONS)[number];

export type Company = {
  id: string;
  name: string;
  cnpj: string;
  segment: string;
  status: CompanyStatus;
  phone: string;
  email: string;
  address: string;
  responsible: string;
  notes: string;
  campo: string;
  gc: string;
  cursos: string[];
  esposo: string;
  esposa: string;
  created_at: string;
};

export type CompanyFormData = {
  name: string;
  segment: string;
  status: CompanyStatus;
  phone: string;
  email: string;
  responsible: string;
  campo: string;
  gc: string;
  cursos: string[];
  esposo: string;
  esposa: string;
};

export const EMPTY_FORM: CompanyFormData = {
  name: '',
  segment: '',
  status: COMPANY_STATUS.ACTIVE,
  phone: '',
  email: '',
  responsible: '',
  campo: '',
  gc: '',
  cursos: [],
  esposo: '',
  esposa: '',
};
