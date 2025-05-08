import Stripe from 'stripe';
import { User } from '@shared/schema';
import { storage } from '../storage';

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('Missing STRIPE_SECRET_KEY environment variable');
  throw new Error('Stripe not configured properly');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16' as any,
  typescript: true,
});

/**
 * Create a Stripe setup intent for adding a payment method
 */
export async function createSetupIntent(userId: number): Promise<{
  clientSecret: string;
  setupIntentId: string;
} | null> {
  try {
    // Get the user
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // First, ensure the user has a Stripe customer ID
    const customerId = await getOrCreateStripeCustomer(user);
    if (!customerId) {
      throw new Error('Failed to create or retrieve Stripe customer');
    }

    // Create a setup intent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session', // Allow the payment method to be used for future payments
    });

    return {
      clientSecret: setupIntent.client_secret!,
      setupIntentId: setupIntent.id,
    };
  } catch (error) {
    console.error('Error creating setup intent:', error);
    return null;
  }
}

/**
 * Get or create a Stripe customer ID for a user
 */
export async function getOrCreateStripeCustomer(user: User): Promise<string | null> {
  try {
    // If user already has a customer ID, return it
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Otherwise, create a new customer
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      name: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.username,
      metadata: {
        userId: user.id.toString(),
      },
    });

    // Update user with new customer ID
    await storage.updateUser(user.id, {
      stripeCustomerId: customer.id,
    });

    return customer.id;
  } catch (error) {
    console.error('Error getting or creating Stripe customer:', error);
    return null;
  }
}

/**
 * Retrieve a user's saved payment methods
 */
export async function getUserPaymentMethods(userId: number): Promise<Stripe.PaymentMethod[]> {
  try {
    const user = await storage.getUser(userId);
    if (!user || !user.stripeCustomerId) {
      return [];
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    });

    return paymentMethods.data;
  } catch (error) {
    console.error('Error retrieving payment methods:', error);
    return [];
  }
}

/**
 * Detach a payment method from a customer
 */
export async function removePaymentMethod(userId: number, paymentMethodId: string): Promise<boolean> {
  try {
    const user = await storage.getUser(userId);
    if (!user || !user.stripeCustomerId) {
      throw new Error('User not found or not associated with a Stripe customer');
    }

    // Verify the payment method belongs to this customer
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (paymentMethod.customer !== user.stripeCustomerId) {
      throw new Error('Payment method does not belong to this customer');
    }

    // Detach the payment method
    await stripe.paymentMethods.detach(paymentMethodId);
    return true;
  } catch (error) {
    console.error('Error removing payment method:', error);
    return false;
  }
}

/**
 * Format a payment method for display
 */
export function formatPaymentMethod(paymentMethod: Stripe.PaymentMethod): {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
} {
  const card = paymentMethod.card!;
  return {
    id: paymentMethod.id,
    brand: card.brand,
    last4: card.last4,
    expMonth: card.exp_month,
    expYear: card.exp_year,
    isDefault: paymentMethod.metadata?.isDefault === 'true',
  };
}

/**
 * Set a payment method as the default for a customer
 */
export async function setDefaultPaymentMethod(
  userId: number,
  paymentMethodId: string
): Promise<boolean> {
  try {
    const user = await storage.getUser(userId);
    if (!user || !user.stripeCustomerId) {
      throw new Error('User not found or not associated with a Stripe customer');
    }

    // Get all payment methods for this customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    });

    // Update the customer's default payment method
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Update the metadata for all payment methods
    for (const pm of paymentMethods.data) {
      await stripe.paymentMethods.update(pm.id, {
        metadata: {
          isDefault: pm.id === paymentMethodId ? 'true' : 'false',
        },
      });
    }

    return true;
  } catch (error) {
    console.error('Error setting default payment method:', error);
    return false;
  }
}