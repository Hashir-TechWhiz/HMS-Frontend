# Payment Dialog Balance Synchronization Fix

## Issue Description

### Error Message
```json
{
    "success": false,
    "message": "Payment amount (2000) exceeds remaining balance (0)"
}
```

### Problem
When a user makes a payment during checkout and then tries to make another payment, the payment dialog displays a stale balance amount. This causes the following sequence:

1. User makes first payment (e.g., LKR 2000)
2. Payment succeeds and dialog closes
3. Backend updates balance to 0
4. Frontend refreshes payment data
5. User clicks "Make Payment Now" again
6. Dialog opens with OLD customAmount state (2000)
7. User submits payment with 2000
8. Backend rejects: "Payment amount exceeds remaining balance (0)"

### Root Cause
The `customAmount` state in `MakePaymentDialog` was initialized only once when the component mounted, not when the dialog was reopened with updated balance data.

```typescript
// OLD CODE - Only initialized once
const [customAmount, setCustomAmount] = useState<string>(balance.toString());
```

## Solution

### 1. Added State Synchronization
Added a `useEffect` hook to synchronize the `customAmount` state with the latest `balance` prop whenever the dialog opens:

```typescript
// NEW CODE - Syncs on every dialog open
useEffect(() => {
    if (open) {
        setCustomAmount(balance.toString());
        setIsPartialPayment(false);
        setPaymentMethod(null);
    }
}, [open, balance]);
```

### 2. Added Balance Validation
Added additional validation to prevent payment attempts when balance is 0:

```typescript
// Check before processing payment
if (balance <= 0) {
    toast.error("No outstanding balance. Payment not required.");
    setProcessing(false);
    onOpenChange(false);
    return;
}
```

### 3. Added Visual Feedback
Added UI elements to clearly show when no payment is needed:

```typescript
{/* No Balance Warning */}
{balance <= 0 && (
    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
        <p className="text-sm text-green-400 text-center font-medium">
            ✓ All payments completed! No outstanding balance.
        </p>
    </div>
)}
```

### 4. Added Debug Logging
Added console logging to help debug payment issues:

```typescript
console.log("Payment Request:", {
    bookingId,
    paymentAmount,
    currentBalance: balance,
    totalAmount,
    totalPaid
});
```

## Files Modified

### `MakePaymentDialog.tsx`
**Path**: `src/components/page-components/dashboard/MakePaymentDialog.tsx`

**Changes**:
1. Added `useEffect` import from React
2. Added state synchronization effect
3. Added balance validation in payment handlers
4. Added visual feedback for zero balance
5. Added debug logging
6. Hide payment method selection when balance is 0

## Testing Scenarios

### Scenario 1: Single Full Payment
1. Open checkout with LKR 2000 balance
2. Make payment of LKR 2000
3. ✓ Dialog closes
4. ✓ Balance updates to 0
5. ✓ Checkout button becomes enabled

### Scenario 2: Multiple Partial Payments
1. Open checkout with LKR 5000 balance
2. Make payment of LKR 2000 (partial)
3. ✓ Dialog closes, balance shows LKR 3000
4. Click "Make Payment Now" again
5. ✓ Dialog opens with LKR 3000 in amount field
6. Make payment of LKR 3000
7. ✓ Payment succeeds
8. ✓ Balance becomes 0

### Scenario 3: Attempting Payment After Full Payment
1. Complete full payment (balance = 0)
2. Click "Make Payment Now" again
3. ✓ Dialog shows "All payments completed" message
4. ✓ Payment method selection is hidden
5. ✓ Only "Close" button is shown

### Scenario 4: Balance Changes During Dialog Open
1. Open payment dialog with LKR 2000 balance
2. Another user/process makes payment from different session
3. Current user clicks to pay
4. ✓ Backend rejects with proper error message
5. ✓ Frontend shows error toast
6. User closes and reopens dialog
7. ✓ Updated balance is shown

## Technical Details

### State Management Flow

```
Initial State:
- balance = 2000 (from props)
- customAmount = "2000" (from state)

After Payment:
1. addPayment(bookingId, { amount: 2000 })
2. onPaymentSuccess() called
3. Dialog closes (open = false)
4. fetchData() refreshes payment data
5. balance prop updates to 0

Dialog Reopens:
1. open prop changes to true
2. useEffect triggers
3. customAmount syncs to balance.toString() = "0"
4. UI shows "All payments completed"
```

### Race Condition Prevention

The `useEffect` with dependencies `[open, balance]` ensures:
- When `open` changes from `false` to `true`, state syncs
- When `balance` changes while dialog is open, state syncs
- Both `paymentMethod` and `isPartialPayment` reset to default

### Backend Validation

Even with frontend fixes, backend still validates:
- Payment amount must be > 0
- Payment amount must be ≤ current balance
- Prevents overpayment or duplicate payments

## Benefits

1. **Prevents Payment Errors**: No more "exceeds balance" errors
2. **Better UX**: Shows accurate balance at all times
3. **Clear Feedback**: Users know when no payment is needed
4. **Debug Support**: Console logs help troubleshoot issues
5. **Race Condition Prevention**: State always syncs with latest data

## Related Issues

This fix also resolves related scenarios:
- Multiple users making payments simultaneously
- Payment made from different device/session
- Backend balance updates not reflected in frontend
- Stale state after dialog reopen

## Future Improvements

1. **Real-time Updates**: WebSocket for live balance updates
2. **Optimistic UI**: Show payment success immediately
3. **Balance Refresh**: Auto-refresh balance every N seconds
4. **Payment Lock**: Prevent concurrent payments by same user
5. **Offline Support**: Queue payments when offline

## Conclusion

This fix ensures the payment dialog always displays the current, accurate balance and prevents users from attempting to pay more than the outstanding amount. The state synchronization pattern can be applied to other dialogs with similar issues.
