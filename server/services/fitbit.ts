import fetch from 'node-fetch';

const FITBIT_API_BASE = 'https://api.fitbit.com';
const FITBIT_AUTH_BASE = 'https://www.fitbit.com';
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
  constructor() {
    if (!process.env.FITBIT_CLIENT_ID || !process.env.FITBIT_CLIENT_SECRET) {
      throw new Error('Missing Fitbit credentials');
    }
  }

  getAuthorizationUrl(userId: number): string {
    const callbackUrl = `${process.env.VITE_APP_URL}/api/fitbit/callback`;
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.FITBIT_CLIENT_ID!,
      scope: FITBIT_SCOPES.join(' '),
      redirect_uri: callbackUrl,
      state: userId.toString()
    });

    return `${FITBIT_AUTH_BASE}/oauth2/authorize?${params.toString()}`;
  }

  async handleCallback(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    user_id: string;
  }> {
    const callbackUrl = `${process.env.VITE_APP_URL}/api/fitbit/callback`;
    const basicAuth = Buffer.from(
      `${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`
    ).toString('base64');

    const response = await fetch(`${FITBIT_AUTH_BASE}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: callbackUrl
      }).toString()
    });

    if (!response.ok) {
      throw new Error('Failed to get access token');
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user_id: data.user_id
    };
  }

  async refreshAccessToken(refreshToken: string) {
    const basicAuth = Buffer.from(
      `${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`
    ).toString('base64');

    const response = await fetch(`${FITBIT_AUTH_BASE}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }).toString()
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    return response.json();
  }

  async getUserActivity(accessToken: string, date: string) {
    const response = await fetch(
      `${FITBIT_API_BASE}/1/user/-/activities/date/${date}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch user activity');
    }

    return response.json();
  }
}

export const fitbitService = new FitbitService();