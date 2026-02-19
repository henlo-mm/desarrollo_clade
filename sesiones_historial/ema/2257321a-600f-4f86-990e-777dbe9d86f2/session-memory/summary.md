
# Session Title
_A short and distinctive 5-10 word descriptive title for the session. Super info dense, no filler_

Fix Document Header Filename to Use Original Name

# Current State
_What is actively being worked on right now? Pending tasks not yet completed. Immediate next steps._

Database schema and model updates completed. Ready to modify service layer to use new header_filename field.

**Completed:**
- Task 1: Migration created at backend/migrations/sequelize/20251210000000-add-header-filename-to-templates.cjs (adds header_filename STRING(255) column after header_caption)
- Task 2: MessageTemplate model updated with header_filename field definition (lines 147-157) including validation for max 255 chars

**In Progress:**
- Task 3: Modify TemplateManager.js to use header_filename instead of header_caption for document filename parameter

**Pending:**
- Task 4: Update TemplateService to save originalName as header_filename when creating/updating templates
- Task 5: Update MassCampaignService to use header_filename for documents
- Task 6: Update API endpoints (create.js, sendTemplate.js) to handle header_filename parameter
- Task 7: Update frontend components (TemplateForm.jsx, CampaignForm.jsx, TemplateSelector.jsx) to send originalName

**Next Step:** Modify TemplateManager.js sendTemplateMessage() method lines 187-192 to use header_filename for document filename instead of header_caption. Change logic to: for documents use header_filename as filename, for images/videos use header_caption as caption.

# Task specification
_What did the user ask to build? Any design decisions or other explanatory context_

User wants document headers in WhatsApp templates to preserve the original filename when sending. Currently the system uses a caption field as the filename, but the requirement is:
- Filename should be the original file name (e.g., "invoice.pdf")
- Caption should be independent and separate (e.g., "Your monthly invoice")
- The system should not generate random filenames with dates for the WhatsApp API call

**Design Decision:** Add new `header_filename` field to MessageTemplate model to store original filename separately. This allows:
- `header_filename`: Original filename sent to WhatsApp API as document filename
- `header_caption`: Independent descriptive text (caption for images/videos, or additional description)
- Storage filename: Remains randomized for security (crypto.randomBytes)

# Files and Functions
_What are the important files? In short, what do they contain and why are they relevant?_

**backend/src/services/FileUploadService.js**
- Handles file uploads with crypto.randomBytes(16) for storage filenames
- Methods: uploadDocument() (lines 181-239), uploadDocumentForTemplate()
- Preserves originalName in response but generates random storage filename
- For templates: uploads to Meta's Resumable Upload API to get handle (h:xxxxx format)
- Returns: { filename, originalName, localPath, publicUrl, mediaId, mimeType, size }

**backend/src/services/whatsapp/TemplateManager.js**
- Lines 167-206: Template message sending logic
- Currently uses header_caption as filename for document media: `mediaParam = { ...mediaParam, filename: caption }`
- Lines 174-182: Handle vs URL distinction for header_content
- buildTemplateComponents() method builds WhatsApp API payload

**backend/src/models/sequelize/MessageTemplate.js**
- Database model for templates (212 lines total)
- Lines 136-146: header_caption field (STRING 1024) for document/image/video headers
- Lines 147-157: header_filename field (STRING 255) - NEW field added for original filename, with validation (max 255 chars)
- Fields: header_type, header_content (URL/handle), header_example, header_caption, header_filename

**backend/src/api/v1/templates/uploadMedia.js**
- New endpoint for template media uploads (line 62-68)
- Calls FileUploadService.uploadImageForTemplate()
- Returns handle for Meta approval and publicUrl for sending

**backend/src/api/v1/messages/uploadMessageMedia.js**
- New endpoint for message media uploads (line 62-68)
- Calls FileUploadService.uploadDocument()
- Regular upload for sending messages (not templates)

**backend/src/services/MassCampaignService.js**
- Lines 695-775: Caption processing in mass campaigns
- Lines 62+: Campaign creation with headerCaption parameter
- Uses same pattern: caption becomes filename for documents

**backend/migrations/sequelize/20251209200000-add-header-caption-to-templates.cjs**
- Recent migration adding header_caption column to MessageTemplate table

**backend/migrations/sequelize/20251210000000-add-header-filename-to-templates.cjs**
- NEW: Migration to add header_filename column (STRING 255) to MessageTemplate table
- Adds column after header_caption with comment: "Original filename for document headers. Used as 'filename' parameter in WhatsApp API."
- Rollback supported via down() method

# Workflow
_What bash commands are usually run and in what order? How to interpret their output if not obvious?_

# Errors & Corrections
_Errors encountered and how they were fixed. What did the user correct? What approaches failed and should not be tried again?_

# Codebase and System Documentation
_What are the important system components? How do they work/fit together?_

**Document Upload Flow:**
1. User uploads file → Multer captures buffer
2. FileUploadService generates random filename: crypto.randomBytes(16).toString('hex') + extension
3. Preserves originalName (file.originalname) in response object
4. For templates: additionally uploads to Meta Resumable Upload API to get handle (h:xxxxx)
5. Returns both randomized storage filename + originalName + publicUrl + handle

**Template Storage Structure:**
- `header_type`: NONE, TEXT, IMAGE, VIDEO, DOCUMENT, LOCATION
- `header_content`: URL or handle for the media
- `header_example`: JSON with handles/URLs for Meta template approval
- `header_caption`: User-friendly caption/filename (max 1024 chars) - added in recent migration

**Template Sending Flow (Current Implementation):**
1. Template data includes header_content (URL/handle) and header_caption
2. TemplateManager.buildTemplateComponents() checks header_content type
3. If URL: uses as-is with `{ link: header_content }`
4. If handle (h:xxxxx): throws error (handles only valid for approval, not sending)
5. For documents: adds `filename: caption` to mediaParam where caption = headerCaption || template.header_caption
6. For images/videos: adds `caption: caption` instead

**Key Issue:**
Currently header_caption serves dual purpose: both as display caption AND as the filename sent to WhatsApp API for documents. The problem is TemplateManager.js line ~187-206 where it does:
```javascript
if (mediaType === 'document' && caption) {
  mediaParam = { ...mediaParam, filename: caption };
}
```

**Proposed Solution Architecture:**
1. Add `header_filename` column to MessageTemplate (STRING 255, stores original filename)
2. When uploading: capture `file.originalname` and save to `header_filename`
3. When sending: use `header_filename` as filename parameter in WhatsApp API
4. Keep `header_caption` for optional descriptive text (independent from filename)
5. Update TemplateManager.js line 188-192 to use `header_filename || template.header_filename` instead of caption

**Handle vs URL Distinction:**
- Handles (h:xxxxx): Only for Meta template approval, cannot be used when sending messages
- URLs: Required for actual message sending
- Templates must store publicUrl in header_content, not handle

# Learnings
_What has worked well? What has not? What to avoid? Do not duplicate items from other sections_

**Separation of Concerns:** The current implementation conflates two distinct concepts:
- **Filename** (technical identifier for file, should be original name)
- **Caption** (user-facing descriptive text)

Using a single field (header_caption) for both purposes creates ambiguity. The fix requires explicit separation at database level.

**File Storage vs Display:** System correctly uses randomized storage filenames for security, but must preserve original filename separately for WhatsApp API transmission.

# Key results
_If the user asked a specific output such as an answer to a question, a table, or other document, repeat the exact result here_

# Worklog
_Step by step, what was attempted, done? Very terse summary for each step_

1. User requested original filename preservation for document headers (not random/date-generated names), clarified caption should be independent
2. Launched Explore agent to understand document upload and template header system
3. Agent analyzed FileUploadService, TemplateManager, WhatsAppApiClient, MessageTemplate model, upload endpoints, and MassCampaignService
4. Identified current flow: FileUploadService preserves originalName but TemplateManager uses header_caption as filename in WhatsApp API
5. Read FileUploadService.js lines 181-239: confirmed originalName captured at line 228 but not persisted
6. Read TemplateManager.js lines 167-206: confirmed header_caption used as filename at line 191
7. Read MessageTemplate.js lines 130-146: confirmed header_caption field exists (STRING 1024)
8. Designed solution: new header_filename field to store original name separately from caption
9. Created 7-task todo list for implementation (migration, model update, service updates, frontend updates)
10. Created migration file 20251210000000-add-header-filename-to-templates.cjs (adds STRING(255) column after header_caption)
11. Marked migration task as completed in todo list
12. Read full MessageTemplate.js (212 lines) to prepare for adding header_filename field definition after line 146
13. Marked model update task as in_progress
14. Edited MessageTemplate.js to add header_filename field definition after header_caption field (lines 147-157) with STRING(255) type and validation
15. Marked model update task as completed, marked TemplateManager modification as in_progress
16. Read full TemplateManager.js (544 lines) to prepare for modifying sendTemplateMessage() method
