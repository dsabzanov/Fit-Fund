import fetch from 'node-fetch';
import { User } from '@shared/schema';

// Go High Level API Constants
const GHL_API_KEY = process.env.GO_HIGH_LEVEL_API_KEY;
const GHL_LOCATION_ID = process.env.GO_HIGH_LEVEL_LOCATION_ID;
const GHL_BASE_URL = 'https://rest.gohighlevel.com/v1';

// Determine if the API key is in JWT format or another format
const useBearer = GHL_API_KEY && GHL_API_KEY.startsWith('eyJ');

// Check for token expiration in location ID
const hasExpiredToken = GHL_LOCATION_ID && typeof GHL_LOCATION_ID === 'string' && 
  (GHL_LOCATION_ID.includes('ExpiredToken') || GHL_LOCATION_ID.includes('<Error>'));

// Set integration enabled flag - disable if there's evidence of expired token
const GHL_INTEGRATION_ENABLED = !!(GHL_API_KEY && GHL_LOCATION_ID && !hasExpiredToken);

// Log API credential status with minimal sensitive data exposure
console.log('Go High Level integration status:');
console.log('- API Key provided:', !!GHL_API_KEY);
console.log('- Location ID provided:', !!GHL_LOCATION_ID);
console.log('- Integration enabled:', GHL_INTEGRATION_ENABLED);
if (hasExpiredToken) {
  console.error('- ERROR: Go High Level token is expired. Please refresh the API key.');
} else if (!GHL_API_KEY || !GHL_LOCATION_ID) {
  console.warn('- WARNING: Go High Level credentials missing. Email notifications will not work.');
}

/**
 * Helper function to create proper authorization headers
 */
function getAuthHeaders(): Record<string, string> {
  if (!GHL_API_KEY) {
    console.log('Go High Level API key missing, returning minimal headers');
    return {
      'Content-Type': 'application/json'
    };
  }
  
  // Check if we have a token expiration error in the location ID
  if (!GHL_INTEGRATION_ENABLED) {
    console.error('Go High Level integration is disabled - token may be expired');
    // Return minimal headers to avoid further API calls with expired token
    return {
      'Content-Type': 'application/json'
    };
  }
  
  return {
    'Authorization': useBearer ? `Bearer ${GHL_API_KEY}` : GHL_API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Version': '2021-04-15'
  };
}

// Error handling
if (!GHL_API_KEY || !GHL_LOCATION_ID) {
  console.error('Go High Level credentials are not set. Email notifications will not work.');
}

// Tag constants
const CUSTOMER_TAG = 'Fitfund_Customer';

/**
 * Interface for Go High Level contact
 */
interface GHLContact {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  tags?: string[];
  customFields?: Array<{
    key: string;
    value: string;
  }>;
}

/**
 * Interface for Go High Level API responses
 */
interface GHLSearchResponse {
  contacts?: Array<{
    id: string;
    [key: string]: any;
  }>;
}

interface GHLCreateResponse {
  contact?: {
    id: string;
    [key: string]: any;
  };
}

/**
 * Notification types supported by the system
 */
export enum NotificationType {
  START_DATE_CHANGE = 'start_date_change',
  WEIGH_IN_REMINDER = 'weigh_in_reminder',
  PROMOTIONAL_UPDATE = 'promotional_update'
}

/**
 * Create or update a contact in Go High Level
 * @param user The user to create or update
 * @param tags Optional array of tags to apply to the contact, default includes CUSTOMER_TAG
 */
export async function createOrUpdateContact(
  user: User, 
  customTags: string[] = []
): Promise<string | null> {
  if (!GHL_INTEGRATION_ENABLED) {
    console.error('Cannot create contact: Go High Level integration is disabled');
    return null;
  }

  try {
    // Ensure CUSTOMER_TAG is always included in tags with no duplicates
    const uniqueTags = [CUSTOMER_TAG];
    
    // Add the custom tags, avoiding duplicates
    customTags.forEach(tag => {
      if (tag !== CUSTOMER_TAG && !uniqueTags.includes(tag)) {
        uniqueTags.push(tag);
      }
    });
    
    // Prepare contact data
    const contact: GHLContact = {
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      tags: uniqueTags,
      customFields: [
        { 
          key: 'username', 
          value: user.username 
        },
        { 
          key: 'account_type', 
          value: user.isHost ? 'Host' : (user.isAdmin ? 'Admin' : 'Participant') 
        }
      ]
    };

    // Check if contact exists by email
    console.log(`Searching for contact with email: ${user.email}`);
    
    const searchResponse = await fetch(
      `${GHL_BASE_URL}/contacts/search?email=${encodeURIComponent(user.email || '')}`,
      {
        method: 'GET',
        headers: getAuthHeaders()
      }
    );
    
    const searchResult = await searchResponse.json() as any;
    
    if (searchResult && Array.isArray(searchResult.contacts) && searchResult.contacts.length > 0) {
      // Update existing contact
      const contactId = searchResult.contacts[0].id;
      console.log(`Updating existing contact: ${contactId} for email: ${user.email}`);
      
      await fetch(
        `${GHL_BASE_URL}/contacts/${contactId}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ...contact,
            locationId: GHL_LOCATION_ID
          })
        }
      );
      
      console.log(`Updated existing contact in Go High Level: ${user.email}`);
      return contactId;
    } else {
      // Create new contact
      console.log(`Creating new contact for: ${user.email}`);
      console.log(`Contact data:`, JSON.stringify({...contact, locationId: GHL_LOCATION_ID}));
      
      const createResponse = await fetch(
        `${GHL_BASE_URL}/contacts`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ...contact,
            locationId: GHL_LOCATION_ID  // Including location ID in the body instead
          })
        }
      );
      
      const result = await createResponse.json() as any;
      
      if (result && result.contact && result.contact.id) {
        console.log(`Created new contact in Go High Level: ${user.email}`);
        return result.contact.id;
      } else {
        console.error('Failed to create contact in Go High Level', result);
        return null;
      }
    }
  } catch (error) {
    console.error('Error creating or updating Go High Level contact:', error);
    return null;
  }
}

/**
 * Send an email notification to a user
 */
export async function sendNotification(
  user: User,
  type: NotificationType,
  data: Record<string, any> = {}
): Promise<boolean> {
  if (!GHL_INTEGRATION_ENABLED) {
    console.error('Cannot send notification: Go High Level integration is disabled');
    return false;
  }
  
  if (!user.email) {
    console.error('Cannot send notification: User has no email address');
    return false;
  }

  try {
    // First ensure the contact exists
    const contactId = await createOrUpdateContact(user);
    
    if (!contactId) {
      console.error('Failed to find or create contact for notification');
      return false;
    }
    
    // Prepare email content and subject based on notification type
    let subject = '';
    let body = '';
    
    switch (type) {
      case NotificationType.START_DATE_CHANGE:
        subject = 'Important: Your FitFund Challenge Start Date Has Changed';
        body = `
          <p>Hello ${user.firstName || user.username},</p>
          <p>The start date for your challenge "${data.challengeName}" has been updated to ${data.newStartDate}.</p>
          <p>Please make a note of this change and prepare accordingly.</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>The FitFund Team</p>
        `;
        break;
        
      case NotificationType.WEIGH_IN_REMINDER:
        subject = 'FitFund Reminder: Time for Your Official Weigh-In';
        body = `
          <p>Hello ${user.firstName || user.username},</p>
          <p>This is a friendly reminder that it's time for your official weigh-in for the "${data.challengeName}" challenge.</p>
          <p>Please complete your weigh-in by ${data.deadline}.</p>
          <p>Remember, accurate and timely weigh-ins are essential for maintaining the integrity of the challenge.</p>
          <p>Best regards,<br>The FitFund Team</p>
        `;
        break;
        
      case NotificationType.PROMOTIONAL_UPDATE:
        subject = 'FitFund Updates: New Features and Opportunities';
        body = `
          <p>Hello ${user.firstName || user.username},</p>
          <p>${data.message}</p>
          <p>Best regards,<br>The FitFund Team</p>
        `;
        break;
        
      default:
        console.error('Unknown notification type:', type);
        return false;
    }
    
    // Send the email through Go High Level
    console.log(`Sending email to contact ${contactId} with subject: ${subject}`);
    
    const emailResponse = await fetch(
      `${GHL_BASE_URL}/emails`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          subject,
          body,
          contactId,
          locationId: GHL_LOCATION_ID,
          to: [user.email]
        })
      }
    );
    
    if (emailResponse.ok) {
      console.log(`Successfully sent ${type} notification to ${user.email}`);
      return true;
    } else {
      const errorDetails = await emailResponse.text();
      console.error(`Failed to send notification: ${errorDetails}`);
      return false;
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

/**
 * Send notification to all participants in a challenge
 */
export async function notifyAllParticipants(
  participantUsers: User[],
  type: NotificationType,
  data: Record<string, any> = {}
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  
  for (const user of participantUsers) {
    const result = await sendNotification(user, type, data);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }
  
  return { success, failed };
}