# Checkout Payment Validation - Complete Implementation

## Overview
Enhanced the checkout process to:
1. **Require check-in status** before allowing checkout
2. **Validate full payment** before checkout
3. **Display payment summary** with balance details
4. **Allow payment during checkout** flow
5. **Show clear error messages** for unpaid balances

## Changes Made

### Backend Changes

#### **File: `BE/HMS-Backend/src/services/bookingService.js`**

**Location:** `checkOutBooking()` method (line ~869)

**Added Payment Validation Before Checkout:**

```javascript
// IMPORTANT: Calculate and validate payment before checkout
// 1. Fetch all completed service requests
// 2. Recalculate service charges
// 3. Update booking amounts if changed
// 4. Validate balance is paid in full
```

**Features:**
1. ✅ **Recalculates amounts before checkout** - Ensures all completed services are included
2. ✅ **Validates check-in status** - Must be "checkedin" before checkout
3. ✅ **Validates payment complete** - Balance must be LKR 0
4. ✅ **Clear error messages** - Shows exact balance owed

**Error Message:**
```
Cannot check-out with outstanding balance. Please pay the remaining LKR 2,000 before checkout.
Total: LKR 4,740, Paid: LKR 2,740, Balance: LKR 2,000
```

### Frontend Changes

#### **File: `src/components/page-components/dashboard/CheckOutInvoiceFlow.tsx`**

**Major Enhancements:**

1. **Added Payment Data Fetching**
   - Fetches `BookingPaymentsResponse` before showing checkout options
   - Displays real-time balance and payment status
   - Shows service breakdown

2. **Payment Summary Card**
   - Room charges display
   - Individual service charges with descriptions
   - Total, Paid, and Balance prominently shown
   - Color-coded (red for unpaid, green for paid)

3. **Payment Validation UI**
   - **If Balance > 0:**
     - Shows yellow warning alert
     - Displays "Payment Required Before Checkout" message
     - Shows exact balance amount
     - Provides "Make Payment Now" button
     - Disables checkout button
   
   - **If Balance = 0:**
     - Shows green success alert
     - Displays "Payment Complete!" message
     - Enables checkout button

4. **Integrated Payment Dialog**
   - Opens payment dialog directly from checkout flow
   - Supports card and cash payments (staff only)
   - Refreshes data after payment
   - Shows service details in payment dialog

## User Flow

### Scenario 1: Checkout with Unpaid Balance

```
Step 1: Staff clicks "Check Out" button
        ↓
Step 2: Checkout dialog opens showing:
        - Room Charges: LKR 740
        - Service 1: LKR 2,000
        - Service 2: LKR 2,000
        - Total: LKR 4,740
        - Paid: LKR 2,740
        - Balance: LKR 2,000 (RED)
        ↓
Step 3: Yellow warning: "Payment Required Before Checkout"
        ↓
Step 4: "Make Payment Now" button available
        Checkout button is DISABLED
        ↓
Step 5: Click "Make Payment Now"
        ↓
Step 6: Payment dialog opens
        - Shows same breakdown
        - Allows partial or full payment
        - Select card/cash method
        ↓
Step 7: Payment processed
        ↓
Step 8: Returns to checkout screen
        - Balance now: LKR 0 (GREEN)
        - Shows "Payment Complete!"
        - Checkout button now ENABLED
        ↓
Step 9: Click "Generate Invoice & Checkout"
        ↓
Step 10: Backend validates:
         - Check-in status ✓
         - Balance = 0 ✓
         - Generates invoice
         - Marks as checked out
         ↓
Step 11: Success! Guest checked out
```

### Scenario 2: Checkout with Full Payment

```
Step 1: Staff clicks "Check Out" button
        ↓
Step 2: Checkout dialog shows:
        - Balance: LKR 0 (GREEN)
        - "Payment Complete!" message
        - Checkout button ENABLED
        ↓
Step 3: Click "Generate Invoice & Checkout"
        ↓
Step 4: Backend validates and proceeds
        ↓
Step 5: Success!
```

### Scenario 3: Try Checkout with Balance (Backend Catch)

```
Step 1: Someone bypasses frontend validation
        ↓
Step 2: Backend checkOutBooking() called
        ↓
Step 3: Backend recalculates amounts
        ↓
Step 4: Backend finds balance > 0
        ↓
Step 5: Backend throws error:
        "Cannot check-out with outstanding balance.
         Please pay the remaining LKR 2,000..."
        ↓
Step 6: Error displayed to user
        Payment must be completed first
```

## API Validation Flow

### `checkOutBooking()` Validation Steps:

```javascript
1. Validate booking ID format
2. Find booking in database
3. Check authorization (guest/staff/admin)
4. ✅ NEW: Validate status is "checkedin"
5. ✅ NEW: Fetch all completed service requests
6. ✅ NEW: Recalculate service charges
7. ✅ NEW: Update booking amounts if changed
8. ✅ NEW: Calculate balance
9. ✅ NEW: Throw error if balance > 0
10. Generate invoice
11. Mark as checked out
12. Create cleaning request
```

## Payment Summary Display

### Visual Layout:

```
┌─────────────────────────────────────────┐
│ 💵 Payment Summary                      │
│                                         │
│ Room Charges              LKR 740      │
│                                         │
│ Service Charges:                        │
│ ├─ • Full room cleaning   LKR 2,000   │
│ └─ • Full room cleaning   LKR 2,000   │
│                                         │
│ ─────────────────────────────────────  │
│ Total Amount              LKR 4,740    │
│ Already Paid              LKR 2,740    │
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ Balance Due          LKR 2,000      ││  RED
│ └─────────────────────────────────────┘│
│                                         │
│ ⚠️ Payment Required Before Checkout    │
│ You have an outstanding balance of     │
│ LKR 2,000. Please complete payment.    │
│                                         │
│ [💳 Make Payment Now]                  │
│                                         │
│ [ Cancel ]  [ Checkout ] (disabled)    │
└─────────────────────────────────────────┘
```

## Error Messages

### Backend Errors:

1. **Not Checked In:**
   ```
   "Booking must be checked-in before check-out"
   ```

2. **Unpaid Balance:**
   ```
   "Cannot check-out with outstanding balance. 
    Please pay the remaining LKR 2,000 before checkout.
    Total: LKR 4,740, Paid: LKR 2,740, Balance: LKR 2,000"
   ```

### Frontend Messages:

1. **Warning (Balance > 0):**
   ```
   ⚠️ Payment Required Before Checkout
   You have an outstanding balance of LKR 2,000.
   Please complete the payment before proceeding with checkout.
   ```

2. **Success (Balance = 0):**
   ```
   ✓ Payment Complete!
   All charges have been paid. You can proceed with checkout.
   ```

## Testing Checklist

### Test Case 1: Checkout with Unpaid Services
- [ ] Create booking, check-in
- [ ] Add 2 services and complete them
- [ ] Pay for room only
- [ ] Try to checkout
- [ ] **Expected:** Warning shown, checkout disabled
- [ ] Make payment for services
- [ ] **Expected:** Checkout now enabled
- [ ] Complete checkout
- [ ] **Expected:** Success

### Test Case 2: Try Backend Bypass
- [ ] Create booking with unpaid balance
- [ ] Call checkout API directly
- [ ] **Expected:** Error message with balance details

### Test Case 3: Checkout Without Check-in
- [ ] Create confirmed booking (not checked in)
- [ ] Try to checkout
- [ ] **Expected:** Error "must be checked-in first"

### Test Case 4: Add Service After Payment
- [ ] Create booking, pay full amount, check-in
- [ ] Add and complete service
- [ ] Try to checkout
- [ ] **Expected:** Warning shown with new balance
- [ ] Pay for service
- [ ] Complete checkout
- [ ] **Expected:** Success

### Test Case 5: Multiple Partial Payments
- [ ] Create booking with services
- [ ] Make partial payment 1
- [ ] Try checkout - blocked
- [ ] Make partial payment 2
- [ ] Balance still > 0 - blocked
- [ ] Make final payment
- [ ] Balance = 0 - enabled
- [ ] Complete checkout
- [ ] **Expected:** Success

## Benefits

1. ✅ **Prevents checkout with unpaid balance**
2. ✅ **Clear visibility of charges** (room + services)
3. ✅ **Easy payment during checkout** (one-click payment button)
4. ✅ **Accurate balance calculation** (recalculates before checkout)
5. ✅ **Better user experience** (clear warnings and guidance)
6. ✅ **Audit trail** (all payments tracked before final checkout)
7. ✅ **Staff convenience** (can accept payment during checkout)
8. ✅ **Prevents revenue loss** (ensures all charges paid)

## Related Files

### Backend:
- ✅ `BE/HMS-Backend/src/services/bookingService.js` - Added payment validation
- ✅ `BE/HMS-Backend/src/services/serviceRequestService.js` - Fixed service charge calculation

### Frontend:
- ✅ `src/components/page-components/dashboard/CheckOutInvoiceFlow.tsx` - Complete redesign
- ✅ `src/components/page-components/dashboard/MakePaymentDialog.tsx` - Already supports partial payments
- ✅ `src/services/paymentService.ts` - Already has service details

## Configuration

No configuration needed. All validation is automatic.

## Notes

- Payment validation happens on BOTH frontend and backend (defense in depth)
- Frontend validation provides better UX (immediate feedback)
- Backend validation ensures security (cannot be bypassed)
- Service charges are recalculated before checkout (ensures accuracy)
- Console logs help with debugging payment issues
- Staff can accept both card and cash payments during checkout

## Future Enhancements

- [ ] Add "Partial Checkout" option (checkout with payment plan)
- [ ] Add "Payment History" view in checkout dialog
- [ ] Add automatic payment reminders before checkout
- [ ] Add QR code payment integration
- [ ] Add split payment (multiple methods)
- [ ] Add refund handling on checkout cancellation
- [ ] Add payment receipt printing
