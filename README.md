# Sanctum — Bedtime Wind-Down & Emotion Gradient Journal

**Sanctum** is a tranquil, mobile-first bedtime reflection companion designed for evening decompression. Before going to sleep, users move through a gentle, four-stage staged reflection to unburden their minds, capture daily highlights, cultivate gratitude, and select multiple feelings. Powered by **Gemini AI**, **Firebase Authentication**, **Cloud Firestore**, and **Google Cloud Run**, Sanctum transforms bedtime reflections into topic-separated journals and visualizes daily feelings as multi-color emotional gradients on an evening calendar.

---

## Brief Description of Your Solution

Modern wind-downs often suffer from screen clutter and friction. Sanctum solves this by offering an uncluttered, night-themed digital sanctuary:
- **Gentle 4-Stage Wind-Down**: Users step through bite-sized stages (*Feelings & Energy*, *Today's Journey*, *Unburdening & Letting Go*, and *Gratitude*) using minimal text inputs and hands-free voice dictation.
- **Multi-Feeling Emotional Gradients**: Users can select more than one emotion for their evening (e.g., *Peaceful & Serene* combined with *Grateful & Warm*). The app generates a harmonious, multi-stop color gradient representing the unique emotional atmosphere of their night.
- **AI-Separated Topic Journals**: Gemini distills the reflection into distinct, digestible bedtime topics (*Today's Rhythm*, *Unpacking & Letting Go*, *Gratitude & Small Sparks*, and *Night Blessing & Rest*) alongside a soothing sleep affirmation.
- **Night Harmony Calendar & Reader**: An interactive calendar visualizes the user's emotional gradient spectrum over time, paired with a full-screen, distraction-free Bedtime Reader mode.

---

## How Key Technologies Are Leveraged

### 1. Google Gemini AI (`@google/genai` SDK)
- **Topic-Separated Synthesis**: Gemini processes staged reflection inputs, identifying narrative threads and dividing the user's day into structured topics with custom iconography and comforting bedtime prose.
- **Multi-Feeling Gradient Intelligence**: Gemini synthesizes how distinct, co-occurring emotions blend into an evening atmosphere, assigning coordinated hex stops, harmonic palette names (e.g., *Twilight Indigo & Starlight Amber*), and personalized bedtime affirmations.
- **Resilient Fallback Ladder**: Implements automated multi-model fallback (`gemini-2.5-flash` &rarr; `gemini-2.5-pro` &rarr; `gemini-1.5-flash`) to guarantee uninterrupted reflection during high traffic or model deprecation.
- **Contextual Bedside Inquiries**: Supports gentle, multi-turn conversational follow-ups for users wishing to explore a specific thought before sleeping.

### 2. Firebase Authentication
- **Frictionless Google Sign-In**: Enables users to authenticate securely with a single tap, removing the cognitive fatigue of managing passwords before bed.
- **Client-Side Token Verification**: Uses Firebase Auth state listeners to bind user sessions and authorize both frontend Firestore requests and backend API requests.

### 3. Google Cloud Firestore
- **Private, User-Scoped Data Model**: All reflection entries, topic breakdowns, affirmations, and gradient metadata are stored under isolated subcollections (`/users/{userId}/entries/{entryId}`).
- **Granular Security Rules**: Strict Firestore security rules enforce `request.auth.uid == userId`, ensuring complete data privacy and data isolation between users.
- **Real-Time Calendar Synchronization**: Changes to reflections immediately sync with the Emotion Calendar, rendering live gradient capsules and monthly coverage stats.

### 4. Google Cloud Run
- **Full-Stack Container Architecture**: Hosts the Express backend and compiled Vite/React single-page application within a single, lightweight Cloud Run container.
- **Zero-Leakage Secret Hygiene**: Proxies all Gemini API interactions through server-side endpoints (`/api/gemini/*`), keeping the `GEMINI_API_KEY` strictly hidden from browser clients.
- **Serverless Autoscaling & Low Latency**: Scales down to zero when idle for cost-efficiency and instantly serves requests when users open their nightly wind-down.
- **Challenge Tracking**: Configured with the `dev-tutorial=cloud-run-ai-challenge` label for Google Cloud competition validation.

---

## Architecture Overview

```
[ Mobile / Desktop Browser ]
         │
         ├─── Firebase Auth (Google Sign-In)
         ├─── Direct Firestore Operations (Scoped by Security Rules: /users/{userId}/entries)
         │
         ▼
[ Google Cloud Run (Container on Port 3000) ]
         │
         ├── Express API Gateway & Vite Static Hosting
         ├── Server-Side Secret Management (GEMINI_API_KEY)
         │
         ▼
[ Google Gemini AI (Google Gen AI SDK) ]
         └── Bedtime Journal Synthesis & Emotion Gradient Engine
```

---

## Setup & Deployment Guide

### 1. Prerequisites
- Node.js 20+ installed
- Google Cloud CLI (`gcloud`) installed and authenticated
- Firebase CLI (`firebase`) installed

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### 3. Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
The application will be accessible at `http://localhost:3000`.

### 4. Firestore Security Rules Deployment
Deploy the owner-bound security rules to ensure complete user isolation:
```bash
firebase deploy --only firestore:rules
```

Rules enforce:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        match /messages/{messageId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
  }
}
```

### 5. Google Cloud Run Deployment
Deploy the containerized service directly to Google Cloud Run:
```bash
gcloud run deploy sanctum \
  --source . \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,GEMINI_API_KEY=your_gemini_api_key_here" \
  --labels=dev-tutorial=cloud-run-ai-challenge
```

---

## Verification & Key User Flows

1. **Sign In**: Authenticate using Google Sign-In on the landing screen.
2. **Bedtime Staged Flow**:
   - **Stage 1 (Feelings & Energy)**: Select one or more feelings from the emotion palette to watch the live color gradient blend in real time.
   - **Stage 2 (Today's Journey)**: Share key highlights with quick tags or voice dictation.
   - **Stage 3 (Unburdening)**: Release unresolved thoughts or tap "Clear Mind" to let go.
   - **Stage 4 (Gratitude)**: Record moments of warmth or stillness.
3. **Synthesis**: Tap "Weave Bedtime Journal" to invoke Gemini, generating the topic-separated journal, affirmation, and multi-color gradient.
4. **Night Calendar & Reader**:
   - View gradient capsules on the monthly calendar.
   - Tap any entry to open the full-screen **Bedtime Reader Mode** for mindful evening reading.
