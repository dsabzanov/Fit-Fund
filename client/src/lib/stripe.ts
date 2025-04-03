import { loadStripe } from '@stripe/stripe-js';

export async function createPaymentSession(challengeId: number, amount: number) {
  try {
    console.log('Creating payment session for challenge:', challengeId, 'amount:', amount);
    
    const res = await fetch('/api/create-payment-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for sending cookies/session info
      body: JSON.stringify({
        challengeId,
        amount
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Payment session creation response error:', errorData);
      throw new Error(errorData.error || 'Failed to create payment session');
    }

    const { sessionId } = await res.json();
    console.log('Payment session created with ID:', sessionId);

    // Redirect to Stripe Checkout
    if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
      console.error('Missing Stripe public key');
      throw new Error('Payment configuration error');
    }
    
    const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
    if (!stripe) {
      console.error('Failed to load Stripe');
      throw new Error('Failed to load payment processor');
    }

    console.log('Redirecting to Stripe checkout...');
    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) {
      console.error('Stripe redirect error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Payment session creation failed:', error);
    throw error;
  }
}