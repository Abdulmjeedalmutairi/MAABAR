export function getMoyasarPublishableKey() {
  // Get publishable key from environment variable
  return process.env.REACT_APP_MOYASAR_PUBLISHABLE_KEY || 'pk_test_gYDMsvJ8sAetQWtBXfzGPMz6B1kiu38TJYTJu5Rn';
}

export function isMoyasarConfigured(publishableKey) {
  const key = publishableKey || getMoyasarPublishableKey();
  return typeof key === 'string' && key.length > 10;
}

export async function initiatePayment(paymentData) {
  // Initiate payment through Moyasar
  // This is a wrapper that could be extended to support multiple gateways
  const { initiateMoyasarPayment } = await import('./moyasarCheckout');
  return initiateMoyasarPayment(paymentData);
}

export async function verifyPayment(paymentId, sb) {
  // Verify payment through Moyasar
  const { verifyMoyasarPayment } = await import('./moyasarCheckout');
  return verifyMoyasarPayment(paymentId, sb);
}

export async function refundPayment(paymentId, amount, reason) {
  // Refund payment through Moyasar
  // This is a stub - actual implementation would call Moyasar API
  console.log('Refunding payment:', { paymentId, amount, reason });
  
  return {
    id: `refund_${Date.now()}`,
    paymentId,
    status: 'refunded',
    amount,
    currency: 'SAR',
    created_at: new Date().toISOString(),
  };
}