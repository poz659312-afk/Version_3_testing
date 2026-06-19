# Walkthrough: Secure Admin Management Page

I have built the secure **Super Admin Management Console** for your Next.js 14/15 + TypeScript + Supabase + Google Drive project. All code compiles cleanly and adheres to your design system and specifications.

Below is a summary of the architecture, file changes, database migration instructions, and verification steps.

---

## 🛠️ Summary of Changes

### 1. Type Definitions & Auth Checks
- **Modified [types.ts](file:///e:/my-shadcn-project/Version_3_testing-main/src/lib/types.ts)**: Added `is_super_admin: boolean` to the core `User` model.
- **Modified [auth.ts](file:///e:/my-shadcn-project/Version_3_testing-main/src/lib/auth.ts)**: Integrated the `is_super_admin` column in `StudentUser` and updated the browser-side `getStudentSession()` query to fetch it.
- **Modified [auth-server.ts](file:///e:/my-shadcn-project/Version_3_testing-main/src/lib/auth-server.ts)**: Updated `getServerStudentSession()` to select and return `is_super_admin`, securing server-side components and guards.
- **Modified [auth-updated.ts](file:///e:/my-shadcn-project/Version_3_testing-main/src/lib/auth-updated.ts)**: Updated student user properties for type consistency.

### 2. Google Drive Sharing Sync
- **Created [drive-sharing.ts](file:///e:/my-shadcn-project/Version_3_testing-main/src/lib/drive-sharing.ts)**: Implemented:
  - `getAdminDriveClient`: Dynamically resolves a Google client using the current admin's tokens, falling back to the first available authorized admin.
  - `grantFolderAccess`: Viewer-only (`reader`) folder sharing via Google Drive API.
  - `revokeFolderAccess`: Permission ID lookup and revocation.
  - `syncUserFolderAccess`: Compares old and new specialization/level rules to automate permissions syncing.

### 3. Administrative Server Actions
- **Created [actions.ts](file:///e:/my-shadcn-project/Version_3_testing-main/src/app/admin/actions.ts)**: Secure Server Actions verifying `is_super_admin === true` on every request. Handles:
  - Fetching users directory.
  - Previewing folder access changes.
  - Modifying user roles (admin/specialization/level) with Drive permission sync.
  - Folder access rules configuration CRUD.
  - Retrieving logs from `admin_audit_logs`.

### 4. Admin Portal UI (With Server-Side Pagination & Email Search)
- **Modified [AdminDashboardClient.tsx](file:///e:/my-shadcn-project/Version_3_testing-main/src/app/admin/AdminDashboardClient.tsx)**: Enhanced the dashboard to support server-side pagination, sorting, and searching:
  - **Dynamic Pagination**: Added states for `page`, `pageSize`, `totalCount`, and `isLoading`.
  - **Interactive Controls**: Appended pagination components at the bottom of the User Directory table showing stats ("Showing X to Y of Z entries"), a rows-per-page selector (5, 10, 20, 50), and page number buttons.
  - **Debounced Search**: Integrated a 300ms debounce on the search input to prevent redundant API queries.
  - **Filter Handling**: Automatically resets page to `1` when specialization, level, or search terms change.
- **Modified [page.tsx](file:///e:/my-shadcn-project/Version_3_testing-main/src/app/admin/page.tsx)**: Updated initial server-side pre-fetching to retrieve only the first page (range 0 to 9) and the total count of users, preventing heavy database loads.
- **Verified [actions.ts](file:///e:/my-shadcn-project/Version_3_testing-main/src/app/admin/actions.ts)**: Confirmed that `getAllUsers` correctly queries Supabase with sorting by `created_at desc` and uses case-insensitive partial searches on both `username` and `email` columns via `.or()`.

### 5. Google Drive Authorization Endpoint Fix
- **Modified [route.ts](file:///e:/my-shadcn-project/Version_3_testing-main/src/app/api/google-drive/auth/route.ts)**:
  - **Inconsistent Callers Resolution**: Enabled support for both `GET` (used by `GoogleDriveManager`, `page.tsx` routes) and `POST` (used by `GoogleDriveAuthRequired`, `create-actions`, `AdminAuthGuard`) request formats.
  - **JSON Response Format**: Replaced the server-side redirect (`NextResponse.redirect`) with a JSON response returning `{ success: true, authUrl, data: { authUrl } }` on both HTTP methods. This enables client-side `fetch` hooks to successfully parse the payload and redirect in the browser using `window.location.href = authUrl` without failing on HTML content.
  - **Type Safety**: Cast database return records safely to avoid compiler errors during TypeScript checks.

### 6. Domain Replacement & Redirection Fix (chameleon-nu.tech ➔ chameleon-nu.vercel.app)
- Replaced the deprecated domain name `chameleon-nu.tech` / `www.chameleon-nu.tech` with the active live domain `chameleon-nu.vercel.app` across all routes, middleware, and email templates:
  - **[security-middleware.ts](file:///e:/my-shadcn-project/Version_3_testing-main/src/lib/security-middleware.ts)**: Updated allowed origins for CORS validation.
  - **[explo/route.ts](file:///e:/my-shadcn-project/Version_3_testing-main/src/app/api/explo/route.ts)**: Updated the `HTTP-Referer` header for third-party API verification.
  - **[send-otp/route.ts](file:///e:/my-shadcn-project/Version_3_testing-main/src/app/api/send-otp/route.ts)**: Replaced website links in the HTML email template and updated the sender domain to `@chameleon-nu.vercel.app`.
  - **[middleware.ts](file:///e:/my-shadcn-project/Version_3_testing-main/src/middleware.ts)**: Added a global 308 permanent redirect rule that intercepts any requests pointing to `chameleon-nu.tech` and redirects the browser directly to `chameleon-nu.vercel.app`.
  - **[google-oauth.ts](file:///e:/my-shadcn-project/Version_3_testing-main/src/lib/google-oauth.ts)**, **[google-oauth-updated.ts](file:///e:/my-shadcn-project/Version_3_testing-main/src/lib/google-oauth-updated.ts)**, and **[drive-sharing.ts](file:///e:/my-shadcn-project/Version_3_testing-main/src/lib/drive-sharing.ts)**: Dynamically sanitizes `GOOGLE_REDIRECT_URI` before constructing Google OAuth clients to replace any deprecated domain settings on the fly.
  - **OAuth Callback Routes**: Replaced relative redirects (`new URL('/drive', request.url)`) with absolute sanitized redirections using `NEXT_PUBLIC_APP_URL` fallback, preventing browser session loss from landers on the deprecated domain. This applies to:
    - **[callback/google/route.ts](file:///e:/my-shadcn-project/Version_3_testing-main/src/app/api/auth/callback/google/route.ts)**
    - **[google-drive/callback/route.ts](file:///e:/my-shadcn-project/Version_3_testing-main/src/app/api/google-drive/callback/route.ts)**
    - **[google-drive/callback/route-updated.ts](file:///e:/my-shadcn-project/Version_3_testing-main/src/app/api/google-drive/callback/route-updated.ts)**
    - **[auth/callback/route.ts (Supabase OAuth Callback)](file:///e:/my-shadcn-project/Version_3_testing-main/src/app/api/auth/callback/route.ts)**
    - **[auth/callback/route.ts (Supabase Auth Callback)](file:///e:/my-shadcn-project/Version_3_testing-main/src/app/auth/callback/route.ts)**

---

## 💾 Database Setup Instructions

Please copy the following SQL script and execute it in your **Supabase Dashboard SQL Editor**:

```sql
-- 1. Create drive_access_rules table
CREATE TABLE IF NOT EXISTS public.drive_access_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  specialization text, -- e.g. 'Data Science', 'Cybersecurity'
  current_level integer, -- e.g. 1, 2, 3, 4
  folder_id text NOT NULL,
  folder_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on drive_access_rules
ALTER TABLE public.drive_access_rules ENABLE ROW LEVEL SECURITY;

-- 2. Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  admin_auth_id uuid NOT NULL REFERENCES public.chameleons(auth_id) ON DELETE CASCADE,
  admin_email text,
  admin_username text,
  action text NOT NULL,
  target_auth_id uuid REFERENCES public.chameleons(auth_id) ON DELETE SET NULL,
  target_email text,
  target_username text,
  details jsonb NOT NULL
);

-- Enable RLS on admin_audit_logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Setup RLS Policies

-- Policy for drive_access_rules: only super admins can manage
DROP POLICY IF EXISTS "Super admins can manage access rules" ON public.drive_access_rules;
CREATE POLICY "Super admins can manage access rules"
  ON public.drive_access_rules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chameleons
      WHERE chameleons.auth_id = auth.uid() AND chameleons.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chameleons
      WHERE chameleons.auth_id = auth.uid() AND chameleons.is_super_admin = true
    )
  );

-- Policy for admin_audit_logs: only super admins can view logs
DROP POLICY IF EXISTS "Super admins can select audit logs" ON public.admin_audit_logs;
CREATE POLICY "Super admins can select audit logs"
  ON public.admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chameleons
      WHERE chameleons.auth_id = auth.uid() AND chameleons.is_super_admin = true
    )
  );

-- Policy for admin_audit_logs: admins or super-admins can insert logs
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chameleons
      WHERE chameleons.auth_id = auth.uid() AND (chameleons.is_admin = true OR chameleons.is_super_admin = true)
    )
  );
```

> [!NOTE]
> **Super Admin Promotion**: I have already executed a script to update your account `poz659312@gmail.com` to `is_super_admin = true` and `is_admin = true` directly in your database. Once the tables above are created, you will have complete access immediately.

---

## 🧪 Manual Verification Steps

1. **Access the Console**: Start the dev server (`npm run dev`) and navigate to [http://localhost:3000/admin](http://localhost:3000/admin). Verify that you can access the page. Try logging out or using an account where `is_super_admin = false` to confirm it blocks access.
2. **Add an Access Rule**: 
   - Navigate to the **Folder Rules** tab.
   - Choose a Specialization (e.g. `Data Science`) and Level (e.g. `3`).
   - Paste a test Google Drive folder URL (or ID) and give it a name (e.g. "DS Level 3 Resources").
   - Click "Add Access Rule". Confirm it is added to the table.
3. **Change User Parameters**:
   - Navigate to the **User Directory** tab and find a test user.
   - Click **Manage** on the user row.
   - Change their specialization to `Data Science` and current level to `3`.
   - Click **Save Changes**.
   - Verify that the confirmation dialog pops up and displays the folder name you configured in step 2 under **Granting Folder Access**.
   - Click **Confirm & Apply**.
4. **Verify Drive Synchronization**:
   - Check the success toast notification.
   - Confirm that the student has received viewer access on the Google Drive folder.
   - Edit the user again, changing their level or specialization to a different value. Verify that the confirmation dialog lists the folder to be revoked under **Revoking Folder Access**.
5. **Verify Audit Logs**:
   - Navigate to the **Audit Logs** tab.
   - Confirm that your profile update and rule creation/deletion actions are recorded with timestamps, administrator credentials, and precise changes payloads.
