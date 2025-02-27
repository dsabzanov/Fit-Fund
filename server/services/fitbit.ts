import { default as FitbitClient } from 'fitbit-api-client';

const FITBIT_SCOPES = [
  'activity',
  'heartrate',
  'location',
  'nutrition',
  'profile',
  'settings',
  'sleep',
  'weight'
];

export class FitbitService {
  private client: any;

  constructor() {
    this.client = FitbitClient({
      clientId: process.env.FITBIT_CLIENT_ID!,
      clientSecret: process.env.FITBIT_CLIENT_SECRET!,
      apiVersion: '1.2'
    });
  }

  getAuthorizationUrl(userId: number): string {
    const callbackUrl = `${process.env.VITE_APP_URL}/api/fitbit/callback`;
    return this.client.getAuthorizeUrl({
      redirect_uri: callbackUrl,
      scope: FITBIT_SCOPES.join(' '),
      state: userId.toString() // Used to identify user after callback
    });
  }

  async handleCallback(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    user_id: string;
  }> {
    const callbackUrl = `${process.env.VITE_APP_URL}/api/fitbit/callback`;
    const tokens = await this.client.getAccessToken({
      code,
      redirect_uri: callbackUrl
    });

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user_id: tokens.user_id
    };
  }

  async refreshAccessToken(refreshToken: string) {
    return await this.client.refreshAccessToken(refreshToken);
  }

  async getUserActivity(accessToken: string, date: string) {
    return await this.client.get('/activities/date/' + date, accessToken);
  }
}

export const fitbitService = new FitbitService();