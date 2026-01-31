# Service Details Enhancement - Individual Service Breakdown

## Overview
Enhanced the payment system to display **individual service charges** as line items instead of showing only a single "Service Charges" total. Now users can see exactly which services were ordered and their individual costs.

## Problem
Previously, when multiple services were added to a booking (e.g., Room Service, Spa, Laundry), the payment view only showed:
```
Service Charges: LKR 2,000
```

This didn't show what services made up that total.

## Solution
Now the payment view shows a detailed breakdown:
```
Room Charges: LKR 740

Service Charges:
• Room Service: LKR 500
• Spa Service: LKR 1,200
• Laundry Service: LKR 300
Total Services: LKR 2,000
---
Total: LKR 2,740
```

## Changes Made

### Backend Changes

#### **Payment Service (`BE/HMS-Backend/src/services/paymentService.js`)**

1. **Added `formatServiceType()` method**
   - Converts service type codes to human-readable names
   - Example: `room_service` → "Room Service"
   - Handles all service types: cleaning, spa, laundry, etc.

2. **Enhanced `getBookingPayments()` method**
   - Fetches completed service requests for the booking
   - Returns `serviceDetails` array with individual service information:
     ```javascript
     serviceDetails: [
       {
         serviceType: "room_service",
         description: "Room Service",
         price: 500,
         completedAt: "2024-01-15T10:30:00Z"
       },
       // ... more services
     ]
     ```

3. **Enhanced `getMyPayments()` method** (Guest payments)
   - Batch fetches service requests for all bookings
   - Groups services by booking ID for efficient lookup
   - Adds `serviceDetails` to each booking in response

4. **Enhanced `getAllPayments()` method** (Admin/Receptionist payments)
   - Same batch fetching and grouping logic
   - Adds `serviceDetails` to all payment records

### Frontend Changes

#### **Payment Service Types (`src/services/paymentService.ts`)**

1. **Added `ServiceDetail` interface**
   ```typescript
   export interface ServiceDetail {
       serviceType: string;
       description: string;
       price: number;
       completedAt: string;
   }
   ```

2. **Updated `BookingPaymentsResponse` interface**
   - Added `serviceDetails: ServiceDetail[]`

3. **Updated `MyPaymentsResponse` interface**
   - Added `serviceDetails: ServiceDetail[]` to payment items

#### **Make Payment Dialog (`src/components/page-components/dashboard/MakePaymentDialog.tsx`)**

1. **Added `serviceDetails` prop**
   - Receives array of individual services

2. **Enhanced charges breakdown display**
   - Shows "Room Charges" as before
   - NEW: Shows "Service Charges:" header
   - Lists each service as a line item with icon
   - Shows "Total Services" summary
   - Fallback to simple "Service Charges" if details not available

3. **Visual improvements**
   - Indented service items for better hierarchy
   - Smaller icons for service line items
   - Border separator for totals
   - Maintains consistent formatting

#### **Payments Page (`src/app/dashboard/payments/page.tsx`)**

1. **Updated booking list display**
   - Shows individual services with bullet points
   - Indented under charges breakdown
   - Format: `• Service Description: LKR X,XXX`

2. **Pass serviceDetails to payment dialog**
   - Extracts from booking data
   - Defaults to empty array if not present

## Features

### ✅ Individual Service Visibility
- Each completed service shown as separate line item
- Service name/description clearly displayed
- Individual price for each service
- Completion timestamp available (not displayed in UI but in data)

### ✅ Hierarchical Display
- Room charges at top level
- Service charges grouped with header
- Individual services indented
- Total services shown as summary

### ✅ Backward Compatibility
- Falls back to simple "Service Charges: X" if details not available
- Works with old bookings that don't have service details
- Gracefully handles empty service arrays

### ✅ Performance Optimized
- Batch fetches all service requests in one query
- Groups by booking ID to avoid N+1 queries
- Only fetches completed services
- Minimal data in response (only needed fields)

## Service Type Mapping

The system automatically formats service type codes to readable names:

| Service Type Code | Display Name |
|------------------|--------------|
| `cleaning` | Room Cleaning |
| `housekeeping` | Housekeeping Service |
| `maintenance` | Maintenance Service |
| `room_service` | Room Service |
| `food_service` | Food Service |
| `medical_assistance` | Medical Assistance |
| `massage` | Massage Service |
| `gym_access` | Gym Access |
| `yoga_session` | Yoga Session |
| `laundry` | Laundry Service |
| `spa` | Spa Service |
| `transport` | Transport Service |
| `room_decoration` | Room Decoration |
| `other` | Other Service |

## API Response Structure

### Before (Old):
```json
{
  "roomCharges": 740,
  "serviceCharges": 2000,
  "totalAmount": 2740
}
```

### After (New):
```json
{
  "roomCharges": 740,
  "serviceCharges": 2000,
  "serviceDetails": [
    {
      "serviceType": "room_service",
      "description": "Room Service",
      "price": 500,
      "completedAt": "2024-01-15T10:30:00Z"
    },
    {
      "serviceType": "spa",
      "description": "Spa Service",
      "price": 1200,
      "completedAt": "2024-01-15T14:00:00Z"
    },
    {
      "serviceType": "laundry",
      "description": "Laundry Service",
      "price": 300,
      "completedAt": "2024-01-15T16:00:00Z"
    }
  ],
  "totalAmount": 2740
}
```

## User Experience

### Guest View (Payments Page)
```
┌─────────────────────────────────────────┐
│ Deluxe Room 301                         │
│ Status: Partially Paid                  │
│                                         │
│ Room Charges:           LKR 740        │
│ • Room Service:         LKR 500        │
│ • Spa Service:          LKR 1,200      │
│ • Laundry Service:      LKR 300        │
│ ─────────────────────────────────────  │
│ Total:                  LKR 2,740      │
│ Paid:                   LKR 1,000      │
│ Balance:                LKR 1,740      │
│                                         │
│ [Make Payment]                          │
└─────────────────────────────────────────┘
```

### Payment Dialog View
```
┌─────────────────────────────────────────┐
│ Make Payment                            │
│                                         │
│ Payment Summary                         │
│ Total Amount          LKR 2,740        │
│                                         │
│  📄 Room Charges      LKR 740          │
│                                         │
│  Service Charges:                       │
│    📄 Room Service     LKR 500         │
│    📄 Spa Service      LKR 1,200       │
│    📄 Laundry Service  LKR 300         │
│  ─────────────────────────────────────  │
│    Total Services      LKR 2,000       │
│                                         │
│ Already Paid          LKR 1,000        │
│ Balance Due           LKR 1,740        │
│                                         │
│ [Select Payment Method]                 │
└─────────────────────────────────────────┘
```

## Testing

### ✅ Test Scenarios

1. **Single Service**
   - Add one service (e.g., Room Service)
   - Complete the service
   - View payment page
   - Expected: Shows "Room Service: LKR X"

2. **Multiple Services**
   - Add 3+ services
   - Complete all services
   - View payment page
   - Expected: All services listed individually with total

3. **No Services**
   - Booking with only room charges
   - View payment page
   - Expected: Only room charges shown, no service section

4. **Old Bookings (Before Enhancement)**
   - Access booking created before this update
   - Expected: Falls back to "Service Charges: X" display

5. **Mixed Status Services**
   - Add 5 services
   - Complete only 2 services
   - Expected: Only 2 completed services shown in charges

## Future Enhancements

- [ ] Add service completion date/time in UI
- [ ] Group services by category (Food, Wellness, Housekeeping)
- [ ] Add service provider/staff name who completed it
- [ ] Add option to view pending (not completed) services
- [ ] Export service breakdown to PDF/Excel
- [ ] Add service icons based on type
- [ ] Show service duration if applicable
- [ ] Add service rating/feedback option

## Benefits

1. **Transparency**: Guests see exactly what they're paying for
2. **Clarity**: Easy to verify charges against services received
3. **Trust**: Detailed breakdown builds customer confidence
4. **Audit Trail**: Complete record of all services and costs
5. **Dispute Resolution**: Easy to identify and discuss specific charges
6. **Billing Accuracy**: Verify all services are accounted for

## Impact on Existing System

- ✅ **Backward Compatible**: Old bookings still work
- ✅ **No Breaking Changes**: All existing APIs still function
- ✅ **Performance**: Optimized batch queries prevent slowdown
- ✅ **Data Integrity**: No changes to database schema required
- ✅ **UI Graceful**: Falls back if details unavailable

## Conclusion

This enhancement provides complete transparency in billing by showing individual service charges instead of just a total. Users can now see exactly what services they ordered, what each service cost, and verify their charges against the services they received. The implementation is efficient, backward-compatible, and provides a better user experience for both guests and staff.
