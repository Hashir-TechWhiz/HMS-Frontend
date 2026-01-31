# Payment System Improvements

## Overview
This document outlines the comprehensive improvements made to the HMS payment system to support partial payments, service charge tracking, and enhanced payment flow during check-in and checkout.

## Changes Made

### 1. Backend Changes

#### **Booking Model (`BE/HMS-Backend/src/models/Booking.js`)**
- **roomCharges** and **serviceCharges** fields now properly track costs separately
- Enhanced payment tracking with detailed payment records
- Payment status automatically updates based on totalPaid vs totalAmount

#### **Payment Service (`BE/HMS-Backend/src/services/paymentService.js`)**
- ✅ Added `roomCharges` and `serviceCharges` to payment response interfaces
- ✅ `calculateBookingAmount()` now returns breakdown: `{ roomCharges, serviceCharges, totalAmount }`
- ✅ Payment responses now include charge breakdowns for all endpoints:
  - `getMyPayments()`
  - `getAllPayments()`
  - `getBookingPayments()`
  - `getBookingBalance()`
- ✅ Enhanced payment validation to check against remaining balance
- ✅ Supports partial payments with proper tracking

#### **Booking Service (`BE/HMS-Backend/src/services/bookingService.js`)**
- ✅ `createBooking()` now calculates and stores `roomCharges` separately on creation
- ✅ Initial `serviceCharges` set to 0 (updated when services are completed)
- ✅ Payment during booking creation is fully supported via `paymentData` parameter
- ✅ Automatic payment status updates based on amount paid

#### **Service Request Service (`BE/HMS-Backend/src/services/serviceRequestService.js`)**
- ✅ **NEW:** When a service request is marked as "completed", the system now:
  - Recalculates total service charges from all completed service requests
  - Updates the booking's `serviceCharges` field
  - Recalculates `totalAmount` (roomCharges + serviceCharges)
  - Updates payment status based on new total
- ✅ Service charges are automatically reflected in booking payments

#### **Invoice Service (`BE/HMS-Backend/src/services/invoiceService.js`)**
- ✅ Invoice generation now includes:
  - Room charges breakdown
  - Service charges breakdown (line items)
  - All payment records from the booking
  - Payment status reflects actual booking payment status
- ✅ Enhanced invoice notes with detailed charge breakdown
- ✅ Tax calculation support (configurable)

### 2. Frontend Changes

#### **Payment Service (`src/services/paymentService.ts`)**
- ✅ Updated `BookingPaymentsResponse` interface to include:
  - `roomCharges: number`
  - `serviceCharges: number`
- ✅ Updated `MyPaymentsResponse` interface with same fields
- ✅ All payment-related API calls now receive charge breakdowns

#### **Make Payment Dialog (`src/components/page-components/dashboard/MakePaymentDialog.tsx`)**
- ✅ **Partial Payment Support:**
  - Toggle between full balance and partial payment
  - Input field for custom payment amount
  - Validation to prevent overpayment
  - Clear UI indication of payment amount
- ✅ **Charge Breakdown Display:**
  - Shows room charges separately
  - Shows service charges separately
  - Displays total, paid, and balance
- ✅ **Enhanced Payment Notes:**
  - Records whether payment is partial or full
  - Includes amount details in transaction notes
- ✅ Supports both card and cash payments (cash only for staff)

#### **Payments Page (`src/app/dashboard/payments/page.tsx`)**
- ✅ **Charge Breakdown in Listing:**
  - Each booking now shows:
    - Room charges (if > 0)
    - Service charges (if > 0)
    - Total amount
    - Amount paid
    - Balance due
- ✅ Pass charge breakdown to payment dialog
- ✅ Enhanced payment history preview

#### **Check-In Form (`src/components/page-components/dashboard/CheckInForm.tsx`)**
- ✅ **MAJOR ENHANCEMENT:** Payment during check-in
  - **Pay Now Option:**
    - Select payment amount (full or partial)
    - Choose payment method (card/cash)
    - Process payment during check-in flow
  - **Pay Later Option:**
    - Skip payment and check in
    - Payment can be made later from Payments page
  - **Payment Summary Display:**
    - Shows total, paid, and balance
    - Updates in real-time
  - **Staff Features:**
    - Cash payment option (receptionists/admins)
    - Card payment for guests
  - **Seamless Flow:**
    - Guest info collection
    - Payment processing
    - Single submit button for entire flow

#### **Bookings Page (`src/components/page-components/dashboard/BookingsPage.tsx`)**
- ✅ Updated to pass payment details to CheckInForm:
  - `totalAmount`
  - `totalPaid`
  - `balance`
  - `allowCashPayment` (role-based)

#### **Payment History Card (`src/components/page-components/dashboard/PaymentHistoryCard.tsx`)**
- ✅ Already supports full payment history display
- ✅ Shows payment method, transaction ID, processor, notes
- ✅ Displays all payment records chronologically

### 3. Feature Summary

#### ✅ **Partial Payments**
- Users can pay any amount between LKR 1 and the remaining balance
- Payment status automatically updates:
  - `unpaid`: No payment made
  - `partially_paid`: Some payment made but not full
  - `paid`: Full amount paid
- All partial payments are tracked with detailed notes

#### ✅ **Service Charges Integration**
- Service charges automatically added to booking when service requests are completed
- Real-time updates to total amount and payment status
- Service charges displayed separately in all payment views
- Included in invoice generation

#### ✅ **Payment During Check-In**
- Guests can choose to pay now or pay later
- Support for partial or full payment during check-in
- Multiple payment methods (card for guests, card/cash for staff)
- Seamless integration with check-in flow

#### ✅ **Payment During Check-Out**
- Invoice generated with all payment records
- Shows complete payment history
- Includes room charges and service charges
- Email delivery of invoice with PDF attachment

#### ✅ **Comprehensive Payment Tracking**
- Every payment recorded with:
  - Amount
  - Payment method (card/cash)
  - Transaction ID (for card payments)
  - Processor (who recorded the payment)
  - Date/time
  - Notes (context about the payment)
- Payment history visible in:
  - Payments page
  - Booking details
  - Invoice

## API Endpoints Updated

### Payment Endpoints
- `POST /api/payments/bookings/:bookingId/payments` - Add payment (supports partial)
- `GET /api/payments/bookings/:bookingId/payments` - Get all payments with breakdown
- `GET /api/payments/my-payments` - Guest payments with breakdown
- `GET /api/payments` - All payments (admin/receptionist) with breakdown
- `GET /api/payments/bookings/:bookingId/balance` - Get balance with breakdown

### Booking Endpoints
- `POST /api/bookings` - Create booking (supports initial payment via `paymentData`)
- `PATCH /api/bookings/:id/check-in` - Check-in (payment handled separately now)
- `PATCH /api/bookings/:id/check-out` - Check-out with invoice generation

### Service Request Endpoints
- `PATCH /api/service-requests/:id/status` - Update status (auto-updates booking charges)

## Testing Checklist

### ✅ Partial Payments
- [x] Make partial payment during booking creation
- [x] Make partial payment during check-in
- [x] Make multiple partial payments
- [x] Verify payment status updates correctly
- [x] Verify balance calculation

### ✅ Service Charges
- [x] Create service request while checked in
- [x] Complete service request
- [x] Verify booking total amount updates
- [x] Verify service charges show in payments page
- [x] Verify service charges in invoice

### ✅ Check-In Flow
- [x] Check-in with "Pay Now" (full payment)
- [x] Check-in with "Pay Now" (partial payment)
- [x] Check-in with "Pay Later"
- [x] Check-in with card payment
- [x] Check-in with cash payment (staff only)

### ✅ Payment Display
- [x] Verify room charges shown separately
- [x] Verify service charges shown separately
- [x] Verify payment history shows all payments
- [x] Verify payment breakdown in all views

### ✅ Invoice Generation
- [x] Generate invoice at checkout
- [x] Verify room charges in invoice
- [x] Verify service charges in invoice
- [x] Verify all payments listed in invoice
- [x] Verify payment status in invoice
- [x] Verify invoice PDF includes all records

## User Flows

### Flow 1: Guest Makes Partial Payment During Check-In
1. Guest arrives at hotel (booking confirmed)
2. Staff/Guest initiates check-in
3. Fills in guest information
4. Clicks "Pay Now"
5. Enters custom amount (e.g., 50% of balance)
6. Selects payment method (card)
7. Completes card payment
8. System records payment and checks in guest
9. Remaining balance can be paid later

### Flow 2: Guest Orders Services and Pays at Checkout
1. Guest checks in (paid partial or full)
2. Guest orders room service, spa, etc.
3. Services are completed and marked as such
4. Service charges added to booking automatically
5. Guest's balance increases
6. At checkout, invoice shows:
   - Room charges
   - Service charges
   - All payments made
   - Remaining balance
7. Guest pays remaining balance
8. Invoice emailed with complete payment history

### Flow 3: Walk-In Guest with Multiple Partial Payments
1. Receptionist creates walk-in booking
2. Guest makes small initial payment
3. Guest checks in (pays another partial amount)
4. Guest uses services during stay
5. Guest makes payment at reception (another partial)
6. At checkout, sees complete breakdown
7. Pays final balance
8. All payments tracked and included in invoice

## Notes for Developers

### Important Functions
- **`PaymentService.calculateBookingAmount()`**: Always use this to get current amounts
- **`PaymentService.updatePaymentStatus()`**: Automatically updates based on totalPaid
- **`ServiceRequestService.updateServiceRequestStatus()`**: Updates booking charges when service completed
- **`InvoiceService.generateInvoice()`**: Includes all payment records and charge breakdown

### Best Practices
1. Always recalculate booking amounts before displaying payment options
2. Use `getBookingBalance()` to get real-time balance
3. Validate payment amount against balance on both frontend and backend
4. Record detailed notes for all payments for audit trail
5. Always update payment status after adding payments

### Future Enhancements
- [ ] Add support for refunds
- [ ] Add payment gateway integration (Stripe, PayPal)
- [ ] Add payment reminders for unpaid balances
- [ ] Add payment receipt generation
- [ ] Add payment analytics and reporting
- [ ] Add support for multiple currencies
- [ ] Add payment plan/installment support

## Conclusion

The payment system now fully supports:
- ✅ Partial payments at any stage
- ✅ Service charge tracking and integration
- ✅ Payment during check-in with flexible options
- ✅ Complete payment history and breakdown
- ✅ Comprehensive invoice generation

All changes are backward compatible and do not affect existing bookings or payments.
