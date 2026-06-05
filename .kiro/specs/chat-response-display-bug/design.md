# Chat Response Display Bug - Design Document

## Overview

The AI Concierge chat panel fails to display assistant responses despite successful API streaming. The useChat hook from Vercel AI SDK v3 (@ai-sdk/react) receives streamed data from the `/api/chat` endpoint, but the messages array is not updated with assistant content. This is a critical display layer issue where the streaming protocol produces valid responses, but the client-side hook does not consume and display them.

The root cause likely involves a mismatch between:
1. The useChat hook's expected API endpoint configuration (missing `api` parameter)
2. Message format incompatibility between initial messages using `parts` array (custom format) vs standard Vercel AI SDK message format
3. The streamText response format from the API not being properly consumed by useChat
4. sendMessage invocation pattern not matching the expected useChat interface

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when the API returns a successful streamed response but the useChat hook's messages array is not updated with assistant content
- **Property (P)**: The desired behavior when a successful stream completes - assistant messages should appear in the chat UI with visible text content
- **Preservation**: Existing functionality that must remain unchanged - user message display, tool result showcase updates, loading indicators, image uploads, and initial greeting message
- **useChat hook**: The client-side React hook from @ai-sdk/react v3 that manages chat state and streaming
- **sendMessage function**: The function returned by useChat to send messages (replaces deprecated `append` function in v3)
- **messages array**: The reactive state managed by useChat containing all chat messages
- **parts array**: A custom message format used in the initial message that contains structured content blocks (not standard Vercel AI SDK format)
- **toTextStreamResponse()**: The AI SDK method that converts streamText results to a streaming HTTP response
- **StreamText**: The AI SDK function that handles LLM streaming with tool support

## Bug Details

### Bug Condition

The bug manifests when the `/api/chat` endpoint successfully returns a 200 OK response with streamed text data, but the useChat hook fails to update its messages array with the assistant's response content. The loading state transitions correctly, tool results display in the showcase panel, but no assistant text bubble appears in the chat UI.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type ChatInteraction
  OUTPUT: boolean
  
  RETURN input.apiResponse.status = 200 
         AND input.apiResponse.hasStreamedData = true
         AND input.apiResponse.format = "toTextStreamResponse"
         AND input.clientHook = "useChat"
         AND input.messagesArray.hasNewAssistantMessage = false
         AND input.loadingState.transitionedToComplete = true
END FUNCTION
```

### Examples

1. **User sends "Show me quiet luxury essentials"**
   - Expected: User message appears → Loading indicator → Assistant text response appears with product carousel
   - Actual: User message appears → Loading indicator → No assistant text appears (but product carousel shows in showcase)

2. **User sends "Build a wedding guest outfit for me"**
   - Expected: User message appears → Loading indicator → Assistant text response appears with outfit builder
   - Actual: User message appears → Loading indicator → No assistant text appears (but outfit builder shows in showcase)

3. **User uploads an image for visual search**
   - Expected: User message appears → Loading indicator → Assistant text describing found items appears with image search results
   - Actual: User message appears → Loading indicator → No assistant text appears (but image search results show in showcase)

4. **Edge case - Initial greeting message displays correctly**
   - The initial assistant message with `parts` array format displays correctly
   - This suggests the rendering logic works, but new streamed messages don't reach the messages array

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- User messages must continue to display immediately upon submission
- Loading indicators ("thinking" dots) must continue to appear during API processing
- Tool result showcase updates must continue to work (product carousels, lookbooks, size pickers, etc.)
- Image upload preview and visual search workflow must continue to function
- Quick prompts and input field interactions must continue to work correctly
- Initial greeting message must continue to display on page load

**Scope:**
All inputs and interactions that do NOT involve receiving assistant text responses from the streaming API should be completely unaffected by this fix. This includes:
- User message submission and display
- Loading state transitions
- Tool execution and showcase panel updates
- Image upload and file handling
- UI interactions (buttons, quick prompts, input field)
- Initial message rendering with `parts` array format

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Missing API Endpoint Configuration**: The useChat hook is not configured with an `api` parameter to specify the endpoint URL
   - The hook initialization at line 76 only provides `id`, `body`, and `messages` parameters
   - Default behavior may be sending requests to `/api/chat` but the response format might not be compatible
   - The useChat hook from @ai-sdk/react v3 requires explicit endpoint configuration

2. **Message Format Incompatibility**: The initial messages use a custom `parts` array format that doesn't match standard Vercel AI SDK message structure
   - Initial message structure: `{ id, role, parts: [{ type, text, state }] }`
   - Standard AI SDK format: `{ id, role, content }`
   - The useChat hook may not know how to merge streamed messages in standard format into a messages array initialized with custom format
   - Type mismatch between message schemas could prevent proper state updates

3. **StreamText Response Format Mismatch**: The API uses `toTextStreamResponse()` which may not be producing the format expected by useChat v3
   - The streaming protocol may have changed between SDK versions
   - The useChat hook might be expecting data stream events that aren't being emitted correctly
   - Response headers or content-type might not match what useChat expects

4. **SendMessage Parameter Mismatch**: The sendMessage function is called with `{ text: string, files?: File[] }` objects
   - Line 207: `sendMessage({ text: msg.content })`
   - Line 320: `sendMessage({ text: \`[Image Upload] ...\`, files: [imageFile] })`
   - Line 323: `sendMessage({ text })`
   - The useChat v3 API may expect different parameter format or function signature
   - This mismatch could cause messages to be sent but responses not properly linked

## Correctness Properties

Property 1: Bug Condition - Assistant Response Display

_For any_ chat interaction where the API returns a 200 OK status with streamed text data in toTextStreamResponse format, and the useChat hook completes its loading state transition, the useChat messages array SHALL be updated with a new assistant message containing the streamed text content, which SHALL render as a visible text bubble in the chat UI.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Non-Streamed Message Behavior

_For any_ chat interaction that does NOT involve receiving assistant text responses from the streaming API (user message submission, tool result showcasing, loading state display, image uploads, initial message rendering), the application SHALL produce exactly the same behavior as the original code, preserving all existing user message display, showcase panel updates, loading indicators, and initial greeting functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct, the fix will involve one or more of the following changes:

**File**: `app/(ai)/concierge/page.tsx`

**Function**: `useChat` hook initialization (line 76)

**Specific Changes**:

1. **Add API Endpoint Configuration**:
   - Add `api: "/api/chat"` parameter to useChat configuration
   - Verify the endpoint path matches the actual route location
   - Ensure the hook knows where to send POST requests

2. **Convert Message Format to Standard AI SDK Schema**:
   - Replace custom `parts` array format with standard `content` string format
   - Change initial message from:
     ```typescript
     {
       id: "init-1",
       role: "assistant",
       parts: [{ type: "text", text: "...", state: "done" }]
     }
     ```
   - To standard format:
     ```typescript
     {
       id: "init-1",
       role: "assistant",
       content: "Welcome. Your private styling suite is ready..."
     }
     ```
   - Update message rendering logic to handle both old `parts` format (for backward compatibility if needed) and new `content` format

3. **Verify StreamText Response Compatibility**:
   - Confirm that `result.toTextStreamResponse()` in `/api/chat/route.ts` is compatible with useChat v3
   - Check if response headers need to be set explicitly
   - Verify the streaming protocol matches what @ai-sdk/react v3 expects
   - Consider using `result.toDataStreamResponse()` if text-only streaming has compatibility issues

4. **Review SendMessage Invocation Pattern**:
   - Verify that `sendMessage({ text, files })` parameter format matches useChat v3 API
   - Check if sendMessage should be called differently for text vs file uploads
   - Ensure the function signature matches the expected interface from @ai-sdk/react v3

5. **Add Error Handling for Stream Failures**:
   - Add error callback to useChat configuration to surface streaming errors
   - Log any message update failures to help diagnose issues
   - Provide fallback behavior if streaming fails

### Most Likely Fix

Based on Vercel AI SDK v3 documentation patterns, the most probable fix is:

1. Add `api: "/api/chat"` to useChat configuration
2. Convert initial message format from `parts` array to standard `content` string
3. This should resolve the format mismatch and allow the hook to properly consume streamed responses

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code and confirm root cause, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write integration tests that simulate user chat interactions, send messages through the useChat hook, and assert that assistant responses appear in the messages array. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Simple Text Query Test**: Send "Show me quiet luxury essentials" and verify assistant text response appears (will fail on unfixed code)
2. **Tool Call Response Test**: Send message that triggers tool execution, verify assistant text appears alongside tool results (will fail on unfixed code)
3. **Image Upload Test**: Upload image with query, verify assistant text describing results appears (will fail on unfixed code)
4. **Initial Message Test**: Verify the initial greeting message with `parts` format displays correctly (will pass on unfixed code - confirms rendering works)

**Expected Counterexamples**:
- messages array does not contain assistant messages after API returns 200 OK
- Tool results display in showcase but no assistant text in messages array
- Possible causes: missing API endpoint, message format incompatibility, streaming protocol mismatch, sendMessage parameter issues

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL interaction WHERE isBugCondition(interaction) DO
  result := useChatHook_fixed.messages
  ASSERT result.containsAssistantMessage = true
  ASSERT result.lastAssistantMessage.hasTextContent = true
  ASSERT result.lastAssistantMessage.isRenderedInUI = true
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL interaction WHERE NOT isBugCondition(interaction) DO
  ASSERT useChatHook_original.behavior = useChatHook_fixed.behavior
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the interaction domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for non-buggy interactions

**Test Plan**: Observe behavior on UNFIXED code first for non-assistant-response interactions (user messages, tool showcases, loading states, image uploads, initial greeting), then write property-based tests capturing that behavior.

**Test Cases**:
1. **User Message Display Preservation**: Observe that user messages display immediately on unfixed code, then verify this continues after fix
2. **Loading Indicator Preservation**: Observe that loading states display correctly on unfixed code, then verify this continues after fix
3. **Tool Showcase Preservation**: Observe that product carousels, lookbooks, etc. display correctly on unfixed code, then verify this continues after fix
4. **Image Upload Preservation**: Observe that image preview and upload workflow works on unfixed code, then verify this continues after fix
5. **Initial Message Preservation**: Observe that initial greeting displays correctly on unfixed code, then verify this continues after fix
6. **Quick Prompt Preservation**: Observe that quick prompt buttons work correctly on unfixed code, then verify this continues after fix

### Unit Tests

- Test useChat hook configuration with correct API endpoint
- Test message format conversion from parts array to content string
- Test sendMessage invocation with various parameter formats
- Test message rendering with both old parts format and new content format
- Test edge cases (empty messages, messages with only tool results, messages with files)

### Property-Based Tests

- Generate random user queries and verify assistant responses appear in messages array
- Generate random tool execution scenarios and verify both tool results and assistant text display
- Generate random image upload workflows and verify assistant text accompanies visual search results
- Test across many message sequences to ensure state consistency

### Integration Tests

- Test full chat flow: user types message → API streams response → assistant message appears in UI
- Test tool execution flow: user triggers tool → showcase updates → assistant text appears
- Test image upload flow: user uploads image → visual search executes → assistant text describes results
- Test that quick prompts trigger full response cycle correctly
- Test that loading states transition properly throughout the flow
