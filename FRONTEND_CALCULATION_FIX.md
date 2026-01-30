# Frontend Balance Calculation Fix

## Problem
The frontend was displaying incorrect totals and balances because it was showing the `totalAmount` from the backend database, which wasn't being updated when new services were completed.

**Example Issue:**
- Room Charges: LKR 740
- Service 1: LKR 2,000
- Service 2: LKR 2,000
- **Expected Total: LKR 4,740**
- **Showing: LKR 2,740** ❌

## Root Cause
The frontend was using `booking.totalAmount` and `booking.balance` directly from the API response, but these values in the database weren't always up-to-date when services were completed.

## Solution: Calculate on Frontend
Instead of relying on backend's stored `totalAmount`, we now calculate it on the frontend by:
1. Taking `roomCharges`
2. Summing all individual service prices from `serviceDetails[]`
3. Subtracting `totalPaid` to get the correct balance

## Implementation

### Files Changed

#### 1. `src/app/dashboard/payments/page.tsx` (Guest Payments Page)

**Added calculation functions:**

```typescript
// Calculate correct total from charges
const calculateBookingTotal = (booking: any) => {
    const roomCharges = booking.roomCharges || 0;
    let serviceCharges = 0;

    // Sum all individual service charges if available
    if (booking.serviceDetails && booking.serviceDetails.length > 0) {
        serviceCharges = booking.serviceDetails.reduce((sum: number, service: any) => {
            return sum + (service.price || 0);
        }, 0);
    } else {
        serviceCharges = booking.serviceCharges || 0;
    }

    return roomCharges + serviceCharges;
};

// Calculate correct balance
const calculateBalance = (booking: any) => {
    const total = calculateBookingTotal(booking);
    const paid = booking.totalPaid || 0;
    return total - paid;
};
```

**Updated UI to use calculated values:**

```typescript
// Display calculated total (not booking.totalAmount)
<span>{formatCurrency(calculateBookingTotal(booking))}</span>

// Display calculated balance (not booking.balance)
<span className={`font-bold ${calculateBalance(booking) > 0 ? 'text-red-500' : 'text-green-500'}`}>
    {formatCurrency(calculateBalance(booking))}
</span>

// Pass calculated values to payment dialog
<MakePaymentDialog
    totalAmount={calculateBookingTotal(selectedBooking)}
    balance={calculateBalance(selectedBooking)}
    // ... other props
/>
```

**Removed:**
- ❌ Recalculate button
- ❌ `recalculateBookingAmounts` import
- ❌ `handleRecalculate` function
- ❌ `Calculator` icon import

#### 2. `src/components/page-components/dashboard/CheckOutInvoiceFlow.tsx` (Checkout Flow)

**Added calculation function:**

```typescript
// Calculate correct total from individual charges
const calculateTotal = () => {
    if (!paymentData) return 0;
    const roomCharges = paymentData.roomCharges || 0;
    let serviceCharges = 0;

    // Sum all individual service charges if available
    if (paymentData.serviceDetails && paymentData.serviceDetails.length > 0) {
        serviceCharges = paymentData.serviceDetails.reduce((sum, service) => {
            return sum + (service.price || 0);
        }, 0);
    } else {
        serviceCharges = paymentData.serviceCharges || 0;
    }

    return roomCharges + serviceCharges;
};

const totalAmount = calculateTotal();
const totalPaid = paymentData?.totalPaid || 0;
const balance = totalAmount - totalPaid;
```

**Updated UI:**

```typescript
// Use calculated values instead of paymentData values
<span>{formatCurrency(totalAmount)}</span>
<span>{formatCurrency(totalPaid)}</span>
<span>{formatCurrency(balance)}</span>

// Pass to payment dialog
<MakePaymentDialog
    totalAmount={totalAmount}
    totalPaid={totalPaid}
    balance={balance}
    // ... other props
/>
```

## How It Works

### Before (Incorrect):
```
Frontend receives:
{
  roomCharges: 740,
  serviceCharges: 0,      // Not updated!
  totalAmount: 2740,      // Old value!
  totalPaid: 2740,
  balance: 0,             // Wrong!
  serviceDetails: [
    { price: 2000 },
    { price: 2000 }
  ]
}

Frontend displays: totalAmount (2740) ❌
```

### After (Correct):
```
Frontend receives same data but calculates:

calculateBookingTotal():
  roomCharges = 740
  serviceCharges = serviceDetails[0].price + serviceDetails[1].price
  serviceCharges = 2000 + 2000 = 4000
  total = 740 + 4000 = 4740 ✅

calculateBalance():
  balance = 4740 - 2740 = 2000 ✅

Frontend displays: calculated total (4740) ✅
```

## Benefits

1. ✅ **Always Accurate**: Calculation uses actual service data
2. ✅ **No Database Updates Needed**: Works with existing data
3. ✅ **Simple**: Just sum the charges we can see
4. ✅ **No Extra API Calls**: No recalculate endpoint needed
5. ✅ **Real-time**: Reflects all services immediately

## Testing

### Test Case 1: Multiple Services
```
Given: Booking with 2 services completed
- Room: LKR 740
- Service 1: LKR 2,000
- Service 2: LKR 2,000
- Paid: LKR 2,740

Expected Display:
- Total: LKR 4,740 ✅
- Paid: LKR 2,740 ✅
- Balance: LKR 2,000 ✅
```

### Test Case 2: No Services
```
Given: Booking with no services
- Room: LKR 1,000
- Services: None
- Paid: LKR 500

Expected Display:
- Total: LKR 1,000 ✅
- Paid: LKR 500 ✅
- Balance: LKR 500 ✅
```

### Test Case 3: Fully Paid
```
Given: Booking fully paid
- Room: LKR 740
- Service: LKR 2,000
- Paid: LKR 2,740

Expected Display:
- Total: LKR 2,740 ✅
- Paid: LKR 2,740 ✅
- Balance: LKR 0 ✅
- Balance color: GREEN ✅
```

## Visual Changes

### Payment Display:
```
Room Charges:                 LKR 740
• Full room will be cleaned:  LKR 2,000
• Full room will be cleaned:  LKR 2,000
────────────────────────────────────────
Total:                        LKR 4,740 ✅ (was 2,740)
Paid:                         LKR 2,740
Balance:                      LKR 2,000 ✅ (was 0)

[Make Payment] ✅ (shows when balance > 0)
```

### Balance Color Coding:
- **Red text** when `balance > 0` (unpaid)
- **Green text** when `balance = 0` (fully paid)

## Backend Changes (Not Required)

The backend recalculate endpoint was created but is **not needed** because:
- Frontend now calculates correctly regardless of database values
- No user action required
- Works with existing bookings automatically

## Migration Notes

**No migration needed!** The fix:
- ✅ Works with existing bookings
- ✅ Doesn't require database updates
- ✅ Automatically fixes all displays
- ✅ No user intervention required

## Summary

**The Fix:** Calculate totals and balances on the frontend by summing visible charges instead of trusting backend's stored values.

**Result:** All payment displays now show correct totals and balances automatically, even for bookings with multiple services completed after initial payment.

**User Action:** Just refresh the page - no buttons to click, no recalculation needed!
