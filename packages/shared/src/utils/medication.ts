import type { MedicationRecord } from '../types/animal';

export type MedicationFieldErrors = {
  name?: string;
  dose?: string;
  frequency?: string;
  period?: string;
};

export function createEmptyMedicationRecord(): MedicationRecord {
  return {
    name: '',
    dose: '',
    frequency: '',
    continuousUse: false,
    period: '',
  };
}

export function isMedicationRecordEmpty(record: MedicationRecord): boolean {
  return (
    !record.name.trim() &&
    !record.dose.trim() &&
    !record.frequency.trim() &&
    !(record.period?.trim() ?? '')
  );
}

export function validateMedicationRecord(
  record: MedicationRecord,
  requireNonEmpty = false,
): MedicationFieldErrors {
  if (!requireNonEmpty && isMedicationRecordEmpty(record)) {
    return {};
  }

  const errors: MedicationFieldErrors = {};
  if (!record.name.trim()) {
    errors.name = 'Informe o nome do medicamento.';
  }
  if (!record.dose.trim()) {
    errors.dose = 'Informe a dose.';
  }
  if (!record.frequency.trim()) {
    errors.frequency = 'Informe a frequência.';
  }
  if (!record.continuousUse && !record.period?.trim()) {
    errors.period = 'Informe o período de uso ou marque uso contínuo.';
  }
  return errors;
}

export function getMedicationValidationSummary(
  records: readonly MedicationRecord[],
): string[] {
  const issues: string[] = [];
  records.forEach((record, index) => {
    if (isMedicationRecordEmpty(record)) {
      return;
    }
    const prefix = `medicamento ${index + 1}`;
    const errors = validateMedicationRecord(record, true);
    if (errors.name) issues.push(`nome do ${prefix}`);
    if (errors.dose) issues.push(`dose do ${prefix}`);
    if (errors.frequency) issues.push(`frequência do ${prefix}`);
    if (errors.period) issues.push(`período de uso do ${prefix}`);
  });
  return issues;
}

export function parseMedicationRecords(
  raw: string | null | undefined,
): { medications: MedicationRecord[]; legacyNote: string | null } {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed) {
    return { medications: [], legacyNote: null };
  }

  if (trimmed.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const medications: MedicationRecord[] = [];
        for (const item of parsed) {
          if (item && typeof item === 'object') {
            const candidate = item as Record<string, unknown>;
            const name =
              typeof candidate.name === 'string' ? candidate.name.trim() : '';
            const dose =
              typeof candidate.dose === 'string' ? candidate.dose.trim() : '';
            const frequency =
              typeof candidate.frequency === 'string'
                ? candidate.frequency.trim()
                : '';
            const continuousUse = Boolean(candidate.continuousUse);
            const period =
              typeof candidate.period === 'string' && candidate.period.trim()
                ? candidate.period.trim()
                : undefined;

            if (name || dose || frequency || period) {
              medications.push({
                name,
                dose,
                frequency,
                continuousUse,
                ...(continuousUse ? {} : { period: period ?? '' }),
              });
            }
          }
        }
        return { medications, legacyNote: null };
      }
    } catch {
      // Fall back to legacy note
    }
  }

  return {
    medications: [
      {
        name: trimmed,
        dose: '',
        frequency: '',
        continuousUse: true,
      },
    ],
    legacyNote: trimmed,
  };
}

export function serializeMedicationRecords(
  records: readonly MedicationRecord[],
): string {
  const cleaned: MedicationRecord[] = [];
  for (const record of records) {
    if (isMedicationRecordEmpty(record)) {
      continue;
    }
    const continuousUse = Boolean(record.continuousUse);
    const period = continuousUse ? undefined : record.period?.trim() || undefined;
    cleaned.push({
      name: record.name.trim(),
      dose: record.dose.trim(),
      frequency: record.frequency.trim(),
      continuousUse,
      ...(period ? { period } : {}),
    });
  }

  if (cleaned.length === 0) {
    return '';
  }

  return JSON.stringify(cleaned);
}
