import {
  attachSupplierProfiles,
  fetchSupplierPublicProfilesByIds,
  SUPPLIER_PUBLIC_PROFILE_COMPAT_COLUMNS,
} from './profileVisibility';
import { getSupplierPublicVisibilityStatuses } from './supplierOnboarding';

function createMockSupabase(resolver) {
  return {
    from(table) {
      const state = { table, columns: '', filters: [] };
      const builder = {
        select(columns) {
          state.columns = columns;
          return builder;
        },
        in(column, value) {
          state.filters.push({ operator: 'in', column, value });
          return builder;
        },
        eq(column, value) {
          state.filters.push({ operator: 'eq', column, value });
          return builder;
        },
        neq(column, value) {
          state.filters.push({ operator: 'neq', column, value });
          return builder;
        },
        then(resolve, reject) {
          return Promise.resolve(resolver({ ...state })).then(resolve, reject);
        },
      };
      return builder;
    },
  };
}

describe('profileVisibility', () => {
  test('retries supplier_public_profiles with compatible columns when deals_completed is missing', async () => {
    const requests = [];
    const sb = createMockSupabase((request) => {
      requests.push(request);

      if (request.table === 'supplier_public_profiles' && request.columns.includes('deals_completed')) {
        return {
          data: null,
          error: { message: "Could not find the 'deals_completed' column of 'supplier_public_profiles' in the schema cache" },
        };
      }

      if (request.table === 'supplier_public_profiles') {
        return {
          data: [{ id: 'sup-1', company_name: 'Factory One', status: 'verified' }],
          error: null,
        };
      }

      return { data: [], error: null };
    });

    const result = await fetchSupplierPublicProfilesByIds(sb, ['sup-1']);

    expect(result).toEqual([
      expect.objectContaining({
        id: 'sup-1',
        company_name: 'Factory One',
        status: 'verified',
        deals_completed: null,
        product_count: null,
      }),
    ]);

    expect(requests).toHaveLength(2);
    expect(requests[0].table).toBe('supplier_public_profiles');
    expect(requests[0].filters).toEqual([
      { operator: 'in', column: 'id', value: ['sup-1'] },
    ]);
    expect(requests[1].columns).toBe(SUPPLIER_PUBLIC_PROFILE_COMPAT_COLUMNS);
  });

  test('falls back to profiles with supplier visibility filters when the public view is unavailable', async () => {
    const requests = [];
    const sb = createMockSupabase((request) => {
      requests.push(request);

      if (request.table === 'supplier_public_profiles') {
        return {
          data: null,
          error: { message: 'relation "public.supplier_public_profiles" does not exist' },
        };
      }

      if (request.table === 'profiles') {
        return {
          data: [{ id: 'sup-2', company_name: 'Fallback Supplier', status: 'approved', deals_completed: 8 }],
          error: null,
        };
      }

      return { data: [], error: null };
    });

    const rows = await attachSupplierProfiles(sb, [{ id: 'prod-1', supplier_id: 'sup-2' }]);

    expect(rows[0]).toEqual(
      expect.objectContaining({
        id: 'prod-1',
        supplier_id: 'sup-2',
        profiles: expect.objectContaining({
          id: 'sup-2',
          company_name: 'Fallback Supplier',
          status: 'approved',
          deals_completed: 8,
          product_count: null,
        }),
      }),
    );

    expect(requests[1]).toEqual(
      expect.objectContaining({
        table: 'profiles',
        filters: [
          { operator: 'in', column: 'id', value: ['sup-2'] },
          { operator: 'eq', column: 'role', value: 'supplier' },
          { operator: 'in', column: 'status', value: getSupplierPublicVisibilityStatuses() },
        ],
      }),
    );
  });
});
