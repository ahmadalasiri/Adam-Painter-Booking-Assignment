# API Testing with HTTP Files

This folder contains `.http` files for testing the API endpoints using REST Client extensions.

## Setup

### For VS Code

Install the **REST Client** extension by Huachao Mao:

- Extension ID: `humao.rest-client`
- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)

### For IntelliJ/WebStorm

The HTTP Client is built-in. Just open any `.http` file and click the play button.

### Environment Configuration

The backend uses the following environment variables that affect API behavior:

#### Recommendation System

- **`RECOMMENDATION_WINDOW_DAYS`** (default: `7`)  
  Days ahead to search for alternative slots when no exact match exists.

- **`MIN_SLOT_DURATION_PERCENT`** (default: `50`, range: `1-100`)  
  Minimum slot duration as percentage of requested duration.  
  **Example**: Customer requests 2 hours with `MIN_SLOT_DURATION_PERCENT=50`  
  → Only return slots ≥ 1 hour (not 10-minute slots)

#### Painter Selection

- **`PAINTER_SELECTION_STRATEGY`** (default: `most`)  
  Options: `most` (most requested) or `least` (least requested)  
  Controls which available painter gets assigned to bookings.

## Files

### 📄 `workflow.http`

**Complete end-to-end testing workflow**

- Start here for a full system test
- Follow steps 1-10 in order
- Copy tokens between requests as needed

### 📄 `auth.http`

**Authentication endpoints**

- Register as painter or customer
- Login
- Get profile

### 📄 `availability.http`

**Painter availability management**

- Add availability slots
- View availability
- Test validation (overlapping slots, invalid times)

### 📄 `booking.http`

**Customer booking requests**

- Request bookings
- View bookings (customer & painter)
- Test recommendations when no painter available
- Test validation

## Usage

### Quick Start

1. Make sure the backend is running: `npm run start:dev`
2. Open `workflow.http`
3. Click "Send Request" above each request
4. Copy the `accessToken` from login responses
5. Replace `PAINTER_TOKEN` and `CUSTOMER_TOKEN` with actual tokens

### Using Variables

Each file has variables at the top:

```http
@baseUrl = http://localhost:3000
@contentType = application/json
@painterToken = YOUR_TOKEN_HERE
```

You can:

- Modify `@baseUrl` for different environments
- Set tokens once at the top
- Use `{{variable}}` syntax in requests

### Example Flow

```http
### Step 1: Register
POST {{baseUrl}}/auth/register
Content-Type: {{contentType}}

{
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User",
  "role": "painter"
}

### Step 2: Login (copy the accessToken from response)
POST {{baseUrl}}/auth/login
Content-Type: {{contentType}}

{
  "email": "test@example.com",
  "password": "password123"
}

### Step 3: Use the token
GET {{baseUrl}}/auth/profile
Authorization: Bearer YOUR_COPIED_TOKEN_HERE
```

## Expected Responses

### ✅ Success Responses

**Register/Login:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "painter"
  }
}
```

**Booking Success:**

```json
{
  "bookingId": "uuid",
  "painter": {
    "id": "uuid",
    "name": "Painter Name"
  },
  "startTime": "2025-10-15T10:00:00.000Z",
  "endTime": "2025-10-15T12:00:00.000Z",
  "status": "confirmed"
}
```

### ❌ Error Responses

**No Painter Available:**

```json
{
  "error": "No painters are available for the requested time slot.",
  "recommendations": [
    {
      "painterId": "uuid",
      "painterName": "Bob Ross",
      "startTime": "2025-10-15T09:00:00.000Z",
      "endTime": "2025-10-15T18:00:00.000Z"
    }
  ]
}
```

**Validation Error:**

```json
{
  "message": "Start time must be before end time",
  "statusCode": 400
}
```

## Testing Scenarios

### Scenario 1: Successful Booking

1. Register painter → Add availability
2. Register customer → Request booking within availability
3. ✅ Booking confirmed with painter assigned

### Scenario 2: No Availability

1. Customer requests booking outside painter's availability
2. ❌ Error with recommended alternative slots

### Scenario 3: Multiple Painters

1. Register 2 painters with same availability
2. Create multiple bookings
3. ✅ System assigns most requested painter

### Scenario 4: Validation

1. Try overlapping availability slots
2. Try invalid time ranges (end before start)
3. ❌ Appropriate validation errors

## Tips

- **Keep tokens organized**: Copy tokens to a separate note
- **Use named requests**: The `# @name` comments allow referencing responses
- **Environment files**: Create `.env.http` for different environments
- **Keyboard shortcuts**: In VS Code, `Ctrl+Alt+R` (Windows) or `Cmd+Alt+R` (Mac)

## Troubleshooting

**401 Unauthorized**: Token expired or invalid

- Login again and get a new token

**403 Forbidden**: Wrong role trying to access endpoint

- Painters can't access customer endpoints and vice versa

**Connection refused**: Backend not running

- Run `npm run start:dev` in backend folder

**404 Not Found**: Wrong endpoint URL

- Check `@baseUrl` variable

## Alternative Tools

You can also use:

- **Postman**: Import requests manually
- **curl**: Copy as curl from REST Client
- **Insomnia**: Similar to Postman
- **Thunder Client**: VS Code extension alternative
