import { Currency } from "@shared/schema";

interface UserSettings {
  currency?: Currency;
  name?: string;
  email?: string;
  emailNotifications?: boolean;
  reminderDays?: number;
}

/**
 * Updates user settings including currency preference
 * @param settings The settings to update
 * @returns The updated user data
 */
export async function updateUserSettings(settings: UserSettings): Promise<any> {
  const response = await fetch('/api/user/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(settings),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update user settings');
  }
  
  return response.json();
}

/**
 * Fetches the current user data
 * @returns The user data
 */
export async function fetchCurrentUser(): Promise<any> {
  const response = await fetch('/api/user', {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }
  
  return response.json();
}

/**
 * Updates user password
 * @param data The password change data
 * @returns Success status
 */
export async function updatePassword(data: { currentPassword: string; newPassword: string }): Promise<any> {
  const response = await fetch('/api/user/password', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update password');
  }
  
  return response.json();
}
