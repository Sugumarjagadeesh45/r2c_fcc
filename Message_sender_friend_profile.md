# Message Sender & Friend Profile Integration Guide

This document outlines the API endpoints, parameters, and integration details required for the backend AI to fetch and display real user profile data for message senders, friends, and friend request senders.

## 1. API Endpoints

### A. Get User Profile (Public/Private View)
Fetches the profile details of a specific user.

*   **URL:** `/api/user/profile/:userId`
*   **Method:** `GET`
*   **Headers:**
    *   `Authorization`: `Bearer <token>` (Required to check friendship status and privacy settings)
    *   `Content-Type`: `application/json`
*   **Path Parameters:**
    *   `userId`: The unique MongoDB `_id` or custom `userId` of the user to fetch.
*   **Response (Success 200):**
    ```json
    {
      "success": true,
      "data": {
        "_id": "65a1b2c3d4e5f6...",
        "userId": "john_doe_123",
        "name": "John Doe",
        "email": "john@example.com", // May be masked if not friends
        "avatar": "https://example.com/uploads/profile/123.jpg", // Real URL
        "bio": "Lover of nature and coding.",
        "location": "New York, USA",
        "website": "https://johndoe.dev",
        "gender": "male",
        "dateOfBirth": "1990-01-01",
        "isOnline": true,
        "lastSeen": "2024-01-15T10:30:00.000Z",
        "stats": {
          "postsCount": 42,
          "followersCount": 150,
          "followingCount": 80,
          "profileCompletion": 85
        },
        "friendshipStatus": "friends" // 'friends', 'request_sent', 'request_received', 'none', 'blocked'
      }
    }
    ```

### B. Get Friends List
Fetches the authenticated user's friends list.

*   **URL:** `/api/friends`
*   **Method:** `GET`
*   **Response:** Returns an array of user objects (as defined above) with `status: 'accepted'`.

### C. Get Friend Requests
Fetches pending friend requests (sender profiles).

*   **URL:** `/api/friends/requests/pending`
*   **Method:** `GET`
*   **Response:** Returns an array of request objects containing the `fromUser` profile details.

## 2. Backend AI Integration Notes

To ensure the "Backend AI" automatically fetches and serves the correct data:

1.  **Context Awareness:** When a user clicks on a profile in the frontend (Message Screen, Friend List, etc.), the frontend passes the `userId`. The backend must use this `userId` to query the `users` collection.
2.  **Real Data Enforcement:**
    *   **Profile Image:** Must return a valid URL (S3, Cloudinary, or Firebase Storage). If missing, return a deterministic default avatar based on gender or name, not a generic placeholder if possible.
    *   **User ID:** The custom `userId` (e.g., `@john_doe`) should be prioritized for display over the MongoDB `_id`.
    *   **Friendship Status:** The backend *must* calculate the relationship between the *requesting user* (from token) and the *target user* (from URL) to return the correct `friendshipStatus`. This drives the UI buttons (e.g., "Add Friend" vs "Message").
3.  **Privacy:**
    *   If `friendshipStatus` is `none` or `blocked`, sensitive fields like `email` or `phone` should be omitted from the response.
    *   `posts` should only be returned if the profile is public or if the users are friends.

## 3. Frontend Navigation Flow

*   **Trigger:** User taps avatar in `MessageScreen`, `FriendsScreen`, or `SearchScreen`.
*   **Action:** `navigation.navigate('ProfileView', { userId: 'TARGET_USER_ID' })`
*   **Data Loading:** `ProfileScreen.tsx` detects the `userId` param.
    *   **If `userId` == Current User:** Loads data from local `UserContext`.
    *   **If `userId` != Current User:** Calls `GET /api/user/profile/:userId` and displays the fetched data in "View Mode" (Edit buttons hidden, Action buttons shown).

## 4. Required Data Fields (Mandatory)

The following fields must always be present in the response for a professional UI:

*   `_id` (String)
*   `name` (String)
*   `avatar` (String URL)
*   `userId` (String - Display ID)
*   `stats` (Object - counts for posts/followers)

---
*Generated for Reals2Chat Professional UI Upgrade*
