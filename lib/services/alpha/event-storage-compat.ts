export interface EventStorageCapabilities {
  canonicalStorageReady: boolean;
  canonicalStorageReason: string | null;
  legacyScheduleHasDedupeKey: boolean;
  legacyScheduleHasConfidence: boolean;
  legacyScheduleHasSourcePublishedAt: boolean;
}

export interface EventStorageCatalogSnapshot {
  tableNames: Iterable<string>;
  legacyScheduleColumns: Iterable<string>;
  delegateErrorMessage?: string | null;
}

export interface LegacyScheduleRecordWriter {
  findFirst(args: unknown): Promise<{ id: string } | null>;
  upsert(args: unknown): Promise<unknown>;
  create(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
}

export interface LegacyScheduleWriteArgs {
  dedupeKey: string;
  token: string;
  scheduledTime: Date;
  createData: Record<string, unknown>;
  updateData: Record<string, unknown>;
}

const REQUIRED_CANONICAL_TABLES = [
  "airdrop_events",
  "event_raw_sources",
  "source_health",
] as const;

function stripUnsupportedLegacyScheduleFields(
  data: Record<string, unknown>,
  capabilities: EventStorageCapabilities,
): Record<string, unknown> {
  const nextData = { ...data };

  if (!capabilities.legacyScheduleHasDedupeKey) {
    delete nextData.dedupeKey;
  }

  if (!capabilities.legacyScheduleHasConfidence) {
    delete nextData.confidence;
  }

  if (!capabilities.legacyScheduleHasSourcePublishedAt) {
    delete nextData.sourcePublishedAt;
  }

  return nextData;
}

export function buildEventStorageCapabilitiesFromCatalog(
  snapshot: EventStorageCatalogSnapshot,
): EventStorageCapabilities {
  const tableNames = new Set(snapshot.tableNames);
  const legacyScheduleColumns = new Set(snapshot.legacyScheduleColumns);
  const missingCanonicalTables = REQUIRED_CANONICAL_TABLES.filter(
    (tableName) => !tableNames.has(tableName),
  );
  const canonicalStorageReason = snapshot.delegateErrorMessage
    ? snapshot.delegateErrorMessage
    : missingCanonicalTables.length > 0
      ? `Canonical event storage is not ready because the connected database is missing: ${missingCanonicalTables.join(
          ", ",
        )}. Run "npm run db:generate" and apply the Prisma schema changes with "npm run db:push" or your migration workflow.`
      : null;

  return {
    canonicalStorageReady: canonicalStorageReason === null,
    canonicalStorageReason,
    legacyScheduleHasDedupeKey: legacyScheduleColumns.has("dedupeKey"),
    legacyScheduleHasConfidence: legacyScheduleColumns.has("confidence"),
    legacyScheduleHasSourcePublishedAt: legacyScheduleColumns.has("sourcePublishedAt"),
  };
}

export async function writeLegacyScheduleRecord(
  writer: LegacyScheduleRecordWriter,
  args: LegacyScheduleWriteArgs,
  capabilities: EventStorageCapabilities,
): Promise<{ created: boolean }> {
  const createData = stripUnsupportedLegacyScheduleFields(
    args.createData,
    capabilities,
  );
  const updateData = stripUnsupportedLegacyScheduleFields(
    args.updateData,
    capabilities,
  );

  if (capabilities.legacyScheduleHasDedupeKey) {
    const existing = await writer.findFirst({
      where: { dedupeKey: args.dedupeKey },
      select: { id: true },
    });

    await writer.upsert({
      where: { dedupeKey: args.dedupeKey },
      create: createData,
      update: updateData,
      select: { id: true },
    });

    return { created: !existing };
  }

  const existing = await writer.findFirst({
    where: {
      token: args.token,
      scheduledTime: args.scheduledTime,
    },
    select: { id: true },
  });

  if (existing?.id) {
    await writer.update({
      where: { id: existing.id },
      data: updateData,
      select: { id: true },
    });
    return { created: false };
  }

  await writer.create({
    data: createData,
    select: { id: true },
  });

  return { created: true };
}
