# Supabase Edge Function - Notify

This Edge Function handles sending push notifications via Firebase Cloud Messaging (FCM) when a new notification is inserted into the database.

## Setup

### 1. Set Environment Variables in Supabase Dashboard

Go to **Project Settings → Edge Functions → Add Secret** and add:

- `FIREBASE_SERVER_KEY`: Your Firebase Cloud Messaging Server Key

### 2. Deploy the Function

```bash
supabase functions deploy notify
```

### 3. Test the Function

```bash
curl -i --location --request POST 'https://kbgbftyvbdgyoeosxlok.supabase.co/functions/v1/notify' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "notification_id": 1,
    "user_id": 123,
    "title": "Test Notification",
    "message": "This is a test",
    "notification_type": "system",
    "priority": "high"
  }'
```

## How It Works

1. Database trigger fires when notification is inserted
2. Trigger calls this Edge Function via webhook
3. Function fetches user's FCM token from database
4. Sends push notification via FCM
5. Returns success/failure status
