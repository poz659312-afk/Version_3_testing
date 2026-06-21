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

// Check token status by calling the API
export async function checkTokenStatus(): Promise<TokenStatus> {
  try {
    const response = await fetch('/api/cron/token-refresh?checkOnly=true', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.NEXT_PUBLIC_CRON_SECRET || 'your-secret-key-here'
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      isValid: data.success,
      needsRefresh: data.failedCount > 0,
      lastChecked: new Date(data.timestamp),
      totalCount: data.totalUsers,
      expiredCount: data.failedCount,
      validCount: data.totalUsers !== undefined && data.failedCount !== undefined ? data.totalUsers - data.failedCount : undefined,
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

// Manual token refresh trigger
export async function triggerTokenRefresh(): Promise<RefreshResult> {
  try {
    const response = await fetch('/api/cron/token-refresh', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.NEXT_PUBLIC_CRON_SECRET || 'your-secret-key-here'
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: RefreshResult = await response.json();
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
