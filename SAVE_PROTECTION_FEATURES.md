# Save Protection Features - Comprehensive Data Loss Prevention

## Overview

The app now has **5 layers of protection** to ensure responses are never lost:

1. ✅ **Instant localStorage Backup** - Every keystroke saved locally
2. ✅ **Auto-save to Database** - Saves every 30 seconds
3. ✅ **Automatic Draft Recovery** - Restores work on page reload
4. ✅ **Retry Logic** - 3 automatic retry attempts on failure
5. ✅ **Browser Close Warning** - Prevents accidental data loss

---

## Layer 1: Instant localStorage Backup 💾

**What it does:**
- Saves form data to browser's localStorage immediately when any field changes
- Works offline - no internet required
- Survives browser refresh, tab close, and even browser restart

**How it works:**
```javascript
// Triggered on every form field change
saveDraft(indicator.id, {
  priorityRating, validityRating, feasibilityRating,
  qualitativeReasoning, thresholdSuggestion, generalComments,
  dissentFlag, dissentReason, timestamp
})
```

**Storage location:**
- Key: `delphi_draft_{roundNumber}_{indicatorId}`
- Example: `delphi_draft_1_cmj1vb9tx0008t15e7xyz1234`

**User sees:**
```
💾 Draft saved locally
```

---

## Layer 2: Auto-save to Database ⏰

**What it does:**
- Automatically saves to database every 30 seconds
- Only triggers if there are unsaved changes
- Doesn't interrupt user's work

**How it works:**
```javascript
// Runs every 30 seconds
setInterval(() => {
  if (hasChanges && !isSaving) {
    handleSave(true) // isAutoSave = true
  }
}, 30000)
```

**User sees:**
```
✓ Auto-saved 2:45 PM
```

**Console shows:**
```
⏰ Auto-saving...
✅ Response saved to database (auto-save)
```

---

## Layer 3: Automatic Draft Recovery 📂

**What it does:**
- When user returns to an indicator, checks for unsaved drafts
- Automatically restores the draft if found
- Shows clear notification that draft was recovered

**How it works:**
```javascript
useEffect(() => {
  if (!response) {
    const draft = loadDraft(indicator.id)
    if (draft) {
      // Restore all form fields from draft
      setPriorityRating(draft.priorityRating)
      setReasoning(draft.qualitativeReasoning)
      // ... etc
      setDraftRecovered(true) // Show notification
    }
  }
}, [indicator.id, response])
```

**User sees:**
```
╔════════════════════════════════════════════╗
║ ℹ️ Draft Restored                          ║
║                                            ║
║ We recovered your previous unsaved work    ║
║ on this indicator. Click "Save" to store   ║
║ it in the database, or continue editing.   ║
╚════════════════════════════════════════════╝
```

**When it triggers:**
- User refreshes page
- User closes and reopens browser
- User navigates away and back to indicator
- Browser crashes and restarts

---

## Layer 4: Retry Logic with Exponential Backoff 🔄

**What it does:**
- If save fails, automatically retries up to 3 times
- Waits progressively longer between attempts
- Keeps draft in localStorage until successful

**How it works:**
```javascript
if (!success && retryCount < 3) {
  const delay = Math.pow(2, retryCount) * 1000
  // Retry after: 1s, 2s, 4s
  setTimeout(() => handleSave(isAutoSave, retryCount + 1), delay)
}
```

**User sees:**
```
❌ Error - retrying...
```

**Console shows:**
```
⚠️ Save failed, retrying in 1000ms... (attempt 1/3)
⚠️ Save failed, retrying in 2000ms... (attempt 2/3)
⚠️ Save failed, retrying in 4000ms... (attempt 3/3)
❌ Save failed after 3 retries. Draft saved in localStorage.
```

**Why this helps:**
- Temporary network issues
- Server hiccups
- Rate limiting
- Authentication token refresh

---

## Layer 5: Browser Close Warning ⚠️

**What it does:**
- Shows browser warning if user tries to close tab with unsaved changes
- Standard browser dialog (can't be bypassed)
- Only triggers if changes haven't been saved to database

**How it works:**
```javascript
window.addEventListener('beforeunload', (e) => {
  if (hasChanges) {
    e.preventDefault()
    e.returnValue = 'You have unsaved changes...'
  }
})
```

**User sees:**
```
┌─────────────────────────────────────────┐
│ Leave site?                              │
│                                          │
│ You have unsaved changes. Your draft is │
│ saved locally, but it's recommended to   │
│ save to the database first.             │
│                                          │
│         [Leave]        [Stay]            │
└─────────────────────────────────────────┘
```

---

## Visual Status Indicators

### Save States

**1. Idle (no changes):**
```
[Save] [Save & Next]
```

**2. Unsaved changes:**
```
💾 Draft saved locally  [Save] [Save & Next]
```

**3. Saving:**
```
[Saving...] [Save & Next]
(disabled)
```

**4. Saved to database:**
```
✓ Saved to database  [Save] [Save & Next]
```

**5. Auto-saved:**
```
✓ Auto-saved 2:45 PM  [Save] [Save & Next]
```

**6. Error with retry:**
```
❌ Error - retrying...  [Save] [Save & Next]
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ USER TYPES IN FORM                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ LAYER 1: Instant localStorage Save                          │
│ ✅ Data saved locally (survives refresh/close)              │
└─────────────────────────────────────────────────────────────┘
                              │
                   ┌──────────┴──────────┐
                   │   30 seconds pass   │
                   └──────────┬──────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ LAYER 2: Auto-save Triggered                                │
│ → POST /api/responses                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                   ┌──────────┴──────────┐
                   │   Success?          │
                   └──────────┬──────────┘
                 Yes ◄────────┼────────► No
                  │           │           │
                  ▼           │           ▼
         ┌──────────────┐    │    ┌──────────────────┐
         │ ✅ Saved!    │    │    │ LAYER 4: Retry   │
         │ Clear draft  │    │    │ Wait 1s, 2s, 4s  │
         └──────────────┘    │    └──────┬───────────┘
                             │           │
                             │           ▼
                             │    ┌──────────────────┐
                             │    │ Still fails?     │
                             │    │ Draft in storage │
                             │    └──────────────────┘
                             │
                ┌────────────┴────────────┐
                │ User closes browser tab  │
                └────────────┬────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ LAYER 5: Browser Warning                                    │
│ "You have unsaved changes..."                               │
└─────────────────────────────────────────────────────────────┘
                             │
                   ┌─────────┴─────────┐
                   │  User comes back   │
                   └─────────┬─────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ LAYER 3: Draft Recovery                                     │
│ ✨ "Draft Restored" banner shown                            │
│ All form fields populated from localStorage                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Console Messages for Debugging

### Normal Operation
```
💾 Draft saved to localStorage: cmj1vb9tx0008t15e
⏰ Auto-saving...
✅ Response saved to database (auto-save)
🗑️ Draft cleared from localStorage: cmj1vb9tx0008t15e
```

### Draft Recovery
```
📂 Draft loaded from localStorage: cmj1vb9tx0008t15e
✨ Restored unsaved draft from 1/7/2026, 3:45:12 PM
```

### Error Handling
```
⚠️ Save failed, retrying in 1000ms... (attempt 1/3)
⚠️ Save failed, retrying in 2000ms... (attempt 2/3)
⚠️ Save failed, retrying in 4000ms... (attempt 3/3)
❌ Save failed after 3 retries. Draft saved in localStorage.
```

---

## Testing the Save Protection

### Test 1: localStorage Backup
1. Fill out a form
2. Open DevTools → Application → Local Storage
3. See: `delphi_draft_1_[indicatorId]` with your data
4. Refresh page
5. ✅ Data should be restored

### Test 2: Auto-save
1. Fill out a form
2. Wait 30 seconds
3. See console: "⏰ Auto-saving..."
4. See UI: "✓ Auto-saved [time]"
5. ✅ Check database for response

### Test 3: Draft Recovery
1. Fill out a form (don't click Save)
2. Close browser completely
3. Reopen and navigate to same indicator
4. See blue banner: "Draft Restored"
5. ✅ All fields should be populated

### Test 4: Retry Logic
1. Disconnect internet
2. Fill out form and click Save
3. See: "❌ Error - retrying..."
4. Reconnect internet within 7 seconds
5. ✅ Should auto-retry and succeed

### Test 5: Browser Warning
1. Fill out a form (don't click Save)
2. Try to close the browser tab
3. ✅ See browser warning dialog

---

## Production Checklist

Before removing auth bypass:

- [ ] Test all 5 layers with real authentication
- [ ] Test auto-save with magic link sessions
- [ ] Test draft recovery across different panelists
- [ ] Test retry logic with real network conditions
- [ ] Verify localStorage quota limits (usually 5-10MB)
- [ ] Test on mobile browsers (Safari, Chrome)
- [ ] Add analytics to track save failures
- [ ] Add admin dashboard to view localStorage issues

---

## localStorage Considerations

**Storage limits:**
- Chrome/Edge: ~10 MB
- Firefox: ~10 MB
- Safari: ~5 MB
- Mobile browsers: May be lower

**Current storage per draft:** ~1-5 KB
- Can store approximately 1,000-5,000 drafts

**Cleanup strategy:**
- Drafts cleared on successful save
- Could add: Clear drafts older than 30 days
- Could add: Clear drafts when round closes

---

## Future Enhancements

### Potential additions:
1. **Sync across devices** - Cloud backup for logged-in users
2. **Draft list page** - View all saved drafts
3. **Version history** - Undo/redo changes
4. **Offline mode** - Full PWA with service worker
5. **Conflict resolution** - Handle multiple devices editing
6. **Export drafts** - Download all drafts as JSON
7. **Admin recovery tool** - Help users recover lost data

---

## Modified Files

1. `src/app/study/[studyId]/indicator-assessment.tsx`
   - Added localStorage draft system
   - Added auto-save timer
   - Added retry logic
   - Added browser warning
   - Added recovery notification

---

## Summary

**Before:** ❌ Data lost on browser close, refresh, or save failure
**After:** ✅ Data protected by 5 layers of redundancy

**The Problem That Was:** User fills out 20 indicators → Browser crashes → All work lost
**The Solution Now:** User fills out 20 indicators → Browser crashes → All work automatically restored

---

**Your responses are now bulletproof! 🛡️**
