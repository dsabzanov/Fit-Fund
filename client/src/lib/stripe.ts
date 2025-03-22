import { loadStripe } from '@stripe/stripe-js';

export async function createPaymentSession(challengeId: number, amount: number) {
  try {
    const res = await fetch('/api/create-payment-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        challengeId,
        amount
      })
    });

    if (!res.ok) {
      throw new Error('Failed to create payment session');
    }

    const { sessionId } = await res.json();

    // Redirect to Stripe Checkout
    const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);
    if (!stripe) {
      throw new Error('Failed to load Stripe');
    }

    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Payment session creation failed:', error);
    throw error;
  }
}