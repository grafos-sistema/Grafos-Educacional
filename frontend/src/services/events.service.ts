import api from '@/lib/api';
import { getValidInstitutionIds } from '@/lib/institution-filter';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import {
  Event,
  CreateEventDto,
  UpdateEventDto,
  EventFilters,
} from '@/types/communication.types';
import { PaginatedResponse } from '@/types/common.types';
import { UserRole } from '@/types/user.types';

type AcademicYearRow = {
  id: string;
  name: string;
  institutionId: string;
};

type EventRow = Omit<Event, 'academicYear'>;

async function findUpcomingEventsForGlobalAdmins(days: number): Promise<Event[]> {
  const { institutionFilterAll, institutionFilterIds, user } = useAuthStore.getState();
  const currentRole = user?.activeProfile || user?.role;

  if (currentRole !== UserRole.SUPER_ADMIN_GLOBAL) {
    throw new Error('Fallback exclusivo para SUPER_ADMIN_GLOBAL.');
  }

  const effectiveIds = institutionFilterAll ? [] : getValidInstitutionIds(institutionFilterIds);
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  let academicYearsQuery = supabase
    .from('academic_years')
    .select('id, name, institutionId');

  if (effectiveIds.length > 0) {
    academicYearsQuery = academicYearsQuery.in('institutionId', effectiveIds);
  }

  const { data: academicYears, error: academicYearsError } = await academicYearsQuery;

  if (academicYearsError) throw academicYearsError;

  const academicYearRows = (academicYears ?? []) as AcademicYearRow[];
  const academicYearIds = academicYearRows.map((academicYear) => academicYear.id);

  if (academicYearIds.length === 0) {
    return [];
  }

  const { data: institutions, error: institutionsError } = await supabase
    .from('institutions')
    .select('id, name')
    .in(
      'id',
      Array.from(new Set(academicYearRows.map((academicYear) => academicYear.institutionId)))
    );

  if (institutionsError) throw institutionsError;

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, title, description, type, startDate, endDate, location, isAllDay, color, academicYearId, createdAt, updatedAt')
    .in('academicYearId', academicYearIds)
    .gte('startDate', now.toISOString())
    .lte('startDate', futureDate.toISOString())
    .order('startDate', { ascending: true });

  if (eventsError) throw eventsError;

  const institutionsById = new Map(
    (institutions ?? []).map((institution) => [institution.id as string, institution as { id: string; name: string }])
  );
  const academicYearsById = new Map(academicYearRows.map((academicYear) => [academicYear.id, academicYear]));

  return ((events ?? []) as EventRow[]).map((event) => {
    const academicYear = academicYearsById.get(event.academicYearId);

    return {
      ...event,
      academicYear: academicYear
        ? {
            id: academicYear.id,
            name: academicYear.name,
            institution: institutionsById.get(academicYear.institutionId),
          }
        : undefined,
    };
  });
}

export const eventsService = {
  /**
   * Listar eventos com filtros
   */
  async findAll(filters: EventFilters = {}): Promise<PaginatedResponse<Event>> {
    const params = new URLSearchParams();

    if (filters.type) params.append('type', filters.type);
    if (filters.classId) params.append('classId', filters.classId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const { institutionFilterAll, institutionFilterIds } = useAuthStore.getState();
    const effectiveIds = institutionFilterAll ? [] : getValidInstitutionIds(institutionFilterIds);

    if (effectiveIds.length > 1) {
      params.append('institutionIds', effectiveIds.join(','));
    } else if (effectiveIds.length === 1) {
      params.append('institutionId', effectiveIds[0]);
    }

    const response = await api.get<PaginatedResponse<Event>>(`/events?${params.toString()}`);
    return response as unknown as PaginatedResponse<Event>;
  },

  /**
   * Buscar evento por ID
   */
  async findOne(id: string): Promise<Event> {
    const response = await api.get<Event>(`/events/${id}`);
    return response as unknown as Event;
  },

  /**
   * Criar novo evento
   */
  async create(data: CreateEventDto): Promise<Event> {
    const response = await api.post<Event>('/events', data);
    return response as unknown as Event;
  },

  /**
   * Atualizar evento
   */
  async update(id: string, data: UpdateEventDto): Promise<Event> {
    const response = await api.patch<Event>(`/events/${id}`, data);
    return response as unknown as Event;
  },

  /**
   * Remover evento
   */
  async remove(id: string): Promise<void> {
    await api.delete(`/events/${id}`);
  },

  /**
   * Buscar eventos próximos
   */
  async findUpcoming(days: number = 30): Promise<Event[]> {
    const currentUser = useAuthStore.getState().user;
    const currentRole = currentUser?.activeProfile || currentUser?.role;

    if (currentRole === UserRole.SUPER_ADMIN_GLOBAL) {
      return findUpcomingEventsForGlobalAdmins(days);
    }

    const params = new URLSearchParams();
    params.append('days', String(days));

    const { institutionFilterAll, institutionFilterIds } = useAuthStore.getState();
    const effectiveIds = institutionFilterAll ? [] : getValidInstitutionIds(institutionFilterIds);

    if (effectiveIds.length > 1) {
      params.append('institutionIds', effectiveIds.join(','));
    } else if (effectiveIds.length === 1) {
      params.append('institutionId', effectiveIds[0]);
    }

    const response = await api.get<Event[]>(`/events/upcoming?${params.toString()}`);
    return response as unknown as Event[];
  },

  /**
   * Buscar eventos de uma turma
   */
  async findByClass(classId: string): Promise<Event[]> {
    const response = await api.get<Event[]>(`/events/class/${classId}`);
    return response as unknown as Event[];
  },

  /**
   * Buscar eventos do calendário (por mês)
   */
  async findByMonth(year: number, month: number): Promise<Event[]> {
    const params = new URLSearchParams();

    const { institutionFilterAll, institutionFilterIds } = useAuthStore.getState();
    const effectiveIds = institutionFilterAll ? [] : getValidInstitutionIds(institutionFilterIds);

    if (effectiveIds.length > 1) {
      params.append('institutionIds', effectiveIds.join(','));
    } else if (effectiveIds.length === 1) {
      params.append('institutionId', effectiveIds[0]);
    }

    const queryString = params.toString();
    const response = await api.get<Event[]>(
      queryString ? `/events/calendar/${year}/${month}?${queryString}` : `/events/calendar/${year}/${month}`
    );
    return response as unknown as Event[];
  },
};
