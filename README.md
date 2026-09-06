# Sanctum: Cognitive Sanctuary & Gemini Reflections

Sanctum is a full-stack, user-authenticated journaling and reflective thinking application powered by **Firebase Authentication**, **Cloud Firestore**, and the **Gemini 3.6 Flash API**.

Every user reflection is protected with owner-bound Firestore security rules, and all Gemini AI interactions are routed securely through a backend API proxy utilizing Secret Manager for zero-leakage secret hygiene.

---

## Architecture & Security Highlights

1. **User Identity & Passwordless Authentication**: Google Sign-In via Firebase Auth. The application never stores user credentials or passwords directly.
2. **User Data Isolation**: Firestore documents are strictly scoped to `/users/{userId}/...` with granular security rules enforcing `request.auth.uid == userId`.
3. **Resilient Gemini AI Engine**: Automated model fallback ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`) with error recovery for transient rate-limits or outages.
4. **Secret Management**: `GEMINI_API_KEY` is kept server-side only in process environment or Google Cloud Secret Manager.
5. **Multi-Turn Contextual Chat**: Users can converse with Gemini on past or current reflections in dedicated threads saved in real-time.

---

## 1. Prerequisites & GCP Setup

Ensure the Google Cloud CLI (`gcloud`) and Firebase CLI are installed:

```bash
# Authenticate gcloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable required Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  aiplatform.googleapis.com
```

---

## 2. Secret Manager Configuration

Secure your Gemini API key in Google Cloud Secret Manager and grant the Cloud Run runtime service account access:

```bash
# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant the default Compute / Cloud Run service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Firestore Security Rules

Deploy the owner-bound security rules to ensure complete user isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Top-level users collection: each user has complete isolation
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // User reflections and journal entries
      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

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

To deploy via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Local Development

```bash
# Install dependencies
npm install

# Run the development server (Binds to http://localhost:3000)
npm run dev
```

---

## 5. Cloud Run Deployment

Deploy the containerized full-stack application directly to Google Cloud Run:

```bash
# Build & Deploy to Cloud Run with the Challenge Verification Label
gcloud run deploy sanctum-app \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --set-env-vars="NODE_ENV=production" \
  --labels=dev-tutorial=cloud-run-ai-challenge
```

---

## 6. Challenge Verification Labeling

If the service was already deployed or deployed via Google AI Studio's 1-click button, attach or verify the challenge tracking label:

```bash
gcloud run services update sanctum-app \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 7. Functional Verification Walkthrough

Follow these steps to test and verify every interaction flow:

1. **Unauthenticated Landing & Google Sign-In**:
   - Navigate to the root URL. Verify the landing screen highlights the 4 security pillars and the "Sign in with Google" button.
   - Click "Sign in with Google". Complete the federated popup flow.
   - Confirm user avatar, email, and "Security Audited" badge appear on the top navigation bar.
2. **Drafting a Journal Entry**:
   - Select a Category (e.g., *Reflection*, *Brainstorm*, *Daily Log*).
   - Select a Mood (e.g., *Thoughtful*, *Motivated*, *Peaceful*).
   - Select a Gemini Persona (e.g., *Empathetic Companion*, *Strategic Analyst*).
   - Click "AI Inspiration Prompts" to load tailored questions from `/api/gemini/prompts` and click to insert into the editor.
   - Enter a title and write reflection thoughts.
3. **AI Generation & Transaction Integrity**:
   - Click "Reflect with Gemini & Save".
   - Verify the loading indicator displays "Analyzing with Gemini...".
   - Confirm the structured result displays: **Executive Essence**, **Deep Reflection & Perspective**, **Key Insights**, and **Action Steps**.
   - Verify the entry is immediately saved in Firestore under `/users/{userId}/entries/{entryId}`.
4. **Multi-Turn Conversation with Gemini**:
   - Click "Converse with Gemini" or select the "Multi-Turn Chat" tab in the entry modal.
   - Send a follow-up question or click one of the suggested conversation starters.
   - Confirm Gemini replies with contextual insight based on the entry's text.
   - Verify all chat messages persist to the Firestore subcollection `/users/{userId}/entries/{entryId}/messages`.
5. **History & Isolation Verification**:
   - Click the "History" tab in the navbar.
   - Verify statistics ribbon (Total Entries, Words Written, Gemini Follow-ups).
   - Test keyword search and category filtering pills.
   - Click any entry to inspect or delete.
   - Sign out and sign in with a different Google account to confirm that entries from the first user are strictly inaccessible to the second user.
