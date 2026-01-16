# Backend Documentation for Professional Chat

This document outlines the backend requirements for the professional chat feature in the Reals2Chat application.

## 1. Authentication

All endpoints listed below require a valid JSON Web Token (JWT) to be included in the `Authorization` header of the request.

`Authorization: Bearer <your_jwt_token>`

---

## 2. Data Schemas

### 2.1. Message Schema

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique identifier for the message. |
| `conversationId` | ObjectId | The ID of the conversation this message belongs to. |
| `senderId` | ObjectId | The ID of the user who sent the message. |
| `recipientId` | ObjectId | The ID of the user who received the message. |
| `text` | String | The content of the message. Can be empty if there is an attachment. |
| `attachment` | Object | Optional attachment data. |
| `attachment.type` | String | Type of attachment (`'image'`, `'video'`, `'file'`). |
| `attachment.url` | String | URL of the uploaded attachment. |
| `createdAt` | Date | The timestamp when the message was created. |
| `status` | String | The status of the message (`'sent'`, `'delivered'`, `'read'`). |

### 2.2. Conversation Metadata Schema

To handle features like pinning, custom ringtones, and blocking, a new collection `conversation_metadata` is recommended.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique identifier for the metadata entry. |
| `userId` | ObjectId | The ID of the user who owns this metadata. |
| `otherUserId` | ObjectId | The ID of the other user in the conversation. |
| `isPinned` | Boolean | `true` if the user has pinned this conversation. |
| `isBlocked` | Boolean | `true` if the user has blocked the other user. |
| `customRingtone` | String | URL or identifier for a custom ringtone. |
| `isFavorite` | Boolean | `true` if the user has marked the other user as a favorite. |

---

## 3. API Endpoints

### 3.1. Get Friends List

- **Endpoint:** `GET /api/friends`
- **Description:** Retrieves a list of the authenticated user's accepted friends.
- **Success Response (200):**
  ```json
  {
    "success": true,
    "friends": [
      {
        "_id": "63b8c3b9e4b0e4b8c8e1b1a3",
        "name": "Jane Doe",
        "photoURL": "https://example.com/avatar.jpg",
        "isOnline": true,
        "lastSeen": "2023-01-07T11:55:00.000Z"
      }
    ]
  }
  ```

### 3.2. Get Message History

- **Endpoint:** `GET /api/messages/:otherUserId`
- **Description:** Retrieves the message history with another user.
- **Success Response (200):** See Message Schema.

### 3.3. Send a Message

- **Endpoint:** `POST /api/messages/send`
- **Description:** Sends a new message.
- **Request Body:**
  ```json
  {
    "recipientId": "63b8c3b9e4b0e4b8c8e1b1a3",
    "text": "Hello there!",
    "attachment": {
        "type": "image",
        "url": "https://example.com/image.jpg"
    }
  }
  ```
- **Success Response (201):** Returns the newly created message object.

### 3.4. Update Conversation Metadata

- **Endpoint:** `PUT /api/conversations/:otherUserId/metadata`
- **Description:** Updates metadata for a conversation (pin, block, etc.).
- **Request Body:**
  ```json
  {
    "isPinned": true,
    "isBlocked": false,
    "customRingtone": "ringtone_url",
    "isFavorite": true
  }
  ```
- **Success Response (200):** Returns the updated metadata object.

---

## 4. Real-time Communication (WebSockets)

A WebSocket connection is required for real-time features.

### 4.1. Connection

- **Event:** `connection`
- **Description:** Authenticate user via JWT in the query: `io(API_URL, { query: { token } })`.

### 4.2. Events

| Event Name | Direction | Description | Payload |
| :--- | :--- | :--- | :--- |
| `sendMessage` | Client -> Server | User sends a new message. | `{ "recipientId": "...", "text": "...", "attachment": { ... } }` |
| `receiveMessage` | Server -> Client | Server delivers a new message to the recipient. | Full message object (see Message Schema). |
| `userStatus` | Server -> Client | Broadcasts a user's online/offline status to their friends. | `{ "userId": "...", "isOnline": true, "lastSeen": "..." }` |
| `typing` | Client -> Server | User is typing a message. | `{ "recipientId": "..." }` |
| `stopTyping` | Client -> Server | User has stopped typing. | `{ "recipientId": "..." }` |
| `typingStatus` | Server -> Client | Informs a user that the other user is typing. | `{ "senderId": "...", "isTyping": true }` |

## 5. Error Handling

API responses should use standard HTTP status codes. A generic error response body should be:
```json
{
  "success": false,
  "message": "A description of the error."
}
```
- `400 Bad Request`: Invalid request body or parameters.
- `401 Unauthorized`: Invalid or missing JWT.
- `404 Not Found`: Resource not found.
- `500 Internal Server Error`: Server-side error.