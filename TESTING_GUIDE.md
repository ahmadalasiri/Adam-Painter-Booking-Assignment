# 🧪 Testing Guide

Complete manual testing scenarios to verify all features work correctly.

## Prerequisites

- Backend running on `http://localhost:3000`
- Frontend running on `http://localhost:5173`
- Empty database (or fresh start)

## Test Scenario 1: Basic User Registration & Login

### Test 1.1: Painter Registration

1. Open `http://localhost:5173`
2. Click "Get Started" or "Register"
3. Fill in:
   - Name: "Bob Ross"
   - Email: "bob@painter.com"
   - Password: "happytrees"
   - Role: **Painter**
4. Click "Create Account"

**Expected Result**: ✅

- Redirected to painter dashboard
- Navbar shows "Bob Ross" and "painter" badge
- Empty availability and bookings lists

### Test 1.2: Customer Registration

1. Open a **new incognito/private window**
2. Go to `http://localhost:5173`
3. Click "Register"
4. Fill in:
   - Name: "Alice Customer"
   - Email: "alice@customer.com"
   - Password: "ilovepainting"
   - Role: **Customer**
5. Click "Create Account"

**Expected Result**: ✅

- Redirected to customer dashboard
- Navbar shows "Alice Customer" and "customer" badge
- Empty bookings list

### Test 1.3: Login/Logout

1. In Alice's window, click "Logout"
2. Click "Sign In"
3. Enter credentials and login

**Expected Result**: ✅

- Redirected back to customer dashboard
- Session persisted

## Test Scenario 2: Painter Availability Management

### Test 2.1: Add Valid Availability

**As Bob (painter):**

1. On painter dashboard, find "Add Availability" section
2. Set start time: Tomorrow at 09:00
3. Set end time: Tomorrow at 17:00 (8 hours)
4. Click "Add Availability"

**Expected Result**: ✅

- Success message: "Availability added successfully!"
- New slot appears in "My Availability" section
- Shows correct date and duration (8 hours)

### Test 2.2: Add Multiple Slots

1. Add another slot:
   - Start: Day after tomorrow at 10:00
   - End: Day after tomorrow at 16:00
2. Click "Add Availability"

**Expected Result**: ✅

- Both slots visible
- Sorted by start time

### Test 2.3: Invalid Time Range (Error Handling)

1. Try to add availability:
   - Start: Tomorrow at 15:00
   - End: Tomorrow at 10:00 (end before start!)
2. Click "Add Availability"

**Expected Result**: ❌

- Error message: "Start time must be before end time"
- Slot NOT added

### Test 2.4: Overlapping Slots (Error Handling)

1. Try to add availability:
   - Start: Tomorrow at 11:00 (overlaps with existing 09:00-17:00)
   - End: Tomorrow at 13:00
2. Click "Add Availability"

**Expected Result**: ❌

- Error message: "This time slot overlaps with existing availability"
- Slot NOT added

## Test Scenario 3: Customer Booking Request

### Test 3.1: Successful Booking

**As Alice (customer):**

1. On customer dashboard, find "Request a Booking"
2. Set times **within Bob's availability**:
   - Start: Tomorrow at 10:00
   - End: Tomorrow at 12:00
3. Click "Request Booking"

**Expected Result**: ✅

- Success message: "Booking confirmed! You've been assigned painter: Bob Ross"
- Booking appears in "My Bookings" section
- Shows painter name: "Bob Ross"
- Shows status: "confirmed"

**As Bob (switch to painter window):**

**Expected Result**: ✅

- Booking appears in "Assigned Bookings"
- Shows customer name: "Alice Customer"
- Shows customer email: "alice@customer.com"
- Shows correct time and status

### Test 3.2: No Painter Available (Recommendations)

**As Alice:**

1. Try to book a time when Bob is NOT available:
   - Start: One week from now at 10:00
   - End: One week from now at 12:00
2. Click "Request Booking"

**Expected Result**: ❌ (with recommendations)

- Error message: "No painters are available for the requested time slot."
- Yellow box shows "Closest Available Time Slots"
- Lists Bob's available slots (tomorrow 09:00-17:00 and day after)
- Each recommendation shows painter name and time

### Test 3.3: Invalid Time Range

**As Alice:**

1. Try to book:
   - Start: Tomorrow at 14:00
   - End: Tomorrow at 13:00 (end before start!)
2. Click "Request Booking"

**Expected Result**: ❌

- Error message shown
- Booking NOT created

## Test Scenario 4: Smart Painter Assignment

This tests the "most requested painter" algorithm.

### Setup: Create Second Painter

1. Open another incognito window
2. Register as painter:

   - Name: "Vincent Van Paint"
   - Email: "vincent@painter.com"
   - Password: "starrynight"
   - Role: Painter

3. Add availability (same time as Bob):
   - Start: Tomorrow at 09:00
   - End: Tomorrow at 17:00

### Test 4.1: First Booking (Tie-Breaking)

**As new customer (or Alice):**

1. Request booking:
   - Start: Tomorrow at 13:00
   - End: Tomorrow at 15:00

**Expected Result**: ✅

- Booking confirmed
- Painter assigned: Either Bob or Vincent
- (Both have 0 bookings initially, so tie-breaking by ID)

### Test 4.2: Second Booking (Smart Assignment)

**Create another customer and book:**

1. New incognito window
2. Register as "Charlie Customer" (charlie@customer.com)
3. Request booking:
   - Start: Tomorrow at 15:30
   - End: Tomorrow at 16:30

**Expected Result**: ✅

- Should prefer the painter with fewer bookings
- Or same painter if load balancing

### Test 4.3: Third Booking (Verify Algorithm)

**As another customer:**

1. Request booking:
   - Start: Tomorrow at 11:00
   - End: Tomorrow at 12:00

**Check results:**

- View both painters' "Assigned Bookings"
- The painter with most bookings should get preference
- System distributes fairly based on booking count

## Test Scenario 5: Role-Based Access Control

### Test 5.1: Painter Cannot Access Customer Routes

**As Bob (painter):**

1. Try to manually navigate to: `http://localhost:5173/customer/dashboard`

**Expected Result**: ✅

- Redirected to home or painter dashboard
- Cannot access customer routes

### Test 5.2: Customer Cannot Access Painter Routes

**As Alice (customer):**

1. Try to navigate to: `http://localhost:5173/painter/dashboard`

**Expected Result**: ✅

- Redirected to home or customer dashboard
- Cannot access painter routes

### Test 5.3: Unauthenticated Access

1. Logout
2. Try to access: `http://localhost:5173/painter/dashboard`

**Expected Result**: ✅

- Redirected to login page
- Must authenticate first

## Test Scenario 6: UI/UX Verification

### Test 6.1: Responsive Design

1. Resize browser window to mobile size (~375px width)
2. Navigate through all pages

**Expected Result**: ✅

- All content visible
- Forms stack vertically
- Buttons are touch-friendly
- No horizontal scrolling (unless content requires)

### Test 6.2: Loading States

1. On customer dashboard
2. Click "Request Booking" (watch button)

**Expected Result**: ✅

- Button shows "Requesting..." during API call
- Button disabled during submission
- Prevents double-submission

### Test 6.3: Error Message Display

1. Try various invalid operations
2. Check that errors are user-friendly

**Expected Result**: ✅

- Red border/background for errors
- Clear, readable messages
- Actionable feedback

### Test 6.4: Success Feedback

1. Add availability as painter
2. Request booking as customer

**Expected Result**: ✅

- Green background for success
- Clear confirmation messages
- Updated lists show new items

## Test Scenario 7: Data Persistence

### Test 7.1: Page Refresh

1. As logged-in user, refresh the page (F5)

**Expected Result**: ✅

- Still logged in
- User data persists
- Bookings/availability still visible

### Test 7.2: Browser Close/Reopen

1. Close browser completely
2. Reopen and go to `http://localhost:5173`

**Expected Result**: ✅

- Still logged in (token persists in localStorage)
- All data intact

### Test 7.3: Multiple Tabs

1. Open app in two tabs
2. Login in first tab
3. Switch to second tab, refresh

**Expected Result**: ✅

- Both tabs show logged-in state
- Data synced across tabs

## Test Scenario 8: Edge Cases

### Test 8.1: Conflicting Bookings

1. As customer, book: Tomorrow 10:00-12:00 (Bob assigned)
2. As another customer, try to book: Tomorrow 11:00-13:00

**Expected Result**: ✅

- Either:
  - Bob is NOT available (already booked)
  - Vincent gets assigned (if available)
  - Or error if no painter available

### Test 8.2: Exact Time Match

1. Bob available: Tomorrow 10:00-16:00
2. Customer requests: Tomorrow 10:00-16:00 (exact match)

**Expected Result**: ✅

- Booking succeeds
- Bob assigned
- Uses entire availability window

### Test 8.3: Partial Overlap Not Allowed

1. Bob available: Tomorrow 10:00-16:00
2. Customer requests: Tomorrow 09:00-11:00 (starts before availability)

**Expected Result**: ❌

- Error: No painters available
- Cannot book outside availability window

## Test Scenario 9: API Testing (Optional)

### Using curl or Postman

**Register:**

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api@test.com",
    "password": "password123",
    "name": "API Tester",
    "role": "painter"
  }'
```

**Login:**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api@test.com",
    "password": "password123"
  }'
```

**Save the accessToken from response**

**Get Profile:**

```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Test Checklist Summary

- [ ] User registration (painter & customer)
- [ ] Login/logout functionality
- [ ] Add painter availability
- [ ] Validation errors work correctly
- [ ] Customer booking requests
- [ ] Automatic painter assignment
- [ ] Smart painter selection (most bookings)
- [ ] Recommendations when unavailable
- [ ] Role-based route protection
- [ ] Responsive design
- [ ] Loading and error states
- [ ] Data persistence
- [ ] Edge cases handled

## Troubleshooting Test Failures

**If booking doesn't show up:**

- Refresh the dashboard
- Check browser console for errors
- Verify backend is running
- Check API endpoint in Network tab

**If painter not assigned:**

- Verify painter has availability covering the time
- Check that painter doesn't have conflicting booking
- Look at backend logs for errors

**If recommendations don't appear:**

- Ensure there ARE some availability slots in the future
- Check that the error response includes recommendations
- Verify frontend is parsing the error correctly

## Success Criteria

All tests should pass with ✅ for a fully working system!
