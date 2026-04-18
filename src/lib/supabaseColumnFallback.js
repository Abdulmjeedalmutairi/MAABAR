function parseMissingColumn(error, table) {
  const message = error?.message || '';
  const patterns = [
    new RegExp(`column ${table}\\.([a-zA-Z0-9_]+) does not exist`, 'i'),
    new RegExp(`Could not find the '([^']+)' column of '${table}'`, 'i'),
    // PostgREST v14+ PGRST204 schema-cache miss format
    new RegExp(`Column '([^']+)' of relation '${table}' is not present in the schema cache`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

export async function runWithOptionalColumns({
  table,
  payload,
  optionalKeys = [],
  execute,
}) {
  const nextPayload = { ...payload };
  const strippedColumns = [];

  while (true) {
    const result = await execute(nextPayload);
    const missingColumn = parseMissingColumn(result?.error, table);

    if (!result?.error || !missingColumn || !optionalKeys.includes(missingColumn) || !(missingColumn in nextPayload)) {
      return { ...result, payload: nextPayload, strippedColumns };
    }

    delete nextPayload[missingColumn];
    strippedColumns.push(missingColumn);
  }
}
