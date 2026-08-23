export interface DriveAccessResult {
  hasAccess: boolean;
  isAdmin: boolean;
  authorized: boolean;
  error?: string;
}

// In-memory cache & In-flight single-flight request map
const accessCache = new Map<string, { data: DriveAccessResult; timestamp: number }>();
const inFlightRequests = new Map<string, Promise<DriveAccessResult>>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

/**
 * Single-flight deduplicated access checker.
 * Ensures only 1 network request is made even if multiple components call it concurrently.
 */
export async function checkGoogleDriveAccess(
  authId?: string,
  options?: { force?: boolean }
): Promise<DriveAccessResult> {
  const targetId = authId || "current";

  // Return cached result if valid and not forced
  if (!options?.force) {
    const cached = accessCache.get(targetId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  // Deduplicate concurrent in-flight requests (Single-Flight Promise)
  if (inFlightRequests.has(targetId)) {
    return inFlightRequests.get(targetId)!;
  }

  const fetchPromise = (async () => {
    try {
      const url = authId 
        ? `/api/google-drive/check-access?authId=${encodeURIComponent(authId)}`
        : `/api/google-drive/check-access`;
      const response = await fetch(url);
      const result: DriveAccessResult = await response.json();
      
      if (response.ok) {
        accessCache.set(targetId, { data: result, timestamp: Date.now() });
      }
      return result;
    } catch (err: any) {
      return {
        hasAccess: false,
        isAdmin: false,
        authorized: false,
        error: err.message || "Failed to check access"
      };
    } finally {
      inFlightRequests.delete(targetId);
    }
  })();

  inFlightRequests.set(targetId, fetchPromise);
  return fetchPromise;
}

export function invalidateDriveAccessCache(authId?: string) {
  if (authId) {
    accessCache.delete(authId);
  } else {
    accessCache.clear();
  }
}
