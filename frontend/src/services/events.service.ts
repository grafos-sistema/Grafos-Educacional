import api from "@/lib/api";
import { getValidInstitutionIds } from "@/lib/institution-filter";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import {
  Event,
  CreateEventDto,
  UpdateEventDto,
  EventFilters,
  EventAttachment,
} from "@/types/communication.types";
import { PaginatedResponse } from "@/types/common.types";
import { UserRole } from "@/types/user.types";

type AcademicYearRow = {
  id: string;
  name: string;
  institutionId: string;
};

type EventRow = Omit<Event, "academicYear">;

const EVENT_ATTACHMENT_BUCKET = "event-attachments";
const MAX_EVENT_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const ALLOWED_EVENT_ATTACHMENT_TYPES = new Set(["application/pdf"]);

function safeFileName(name: string) {
  return (
    name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120) || "anexo"
  );
}

async function withSignedAttachmentUrls(events: Event[]) {
  return Promise.all(
    events.map(async (event) => {
      const attachments = event.attachments ?? [];
      if (attachments.length === 0) return event;

      const signedAttachments = await Promise.all(
        attachments.map(async (attachment) => {
          const { data, error } = await supabase.storage
            .from(EVENT_ATTACHMENT_BUCKET)
            .createSignedUrl(attachment.path, 60 * 60);

          return {
            ...attachment,
            signedUrl: error ? undefined : data?.signedUrl,
          };
        }),
      );

      return { ...event, attachments: signedAttachments };
    }),
  );
}

async function findEventsForGlobalAdmins(
  startDate: Date,
  endDate: Date,
): Promise<Event[]> {
  const { institutionFilterAll, institutionFilterIds, user } =
    useAuthStore.getState();
  const currentRole = user?.activeProfile || user?.role;

  if (currentRole !== UserRole.SUPER_ADMIN_GLOBAL) {
    throw new Error("Fallback exclusivo para SUPER_ADMIN_GLOBAL.");
  }

  const effectiveIds = institutionFilterAll
    ? []
    : getValidInstitutionIds(institutionFilterIds);

  let academicYearsQuery = supabase
    .from("academic_years")
    .select("id, name, institutionId");

  if (effectiveIds.length > 0) {
    academicYearsQuery = academicYearsQuery.in("institutionId", effectiveIds);
  }

  const { data: academicYears, error: academicYearsError } =
    await academicYearsQuery;

  if (academicYearsError) throw academicYearsError;

  const academicYearRows = (academicYears ?? []) as AcademicYearRow[];
  const academicYearIds = academicYearRows.map(
    (academicYear) => academicYear.id,
  );

  if (academicYearIds.length === 0) {
    return [];
  }

  const { data: institutions, error: institutionsError } = await supabase
    .from("institutions")
    .select("id, name")
    .in(
      "id",
      Array.from(
        new Set(
          academicYearRows.map((academicYear) => academicYear.institutionId),
        ),
      ),
    );

  if (institutionsError) throw institutionsError;

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select(
      "id, title, description, type, startDate, endDate, location, locationType, isAllDay, color, isGeneral, audienceRoles, courseIds, classIds, requiresRsvp, attachments, academicYearId, createdAt, updatedAt",
    )
    .in("academicYearId", academicYearIds)
    .gte("startDate", startDate.toISOString())
    .lte("startDate", endDate.toISOString())
    .order("startDate", { ascending: true });

  if (eventsError) throw eventsError;

  const institutionsById = new Map(
    (institutions ?? []).map((institution) => [
      institution.id as string,
      institution as { id: string; name: string },
    ]),
  );
  const academicYearsById = new Map(
    academicYearRows.map((academicYear) => [academicYear.id, academicYear]),
  );

  const mappedEvents = ((events ?? []) as EventRow[]).map((event) => {
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

  return withSignedAttachmentUrls(mappedEvents);
}

async function findUpcomingEventsForGlobalAdmins(
  days: number,
): Promise<Event[]> {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return findEventsForGlobalAdmins(now, futureDate);
}

export const eventsService = {
  /**
   * Listar eventos com filtros
   */
  async findAll(filters: EventFilters = {}): Promise<PaginatedResponse<Event>> {
    const params = new URLSearchParams();

    if (filters.type) params.append("type", filters.type);
    if (filters.fromDate) params.append("fromDate", filters.fromDate);
    if (filters.toDate) params.append("toDate", filters.toDate);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const { institutionFilterAll, institutionFilterIds } =
      useAuthStore.getState();
    const effectiveIds = institutionFilterAll
      ? []
      : getValidInstitutionIds(institutionFilterIds);

    if (effectiveIds.length > 1) {
      params.append("institutionIds", effectiveIds.join(","));
    } else if (effectiveIds.length === 1) {
      params.append("institutionId", effectiveIds[0]);
    }

    const response = await api.get<PaginatedResponse<Event>>(
      `/events?${params.toString()}`,
    );
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
    const response = await api.post<Event>("/events", data);
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

  async uploadAttachment(
    file: File,
    institutionId: string,
  ): Promise<EventAttachment> {
    if (!ALLOWED_EVENT_ATTACHMENT_TYPES.has(file.type)) {
      throw new Error("Anexe apenas arquivos PDF.");
    }

    if (file.size > MAX_EVENT_ATTACHMENT_SIZE) {
      throw new Error("Cada anexo pode ter no máximo 10 MB.");
    }

    const path = `${institutionId}/${crypto.randomUUID()}/${safeFileName(file.name)}`;
    const { error } = await supabase.storage
      .from(EVENT_ATTACHMENT_BUCKET)
      .upload(path, file, {
        upsert: false,
        contentType: file.type,
        cacheControl: "3600",
      });

    if (error) throw error;

    return {
      path,
      name: file.name,
      mimeType: file.type,
      size: file.size,
    };
  },

  async removeAttachment(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(EVENT_ATTACHMENT_BUCKET)
      .remove([path]);
    if (error) throw error;
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
    params.append("days", String(days));

    const { institutionFilterAll, institutionFilterIds } =
      useAuthStore.getState();
    const effectiveIds = institutionFilterAll
      ? []
      : getValidInstitutionIds(institutionFilterIds);

    if (effectiveIds.length > 1) {
      params.append("institutionIds", effectiveIds.join(","));
    } else if (effectiveIds.length === 1) {
      params.append("institutionId", effectiveIds[0]);
    }

    const response = await api.get<Event[]>(
      `/events/upcoming?${params.toString()}`,
    );
    return withSignedAttachmentUrls((response as unknown as Event[]) ?? []);
  },

  /**
   * Buscar todos os eventos de um ano para a visualização anual do calendário.
   */
  async findForYear(year: number): Promise<Event[]> {
    const currentUser = useAuthStore.getState().user;
    const currentRole = currentUser?.activeProfile || currentUser?.role;
    const start = new Date(year, 0, 1, 0, 0, 0, 0);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);

    if (currentRole === UserRole.SUPER_ADMIN_GLOBAL) {
      return findEventsForGlobalAdmins(start, end);
    }

    const response = await this.findAll({
      fromDate: start.toISOString(),
      toDate: end.toISOString(),
      page: 1,
      limit: 500,
    });

    return withSignedAttachmentUrls(response.data);
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

    const { institutionFilterAll, institutionFilterIds } =
      useAuthStore.getState();
    const effectiveIds = institutionFilterAll
      ? []
      : getValidInstitutionIds(institutionFilterIds);

    if (effectiveIds.length > 1) {
      params.append("institutionIds", effectiveIds.join(","));
    } else if (effectiveIds.length === 1) {
      params.append("institutionId", effectiveIds[0]);
    }

    const queryString = params.toString();
    const response = await api.get<Event[]>(
      queryString
        ? `/events/calendar/${year}/${month}?${queryString}`
        : `/events/calendar/${year}/${month}`,
    );
    return withSignedAttachmentUrls((response as unknown as Event[]) ?? []);
  },
};
