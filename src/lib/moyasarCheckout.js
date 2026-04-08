const PENDING_CHECKOUT_PREFIX = 'maabar:moyasar:pending:';

export function savePendingMoyasarCheckout(checkoutData) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 'local';
  }
  
  const key = `${PENDING_CHECKOUT_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try {
    window.localStorage.setItem(key, JSON.stringify(checkoutData));
    return key;
  } catch (error) {
    console.error('Failed to save pending checkout:', error);
    return 'local';
  }
}

export function loadPendingMoyasarCheckout(key) {
  if (typeof window === 'undefined' || !window.localStorage || !key) {
    return null;
  }
  
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Failed to load pending checkout:', error);
    return null;
  }
}

export function clearPendingMoyasarCheckout(key) {
  if (typeof window === 'undefined' || !window.localStorage || !key) {
    return;
  }
  
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear pending checkout:', error);
  }
}

export function buildMoyasarAmountMinorUnits(amount) {
  // Convert amount to minor units (e.g., SAR to halalas)
  // Moyasar expects amount in the smallest currency unit (100 halalas = 1 SAR)
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    return 0;
  }
  
  // Assuming currency is SAR (Saudi Riyal)
  return Math.round(amount * 100);
}

export function buildMoyasarCallbackUrl(checkoutStateKey) {
  if (typeof window === 'undefined') {
    return 'https://maabar.io/payment/success';
  }
  
  const baseUrl = window.location.origin;
  return `${baseUrl}/payment/success?checkout=${encodeURIComponent(checkoutStateKey)}`;
}

export async function initiateMoyasarPayment(paymentData) {
  // This function would typically call Moyasar API
  // For now, return a mock response
  console.log('Initiating Moyasar payment:', paymentData);
  
  return {
    id: `mock_${Date.now()}`,
    status: 'initiated',
    amount: paymentData?.amount || 0,
    currency: paymentData?.currency || 'SAR',
  };
}

export async function verifyMoyasarPayment(paymentId, sb) {
  // This function would verify payment with Moyasar API or Supabase Edge Function
  // For now, return a mock verification
  console.log('Verifying Moyasar payment:', paymentId);
  
  if (sb) {
    try {
      const { data, error } = await sb.functions.invoke('verify-moyasar-payment', {
        body: { paymentId },
      });
      
      if (!error) {
        return data;
      }
    } catch (error) {
      console.error('Failed to invoke verify-moyasar-payment function:', error);
    }
  }
  
  // Mock verification for development
  return {
    id: paymentId,
    status: 'paid',
    amount: 10000,
    currency: 'SAR',
    created_at: new Date().toISOString(),
  };
}