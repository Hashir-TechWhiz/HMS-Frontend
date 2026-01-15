# Housekeeping Roster Navigation Access

## Issue
Housekeepers could not see the "Housekeeping Roster" link in the dashboard navigation sidebar, preventing them from accessing their cleaning tasks page.

## Root Cause
The route permissions in `src/lib/auth/permissions.ts` only allowed `admin` role to access `/dashboard/roster`. The navigation links are dynamically filtered based on user role, so housekeepers couldn't see the link.

## Solution

### File Modified
**File**: `src/lib/auth/permissions.ts`

**Line 15**: Changed from:
```typescript
'/dashboard/roster': ['admin'],
```

To:
```typescript
'/dashboard/roster': ['receptionist', 'housekeeping', 'admin'],
```

## How It Works

### Navigation System:
1. **Dashboard Links** (`src/lib/dashboardLinks.ts`):
   - Defines all navigation links
   - Each link has a `roles` array from `getAllowedRoles(route)`

2. **Permissions** (`src/lib/auth/permissions.ts`):
   - Maps routes to allowed roles
   - Used by navigation to filter visible links

3. **Sidebar** (`src/components/common/sidebar/appSidebar.tsx`):
   - Renders navigation based on user's role
   - Only shows links the user has permission to access

### User Experience:

#### **For Housekeepers:**
Now they will see in the sidebar under "Management" section:
```
Management
  ├─ Service Requests
  └─ Housekeeping Roster  ← NOW VISIBLE!
```

#### **For Receptionists:**
They will also see:
```
Management
  ├─ Operations Hub
  ├─ Bookings
  ├─ Service Requests
  └─ Housekeeping Roster  ← Can manage roster
```

#### **For Admins:**
Full access to all links (unchanged)

## What Housekeepers Can Do Now

1. **See Navigation Link**: "Housekeeping Roster" appears in sidebar
2. **Click to Access**: Goes to `/dashboard/roster`
3. **View Their Tasks**: See "My Cleaning Tasks" page with:
   - All cleaning sessions assigned to them for today
   - Filter by session (MORNING/AFTERNOON/EVENING)
   - Filter by status (Pending/In Progress/Completed)
   - Room details, session time, priority, status

## Complete User Flow

### Housekeeper Login → Dashboard:
1. **Dashboard** shows statistics (cleaning tasks + service requests)
2. **Sidebar** shows "Housekeeping Roster" link
3. **Click** "Housekeeping Roster"
4. **See** "My Cleaning Tasks" page
5. **Filter** and view assigned tasks

### Alternative Access:
- Dashboard → Quick Action: "View Cleaning Tasks" button
- Direct URL: `/dashboard/roster`

## Files Modified

1. `src/lib/auth/permissions.ts` - Added housekeeping and receptionist to roster route

## Related Components

- `src/lib/dashboardLinks.ts` - Navigation links configuration
- `src/components/common/sidebar/appSidebar.tsx` - Sidebar component
- `src/components/page-components/dashboard/RosterManagementPage.tsx` - Roster page with role-based views

## Testing

### To Verify:
1. **Log in as housekeeper**
2. **Check sidebar** - "Housekeeping Roster" should be visible under "Management"
3. **Click the link** - Should navigate to `/dashboard/roster`
4. **See** "My Cleaning Tasks" page (not "Access Denied")

### Expected Behavior:
- **Before**: No "Housekeeping Roster" link visible, only "Service Requests"
- **After**: Both "Service Requests" and "Housekeeping Roster" links visible

## Status
✅ **FIXED** - Housekeepers can now access the roster page via sidebar navigation
