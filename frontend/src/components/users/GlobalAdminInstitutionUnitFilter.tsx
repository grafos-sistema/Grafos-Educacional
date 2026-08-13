'use client';

import { useEffect, useMemo, useState } from 'react';
import { institutionsService, type PublicInstitution } from '@/services/institutions.service';
import { Select } from '@/components/ui/Select';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types/user.types';
import type { InstitutionUnit } from '@/types/institution.types';

type GlobalAdminInstitutionUnitFilterProps = {
  className?: string;
};

export function GlobalAdminInstitutionUnitFilter({
  className = '',
}: GlobalAdminInstitutionUnitFilterProps) {
  const {
    user,
    institutionFilterAll,
    institutionFilterIds,
    institutionUnitFilterId,
    setInstitutionFilterAll,
    setInstitutionFilterIds,
    setInstitutionUnitFilterId,
  } = useAuthStore();

  const viewerRole = user?.activeProfile ?? user?.role;
  const isGlobalAdmin = viewerRole === UserRole.SUPER_ADMIN_GLOBAL;

  const [institutions, setInstitutions] = useState<PublicInstitution[]>([]);
  const [units, setUnits] = useState<InstitutionUnit[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);

  const selectedInstitutionId = useMemo(() => {
    if (institutionFilterAll) return '';
    if (institutionFilterIds.length === 0) return '';
    return institutionFilterIds[0];
  }, [institutionFilterAll, institutionFilterIds]);

  useEffect(() => {
    if (!isGlobalAdmin) return;
    let cancelled = false;

    institutionsService
      .getPublicInstitutions()
      .then((data) => {
        if (cancelled) return;
        setInstitutions(data);
      })
      .catch(() => {
        if (cancelled) return;
        setInstitutions([]);
      });

    return () => {
      cancelled = true;
    };
  }, [isGlobalAdmin]);

  useEffect(() => {
    if (!isGlobalAdmin) return;
    if (!selectedInstitutionId) {
      setUnits([]);
      setInstitutionUnitFilterId(null);
      return;
    }

    let cancelled = false;
    setIsLoadingUnits(true);

    institutionsService
      .findOne(selectedInstitutionId)
      .then((institution) => {
        if (cancelled) return;
        const activeUnits = (institution.units ?? []).filter((unit) => unit.isActive);
        setUnits(activeUnits);
      })
      .catch(() => {
        if (cancelled) return;
        setUnits([]);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingUnits(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isGlobalAdmin, selectedInstitutionId, setInstitutionUnitFilterId]);

  if (!isGlobalAdmin) {
    return null;
  }

  const institutionOptions = [
    { value: '', label: 'Todas as instituições' },
    ...institutions.map((institution) => ({
      value: institution.id,
      label: institution.name,
    })),
  ];

  const unitOptions = [
    { value: '', label: 'Todos os anexos' },
    ...units.map((unit) => ({
      value: unit.id,
      label: unit.name,
    })),
  ];

  return (
    <div className={`grid w-full grid-cols-1 gap-3 sm:grid-cols-2 ${className}`}>
      <Select
        label="Instituição"
        options={institutionOptions}
        value={selectedInstitutionId}
        onChange={(event) => {
          const nextId = event.target.value;

          if (!nextId) {
            setInstitutionFilterAll(true);
            setInstitutionFilterIds([]);
            setInstitutionUnitFilterId(null);
            return;
          }

          setInstitutionFilterAll(false);
          setInstitutionFilterIds([nextId]);
        }}
      />
      <Select
        label="Anexo"
        options={unitOptions}
        value={institutionUnitFilterId ?? ''}
        disabled={!selectedInstitutionId || isLoadingUnits}
        onChange={(event) => {
          const unitId = event.target.value;
          setInstitutionUnitFilterId(unitId ? unitId : null);
        }}
      />
    </div>
  );
}

