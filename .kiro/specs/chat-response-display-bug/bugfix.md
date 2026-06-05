# Bugfix Requirements Document

## Introduction

The AI Concierge chat panel (/app/(ai)/concierge/page.tsx) experiences a critical bug where assistant responses fail to display after successful API calls. When a user sends a message, the loading indicator appears, the API returns 200 OK with a streamed response, but the assistant's message never appears in the chat UI. This breaks the core functionality of the chat interface, making it appear non-responsive to users despite successful backend processing.

The bug affects the primary user interaction flow: users send messages expecting AI responses, but receive no visible feedback beyond loading states, creating a broken user experience.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user sends a chat message and the API returns 200 OK with a streamed text response THEN the system fails to display the assistant's response message in the chat UI

1.2 WHEN the API streams response data using Vercel AI SDK's `toTextStreamResponse()` format THEN the useChat hook's messages array is not updated with the streamed content

1.3 WHEN the loading state transitions from "streaming" to completion THEN no assistant message bubble appears in the messages list despite successful API response

1.4 WHEN tool calls are executed and return results with 200 OK THEN the tool results may display in the showcase panel but no accompanying assistant text appears in chat

### Expected Behavior (Correct)

2.1 WHEN a user sends a chat message and the API returns 200 OK with a streamed text response THEN the system SHALL display the assistant's response message in the chat UI as it streams

2.2 WHEN the API streams response data using Vercel AI SDK's `toTextStreamResponse()` format THEN the useChat hook's messages array SHALL be updated in real-time with the streamed content

2.3 WHEN the loading state transitions from "streaming" to completion THEN an assistant message bubble SHALL appear in the messages list containing the complete response text

2.4 WHEN tool calls are executed and return results THEN both the tool results in the showcase panel AND the assistant's accompanying text SHALL display in the chat

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user sends a message THEN the system SHALL CONTINUE TO display the user's message bubble immediately in the chat UI

3.2 WHEN the API is processing a request THEN the system SHALL CONTINUE TO display the loading indicator ("thinking" dots) correctly

3.3 WHEN tool calls complete successfully THEN the system SHALL CONTINUE TO update the showcase panel with tool results (product carousels, lookbooks, etc.)

3.4 WHEN the user types in the input field THEN the system SHALL CONTINUE TO handle text input, submission, and quick prompts correctly

3.5 WHEN images are uploaded for visual search THEN the system SHALL CONTINUE TO handle image preview and file uploads correctly

3.6 WHEN the messages array contains the initial assistant greeting THEN the system SHALL CONTINUE TO display the welcome message correctly
