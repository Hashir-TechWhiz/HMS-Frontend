# Housekeeping Roster - Records Not Showing Fix

## Issue
When housekeepers accessed the roster page (`/dashboard/roster`), no records were showing even though they had assigned cleaning tasks.

## Root Cause
The `RosterManagementPage` component was using `getTasksByDate` API for all roles, which requires a `hotelId` parameter. However, housekeepers should use the `getMyTasks` API endpoint which automatically fetches tasks assigned to the logged-in housekeeper.

## Solution

### Frontend Fix
**File**: `src/components/page-components/dashboard/RosterManagementPage.tsx`

#### 1. Added Import
```typescript
import {
    getTasksByDate,
    getMyTasks,  // ← ADDED
    assignTask,
    updateTaskStatus,
    generateDailyTasks,
    getHotelStaffByRole
} from "@/services/housekeepingService";
```

#### 2. Updated fetchTasks Function
Changed the logic to use different API endpoints based on user role:

```typescript
const fetchTasks = useCallback(async () => {
    try {
        setLoading(true);

        // Housekeepers use getMyTasks endpoint
        if (role === "housekeeping") {
            const response = await getMyTasks({
                date: new Date().toISOString(),
                session: filterSession === "all" ? undefined : filterSession,
                status: filterStatus === "all" ? undefined : filterStatus,
            });

            if (response.success) {
                setTasks(response.data || []);
            }
            return;
        }

        // Admin and receptionist use getTasksByDate endpoint
        let hotelId = filterHotel;
        if (role === "receptionist") {
            hotelId = selectedHotel?._id || user?.hotelId || "";
        }

        const response = await getTasksByDate({
            hotelId,
            date: new Date().toISOString(),
            session: filterSession === "all" ? undefined : filterSession,
            status: filterStatus === "all" ? undefined : filterStatus,
        });

        if (response.success) {
            setTasks(response.data || []);
        }
    } catch (error) {
        toast.error("An error occurred while fetching tasks");
    } finally {
        setLoading(false);
    }
}, [role, user, selectedHotel, filterSession, filterStatus, filterHotel]);
```

## API Endpoints Used

### For Housekeepers:
**GET** `/api/housekeeping/my-tasks`
- Automatically fetches tasks assigned to the logged-in housekeeper
- No `hotelId` required (uses user's hotel from auth context)
- Filters by date, session, and status

### For Admin/Receptionist:
**GET** `/api/housekeeping/tasks`
- Requires `hotelId` parameter
- Fetches all tasks for the specified hotel
- Filters by date, session, and status

## How It Works Now

### Housekeeper Flow:
1. Navigate to `/dashboard/roster`
2. Component calls `getMyTasks({ date: today })`
3. Backend queries: `{ hotelId: user.hotelId, assignedTo: user._id, date: today }`
4. Returns all cleaning tasks assigned to that housekeeper
5. Frontend displays tasks in table

### Admin/Receptionist Flow:
1. Navigate to `/dashboard/roster`
2. Select hotel (admin) or use assigned hotel (receptionist)
3. Component calls `getTasksByDate({ hotelId, date: today })`
4. Backend queries: `{ hotelId, date: today }`
5. Returns all cleaning tasks for that hotel
6. Frontend displays tasks with assignment controls

## What Housekeepers See

**Roster Page** (`/dashboard/roster`):
```
My Cleaning Tasks
View and manage your assigned cleaning tasks for today

Filters: [All Sessions ▼] [All Status ▼]

┌────────────────────────────────────────────────────────┐
│ Room │ Session   │ Type    │ Priority │ Status        │
├────────────────────────────────────────────────────────┤
│ 101  │ MORNING   │ ROUTINE │ Normal   │ Pending       │
│ 102  │ MORNING   │ ROUTINE │ Normal   │ In Progress   │
│ 103  │ AFTERNOON │ ROUTINE │ Normal   │ Pending       │
└────────────────────────────────────────────────────────┘
```

## Testing

### To Verify:
1. **Generate cleaning tasks** (as admin):
   - Go to `/dashboard/roster`
   - Click "Generate Tasks"
   - Tasks are automatically assigned to housekeepers

2. **Log in as housekeeper**:
   - Navigate to `/dashboard/roster`
   - Should see assigned tasks immediately
   - Can filter by session and status

3. **Check browser console**:
   - Should see: `Fetching cleaning tasks for user: <userId>`
   - Should see: `Cleaning tasks response: { success: true, data: [...] }`

### Expected Behavior:
- **Before**: Empty table with "No cleaning tasks assigned to you for today"
- **After**: Table showing all assigned cleaning tasks with room details

## Related Fixes

This fix works in conjunction with:
1. **Backend Fix**: `getMyTasks` using `currentUser._id` instead of `currentUser.id`
2. **Navigation Fix**: Housekeepers can see "Housekeeping Roster" link
3. **Dashboard Fix**: Dashboard shows combined cleaning tasks + service requests

## Files Modified

1. `src/components/page-components/dashboard/RosterManagementPage.tsx`
   - Added `getMyTasks` import
   - Updated `fetchTasks` to use role-based API calls

## Status
✅ **FIXED** - Housekeepers can now see their assigned cleaning tasks in the roster page
