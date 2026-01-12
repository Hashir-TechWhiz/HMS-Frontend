# Service Request with Service Catalog - How It Works

## Date: January 12, 2026
## Status: ✅ ALREADY WORKING CORRECTLY

---

## Overview

The service request system **already displays services from the Service Catalog** based on the guest's hotel. Here's how it works:

---

## 🎯 Current Implementation

### **Guest Service Request Flow:**

```
1. Guest clicks "New Service Request"
   ↓
2. System fetches guest's checked-in bookings
   ↓
3. Guest selects their active booking (checked-in)
   ↓
4. System extracts hotelId from selected booking
   ↓
5. ServiceRequestForm loads with booking's hotelId
   ↓
6. Form fetches Service Catalog for that hotel
   ↓
7. Service dropdown shows ONLY services from that hotel's catalog
   ↓
8. Guest selects service and sees:
   - Service display name
   - Service description
   - Fixed price (or "pricing TBD" for "other")
   ↓
9. Guest submits request
   ↓
10. Backend applies catalog pricing automatically
```

---

## 📋 How Service Catalog Integration Works

### **Frontend: MyServiceRequestsPage.tsx**

**Line 464-466:**
```typescript
<ServiceRequestForm
    bookingId={selectedBookingId}
    hotelId={bookings.find(b => b._id === selectedBookingId)?.hotelId as string || 
            (bookings.find(b => b._id === selectedBookingId)?.hotelId as any)?._id}
    onSuccess={() => {
        setFormDialogOpen(false);
        fetchServiceRequests(currentPage);
        setSelectedBookingId("");
    }}
    onCancel={() => setSelectedBookingId("")}
/>
```

**What it does:**
- Finds the selected booking
- Extracts the `hotelId` from the booking
- Passes it to ServiceRequestForm

---

### **Frontend: ServiceRequestForm.tsx**

**Lines 52-67: Fetch Service Catalog**
```typescript
useEffect(() => {
    const fetchCatalog = async () => {
        try {
            setCatalogLoading(true);
            const response = await getServiceCatalog(hotelId);
            if (response.success && response.data) {
                setCatalog(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch catalog:", error);
        } finally {
            setCatalogLoading(false);
        }
    };
    fetchCatalog();
}, [hotelId]);
```

**Lines 99-107: Service Dropdown**
```typescript
<SelectField
    label="Service Type"
    name="serviceType"
    options={catalog.map(s => ({ value: s.serviceType, label: s.displayName }))}
    control={control}
    error={errors.serviceType}
    placeholder={catalogLoading ? "Loading catalog..." : "Select a service"}
    required
/>
```

**Lines 109-121: Service Details Display**
```typescript
{selectedService && (
    <div className="bg-primary-900/20 border border-primary-500/20 rounded-lg p-3">
        <div className="space-y-1">
            <p className="text-sm text-white font-medium">{selectedService.displayName}</p>
            <p className="text-xs text-gray-400">{selectedService.description || "No description available."}</p>
            <div className="flex items-center gap-1.5 mt-2 text-primary-300 font-semibold">
                <DollarSign className="h-3.5 w-3.5" />
                <span>
                    {selectedService.serviceType === 'other' 
                        ? "Pricing will be determined upon completion" 
                        : `Fixed Price: $${selectedService.fixedPrice?.toFixed(2)}`}
                </span>
            </div>
        </div>
    </div>
)}
```

---

### **Backend: Service Request Creation**

**File:** `BE/src/services/serviceRequestService.js`

**Lines 55-68: Catalog Pricing Integration**
```javascript
// Fetch fixed price from Service Catalog
let fixedPrice = null;
if (serviceType !== "other") {
    const ServiceCatalog = (await import("../models/ServiceCatalog.js")).default;
    const catalogEntry = await ServiceCatalog.findOne({
        hotelId: booking.hotelId,
        serviceType: serviceType,
        isActive: true
    });
    
    if (catalogEntry && catalogEntry.fixedPrice) {
        fixedPrice = catalogEntry.fixedPrice;
    }
}
```

**What it does:**
- When service request is created
- Looks up service type in Service Catalog for that hotel
- Applies fixed price from catalog
- For "other" service type, no price is set (admin sets later)

---

## 🎨 What Guest Sees

### **Step 1: Select Booking**
```
┌─────────────────────────────────────┐
│ Select Booking *                    │
│ ┌─────────────────────────────────┐ │
│ │ Room 101 - Check-in: 2026-01-12 │ │
│ │ Room 205 - Check-in: 2026-01-10 │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### **Step 2: Select Service (from Hotel's Catalog)**
```
┌─────────────────────────────────────┐
│ Service Type *                      │
│ ┌─────────────────────────────────┐ │
│ │ Room Service                    │ │ ← From catalog
│ │ Laundry Service                 │ │ ← From catalog
│ │ Massage                         │ │ ← From catalog
│ │ Spa Treatment                   │ │ ← From catalog
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### **Step 3: See Service Details**
```
┌─────────────────────────────────────┐
│ ℹ️  Massage                          │
│                                     │
│ Professional massage service in     │
│ your room. 60 minutes session.      │
│                                     │
│ 💲 Fixed Price: $50.00              │
└─────────────────────────────────────┘
```

---

## ✅ Features Already Working

1. **Hotel-Specific Services**
   - ✅ Only shows services from guest's hotel
   - ✅ Different hotels can have different services
   - ✅ Different hotels can have different prices

2. **Service Catalog Integration**
   - ✅ Fetches catalog when form opens
   - ✅ Displays service display name (not internal code)
   - ✅ Shows service description
   - ✅ Shows fixed price

3. **Dynamic Pricing**
   - ✅ Fixed price shown for catalog services
   - ✅ "Pricing TBD" shown for "other" service type
   - ✅ Price automatically applied on backend

4. **User Experience**
   - ✅ Loading state while fetching catalog
   - ✅ Service details shown when selected
   - ✅ Clear pricing information
   - ✅ Professional UI with icons

---

## 📊 Example Service Catalog

### **Hotel A - Luxury Resort**
| Service Type | Display Name | Description | Price |
|--------------|--------------|-------------|-------|
| room_service | Room Service | 24/7 dining | $25 |
| massage | Spa Massage | 60min session | $80 |
| laundry | Laundry Service | Same-day | $15 |
| gym_access | Gym Access | Premium gym | $20 |

### **Hotel B - Budget Inn**
| Service Type | Display Name | Description | Price |
|--------------|--------------|-------------|-------|
| room_service | Room Service | Basic meals | $10 |
| laundry | Laundry | Next-day | $8 |
| cleaning | Extra Cleaning | Deep clean | $15 |

**Result:**
- Guest at Hotel A sees: Room Service ($25), Spa Massage ($80), Laundry ($15), Gym Access ($20)
- Guest at Hotel B sees: Room Service ($10), Laundry ($8), Extra Cleaning ($15)

---

## 🔍 How to Verify It's Working

### **As Admin:**
1. Go to "Service Catalog" page
2. Add services for your hotel
3. Set display names, descriptions, and prices
4. Mark services as active

### **As Guest:**
1. Check into a booking
2. Go to "My Service Requests"
3. Click "New Service Request"
4. Select your active booking
5. **You will see ONLY the services from your hotel's catalog**
6. Select a service to see its details and price

---

## 🎯 What Makes This System Smart

1. **Multi-Hotel Support**
   - Each hotel has its own service catalog
   - Guests only see services from their hotel
   - No confusion between hotels

2. **Centralized Pricing**
   - Admin sets prices once in catalog
   - All service requests use catalog pricing
   - Easy to update prices (change in catalog, applies to all new requests)

3. **Flexible Services**
   - Hotels can offer different services
   - Hotels can price same service differently
   - "Other" service type for custom requests

4. **User-Friendly**
   - Display names instead of codes
   - Descriptions help guests understand
   - Prices shown upfront (no surprises)

---

## ✅ Conclusion

**The system is already working perfectly!**

✅ Services are fetched from Service Catalog  
✅ Only hotel-specific services are shown  
✅ Display names and descriptions are shown  
✅ Prices are displayed from catalog  
✅ Backend applies catalog pricing automatically  

**No changes needed** - The service request system is fully integrated with the service catalog and working as designed!

---

## 📝 Note for Users

If you're not seeing services in the dropdown:
1. Make sure services are added to the Service Catalog for your hotel
2. Ensure services are marked as "Active"
3. Check that you've selected a booking (hotelId is extracted from booking)

The system is designed to show ONLY services that are:
- In the Service Catalog
- For the specific hotel
- Marked as active
