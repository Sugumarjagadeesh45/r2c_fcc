# Message Screen Backend Requirements & Information

This document compiles specific backend requirements and information relevant to the `MessageScreen.tsx` frontend component, especially for integration with an AI-driven backend or for extending existing backend functionality.

## 1. API Endpoints Used by `MessageScreen.tsx`

### 1.1. Fetch Message History

- **Endpoint:** `GET /api/messages/:otherUserId`
- **Description:** Retrieves the chat history between the authenticated user and `otherUserId`.
- **Frontend Usage:** `MessageScreen.tsx` calls this on component mount to load previous messages.
- **Expected Success Response (200):**
  ```json
  {
    "success": true,
    "data": [
      // Array of message objects, most recent first (backend should ideally send it reversed for GiftedChat)
      {
        "_id": "63b8c3b9e4b0e4b8c8e1b1a3",
        "conversationId": "...",
        "sender": { "_id": "...", "name": "...", "avatar": "..." }, // Sender object
        "recipientId": "...",
        "text": "Hello!",
        "attachment": { "type": "image", "url": "https://example.com/img.jpg" }, // Optional
        "createdAt": "2023-01-07T12:00:00.000Z",
        "status": "sent" // 'sent', 'delivered', 'read'
      },
      // ... more messages
    ]
  }
  ```
- **Error Handling:** Standard HTTP error codes (401 Unauthorized, 500 Internal Server Error).

### 1.2. Update Conversation Metadata

- **Endpoint:** `PUT /api/conversations/:otherUserId/metadata`
- **Description:** Updates various settings for a specific chat conversation (e.g., block user, pin chat, custom ringtone).
- **Frontend Usage:** Triggered by options in the "More" menu.
- **Request Body (Example):**
  ```json
  {
    "isBlocked": true,
    "isPinned": false,
    "customRingtone": null
  }
  ```
- **Expected Success Response (200):**
  ```json
  {
    "success": true,
    "metadata": { /* updated metadata object */ }
  }
  ```

## 2. Real-time Communication (Socket.IO)

`MessageScreen.tsx` utilizes Socket.IO for real-time messaging.

### 2.1. Client-to-Server Events

- **`sendMessage`:**
  - **Description:** Sent when the user sends a new message (text or attachment).
  - **Payload:**
    ```json
    {
      "recipientId": "ID_OF_OTHER_USER",
      "text": "The message content", // Can be empty if attachment exists
      "attachment": { // Optional
        "type": "image" | "video" | "file",
        "url": "URL_TO_UPLOADED_ATTACHMENT" // This URL must be pre-uploaded.
      }
    }
    ```
  - **Backend Action:** Save message to database, then emit `receiveMessage` to recipient and `messageStatusUpdate` to sender.

- **`typing`:**
  - **Description:** Emitted when the user starts typing.
  - **Payload:** `{ "recipientId": "ID_OF_OTHER_USER" }`

- **`stopTyping`:**
  - **Description:** Emitted when the user stops typing.
  - **Payload:** `{ "recipientId": "ID_OF_OTHER_USER" }`

### 2.2. Server-to-Client Events (Backend should emit these)

- **`receiveMessage`:**
  - **Description:** Backend should emit this to the recipient (and potentially echo to the sender for confirmation) when a new message is sent.
  - **Payload:** Full message object as per the Message Schema, but with `sender` as an object:
    ```json
    {
      "_id": "SERVER_GENERATED_MESSAGE_ID",
      "conversationId": "...",
      "sender": { "_id": "SENDER_USER_ID", "name": "Sender Name", "avatar": "Sender Avatar URL" },
      "recipientId": "RECIPIENT_USER_ID",
      "text": "The message content",
      "attachment": { "type": "image", "url": "..." }, // Optional
      "createdAt": "ISO_DATE_STRING",
      "status": "sent" // Initial status when first received by server
    }
    ```
    **Note for AI Backend:** The `_id` and `createdAt` from the server are critical for `GiftedChat` to function correctly and for message deduping (replacing optimistic messages).

- **`typingStatus`:**
  - **Description:** Informs a user about the typing status of another user.
  - **Payload:** `{ "senderId": "TYPING_USER_ID", "isTyping": true | false }`

- **`messageStatusUpdate`:**
  - **Description:** (Proposed) Backend should emit this to the sender when a message's status changes (e.g., from 'sent' to 'delivered', or 'delivered' to 'read').
  - **Payload:**
    ```json
    {
      "_id": "MESSAGE_ID_TO_UPDATE",
      "status": "delivered" | "read"
    }
    ```
    **Note:** `MessageScreen.tsx` currently displays `sent`, `delivered`, `read`, and `pending` statuses. The backend needs to update these and send real-time notifications for status changes.

## 3. Push Notifications (FCM) Requirements

The user explicitly requested FCM push notifications for new messages, including screen pop-up and default mobile tone.

### 3.1. Backend Action for New Message Notification

When the backend receives a `sendMessage` event (via WebSocket or REST API):
1.  Save the message to the database.
2.  Emit `receiveMessage` via Socket.IO to the recipient.
3.  **Crucially:** Send an FCM push notification to the `recipientId`'s device(s).

### 3.2. FCM Payload (Recommended Structure)

For a rich, interactive notification, the backend should send a data payload along with the notification payload (for foreground handling) or just a notification payload (for background/killed state).

**Example FCM Payload for a New Message:**

```json
{
  "to": "FCM_DEVICE_TOKEN_OF_RECIPIENT",
  "notification": {
    "title": "New Message from [Sender Name]",
    "body": "[Message Text Preview]...",
    "sound": "default", // Plays default notification sound
    "priority": "high",
    "android_channel_id": "chat_messages" // Required for Android Oreo+ for custom sounds/settings
  },
  "data": {
    "type": "chat_message",
    "otherUserId": "SENDER_USER_ID", // The _id of the user who sent the message (the chat partner for the recipient)
    "otherUserName": "Sender Name", // The name of the sender
    "otherUserPhotoURL": "Sender Avatar URL", // The avatar URL of the sender
    "conversationId": "CONVERSATION_ID", // Important for navigating to the correct chat
    "messageId": "MESSAGE_ID",
    "text": "Full message text (optional, for direct display in app)",
    "timestamp": "ISO_DATE_STRING"
  }
}
```

**Backend Responsibilities for FCM:**
- Store FCM device tokens for each user.
- Associate `recipientId` with their active FCM tokens.
- Construct and send the FCM payload when a new message arrives.
- **Crucially:** Ensure the `data` payload for `chat_message` notifications includes `otherUserId`, `otherUserName`, and `otherUserPhotoURL` corresponding to the sender of the message. This data is used by the frontend's `MessageScreen.tsx` to identify the chat partner and display their profile information, especially when navigating directly from a notification.

## 4. Console Logging Requirements (for Debugging/Verification)

For enhanced debugging, the backend should log the following when a message is sent or received:

- **FCM Notification Sent:** `[FCM] Notification sent to [recipientId] for message [messageId]. Title: [Title], Body: [Body]`
- **Message Received (Backend):** `[Socket] Message received from [senderId] for [recipientId]. Content: [text/attachment details]`
- **Message Stored (Backend):** `[DB] Message [messageId] stored. Status: [status]`
- **Socket Event Emitted:** `[Socket] Emitting 'receiveMessage' to [recipientId] for message [messageId]`
