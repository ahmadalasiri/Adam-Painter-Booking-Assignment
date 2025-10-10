# 🎨 Adam Painter Booking Assignment

## 🧩 Introduction

For this assignment, you’ll build a simplified scheduling system that allows customers to request painting services for a specific time window.  
The system will automatically assign an available painter based on their availability.

Instead of customers choosing a specific painter, your system is responsible for matching the request to the most available painter.

---

## ⚙️ System Overview

Build a minimal system where:

- Allow painters to define their available time slots.
- Allow customers to request a time slot for a paint job.
- Automatically assign a painter whose availability fits the requested time.

---

## 🖥️ UI Expectations

As part of this assignment, implement a simple and clean frontend using **React** that demonstrates your ability to build user-friendly interfaces.  
The design does not need to be pixel-perfect or styled with a design system, but it should reflect solid frontend fundamentals.

### Minimum UI Requirements

#### 👨‍🎨 Painters

- Add available time slots
- View assigned bookings

#### 🧑‍💼 Customers

- Request a booking for a specific time slot
- View their upcoming bookings

---

## 🌐 API References

### 🎨 Painter Availability

#### **POST /availability**

Painter defines an available time slot.

**Request**

```json
{
  "startTime": "2025-05-18T10:00:00Z",
  "endTime": "2025-05-18T14:00:00Z"
}
```

**Response**

```json
{
  "id": "uuid",
  "painterId": "uuid",
  "startTime": "2025-05-18T10:00:00Z",
  "endTime": "2025-05-18T14:00:00Z"
}
```

---

#### **GET /availability/me**

Painter views their own availability.

**Response**

```json
[
  {
    "id": "uuid",
    "startTime": "2025-05-18T10:00:00Z",
    "endTime": "2025-05-18T14:00:00Z"
  },
  {
    "id": "uuid",
    "startTime": "2025-05-19T08:00:00Z",
    "endTime": "2025-05-19T12:00:00Z"
  }
]
```

---

### 📆 Customer Booking

#### **POST /booking-request**

Customer submits a paint job request for a specific time slot.  
The system finds and assigns an available painter.

**Request**

```json
{
  "startTime": "2025-05-18T11:00:00Z",
  "endTime": "2025-05-18T13:00:00Z"
}
```

**Successful Response**

```json
{
  "bookingId": "uuid",
  "painter": {
    "id": "uuid",
    "name": "Best Painter"
  },
  "startTime": "2025-05-18T11:00:00Z",
  "endTime": "2025-05-18T13:00:00Z",
  "status": "confirmed"
}
```

**Error Response**

```json
{
  "error": "No painters are available for the requested time slot."
}
```

---

## 💡 Bonus Features

### 🕓 Recommend Closest Available Slot

If no painters are available for a requested time slot, implement a solution that can recommend the closest available slot.

### 🧠 Smart Painter Prioritization

If multiple painters are available for a requested time slot, implement a strategy to intelligently choose the **best painter** for the job.  
You are free to define your own criteria.

Here we are more keen on your product and critical thinking mindset.  
Even if you did not have the time to finish the code, just write down your thoughts on how you will implement it.
