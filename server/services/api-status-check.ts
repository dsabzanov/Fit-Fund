import { User } from '@shared/schema';
import { createOrUpdateContact } from './go-high-level';

/**
 * Check the Go High Level API status
 * This function will attempt to create a test contact and report whether the integration is working
 */
export async function checkGoHighLevelStatus(): Promise<{
  status: 'ok' | 'error';
  message: string;
}> {
  try {
    // Create a test user
    const testUser: User = {
      id: -1, // Will be ignored by GHL
      username: 'test.user',
      password: 'not-used',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      isAdmin: false,
      isHost: false,
      createdAt: new Date(),
      onboardingComplete: null,
      currentWeight: null,
      targetWeight: null,
      notificationSettings: null,
      stripeCustomerId: null,
      stripeConnectId: null
    };
    
    // Try to create/update contact
    const result = await createOrUpdateContact(testUser, ['API_Test']);
    
    if (result) {
      return {
        status: 'ok',
        message: 'Go High Level API integration is working correctly'
      };
    } else {
      return {
        status: 'error',
        message: 'Go High Level API call failed. The service may be down or credentials are invalid.'
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: `Go High Level API test failed with error: ${error.message || 'Unknown error'}`
    };
  }
}