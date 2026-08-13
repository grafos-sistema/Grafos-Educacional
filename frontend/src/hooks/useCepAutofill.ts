'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type FieldValues, type Path, type PathValue, type UseFormReturn } from 'react-hook-form';
import { lookupCep, normalizeCep } from '@/lib/address-utils';

type CepAutofillFieldMap<TFieldValues extends FieldValues> = {
  zipCode: Path<TFieldValues>;
  address: Path<TFieldValues>;
  city: Path<TFieldValues>;
  state: Path<TFieldValues>;
  bairro?: Path<TFieldValues>;
  complemento?: Path<TFieldValues>;
};

type CepAutofillOptions<TFieldValues extends FieldValues> = {
  form: UseFormReturn<TFieldValues>;
  fields: CepAutofillFieldMap<TFieldValues>;
};

export function useCepAutofill<TFieldValues extends FieldValues>({
  form,
  fields,
}: CepAutofillOptions<TFieldValues>) {
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const lastFetchedCepRef = useRef<string>('');
  const inflightCepRef = useRef<string>('');

  const zipCodeValue = form.watch(fields.zipCode) as string | undefined;
  const normalizedCep = useMemo(() => normalizeCep(zipCodeValue), [zipCodeValue]);

  const fillAddressFromCep = useCallback(async () => {
    if (normalizedCep.length !== 8 || lastFetchedCepRef.current === normalizedCep) {
      return;
    }

    if (inflightCepRef.current === normalizedCep) return;
    inflightCepRef.current = normalizedCep;

    setIsLoadingCep(true);

    try {
      const result = await lookupCep(normalizedCep);
      lastFetchedCepRef.current = normalizedCep;

      if (!result) {
        return;
      }

      const applyIfEmpty = <TPath extends Path<TFieldValues>>(fieldName: TPath, value: string) => {
        const currentValue = form.getValues(fieldName);
        if (!currentValue && value) {
          form.setValue(fieldName, value as PathValue<TFieldValues, TPath>, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          });
        }
      };

      form.setValue(fields.zipCode, result.zipCode as PathValue<TFieldValues, typeof fields.zipCode>, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });

      applyIfEmpty(fields.address, result.address);
      applyIfEmpty(fields.city, result.city);
      applyIfEmpty(fields.state, result.state);

      if (fields.bairro) {
        applyIfEmpty(fields.bairro, result.bairro);
      }

      if (fields.complemento) {
        applyIfEmpty(fields.complemento, result.complemento);
      }
    } finally {
      inflightCepRef.current = '';
      setIsLoadingCep(false);
    }
  }, [fields, form, normalizedCep]);

  useEffect(() => {
    if (normalizedCep.length === 8 && lastFetchedCepRef.current !== normalizedCep) {
      fillAddressFromCep();
    }
  }, [fillAddressFromCep, normalizedCep]);

  return {
    isLoadingCep,
    normalizedCep,
    fillAddressFromCep,
  };
}
