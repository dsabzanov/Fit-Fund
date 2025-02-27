import fetch from 'node-fetch';

export class FitbitService {
  constructor() {
    // Remove credential check since we're using mock data
  }

  getAuthorizationUrl(userId: number): string {
    // Return a mock URL
    return '#';
  }

  async handleCallback(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    user_id: string;
  }> {
    // Return mock tokens
    return {
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      user_id: 'mock_user_id'
    };
  }

  async refreshAccessToken(refreshToken: string) {
    // Return mock refresh response
    return {
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      user_id: 'mock_user_id'
    };
  }

  async getUserActivity(accessToken: string, date: string) {
    // Return mock activity data
    return {
      activities: [
        {
          steps: 8432,
          activeMinutes: 45,
          calories: 1867,
          distance: 5.2
        }
      ]
    };
  }
}

export const fitbitService = new FitbitService();