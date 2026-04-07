import { getMoyasarPublishableKey, isMoyasarConfigured } from './lib/paymentGateway';

describe('payment gateway guards', () => {
  const originalKey = process.env.REACT_APP_MOYASAR_PUBLISHABLE_KEY;

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.REACT_APP_MOYASAR_PUBLISHABLE_KEY;
    } else {
      process.env.REACT_APP_MOYASAR_PUBLISHABLE_KEY = originalKey;
    }
  });

  test('treats missing or placeholder Moyasar keys as not configured', () => {
    delete process.env.REACT_APP_MOYASAR_PUBLISHABLE_KEY;
    expect(getMoyasarPublishableKey()).toBe('');
    expect(isMoyasarConfigured()).toBe(false);

    process.env.REACT_APP_MOYASAR_PUBLISHABLE_KEY = 'pk_test_YOUR_KEY_HERE';
    expect(isMoyasarConfigured()).toBe(false);
  });

  test('accepts real-looking Moyasar publishable keys', () => {
    process.env.REACT_APP_MOYASAR_PUBLISHABLE_KEY = 'pk_test_realkey_123';
    expect(getMoyasarPublishableKey()).toBe('pk_test_realkey_123');
    expect(isMoyasarConfigured()).toBe(true);
  });
});
