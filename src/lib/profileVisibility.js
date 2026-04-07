import { getSupplierPublicVisibilityStatuses } from './supplierOnboarding';

const SUPPLIER_PUBLIC_PROFILE_BASE_COLUMN_LIST = [
  'id',
  'company_name',
  'avatar_url',
  'status',
  'rating',
  'reviews_count',
  'city',
  'country',
  'trade_link',
  'wechat',
  'whatsapp',
  'factory_images',
  'years_experience',
  'maabar_supplier_id',
  'min_order_value',
  'speciality',
  'company_website',
  'company_description',
  'bio_ar',
  'bio_en',
  'bio_zh',
  'business_type',
  'year_established',
  'customization_support',
  'company_address',
  'languages',
  'export_markets',
  'export_years',
  'completion_rate',
  'product_count',
];

const SUPPLIER_PUBLIC_PROFILE_OPTIONAL_COLUMN_LIST = [
  'deals_completed',
];

const SUPPLIER_PUBLIC_PROFILE_COLUMNS = [
  ...SUPPLIER_PUBLIC_PROFILE_BASE_COLUMN_LIST,
  ...SUPPLIER_PUBLIC_PROFILE_OPTIONAL_COLUMN_LIST,
].join(',');

const SUPPLIER_PUBLIC_PROFILE_COMPAT_COLUMNS = SUPPLIER_PUBLIC_PROFILE_BASE_COLUMN_LIST.join(',');

const SUPPLIER_PROFILE_FALLBACK_COLUMNS = [
  'id',
  'company_name',
  'avatar_url',
  'status',
  'rating',
  'reviews_count',
  'city',
  'country',
  'trade_link',
  'wechat',
  'whatsapp',
  'factory_images',
  'years_experience',
  'maabar_supplier_id',
  'min_order_value',
  'speciality',
  'company_website',
  'company_description',
  'bio_ar',
  'bio_en',
  'bio_zh',
  'business_type',
  'year_established',
  'customization_support',
  'company_address',
  'languages',
  'export_markets',
  'export_years',
  'deals_completed',
  'completion_rate',
].join(',');

const PROFILE_DIRECTORY_COLUMNS = [
  'id',
  'role',
  'status',
  'full_name',
  'company_name',
  'avatar_url',
  'city',
  'country',
].join(',');

function uniqueIds(ids = []) {
  return [...new Set((Array.isArray(ids) ? ids : []).filter(Boolean))];
}

function mapRowsById(rows = []) {
  return (rows || []).reduce((acc, row) => {
    if (row?.id) acc[row.id] = row;
    return acc;
  }, {});
}

function applyFilters(query, filters = []) {
  return (filters || []).reduce((nextQuery, filter) => {
    const { column, operator = 'eq', value } = filter || {};
    if (!column) return nextQuery;
    if (operator === 'eq') return nextQuery.eq(column, value);
    if (operator === 'neq') return nextQuery.neq(column, value);
    if (operator === 'in') return nextQuery.in(column, value);
    return nextQuery;
  }, query);
}

function isRelationMissingError(error) {
  return /relation .* does not exist|Could not find the table/i.test(error?.message || '');
}

function isMissingColumnError(error) {
  return /column .* does not exist|Could not find the '.*' column/i.test(error?.message || '');
}

function normalizeSupplierPublicProfiles(rows = []) {
  return (rows || []).map((row) => ({
    ...row,
    deals_completed: row?.deals_completed ?? null,
    product_count: row?.product_count ?? null,
  }));
}

async function fetchRowsByIds({
  sb,
  source,
  sourceColumns,
  ids,
  sourceFilters = [],
  compatibilitySourceColumns = null,
  fallbackSource = null,
  fallbackColumns = sourceColumns,
  fallbackFilters = sourceFilters,
  normalizeRows = null,
}) {
  const unique = uniqueIds(ids);
  if (!sb || unique.length === 0) return [];

  let query = applyFilters(
    sb.from(source).select(sourceColumns).in('id', unique),
    sourceFilters,
  );

  const { data, error } = await query;
  if (!error) {
    return normalizeRows ? normalizeRows(data || []) : (data || []);
  }

  if (isMissingColumnError(error) && compatibilitySourceColumns && compatibilitySourceColumns !== sourceColumns) {
    let compatibilityQuery = applyFilters(
      sb.from(source).select(compatibilitySourceColumns).in('id', unique),
      sourceFilters,
    );
    const { data: compatibilityData, error: compatibilityError } = await compatibilityQuery;
    if (!compatibilityError) {
      return normalizeRows ? normalizeRows(compatibilityData || []) : (compatibilityData || []);
    }
  }

  if (!isRelationMissingError(error) || !fallbackSource) return [];

  let fallbackQuery = applyFilters(
    sb.from(fallbackSource).select(fallbackColumns).in('id', unique),
    fallbackFilters,
  );

  const { data: fallbackData } = await fallbackQuery;
  return normalizeRows ? normalizeRows(fallbackData || []) : (fallbackData || []);
}

export async function fetchSupplierPublicProfilesByIds(sb, ids = []) {
  return fetchRowsByIds({
    sb,
    source: 'supplier_public_profiles',
    sourceColumns: SUPPLIER_PUBLIC_PROFILE_COLUMNS,
    ids,
    compatibilitySourceColumns: SUPPLIER_PUBLIC_PROFILE_COMPAT_COLUMNS,
    fallbackSource: 'profiles',
    fallbackColumns: SUPPLIER_PROFILE_FALLBACK_COLUMNS,
    fallbackFilters: [
      { column: 'role', operator: 'eq', value: 'supplier' },
      { column: 'status', operator: 'in', value: getSupplierPublicVisibilityStatuses() },
    ],
    normalizeRows: normalizeSupplierPublicProfiles,
  });
}

export async function fetchSupplierPublicProfileById(sb, id) {
  const rows = await fetchSupplierPublicProfilesByIds(sb, [id]);
  return rows[0] || null;
}

export async function fetchProfileDirectoryByIds(sb, ids = []) {
  return fetchRowsByIds({
    sb,
    source: 'profile_directory',
    sourceColumns: PROFILE_DIRECTORY_COLUMNS,
    ids,
    fallbackSource: 'profiles',
  });
}

export async function attachSupplierProfiles(sb, rows = [], foreignKey = 'supplier_id', targetKey = 'profiles') {
  const suppliers = await fetchSupplierPublicProfilesByIds(sb, rows.map((row) => row?.[foreignKey]));
  const supplierMap = mapRowsById(suppliers);
  return (rows || []).map((row) => ({
    ...row,
    [targetKey]: supplierMap[row?.[foreignKey]] || row?.[targetKey] || null,
  }));
}

export async function attachDirectoryProfiles(sb, rows = [], foreignKey = 'sender_id', targetKey = 'profiles') {
  const profiles = await fetchProfileDirectoryByIds(sb, rows.map((row) => row?.[foreignKey]));
  const profileMap = mapRowsById(profiles);
  return (rows || []).map((row) => ({
    ...row,
    [targetKey]: profileMap[row?.[foreignKey]] || row?.[targetKey] || null,
  }));
}

export {
  PROFILE_DIRECTORY_COLUMNS,
  SUPPLIER_PROFILE_FALLBACK_COLUMNS,
  SUPPLIER_PUBLIC_PROFILE_COLUMNS,
  SUPPLIER_PUBLIC_PROFILE_COMPAT_COLUMNS,
};
