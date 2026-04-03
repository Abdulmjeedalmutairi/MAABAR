import {
  getSupplierResolvedStatus,
  getSupplierReviewQueueStatuses,
  shouldPromoteSupplierAfterEmailConfirmation,
} from './lib/supplierOnboarding';

describe('supplier onboarding helpers', () => {
  test('treats legacy pending suppliers with incomplete verification as verification_required after email confirmation', () => {
    const status = getSupplierResolvedStatus(
      {
        role: 'supplier',
        status: 'pending',
        company_name: 'Test Supplier',
        country: 'China',
        city: 'Shenzhen',
        trade_link: 'https://example.com/store',
      },
      { email_confirmed_at: '2026-04-01T00:00:00.000Z' },
    );

    expect(status).toBe('verification_required');
  });

  test('promotes registered suppliers after email confirmation when the application basics are complete', () => {
    expect(
      shouldPromoteSupplierAfterEmailConfirmation(
        {
          role: 'supplier',
          status: 'registered',
          company_name: 'Test Supplier',
          country: 'China',
          city: 'Shenzhen',
          trade_link: 'https://example.com/store',
        },
        { email_confirmed_at: '2026-04-01T00:00:00.000Z' },
      ),
    ).toBe(true);
  });

  test('keeps legacy review statuses in the admin queue compatibility list', () => {
    expect(getSupplierReviewQueueStatuses()).toEqual(
      expect.arrayContaining(['verification_under_review', 'pending', 'under_review']),
    );
  });
});
