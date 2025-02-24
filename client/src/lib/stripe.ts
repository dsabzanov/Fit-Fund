import { apiRequest } from "./queryClient";

export async function createPaymentSession(challengeId: number, amount: number) {
  try {
    const res = await apiRequest('POST', '/api/create-payment-session', {
      challengeId,
      amount
    });
    const { sessionId } = await res.json();
    
    // Redirect to Stripe Checkout
    const stripe = await loadStripe(process.env.VITE_STRIPE_PUBLIC_KEY!);
    await stripe?.redirectToCheckout({ sessionId });
  } catch (error) {
    console.error('Payment session creation failed:', error);
    throw error;
  }
}

async function loadStripe(key: string) {
  const Stripe = (await import('@stripe/stripe-js')).loadStripe;
  return Stripe(key);
}
