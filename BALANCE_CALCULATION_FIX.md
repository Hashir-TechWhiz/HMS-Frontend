# Balance Calculation Fix - Service Charges Not Adding Up

## Issue
When multiple services are completed, the second (and subsequent) services were **not being added** to the booking's total amount, causing the balance to show as LKR 0 even though services remain unpaid.

### Example:
- Room Charges: LKR 740
- Service 1: LKR 2,000 ✓ Completed
- Service 2: LKR 2,000 ✓ Completed
- Payment Made: LKR 2,740

**Before Fix:**
- Total: LKR 2,740 ❌ (Only showing room + 1 service)
- Paid: LKR 2,740
- Balance: LKR 0 ❌ (Should be 2,000)

**After Fix:**
- Total: LKR 4,740 ✓ (Room + Service 1 + Service 2)
- Paid: LKR 2,740
- Balance: LKR 2,000 ✓ (Unpaid for Service 2)

## Root Cause

In `serviceRequestService.js`, the order of operations was incorrect:

```javascript
// ❌ BEFORE (Wrong Order):
1. Set serviceRequest.status = "completed"
2. Query for completed services  // Current service NOT saved yet!
3. Calculate totals (missing current service)
4. Save serviceRequest
```

The query for completed services happened **before** the current service was saved, so it wasn't included in the calculation.

## Solution

Fixed the order of operations:

```javascript
// ✅ AFTER (Correct Order):
1. Set serviceRequest.status = "completed"
2. Set completedAt and finalPrice
3. Save serviceRequest FIRST  // Now it's saved!
4. Query for completed services  // Now includes current service
5. Calculate totals (includes all services)
6. Update booking
```

## File Changed

**`BE/HMS-Backend/src/services/serviceRequestService.js`**

### Key Changes:

1. **Moved `await serviceRequest.save()`** to happen **BEFORE** querying completed services
2. **Added console logs** for debugging:
   - Shows room charges
   - Shows number of completed services
   - Shows total service charges
   - Shows new total amount
   - Shows payment status

## Testing

### Test Scenario 1: Add Services One by One
1. ✅ Create booking (Room: 1000)
2. ✅ Complete Service 1 (500)
   - Check: Total should be 1500
3. ✅ Complete Service 2 (300)
   - Check: Total should be 1800
4. ✅ Make payment (1500)
   - Check: Balance should be 300

### Test Scenario 2: Multiple Services Before Payment
1. ✅ Create booking (Room: 740)
2. ✅ Complete Service 1 (2000)
3. ✅ Complete Service 2 (2000)
   - Check: Total should be 4740
4. ✅ Make payment (2740)
   - Check: Balance should be 2000
   - Check: Status should be "partially_paid"

### Test Scenario 3: Complete Services After Full Payment
1. ✅ Create booking (Room: 1000)
2. ✅ Make payment (1000) - Status: "paid"
3. ✅ Complete Service 1 (500)
   - Check: Total should be 1500
   - Check: Balance should be 500
   - Check: Status should change to "partially_paid"

## Console Output

When a service is marked as complete, you'll now see logs like this in your terminal:

```
[Payment Update] Booking 65a1b2c3d4e5f6g7h8i9j0k1:
  - Room Charges: 740
  - Completed Services: 2
  - Total Service Charges: 4000
  - New Total Amount: 4740
  - Total Paid: 2740
  - New Payment Status: partially_paid
```

This helps verify the calculation is working correctly.

## Fixing Existing Bookings

If you have bookings with incorrect totals (created before this fix), you have 3 options:

### Option 1: Re-complete the Service (Easiest)
1. Go to service requests page
2. Find the service that's showing as "completed"
3. Change status to "in_progress"
4. Mark it as "completed" again
5. This triggers recalculation with the fixed code

### Option 2: Use Recalculation Script
```bash
cd BE/HMS-Backend
node RECALCULATE_BOOKING_SCRIPT.js <booking-id>
```

This script will:
- Show current values
- Recalculate all charges
- Update booking
- Show new values

### Option 3: Manual Database Update
```javascript
// In MongoDB shell or Compass
db.bookings.updateOne(
  { _id: ObjectId("your-booking-id") },
  {
    $set: {
      serviceCharges: 4000,        // Sum of all service prices
      totalAmount: 4740,           // roomCharges + serviceCharges
      paymentStatus: "partially_paid"  // or "unpaid"/"paid" as appropriate
    }
  }
)
```

## Prevention

This fix ensures:
- ✅ All completed services are counted
- ✅ Service charges accumulate correctly
- ✅ Total amount updates when services are completed
- ✅ Payment status reflects actual balance
- ✅ Balance calculation is always accurate

## Related Files

- ✅ `BE/HMS-Backend/src/services/serviceRequestService.js` - Fixed
- ✅ `BE/HMS-Backend/RECALCULATE_BOOKING_SCRIPT.js` - Created for fixing old bookings
- ✅ Frontend payment display - No changes needed (uses correct backend data)

## Impact

- **Existing bookings with incorrect totals**: Need manual recalculation
- **New services marked complete**: Will calculate correctly automatically
- **Payment status**: Now accurately reflects unpaid balances
- **User experience**: Clear visibility of unpaid service charges

## Notes

- The fix is **backward compatible** - doesn't break existing functionality
- Console logs can be removed in production if desired
- Recalculation script is safe to run multiple times (idempotent)
- No database schema changes required
