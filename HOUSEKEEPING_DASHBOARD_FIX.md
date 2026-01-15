# Housekeeping Dashboard Enhancement

## Issue
Cleaning sessions (housekeeping roster tasks) were showing in the admin dashboard but not appearing in the housekeeper's dashboard. Housekeepers could only see service requests, not their assigned cleaning tasks.

## Root Cause
The `HousekeepingDashboard` component was only fetching and displaying service requests from the `ServiceRequest` collection, but cleaning sessions are stored in the `HousekeepingRoster` collection.

## Solution Implemented

### 1. Enhanced HousekeepingDashboard Component
**File**: `src/components/page-components/dashboard/HousekeepingDashboard.tsx`

#### Changes Made:
- **Added cleaning tasks fetching**: Now fetches both cleaning tasks (via `getMyTasks()`) and service requests
- **Combined statistics**: Dashboard now shows combined stats from both cleaning tasks and service requests
- **Updated KPI cards**: 
  - "Pending Tasks" includes both cleaning tasks and service requests
  - "In Progress" shows combined count
  - "Completed Today" counts both types of tasks
- **Enhanced chart**: Chart title changed to "All Assigned Tasks by Status" with description showing breakdown
- **Added quick actions**: Two action cards:
  - "View Cleaning Tasks" → Links to `/dashboard/roster`
  - "View Service Requests" → Links to `/dashboard/service-requests`

#### Statistics Breakdown:
```typescript
// Cleaning tasks stats
cleaningStats = {
    total: cleaningTasks.length,
    pending: pending cleaning tasks,
    in_progress: in-progress cleaning tasks,
    completed: completed cleaning tasks
}

// Service requests stats
serviceStats = {
    total: serviceRequests.length,
    pending: unassigned service requests,
    in_progress: assigned in-progress requests,
    completed: assigned completed requests
}

// Combined stats (shown in KPI cards)
stats = {
    total: cleaningStats.total + serviceStats.total,
    pending: cleaningStats.pending + serviceStats.pending,
    in_progress: cleaningStats.in_progress + serviceStats.in_progress,
    completed: cleaningStats.completed + serviceStats.completed
}
```

### 2. Updated RosterManagementPage for Housekeepers
**File**: `src/components/page-components/dashboard/RosterManagementPage.tsx`

#### Changes Made:
- **Removed access block**: Housekeepers can now access the roster page
- **Added housekeeping view**: Shows "My Cleaning Tasks" interface for housekeepers
- **Filtered columns**: Removes "Actions" column for housekeepers (they can't reassign tasks)
- **Session and status filters**: Housekeepers can filter by session (MORNING/AFTERNOON/EVENING) and status
- **Read-only view**: Housekeepers can view their tasks but cannot assign/reassign them

#### Housekeeping View Features:
- Title: "My Cleaning Tasks"
- Description: "View and manage your assigned cleaning tasks for today"
- Filters: Session (All/MORNING/AFTERNOON/EVENING) and Status (All/Pending/In Progress/Completed)
- Table shows: Room, Session, Type, Priority, Assigned To, Status
- Empty state: "No cleaning tasks assigned to you for today."

## User Experience Flow

### For Housekeepers:

1. **Dashboard** (`/dashboard`):
   - See total pending tasks (cleaning + service requests)
   - See in-progress tasks
   - See completed tasks today
   - View chart showing task breakdown
   - Click "View Cleaning Tasks" to see cleaning roster
   - Click "View Service Requests" to see service requests

2. **Cleaning Tasks** (`/dashboard/roster`):
   - See all cleaning tasks assigned to them for today
   - Filter by session (MORNING/AFTERNOON/EVENING)
   - Filter by status (Pending/In Progress/Completed)
   - View room details, session time, priority, and status

3. **Service Requests** (`/dashboard/service-requests`):
   - See assigned service requests
   - Update status of requests

### For Admin/Receptionist:

- **Dashboard**: See hotel-wide statistics
- **Roster Management** (`/dashboard/roster`): Full roster management with assignment capabilities
- **Service Requests**: Manage and assign service requests

## API Endpoints Used

### Housekeeping Dashboard:
```
GET /api/housekeeping/my-tasks?date=<today>
GET /api/service-requests/assigned
```

### Roster Page (Housekeeping):
```
GET /api/housekeeping/tasks?date=<today>&session=<filter>&status=<filter>
```

## Benefits

✅ **Complete Visibility**: Housekeepers now see ALL their assigned work in one place  
✅ **Better Organization**: Separate views for cleaning tasks vs service requests  
✅ **Accurate Statistics**: Dashboard shows combined workload from both sources  
✅ **Improved UX**: Clear navigation with dedicated quick action buttons  
✅ **Role-Based Access**: Housekeepers see read-only view, admins see full management  

## Files Modified

1. `src/components/page-components/dashboard/HousekeepingDashboard.tsx`
2. `src/components/page-components/dashboard/RosterManagementPage.tsx`

## Testing Checklist

- [x] Housekeepers can see cleaning tasks in dashboard
- [x] Housekeepers can access roster page
- [x] Housekeepers see their assigned tasks only
- [x] Statistics correctly combine cleaning tasks and service requests
- [x] Quick action buttons navigate to correct pages
- [x] Filters work correctly on roster page
- [x] Admin/receptionist still have full access
- [x] No access control issues

## Screenshots/Examples

### Housekeeper Dashboard:
- **Pending Tasks**: 5 (3 cleaning + 2 service requests)
- **In Progress**: 2 (1 cleaning + 1 service request)
- **Completed Today**: 8 (6 cleaning + 2 service requests)
- **Chart**: Shows breakdown of all 15 tasks

### Housekeeper Roster View:
- Shows only tasks assigned to logged-in housekeeper
- Filters by session and status
- Read-only (no assignment actions)
