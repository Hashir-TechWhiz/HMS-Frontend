# HMS Enhancement Implementation Plan

## Overview
This document outlines the implementation plan for enhancing the Smart Hotel Management System with:
1. Guest Check-In & Check-Out workflow
2. Service request catalog with pricing & invoicing
3. Automated invoice generation
4. Automated post-checkout cleaning requests
5. Housekeeping roster system (3 cleanings per room per day)

## Current State Analysis

### ✅ Already Implemented
Based on codebase review, the following features are **ALREADY IMPLEMENTED**:

1. **Check-In Feature**
   - ✅ Backend: `checkInBooking()` in `bookingService.js` (lines 716-779)
   - ✅ Frontend: `CheckInForm.tsx` component
   - ✅ Booking model has `isCheckedIn`, `checkInDetails` fields
   - ✅ Status changes: `confirmed` → `checkedin`
   - ✅ Validates: NIC/Passport, Nationality, Phone (+94), Country, Visa Details

2. **Check-Out Feature**
   - ✅ Backend: `checkOutBooking()` in `bookingService.js` (lines 781-849)
   - ✅ Frontend: `CheckOutInvoiceFlow.tsx` component
   - ✅ Booking model has `isCheckedOut`, `checkOutDetails` fields
   - ✅ Status changes: `checkedin` → `completed`
   - ✅ Requires invoice to be paid before checkout
   - ✅ Auto-triggers cleaning request after checkout (line 837)

3. **Invoice System**
   - ✅ Backend: `Invoice.js` model with all required fields
   - ✅ Backend: `invoiceService.js` with generate, get, update payment methods
   - ✅ Frontend: Invoice display in `CheckOutInvoiceFlow.tsx`
   - ✅ Includes room charges and service charges
   - ✅ Payment status tracking (pending, paid, partially_paid)

4. **Service Catalog**
   - ✅ Backend: `ServiceCatalog.js` model
   - ✅ Backend: `serviceCatalogService.js`
   - ✅ Frontend: `ServiceCatalogPage.tsx` and `ServiceCatalogForm.tsx`
   - ✅ Fixed pricing for services
   - ✅ Service types: food_service, medical_assistance, massage, gym_access, yoga_session, laundry, spa, transport, room_decoration, maintenance, other

5. **Service Requests**
   - ✅ Backend: `ServiceRequest.js` model with fixedPrice and finalPrice
   - ✅ Backend: Auto-assigns role based on service type
   - ✅ Frontend: Service request forms and pages

6. **Housekeeping Roster**
   - ✅ Backend: `HousekeepingRoster.js` model
   - ✅ Backend: `housekeepingRosterService.js`
   - ✅ Shifts: morning, afternoon, night
   - ✅ Task types: routine, checkout_cleaning
   - ✅ Frontend: Roster page exists

7. **Auto-Cleaning After Checkout**
   - ✅ Backend: Implemented in `checkOutBooking()` (line 835-841)
   - ✅ Calls `createCheckoutCleaningRequest()`

## Required Enhancements

### 1. Guest Check-In Button Visibility (Frontend)
**Status**: Needs Implementation
**Location**: `BookingsPage.tsx`

**Tasks**:
- Add "Check-In" button to booking details/actions
- Show button ONLY when:
  - `booking.status === 'confirmed'`
  - `booking.isCheckedIn === false`
- Open `CheckInForm` modal on click
- Refresh booking list after successful check-in

### 2. Guest Check-Out Button & Flow (Frontend)
**Status**: Partially Implemented
**Location**: `BookingsPage.tsx`

**Tasks**:
- Add "Check-Out" button to booking details/actions
- Show button ONLY when:
  - `booking.status === 'checkedin'`
  - `booking.isCheckedOut === false`
- Open `CheckOutInvoiceFlow` modal on click
- Flow already handles:
  - Invoice generation
  - Payment settlement
  - Final checkout

### 3. Service Request Integration with Service Catalog
**Status**: Needs Enhancement
**Location**: Backend `serviceRequestService.js`, Frontend `ServiceRequestForm.tsx`

**Tasks**:
- **Backend**:
  - Modify `createServiceRequest()` to fetch `fixedPrice` from ServiceCatalog
  - Set `fixedPrice` on ServiceRequest when created
  - For "other" service type, allow admin to set `finalPrice` after completion
  - Ensure completed services add to invoice

- **Frontend**:
  - Update `ServiceRequestForm` to fetch and display service catalog
  - Show price from catalog when service type is selected
  - For "other", show that price will be determined by admin

### 4. Housekeeping Roster Auto-Generation
**Status**: Needs Implementation
**Location**: Backend `housekeepingRosterService.js`

**Tasks**:
- Create scheduled job/cron to auto-generate daily roster
- For each hotel:
  - Get all rooms
  - For each room, create 3 tasks (morning, afternoon, night)
  - Assign to housekeeping staff with balanced workload
- Frontend: Display daily roster tasks for housekeeping staff

### 5. Multi-Hotel Isolation Enforcement
**Status**: Needs Verification
**Location**: All services

**Tasks**:
- Verify all queries filter by `hotelId`
- Verify staff assignments are hotel-scoped
- Verify invoices, rosters, service requests are hotel-scoped

## Implementation Steps

### Phase 1: Frontend Check-In/Check-Out Buttons
1. Update `BookingsPage.tsx` to show Check-In button
2. Update `BookingsPage.tsx` to show Check-Out button
3. Wire up existing modal components
4. Test complete flow

### Phase 2: Service Catalog Integration
1. Update backend `createServiceRequest()` to fetch catalog pricing
2. Update backend to handle "other" service pricing
3. Update frontend form to show catalog prices
4. Test service request → invoice flow

### Phase 3: Housekeeping Roster Automation
1. Create roster auto-generation function
2. Add cron job or scheduled task
3. Update frontend to display daily tasks
4. Test balanced assignment logic

### Phase 4: Testing & Validation
1. Test multi-hotel isolation
2. Test complete guest journey:
   - Book → Confirm → Check-In → Request Service → Check-Out
3. Test invoice generation with services
4. Test auto-cleaning after checkout
5. Test roster generation and assignment

## Files to Modify

### Backend
- `src/services/serviceRequestService.js` - Add catalog pricing integration
- `src/services/housekeepingRosterService.js` - Add auto-generation
- `src/controllers/serviceRequests/serviceRequestController.js` - Update endpoints if needed

### Frontend
- `src/components/page-components/dashboard/BookingsPage.tsx` - Add buttons
- `src/components/page-components/dashboard/ServiceRequestForm.tsx` - Show catalog prices
- `src/app/dashboard/roster/page.tsx` - Display daily tasks

## Success Criteria
- ✅ Guest can check-in from booking details
- ✅ Guest can check-out after invoice is paid
- ✅ Service requests show pricing from catalog
- ✅ Invoices include all completed services
- ✅ Auto-cleaning request created after checkout
- ✅ Daily roster auto-generated for all rooms (3 shifts)
- ✅ All operations are hotel-scoped
- ✅ RBAC enforced on all endpoints
