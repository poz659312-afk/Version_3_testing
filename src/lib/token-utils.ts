// Client-side utility for token management
export interface TokenStatus {
  isValid: boolean;
  expiresAt?: Date;
  needsRefresh: boolean;
  lastChecked: Date;
  totalCount?: number;
  expiredCount?: number;
  validCount?: number;
  message?: string;
}

export interface RefreshResult {
  success: boolean;
  message: string;
  refreshedCount?: number;
  failedCount?: number;
  totalUsers?: number;
  timestamp: string;
}

import { checkAdminTokensAction, refreshAdminTokensAction } from '@/app/admin/actions';

// Check token status via secure server action
export async function checkTokenStatus(): Promise<TokenStatus> {
  try {
    const data = await checkAdminTokensAction();
    return {
      isValid: data.isValid,
      needsRefresh: data.needsRefresh,
      lastChecked: new Date(data.lastChecked),
      totalCount: data.totalCount,
      expiredCount: data.expiredCount,
      validCount: data.validCount,
      message: data.message
    };
  } catch (error) {
    console.error('Error checking token status:', error);
    return {
      isValid: false,
      needsRefresh: true,
      lastChecked: new Date(),
    };
  }
}

// Manual token refresh trigger via secure server action
export async function triggerTokenRefresh(): Promise<RefreshResult> {
  try {
    const data = await refreshAdminTokensAction();
    return data;
  } catch (error) {
    console.error('Error triggering token refresh:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
    };
  }
}

// Utility to format time remaining until token expiry
export function formatTimeRemaining(expiresAt: Date): string {
  const now = new Date();
  const diffMs = expiresAt.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 'Expired';
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m remaining`;
  } else {
    return `${diffMinutes}m remaining`;
  }
}
