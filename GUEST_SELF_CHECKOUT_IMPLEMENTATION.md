# Guest Self-Checkout Implementation

## Overview
This document describes the implementation of self-checkout functionality for guests, allowing them to complete checkout independently without staff assistance, using the same comprehensive process available to receptionists.

## Implementation Date
January 30, 2026

## Problem Statement
Previously, guests could only check-in to their bookings but couldn't complete the checkout process. The checkout functionality was restricted to staff members (receptionists and admins), requiring guests to wait for staff assistance even when they were ready to complete their stay and make final payments.

## Solution
Enabled the same checkout flow for guests that receptionists use, with appropriate role-based modifications:

### Key Features
1. **Guest Checkout Button**: Added checkout button for guests on bookings with `checkedin` status
2. **Payment Summary**: Guests can view complete payment breakdown including:
   - Room charges (calculated by nights stayed)
   - Service charges (detailed breakdown of all services)
   - Total amount due
   - Amount already paid
   - Outstanding balance

3. **Payment Processing**: Guests can make payments before checkout:
   - **Card Payments**: Guests can pay using card (simulated payment gateway)
   - **Partial Payments**: Option to pay partial amounts or full balance
   - **Payment History**: View all previous payments made for the booking

4. **Balance Validation**: 
   - Checkout is disabled if there's an outstanding balance
   - Clear warning messages inform guests about payment requirements
   - Real-time balance updates after each payment

5. **Invoice Generation**: 
   - Automatic invoice generation during checkout
   - Invoice includes complete breakdown of all charges
   - PDF download option for guests

6. **Checkout Completion**:
   - Booking status changes from `checkedin` to `completed`
   - Room becomes available for new bookings
   - Guest receives confirmation of successful checkout

## Files Modified

### 1. BookingsPage.tsx
**Path**: `src/components/page-components/dashboard/BookingsPage.tsx`

**Changes**:
- Added checkout button for guests in the guest columns action section
- Button shows for bookings with `checkedin` status
- Uses the same `CheckOutInvoiceFlow` component as staff

**Code Changes**:
```typescript
// Added checkout button for guests (lines 538-546)
{booking.status === "checkedin" && (
    <Button
        size="sm"
        variant="default"
        onClick={() => handleCheckOutClick(booking)}
        className="h-8 px-2 bg-purple-600 hover:bg-purple-700 border-purple-700"
        title="Check Out"
    >
        <CheckCircle className="h-4 w-4" />
    </Button>
)}
```

### 2. CheckOutInvoiceFlow.tsx
**Path**: `src/components/page-components/dashboard/CheckOutInvoiceFlow.tsx`

**Changes**:
- Added `useAuth` hook to detect user role
- Implemented role-based cash payment restriction
- Staff can accept cash payments, guests can only use card payments

**Code Changes**:
```typescript
// Import auth context
import { useAuth } from "@/contexts/AuthContext";

// Detect user role and determine payment methods
const { role } = useAuth();
const isStaff = role === "receptionist" || role === "admin";

// Pass allowCash prop based on role
allowCash={isStaff} // Staff can accept cash, guests can only use card
```

## User Experience Flow

### For Guests (Self-Checkout)

1. **Navigate to Bookings Page**
   - Go to Dashboard → My Bookings
   - View all personal bookings

2. **Locate Checked-In Booking**
   - Find booking with status "Checked In"
   - Checkout button appears in actions column (purple button)

3. **Initiate Checkout**
   - Click the checkout button
   - Checkout dialog opens

4. **Review Payment Summary**
   - See complete breakdown:
     - Room charges (per night × number of nights)
     - Service charges (itemized list)
     - Total amount
     - Already paid amount
     - **Balance due** (highlighted)

5. **Make Payment (if balance exists)**
   - Warning message if unpaid balance exists
   - Click "Make Payment Now" button
   - Choose payment amount:
     - Full balance (default)
     - Partial amount (custom input)
   - Complete card payment (simulated payment gateway)
   - Payment gets recorded immediately
   - Balance updates in real-time

6. **Generate Invoice & Complete Checkout**
   - Once balance is zero, "Generate Invoice & Checkout" button becomes enabled
   - Click to generate invoice and complete checkout
   - Invoice is automatically created with complete breakdown
   - Booking status changes to "Completed"
   - Success confirmation message

7. **Download Invoice (Optional)**
   - Invoice can be downloaded as PDF
   - Invoice number and date included

### For Staff (Receptionist/Admin) - No Changes
Staff checkout flow remains unchanged with additional cash payment option.

## Technical Implementation Details

### Role-Based Payment Methods

| User Role | Card Payment | Cash Payment |
|-----------|-------------|--------------|
| Guest     | ✅ Yes      | ❌ No        |
| Receptionist | ✅ Yes   | ✅ Yes       |
| Admin     | ✅ Yes      | ✅ Yes       |

**Rationale**: 
- Guests can only make online card payments for self-service
- Staff can record both card and cash payments received at reception

### Payment Validation
- **Balance Check**: Checkout blocked if balance > 0
- **Payment Limits**: Cannot pay more than outstanding balance
- **Partial Payments**: Supported for gradual payment completion
- **Transaction IDs**: Generated for all card payments

### Invoice Generation
- Invoice created during checkout process
- Includes all charges: rooms + services
- Payment status marked as "paid" after full payment
- PDF generation available

### State Management
- Real-time balance calculation
- Payment data fetching after each payment
- Invoice status tracking
- Booking status updates

## API Endpoints Used

### Payment APIs
- `POST /api/payments/bookings/:bookingId/payments` - Add payment
- `GET /api/payments/bookings/:bookingId/payments` - Get all payments and balances

### Booking APIs
- `PATCH /api/bookings/:bookingId/check-out` - Complete checkout

### Invoice APIs
- `POST /api/invoices/generate/:bookingId` - Generate invoice
- `GET /api/invoices/booking/:bookingId` - Get invoice
- `GET /api/invoices/:invoiceId/download` - Download PDF

## Security & Permissions

### Route Protection
- Guests can access `/dashboard/bookings` ✅
- Guests can access `/dashboard/payments` ✅
- Checkout flow protected by authentication

### Data Access
- Guests can only checkout their own bookings
- Payment validation on backend prevents overpayment
- Invoice generation validates booking ownership

### Role Verification
- Frontend: `useAuth()` hook for UI elements
- Backend: JWT token validation and role checking

## Testing Recommendations

### Test Scenarios

1. **Guest Self-Checkout with No Balance**
   - Check-in a booking
   - Pay full amount
   - Verify checkout succeeds immediately

2. **Guest Self-Checkout with Outstanding Balance**
   - Check-in a booking
   - Attempt checkout without payment
   - Verify checkout is blocked with warning
   - Make payment
   - Verify checkout succeeds

3. **Partial Payment Flow**
   - Check-in a booking with LKR 10,000 balance
   - Make partial payment of LKR 5,000
   - Verify balance updates to LKR 5,000
   - Make another payment of LKR 5,000
   - Verify checkout becomes available

4. **Service Charges Calculation**
   - Check-in a booking
   - Add services during stay
   - Initiate checkout
   - Verify service charges appear in breakdown
   - Complete payment and checkout

5. **Invoice Generation**
   - Complete checkout
   - Verify invoice is generated
   - Check invoice includes all charges
   - Download PDF and verify format

6. **Staff vs Guest Payment Methods**
   - As guest: Verify only card payment available
   - As receptionist: Verify both card and cash available
   - Test both payment methods for staff

## Benefits

### For Guests
- **Independence**: Self-service checkout without waiting for staff
- **Convenience**: Complete checkout at any time
- **Transparency**: Clear view of all charges and payments
- **Flexibility**: Partial payment options
- **Digital Records**: Instant invoice download

### For Hotel Operations
- **Efficiency**: Reduced staff workload during checkout
- **Speed**: Faster checkout process
- **Accuracy**: Automated calculations reduce errors
- **24/7 Availability**: Guests can checkout anytime
- **Scalability**: Handle more checkouts simultaneously

## Known Limitations

1. **Payment Method**: Guests limited to card payments only
   - Cash payments require staff assistance
   - Future: Could add other online payment methods

2. **Invoice Language**: Currently English only
   - Future: Multi-language support

3. **Payment Gateway**: Currently simulated
   - Future: Integration with real payment gateway (Stripe, PayPal, etc.)

## Future Enhancements

1. **Email Notifications**
   - Send invoice via email after checkout
   - Payment confirmation emails

2. **Rating & Reviews**
   - Prompt for feedback after checkout
   - Review submission integration

3. **Digital Receipt**
   - Mobile-friendly receipt view
   - QR code for quick access

4. **Express Checkout**
   - One-click checkout for no-balance bookings
   - Saved payment methods

5. **Multi-Currency Support**
   - Display amounts in guest's currency
   - Automatic conversion

## Related Documentation
- `CHECKOUT_PAYMENT_VALIDATION.md` - Payment validation during checkout
- `PAYMENT_SYSTEM_IMPROVEMENTS.md` - Overall payment system architecture
- `FRONTEND_CALCULATION_FIX.md` - Balance calculation fixes

## Conclusion
The guest self-checkout implementation provides guests with the same comprehensive checkout experience that receptionists use, while maintaining appropriate role-based restrictions. This enhancement improves guest satisfaction through self-service convenience while reducing staff workload during peak checkout times.
