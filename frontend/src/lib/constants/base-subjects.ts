export interface BaseSubjectDefinition {
  name: string;
  code: string;
  description: string;
}

/**
 * Disciplinas iniciais disponíveis para toda instituição nova.
 *
 * O modelo atual de disciplinas não possui um campo de etapa/ano. Por isso,
 * as regras de cada etapa ficam registradas na descrição, mantendo a lista
 * pronta para uso sem criar nomes duplicados para a mesma disciplina.
 */
export const BASE_SUBJECT_CATALOG: BaseSubjectDefinition[] = [
  {
    name: 'Linguagens',
    code: 'LING',
    description: 'Ensino Fundamental I — área de Linguagens.',
  },
  {
    name: 'Matemática',
    code: 'MAT',
    description: 'Ensino Fundamental I, Ensino Fundamental II e Ensino Médio — obrigatória nos 3 anos do Ensino Médio.',
  },
  {
    name: 'Ciências da Natureza',
    code: 'CNA',
    description: 'Ensino Fundamental I — área de Ciências da Natureza.',
  },
  {
    name: 'Ciências Humanas',
    code: 'CH',
    description: 'Ensino Fundamental I — área de Ciências Humanas.',
  },
  {
    name: 'Ensino Religioso',
    code: 'ER',
    description: 'Ensino Fundamental I e Ensino Fundamental II.',
  },
  {
    name: 'Língua Portuguesa',
    code: 'LP',
    description: 'Ensino Fundamental II e Ensino Médio — obrigatória nos 3 anos do Ensino Médio.',
  },
  {
    name: 'Arte',
    code: 'ART',
    description: 'Ensino Fundamental II e Ensino Médio — área de Linguagens e suas Tecnologias.',
  },
  {
    name: 'Educação Física',
    code: 'EDF',
    description: 'Ensino Fundamental II e Ensino Médio — área de Linguagens e suas Tecnologias.',
  },
  {
    name: 'Língua Inglesa',
    code: 'ING',
    description: 'Ensino Fundamental II — obrigatória a partir do 6º ano; Ensino Médio — obrigatória.',
  },
  {
    name: 'Ciências',
    code: 'CIE',
    description: 'Ensino Fundamental II.',
  },
  {
    name: 'Geografia',
    code: 'GEO',
    description: 'Ensino Fundamental II e área de Ciências Humanas e Sociais Aplicadas no Ensino Médio.',
  },
  {
    name: 'História',
    code: 'HIS',
    description: 'Ensino Fundamental II e área de Ciências Humanas e Sociais Aplicadas no Ensino Médio.',
  },
  {
    name: 'Biologia',
    code: 'BIO',
    description: 'Ensino Médio — área de Ciências da Natureza e suas Tecnologias.',
  },
  {
    name: 'Física',
    code: 'FIS',
    description: 'Ensino Médio — área de Ciências da Natureza e suas Tecnologias.',
  },
  {
    name: 'Química',
    code: 'QUI',
    description: 'Ensino Médio — área de Ciências da Natureza e suas Tecnologias.',
  },
  {
    name: 'Sociologia',
    code: 'SOC',
    description: 'Ensino Médio — estudo e prática obrigatórios na área de Ciências Humanas e Sociais Aplicadas.',
  },
  {
    name: 'Filosofia',
    code: 'FIL',
    description: 'Ensino Médio — estudo e prática obrigatórios na área de Ciências Humanas e Sociais Aplicadas.',
  },
];
