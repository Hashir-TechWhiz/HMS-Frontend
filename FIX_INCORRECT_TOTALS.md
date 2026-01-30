# Fix: Incorrect Payment Totals (Quick Recalculate Button)

## Problem
When services are completed after payment, the frontend may show outdated totals:
- Shows: Total LKR 2,740 (wrong)
- Should Show: Total LKR 4,740 (correct - includes new services)

## Root Cause
The booking document in database has old `totalAmount` that wasn't recalculated when services were completed.

## Solution Implemented

### Added "Recalculate" Button

Now on the Payments page, if a booking has services, you'll see a **"Recalculate" button** that:
1. Fetches all completed services
2. Recalculates room charges + service charges
3. Updates totalAmount in database
4. Refreshes the display with correct values

## How to Use

### Step 1: Identify Problem Booking
Look for booking showing incorrect total (e.g., LKR 2,740 when should be 4,740)

### Step 2: Click "Recalculate" Button
- On the Payments page
- Find the booking with services
- Click the small **"Recalculate"** button below "Make Payment"

### Step 3: Wait for Confirmation
- Toast message: "Booking amounts recalculated! Refreshing..."
- Page automatically refreshes
- New total should now be correct

## What the Recalculate Does

```javascript
1. Finds the booking in database
2. Calculates room charges (nights × price per night)
3. Fetches ALL completed service requests
4. Sums up service charges
5. Updates:
   - booking.roomCharges
   - booking.serviceCharges
   - booking.totalAmount (room + services)
   - booking.paymentStatus (based on paid vs total)
6. Saves to database
7. Returns updated values
```

## Files Changed

### Backend:
- ✅ `src/controllers/bookings/recalculateBookingController.js` - NEW controller
- ✅ `src/routes/bookingRoutes.js` - Added `/api/bookings/:id/recalculate` route

### Frontend:
- ✅ `src/services/bookingService.ts` - Added `recalculateBookingAmounts()` function
- ✅ `src/app/dashboard/payments/page.tsx` - Added recalculate button

## API Endpoint

```
POST /api/bookings/:id/recalculate
```

**Authorization:** Admin, Receptionist

**Response:**
```json
{
  "success": true,
  "message": "Booking amounts recalculated successfully",
  "data": {
    "bookingId": "...",
    "roomCharges": 740,
    "serviceCharges": 4000,
    "totalAmount": 4740,
    "totalPaid": 2740,
    "balance": 2000,
    "paymentStatus": "partially_paid",
    "completedServicesCount": 2
  }
}
```

## Console Output

When you click recalculate, check backend terminal:

```
=== RECALCULATING BOOKING 67a1b2c3... ===
BEFORE:
  Room Charges: 740
  Service Charges: 0
  Total Amount: 2740
  Total Paid: 2740
  Payment Status: paid

Found 2 completed services:
  1. cleaning: LKR 2000
  2. cleaning: LKR 2000

AFTER:
  Room Charges: 740
  Service Charges: 4000
  Total Amount: 4740
  Total Paid: 2740
  Balance: 2000
  Payment Status: partially_paid
=== RECALCULATION COMPLETE ===
```

## When to Use Recalculate

Use the recalculate button when:
- ✅ Services completed after payment made
- ✅ Total showing wrong amount
- ✅ Balance showing LKR 0 but services unpaid
- ✅ Payment status showing "paid" but should be "partially_paid"

## Prevention

To prevent this issue in future:
1. ✅ Already fixed: Service completion now updates booking automatically
2. ✅ For old bookings: Use recalculate button to fix

## Alternative: Manual Database Fix

If recalculate button doesn't work, manually update in MongoDB:

```javascript
db.bookings.updateOne(
  { _id: ObjectId("booking-id-here") },
  {
    $set: {
      roomCharges: 740,
      serviceCharges: 4000,  // Sum of all completed services
      totalAmount: 4740,     // room + services
      paymentStatus: "partially_paid"
    }
  }
)
```

## Troubleshooting

### Issue: Recalculate button not showing
**Solution:** Button only shows if booking has services. Check if `serviceDetails` array has items.

### Issue: Recalculate fails with "Access denied"
**Solution:** Only admin and receptionist can recalculate. Guests cannot.

### Issue: Still showing wrong total after recalculate
**Solution:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear browser cache
3. Check backend console for errors

### Issue: Backend gives 404 error
**Solution:** Restart backend server to load new route:
```bash
Ctrl+C
npm run dev
```

## Guest Checkout Feature

### Also Added: Guests Can Now Check Out

Changed checkout route authorization from:
```javascript
// Before: Only staff could checkout
authorize("receptionist", "admin")

// After: Guests can also checkout
authorize("guest", "receptionist", "admin")
```

**What this means:**
- Guests can now initiate their own checkout
- System still validates payment is complete
- System still requires check-in before checkout
- Invoice is automatically generated and emailed

## Summary

**Quick Fix:** Click the **"Recalculate" button** on any booking with incorrect totals!

The button:
- ✅ Recalculates all charges
- ✅ Updates database
- ✅ Refreshes display
- ✅ Shows correct balance
- ✅ Updates payment status

**One-Click Solution!** 🎉
