import fetch from 'node-fetch';
import { User } from '@shared/schema';

// Go High Level API Constants
const GHL_API_KEY = process.env.GO_HIGH_LEVEL_API_KEY;
const GHL_LOCATION_ID = process.env.GO_HIGH_LEVEL_LOCATION_ID;
const GHL_BASE_URL = 'https://rest.gohighlevel.com/v1';

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
  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    console.error('Cannot create contact: Go High Level credentials are not set');
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
    console.log(`Using GHL location ID: ${GHL_LOCATION_ID}`);
    console.log(`Using endpoint: ${GHL_BASE_URL}/contacts/search?email=${encodeURIComponent(user.email || '')}`);
    
    const searchResponse = await fetch(
      `${GHL_BASE_URL}/contacts/search?email=${encodeURIComponent(user.email || '')}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Version': '2021-04-15'
        }
      }
    );
    
    const searchResult = await searchResponse.json() as any;
    
    if (searchResult && Array.isArray(searchResult.contacts) && searchResult.contacts.length > 0) {
      // Update existing contact
      const contactId = searchResult.contacts[0].id;
      
      await fetch(
        `${GHL_BASE_URL}/locations/${GHL_LOCATION_ID}/contacts/${contactId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(contact)
        }
      );
      
      console.log(`Updated existing contact in Go High Level: ${user.email}`);
      return contactId;
    } else {
      // Create new contact
      const createResponse = await fetch(
        `${GHL_BASE_URL}/locations/${GHL_LOCATION_ID}/contacts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(contact)
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
  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    console.error('Cannot send notification: Go High Level credentials are not set');
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
    const emailResponse = await fetch(
      `${GHL_BASE_URL}/locations/${GHL_LOCATION_ID}/contacts/${contactId}/emails`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject,
          body,
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