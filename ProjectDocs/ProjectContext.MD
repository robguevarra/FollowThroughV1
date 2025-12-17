# Project Context: FollowThroughV1 (Phantom Nebula)

## Overview
**FollowThroughV1** is an AI-powered task management and accountability system designed to help users complete their tasks through automated follow-ups via WhatsApp. The system assigns tasks to users, monitors deadlines, and uses AI to classify user responses and assess risk.

## Technology Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS, ShadCN UI
- **External Services**:
  - **WhatsApp Cloud API**: For messaging users.
  - **DeepSeek API (AI)**: For classifying message intent and logic.
  - **Ngrok**: For local webhook development.

## Core Architecture

### 1. Task Management System
The core entity is the **Task**. Tasks are assigned to **Users** and tracked through various statuses.
- **Workflow**: `pending` -> `confirmed` -> `completed` (or `blocked`/`at_risk`).
- **Deadlines**: Strict monitoring of deadlines with risk assessment logic.

### 2. WhatsApp Integration
The primary user interface for "follow through" is WhatsApp.
- **Webhook**: `src/app/api/webhook/whatsapp` handles incoming messages.
- **Sending**: `src/lib/whatsapp.ts` handles outbound messages via Facebook Graph API.
- **User Mapping**: Users are identified by their `message_handle` (phone number).

### 3. AI & Automation
The "Brain" of the system.
- **Classifier** (`src/lib/ai/classifier.ts`): Analyzes user messages to determine intent:
  - `CONFIRM`: User is working on it.
  - `BLOCK`: User is stuck.
  - `DONE`: User finished.
  - `PROGRESS`: Update provided.
- **Risk Engine** (`src/lib/ai/risk.ts`): Evaluates tasks based on time remaining and status to flag `at_risk` items.

## AI Engine Specification

### 1. Philosophy: The "Phantom Manager"
The AI Engine is not a passive tool; it is an active **Accountability Agent**. It mimics a high-performing project manager who checks in, unblocks, and ensures delivery. It lives primarily in WhatsApp.

### 2. Cognitive Architecture
The logic flows through three stages: **Perceive -> Decide -> Act**.

#### A. Perception (What it looks for)
The AI analyzes every incoming message for:
- **Explicit Status Updates:** "Done", "Finished", "Posted".
- **Implicit Progress:** "Working on the design now", "Drafting the email".
- **Blockers & Risks:** "Client hasn't replied", "API is down", "I'm sick today".
- **Sentiment & Urgency:** Is the user stressed? Casual? avoiding the topic?
- **Temporal Commitments:** "Will do it by 5pm", "Tomorrow morning".

#### B. Understanding (How it processes)
Using DeepSeek/LLM, the engine contextualizes the message against the **Active Task**:
- *Context:* User has task "Submit Report" due in 2 hours.
- *Message:* "Almost there."
- *Interpretation:* user is working, risk is medium (deadline close).
- *Action:* Log progress, set shorter follow-up timer.

#### C. Response Strategy (How it responds)
Responses must be **Short, Context-Aware, and Action-Oriented**.
- **Tone:** "Supportive Accountability".
    - *Good:* "Great update. Let me know when you hit send."
    - *Bad:* "Thank you for your update. I have updated the database."
- **Project Information:** The AI weaves in project details naturally. "How's the *API Migration* going?" instead of "How is task #123?"

### 3. Classification Logic
The classifier (`src/lib/ai/classifier.ts`) maps inputs to actionable intents:
- `COMPLETION`: Task is 100% done. -> *Move to Completed.*
- `PROGRESS_UPDATE`: Working, but not done. -> *Log update, reset nag timer.*
- `BLOCKER`: External or internal stop. -> *Move to Blocked, ask for details.*
- `COMMITMENT`: "I'll do it later." -> *Parse time, schedule reminder.*
- `QUERY`: User asks a question. -> *Answer using Project Context.*

### 4. Conversation Loop
1.  **Incoming:** Webhook receives text.
2.  **Context Loading:** Fetch User Profile + Active Task + Recent Chat History.
3.  **Analysis:** LLM classifies Intent + Extracts Facts (Time, Reason).
4.  **State Change:** Update Database (Task Status, Deadline).
5.  **Reply Generation:** Generate WhatsApp reply.
    - *If Done:* Celebrate.
    - *If Blocked:* Empathize + Strategize.
    - *If Slacking:* Gently Nudge.

### 5. Advanced Scenarios & Robustness

#### A. Ambiguity Handling (Multiple Tasks)
*Scenario*: User has 3 active tasks (A, B, C) and says "Done".
*Strategy*:
1.  **Check Context**: If AI just asked "How is Task B?", assume B.
2.  **Ask for Clarification**: If no context, AI *must* ask: "Great! Which one did you finish?\n1. API Report\n2. Email Draft"
3.  **Fuzzy Matching**: If user says "Report done", match to "API Report".

#### B. User Queries (Two-Way Dialogue)
The User can interview the AI.
*User*: "What's on my plate today?"
*AI*: "You have 2 items due:\n1. Update Homepage (Due 2pm)\n2. Call Client (Overdue)"
*User*: "What did I finish yesterday?"
*AI*: "You shipped the 'Login Flow'. Solid work."

#### C. Task Modification
*Scenario*: "Reschedule the report to tomorrow 9am".
*Action*: AI parses time -> Updates database -> Confirms "Done. New deadline: Tomorrow 9 AM."

#### D. The "Stop" Command
*Scenario*: Safety Override.
*Action*: If "STOP"/"PAUSE" -> Disable AI for user -> Confirm "AI Paused."

### 6. WhatsApp Cost Optimization (Best Practice)
WhatsApp Pricing Policy:
- **Service Window (24h)**: Conversations initiated by the *User* are free (or cheaper) to reply to within a 24h window.
- **Business-Initiated**: Starting a new conversation outside the 24h window costs more (Utility/Marketing templates).

**Implementation Strategy**:
1.  **Track `last_user_message_at`**: Store this timestamp in the `users` table.
2.  **The "Free Talk" Zone**:
    - If `now() - last_user_message_at < 24h`: The AI is free to reply, ask follow-ups, and chat naturally.
    - Use this window to get clarification, confirm details, or just build rapport.
3.  **The "Paid" Zone (>24h)**:
    - If silent for >24h, AI must use a **Template Message** to re-engage.
    - *Strategy*: Only send high-priority "Utility" reminders (e.g., "Task X is Overdue"). Avoid casual chat until user replies and re-opens the 24h window.

## Directory Structure
- `src/app/api/webhook`: Webhook endpoints.
- `src/app/tasks`: Task dashboard UI.
- `src/app/autopilot`: AI automation interface.
- `src/app/leader`: Leader-specific views.
- `src/lib/ai`: AI logic (classifier, risk).
- `src/lib/supabase`: Database client.

## Development Workflows
- **Seed Data**: Scripts in `src/app/seed` (e.g., `actions.ts`, `debug-actions.ts`) are used to populate test data.
- **Dev Environment**: Requires `.env.local` with Supabase and WhatsApp credentials.
