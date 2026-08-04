import { usersService } from '@/services/users.service';
import type { InstitutionUnit } from '@/types/institution.types';
import { UserRole } from '@/types/user.types';

export type InstitutionUnitDirectorDraft = {
  id?: string;
  managerName?: string;
  directorUserId?: string;
  directorMode?: 'none' | 'create' | 'link';
  directorFirstName?: string;
  directorLastName?: string;
  directorCpf?: string;
  directorEmail?: string;
  directorPhone?: string;
};

function trimToUndefined(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function sanitizeDigits(value?: string) {
  const digits = value?.replace(/\D/g, '');
  return digits ? digits : undefined;
}

function buildDirectorName(firstName?: string, lastName?: string) {
  return [trimToUndefined(firstName), trimToUndefined(lastName)].filter(Boolean).join(' ');
}

export async function resolveInstitutionUnitDirectors(
  institutionId: string,
  persistedUnits: InstitutionUnit[],
  drafts: InstitutionUnitDirectorDraft[]
) {
  const persistedById = new Map(persistedUnits.map((unit) => [unit.id, unit]));

  return Promise.all(
    drafts.map(async (draft, index) => {
      const persistedUnit = (draft.id ? persistedById.get(draft.id) : undefined) ?? persistedUnits[index];

      if (!persistedUnit) {
        throw new Error('Não foi possível localizar o anexo salvo para vincular o diretor.');
      }

      if (draft.directorMode === 'create') {
        const firstName = trimToUndefined(draft.directorFirstName);
        const lastName = trimToUndefined(draft.directorLastName);
        const email = trimToUndefined(draft.directorEmail);

        if (!firstName || !lastName || !email) {
          throw new Error(
            `Preencha nome, sobrenome e email do diretor no anexo "${persistedUnit.name}".`
          );
        }

        const createdDirector = await usersService.create({
          email,
          role: UserRole.DIRECTOR,
          firstName,
          lastName,
          cpf: sanitizeDigits(draft.directorCpf),
          phone: sanitizeDigits(draft.directorPhone),
          institutionId,
          institutionIds: [institutionId],
          isActive: true,
        });

        return {
          ...persistedUnit,
          managerName: buildDirectorName(firstName, lastName),
          directorUserId: createdDirector.id,
        };
      }

      if (draft.directorMode === 'link') {
        const directorUserId = trimToUndefined(draft.directorUserId);

        if (!directorUserId) {
          throw new Error(`Selecione um diretor válido para o anexo "${persistedUnit.name}".`);
        }

        return {
          ...persistedUnit,
          managerName: trimToUndefined(draft.managerName),
          directorUserId,
        };
      }

      return {
        ...persistedUnit,
        managerName: undefined,
        directorUserId: undefined,
      };
    })
  );
}
