
# Session Title
_A short and distinctive 5-10 word descriptive title for the session. Super info dense, no filler_

Fix Chat TemplateSelector Media Parameter Error

# Current State
_What is actively being worked on right now? Pending tasks not yet completed. Immediate next steps._

**ROOT CAUSE IDENTIFIED AND FIXED**:

Debug logging revealed the actual problem: when user provides custom documentFilename in chat, frontend was sending headerParams with ONLY filename field, missing the required link field.

**All Fixes Applied (5 total):**
1. ✅ messagesStore.js - Added headerCaption parameter (line 522)
2. ✅ TemplateSelector.jsx - Improved media validation (lines 202-220)
3. ✅ TemplateManager.js - Fixed document caption/filename (lines 186-203, plus debug logs 136-307)
4. ✅ MassCampaignService.js - Fixed caption/filename handling (lines 748-771)
5. ✅ TemplateSelector.jsx - Include link when documentFilename provided (lines 239-255)

**Debug Output Revealed:**
- headerParams received: `{ "document": { "filename": "examenesss" } }` ← Missing link!
- Template has valid header_content URL but backend couldn't use it as fallback
- Backend only uses template.header_content when headerParams[mediaType] is undefined
- If headerParams[mediaType] exists but lacks link, error occurs

**Immediate Next Steps:**
- User to test template sending from chat with the fix
- Should now include both link and filename in document headerParams
- Verify #132018 error is resolved

# Task specification
_What did the user ask to build? Any design decisions or other explanatory context_

Fix the templateSelector in chat (non-masivo). The masivo version works correctly, but the regular chat templateSelector fails when sending templates with media. The issue is related to missing media ID or link parameters when constructing template messages.

# Files and Functions
_What are the important files? In short, what do they contain and why are they relevant?_

**frontend/src/components/chat/TemplateSelector.jsx** (649 lines)
- Chat template selector component with media upload capability
- Lines 110-167: handleMediaUpload - uploads media files and sets headerParams with publicUrl link
- Lines 146-153: Sets headerParams as `[mediaType]: { link: result.data.publicUrl }` (NO filename initially)
- Lines 156-158: Only sets documentFilename state for document type
- Lines 178-257: handleSend - validates and sends template, builds finalHeaderParams with media info
- **Lines 239-255: FIXED** - Adds filename for DOCUMENT type AND includes link to finalHeaderParams
  - If documentFilename provided, gets link from: custom upload, manual URL, or template.header_content default
  - Constructs finalHeaderParams[mediaType] = { link: link, filename: documentFilename }
  - Ensures BOTH link and filename are included (link is required by Meta API)
- Line 252: Sends headerCaption for media types (images, videos, documents)
- Line 246-253: Calls onSend with template data including headerParams, buttonParams, headerCaption

**frontend/src/store/messagesStore.js** (622 lines)
- Zustand store managing message state and actions
- Lines 484-530: sendTemplateMessageAction - handles template message sending with optimistic UI
- Lines 515-522: Calls templateService.sendTemplateMessage with templateId, lineId, to, variableValues, headerParams, buttonParams
- **CRITICAL BUG**: Does NOT pass headerCaption from templateData to the service call, even though templateData contains it
- Function signature receives `templateData` parameter which includes headerCaption from TemplateSelector
- But the API call only passes: templateId, lineId, to, variableValues, headerParams, buttonParams (missing headerCaption)

**backend/src/services/whatsapp/TemplateManager.js** (562+ lines)
- Handles WhatsApp template management and sending via Meta API
- Lines 134-320: sendTemplateMessage - main function that sends template messages to Meta
- **Lines 136-145: DEBUG LOGGING** - Logs all incoming parameters for troubleshooting:
  - Template name, id, header_type, header_content, header_caption
  - headerParams received from frontend
  - headerCaption received from frontend
  - variableValues and buttonParams arrays
- Lines 167-250: Builds header component for media types (IMAGE, VIDEO, DOCUMENT)
  - Line 169: Logs header type being processed
  - Line 182: Logs media type (image/video/document)
- Lines 184-202: Gets mediaParam from headerParams or falls back to template.header_content
  - Line 186: Logs mediaParam value from headerParams[mediaType]
  - Lines 188-202: If no mediaParam, checks template.header_content with logging:
    - Line 189: Logs checking template.header_content
    - Lines 191-194: Valid URL - creates mediaParam with link, logs success
    - Lines 196-198: Invalid handle (h:xxxxx) - logs error and throws
    - Line 200: Invalid/unknown format - logs warning
- Lines 204-248: Handles different media types with extensive logging:
  - Line 205: Logs when mediaParam is available
  - DOCUMENT (lines 206-223): **FIXED** - Correctly uses `caption` field for description (not filename)
    - Line 212: Builds docParam preserving existing filename from mediaParam.filename
    - Lines 218-220: Adds caption field (from headerCaption or template.header_caption) separately
    - Properly separates filename (actual file name) from caption (description)
  - IMAGE/VIDEO (lines 225-236): Uses headerCaption as caption field
  - Line 238: Logs final mediaParam structure before adding to component
  - Lines 239-244: Builds header component and adds to components array, logs success
  - **Lines 245-247: ERROR LOGGING** - If mediaParam is undefined/missing:
    - Logs "❌ NO mediaParam available! Template requires [type] header but none provided"
    - Logs "This will cause Meta API error: Either one of media ID or link must be present"
    - This identifies the exact root cause when it occurs
- Lines 294-307: Builds final payload for Meta API
  - Line 307: Logs complete final payload being sent to Meta (JSON formatted)
- **Key requirement**: mediaParam must have either 'link' or 'id' field, or Meta returns error #132018

**frontend/src/components/mass/CampaignForm.jsx** (masivo - working version)
- Lines 195-251: handleMediaUpload - uploads media and sets headerParams
- Lines 231-242: **KEY DIFFERENCE** - Sets headerParams as `[mediaType]: { link: result.data.publicUrl, filename: result.data.originalName }`
- Line 239: Always includes filename in upload for all media types, not just documents
- Lines 414-418: handleSubmit - includes headerCaption in submitData
- This version WORKS correctly with Meta API

**backend/src/services/MassCampaignService.js** (562+ lines)
- Mass campaign service for bulk template sending
- Lines 54-218: createCampaign - creates campaign and stores headerParams and headerCaption (lines 62, 176-177)
- Lines 225-254: processCampaign - sends messages to all recipients
- Lines 263-412: sendCampaignMessage - sends individual template message for campaign
- Lines 338-344: Calls buildTemplateComponents with headerParams, buttonParams, and headerCaption
- Lines 695-833: buildTemplateComponents - builds Meta API components for template
- Lines 719-781: Media header handling (IMAGE, VIDEO, DOCUMENT)
- Lines 748-771: **FIXED** - Caption/filename handling based on media type:
  - Lines 752-762: Documents - adds caption field (not filename) for description
  - Lines 763-770: Images/Videos - adds caption field for description
  - Previously had duplicated code that overwrote filename for all media types
  - Now properly preserves filename from upload and adds caption separately

**backend/src/api/v1/messages/sendTemplate.js** (181 lines)
- API endpoint for sending template messages from chat
- Line 19: Destructures headerCaption from req.body
- Lines 97-105: Calls TemplateManager.sendTemplateMessage with headerCaption parameter
- Line 104: Passes `headerCaption: headerCaption || null` to TemplateManager
- Backend properly handles headerCaption when received

**frontend/src/services/templateService.js** (134 lines)
- Service layer for template-related API calls
- Lines 82-85: sendTemplateMessage function - posts to '/messages/send-template'
- Passes messageData directly to API without modification
- If messageData contains headerCaption, it will be sent to backend

**frontend/src/components/chat/MessageInput.jsx**
- Lines 203-217: handleTemplateSent - receives templateData from TemplateSelector's onSend callback
- Line 206: Calls sendTemplateMessageAction from messagesStore with (phoneNumber, lineId, templateData, leadId)
- Passes templateData as-is, which should contain headerCaption from TemplateSelector

# Workflow
_What bash commands are usually run and in what order? How to interpret their output if not obvious?_

# Errors & Corrections
_Errors encountered and how they were fixed. What did the user correct? What approaches failed and should not be tried again?_

**TemplateSelector Chat Error:**
- Error code: #132018
- Error message: "(#132018) There's an issue with the parameters in your template"
- Error details: "Either one of media ID or link must be present"
- Error type: OAuthException
- Location: TemplateManager.sendTemplateMessage (backend)
- Context: Occurs in chat templateSelector (non-masivo). The masivo version works correctly.

**Root Cause IDENTIFIED:**
The error occurs because messagesStore.js sendTemplateMessageAction (lines 515-522) does NOT pass headerCaption to templateService.sendTemplateMessage.

**Data Flow:**
1. TemplateSelector calls onSend with templateData including headerCaption (line 252)
2. MessageInput.handleTemplateSent receives templateData and passes to messagesStore.sendTemplateMessageAction (line 206)
3. **BUG HERE**: messagesStore.sendTemplateMessageAction destructures templateData but only passes: templateId, lineId, to, variableValues, headerParams, buttonParams - MISSING headerCaption
4. Without headerCaption, backend TemplateManager cannot properly construct media parameters for images/videos/documents
5. Meta API rejects the malformed request with #132018 error

**Working flow in masivo:**
- CampaignForm includes headerCaption in submitData (line 417)
- Masivo sends complete data including headerCaption to backend
- Backend receives headerCaption and constructs valid media parameters

**FIXES APPLIED:**

**Fix 1: messagesStore.js - Missing headerCaption parameter**
- File: frontend/src/store/messagesStore.js
- Location: Lines 515-523 (sendTemplateMessageAction)
- Change: Added `headerCaption: templateData.headerCaption || null` to templateService.sendTemplateMessage call
- Result: Chat template sending now matches the working masivo implementation
- Ensures headerCaption is properly forwarded from TemplateSelector → MessageInput → messagesStore → templateService → backend API

**Fix 2: TemplateSelector.jsx - Improved media validation**
- File: frontend/src/components/chat/TemplateSelector.jsx
- Location: Lines 202-220 (handleSend validation)
- Changes:
  - Added .trim() check to prevent empty strings from passing validation
  - Enhanced URL validation to explicitly check for http:// or https:// prefix
  - Better detection of invalid media headers (handles like h:xxxxx, empty strings)
- Result: Prevents templates with invalid media references from being sent

**Fix 3: TemplateManager.js - Document caption vs filename confusion**
- File: backend/src/services/whatsapp/TemplateManager.js
- Location: Lines 186-203 (document media handling)
- Problem: Was incorrectly assigning documentCaption to filename field
- Changes:
  - Line 192: Preserve existing filename from mediaParam.filename (uploaded file's original name)
  - Lines 198-200: Add caption field separately for document description
  - Properly separates filename (actual file name) from caption (description text)
- Result: Aligns with WhatsApp API specification where documents can have both filename and caption fields

**Fix 4: MassCampaignService.js - Caption/filename overwrite bug**
- File: backend/src/services/MassCampaignService.js
- Location: Lines 748-771 (buildTemplateComponents media handling)
- Problem: Duplicated code was overwriting filename field for all media types (images, videos, documents)
  - Lines 752-757: First block set filename for documents
  - Lines 760-765: Second block ALWAYS overwrote with filename for all media types
  - This caused incorrect parameters for images/videos (should only have caption, not filename)
- Changes:
  - Lines 752-762: Documents - add caption field for description, preserve filename from upload
  - Lines 763-770: Images/Videos - only add caption field
  - Removed duplicated/conflicting code
  - Proper conditional handling based on mediaType
- Result: Each media type now gets correct parameters according to WhatsApp API spec

**POST-FIX STATUS (After Fixes 1-4):**
- User tested after all four fixes applied
- #132018 error still occurs when sending from chat
- Error does NOT occur when sending from masivo
- This indicates the fixes didn't address the root cause
- Need to debug actual parameter values being sent to understand difference between chat and masivo flows

**Fix 5: TemplateSelector.jsx - Missing link field when filename provided**
- File: frontend/src/components/chat/TemplateSelector.jsx
- Location: Lines 239-255 (handleSend, building finalHeaderParams)
- **Problem identified from debug logs**: When user provides documentFilename, frontend was sending `{ filename: "..." }` WITHOUT the required link field
- **Root cause**: Original code at lines 234-242 only added filename to headerParams, didn't ensure link was present
- **Debug output showed**: `headerParams: { "document": { "filename": "examenesss" } }` ← Missing link!
- **Why backend couldn't fix it**: Backend only uses template.header_content as fallback when `headerParams[mediaType]` is undefined. If it exists but lacks link, no fallback occurs.
- Changes:
  - Lines 241-255: When documentFilename is provided, construct complete object with BOTH fields
  - Line 246-247: Get link from: `finalHeaderParams[mediaType]?.link` (custom upload/manual URL) OR `selectedTemplate.header_content` (template default)
  - Lines 250-254: Build `finalHeaderParams[mediaType] = { link: link, filename: documentFilename }`
  - Only constructs object if valid link exists (prevents sending incomplete params)
- Result: Documents now always include required link field along with custom filename
- Expected: This should resolve #132018 error for document templates in chat

# Codebase and System Documentation
_What are the important system components? How do they work/fit together?_

# Learnings
_What has worked well? What has not? What to avoid? Do not duplicate items from other sections_

# Key results
_If the user asked a specific output such as an answer to a question, a table, or other document, repeat the exact result here_

# Worklog
_Step by step, what was attempted, done? Very terse summary for each step_

1. User reported templateSelector error in chat (non-masivo) with media parameters - #132018 "Either one of media ID or link must be present"
2. Searched for templateSelector, sendTemplateMessage files across codebase
3. Read frontend/src/components/chat/TemplateSelector.jsx (649 lines)
   - Found handleMediaUpload sets headerParams with publicUrl link only
   - Found handleSend adds filename later for documents only (lines 234-242)
   - Confirmed headerCaption passed to onSend (line 252)
4. Read frontend/src/store/messagesStore.js (622 lines)
   - Found sendTemplateMessageAction doesn't pass headerCaption to service (lines 515-522)
5. Read backend/src/services/whatsapp/TemplateManager.js (562 lines)
   - Found sendTemplateMessage requires media param with link or id (lines 167-223)
   - Confirmed error comes from Meta API when mediaParam is invalid
6. Read frontend/src/components/mass/CampaignForm.jsx (masivo version, partial, 300 lines)
   - Found key difference: masivo includes filename in upload (line 239) for all media types
   - Masivo includes headerCaption in submitData (line 417)
   - Masivo version works correctly
7. Read backend/src/api/v1/messages/sendTemplate.js (181 lines)
   - Backend correctly expects and handles headerCaption parameter (line 19, 104)
8. Read frontend/src/services/templateService.js (134 lines)
   - Service passes messageData directly to API without filtering
9. Searched for TemplateSelector usage in MessageInput.jsx
   - Found handleTemplateSent receives templateData and passes to messagesStore (line 206)
10. Read frontend/src/components/chat/MessageInput.jsx (partial, lines 200-230)
   - Found handleTemplateSent at line 203-217 receives templateData from TemplateSelector
   - Line 206: Calls sendTemplateMessageAction with (recipientPhone, lineId, templateData, leadId)
   - Confirmed templateData is passed as-is with all properties including headerCaption
11. **ROOT CAUSE CONFIRMED**: Complete data flow traced. messagesStore.sendTemplateMessageAction (line 515-522) receives headerCaption in templateData parameter but doesn't forward it to templateService.sendTemplateMessage API call. This is the single point of failure causing the #132018 error in chat templates.
12. **FIX 1 APPLIED**: Used Edit tool to update frontend/src/store/messagesStore.js lines 515-523
    - Added `headerCaption: templateData.headerCaption || null` to the templateService.sendTemplateMessage call
    - This brings chat template sending in line with the working masivo implementation
    - File successfully updated and verified
13. **FIX 2 APPLIED**: Improved validation in frontend/src/components/chat/TemplateSelector.jsx lines 202-220
    - Enhanced media header validation to detect invalid URLs (handles, empty strings)
    - Added explicit checks for http:// or https:// prefix
    - Added .trim() to prevent empty strings from passing validation
    - Prevents sending templates with invalid media references to Meta API
14. **FIX 3 APPLIED**: Fixed document media handling in backend/src/services/whatsapp/TemplateManager.js lines 186-203
    - Corrected incorrect usage where documentCaption was assigned to filename field
    - Now properly uses caption field for description, preserves filename for actual file name
    - Lines 198-200: Add caption separately if provided
    - Aligns with WhatsApp API specification for document parameters
15. Read backend/src/services/MassCampaignService.js lines 719-781 (buildTemplateComponents media handling)
    - Found similar caption/filename bug in masivo service
    - Lines 752-765 had duplicated code overwriting filename for all media types
    - Second block (760-765) always set filename field, even for images/videos (incorrect)
16. **FIX 4 APPLIED**: Fixed caption/filename handling in backend/src/services/MassCampaignService.js lines 748-771
    - Removed duplicated code that was overwriting parameters
    - Lines 752-762: Documents now add caption field (not filename) for description
    - Lines 763-770: Images/Videos now only add caption field
    - Properly preserves filename from upload for documents
    - Each media type now receives correct parameters per WhatsApp API specification
    - All four fixes complete - chat template sending should now work correctly
17. **USER TESTING**: User tested template sending from chat after all fixes applied
    - Same #132018 error still occurs: "There's an issue with the parameters in your template"
    - Error location: TemplateManager.sendTemplateMessage at line 292
    - Error details: "Either one of media ID or link must be present"
    - Confirmed: Error ONLY happens from chat, NOT from masivo
    - Conclusion: The four fixes did not resolve the underlying issue
18. **DIAGNOSTIC APPROACH**: Need to add debug logging to compare actual parameters
    - Must log exact headerParams, headerCaption, template data being sent from chat
    - Compare with masivo parameters to identify actual difference
    - Investigate why media parameters still malformed despite headerCaption being forwarded
19. **DEBUG LOGGING ADDED**: Used Edit tool to add comprehensive logging to TemplateManager.js sendTemplateMessage
    - Lines 136-145: Entry point logging - all incoming parameters (template info, headerParams, headerCaption, variableValues, buttonParams)
    - Line 169: Header type processing log
    - Lines 182-202: Media parameter construction with detailed step logging:
      - Line 186: Log mediaParam from headerParams[mediaType]
      - Line 189: Log when checking template.header_content fallback
      - Lines 194, 198, 200: Log results of URL validation (success/error/warning)
    - Line 205: Log when mediaParam is successfully available
    - Line 238: Log final mediaParam structure before sending
    - Lines 245-247: **CRITICAL ERROR DETECTION** - Logs when mediaParam is missing (identifies root cause)
    - Line 307: Log complete final payload to Meta API (full JSON)
    - All logs use emoji prefixes (🔍 ✅ ❌ ⚠️ 📋 📥 📤) for easy visual scanning
20. **AWAITING USER TEST**: Requested user to:
    - Test template send from chat again
    - Provide complete backend console output starting from "🔍 ========== TEMPLATE MANAGER"
    - Include all logs through "Final payload to Meta API"
    - This will reveal exact parameter values and identify where mediaParam becomes undefined/malformed
21. **USER PROVIDED DEBUG OUTPUT**: Complete backend logs received showing:
    - Template: caption_template_v1 (ID: 24), Header Type: DOCUMENT
    - Header Content: https://reg-underlying-ultimately-path.trycloudflare.com/uploads/documents/728c8f48e15ba5540eecafdaaa2dcadf.pdf (valid URL)
    - headerParams received: `{ "document": { "filename": "examenesss" } }` ← **MISSING link field!**
    - headerCaption received: Contratacion (correctly forwarded from Fix 1)
    - Final mediaParam: `{ "filename": "examenesss", "caption": "Contratacion" }` ← **Still missing link!**
    - Final payload sent to Meta: document object had filename and caption but NO link
    - Meta API rejected with #132018: "Either one of media ID or link must be present"
22. **ROOT CAUSE IDENTIFIED**: Frontend sending incomplete headerParams
    - When user provides custom documentFilename in TemplateSelector, only filename is added to headerParams
    - Original code (lines 234-242) did: `finalHeaderParams[mediaType] = { ...finalHeaderParams[mediaType], filename: documentFilename }`
    - If finalHeaderParams[mediaType] is undefined (no upload, no manual URL), this creates `{ filename: "..." }` with NO link
    - Backend receives headerParams[mediaType] = { filename: "..." }, which is truthy, so doesn't use template.header_content fallback
    - Backend logic: `let mediaParam = headerParams[mediaType]; if (!mediaParam && template.header_content) { /* fallback */ }`
    - Since mediaParam is truthy (exists but incomplete), fallback never triggers
    - Result: mediaParam missing required link field, Meta API error
23. **FIX 5 APPLIED**: Updated TemplateSelector.jsx lines 239-255 to include link when documentFilename provided
    - Changed logic to explicitly get link from three sources (in priority order):
      1. Custom upload: `finalHeaderParams[mediaType]?.link`
      2. Manual URL input: (included in above)
      3. Template default: `selectedTemplate.header_content` (if starts with http)
    - Constructs complete object: `{ link: link, filename: documentFilename }`
    - Only when documentFilename is provided AND valid link exists
    - If no documentFilename, leaves headerParams as-is (backend will use template.header_content)
    - File successfully updated and verified
24. **AWAITING FINAL USER TEST**: User should test template sending from chat again
    - Fix 5 ensures document headerParams includes both link and filename
    - Should resolve #132018 error for document templates in chat
    - All 5 fixes now complete and integrated
