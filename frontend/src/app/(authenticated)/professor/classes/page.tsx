import { redirect } from 'next/navigation';

/**
 * Compatibilidade para prefetched links antigos que apontavam para
 * /professor/classes. Os detalhes ficam em /professor/classes/[id].
 */
export default function ProfessorClassesIndexPage() {
  redirect('/professor/my-classes');
}
