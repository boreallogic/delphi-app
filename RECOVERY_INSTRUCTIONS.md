# 🚨 URGENT: Data Recovery Instructions

## If You Still Have the Browser Tab Open - DO NOT REFRESH!

Your responses are saved in your browser's memory but haven't been saved to the database yet. Follow these steps CAREFULLY:

---

## Step 1: Backup Your Data (Do This FIRST!)

1. **Keep the browser tab with the survey OPEN**
2. Press **F12** (or Cmd+Option+I on Mac) to open Developer Tools
3. Click on the **Console** tab
4. Copy and paste this entire script, then press Enter:

```javascript
// ===== DATA RECOVERY SCRIPT =====
(function() {
  console.log('🔍 Scanning for response data...');

  const data = {
    timestamp: new Date().toISOString(),
    responses: []
  };

  // Get all rating inputs
  const priorityInputs = document.querySelectorAll('input[type="radio"]:checked');
  const textareas = document.querySelectorAll('textarea');
  const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');

  console.log(`Found ${priorityInputs.length} ratings, ${textareas.length} text fields, ${checkboxes.length} checkboxes`);

  // Extract current indicator info
  const indicatorName = document.querySelector('h1, [class*="CardTitle"]')?.textContent;

  // Extract all form values
  const formData = {
    indicatorName: indicatorName || 'Unknown',
    priority: null,
    validity: null,
    feasibility: null,
    reasoning: '',
    threshold: '',
    generalComments: '',
    dissentFlag: false,
    dissentReason: ''
  };

  // Get rating values
  const ratingInputs = Array.from(document.querySelectorAll('input[type="radio"]:checked'));
  ratingInputs.forEach(input => {
    const name = input.name || input.id;
    const value = parseInt(input.value);
    if (name.includes('priority')) formData.priority = value;
    if (name.includes('validity')) formData.validity = value;
    if (name.includes('feasibility')) formData.feasibility = value;
  });

  // Get textarea values
  const textareaFields = Array.from(document.querySelectorAll('textarea'));
  textareaFields.forEach(ta => {
    const id = ta.id;
    const value = ta.value;
    if (id.includes('reasoning')) formData.reasoning = value;
    if (id.includes('threshold')) formData.threshold = value;
    if (id.includes('general') || id.includes('comment')) formData.generalComments = value;
    if (id.includes('dissent')) formData.dissentReason = value;
  });

  // Get checkbox values
  const dissentCheckbox = document.querySelector('input[type="checkbox"]#dissent');
  if (dissentCheckbox) formData.dissentFlag = dissentCheckbox.checked;

  data.responses.push(formData);

  console.log('✅ Data extracted:', data);

  // Create downloadable backup
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `delphi-backup-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('💾 Backup file downloaded! Check your Downloads folder.');
  console.log('📋 Your data:', jsonStr);

  return data;
})();
```

5. The script will:
   - Extract all your filled form values
   - Download a backup JSON file
   - Print your data in the console (take a screenshot!)

---

## Step 2: Wait for the Fix

**DO NOT CLOSE THE TAB YET!**

The developer is fixing the authentication bug right now. You'll receive an email when it's safe to try saving again.

---

## Step 3: Save Your Responses (After Fix is Deployed)

Once you receive confirmation the bug is fixed:

1. **Still on the same tab** (don't refresh yet!)
2. Click the **"Save"** button on your current indicator
3. You should see: **✓ Saved** (green checkmark)
4. If it works, continue through all your indicators
5. Click **"Save & Next"** to save and move forward

---

## If Saving Still Fails:

Run this script in the console to manually submit your data:

```javascript
// ===== MANUAL SUBMISSION SCRIPT =====
// (Only use after auth is fixed)
(function() {
  // Get current form values
  const data = {
    indicatorId: 'INDICATOR_ID_HERE', // Developer will provide this
    roundNumber: 1,
    priorityRating: null,
    operationalizationValidity: null,
    feasibilityRating: null,
    qualitativeReasoning: '',
    thresholdSuggestion: '',
    generalComments: '',
    dissentFlag: false,
    dissentReason: ''
  };

  // Extract values (same as backup script)
  const ratingInputs = Array.from(document.querySelectorAll('input[type="radio"]:checked'));
  ratingInputs.forEach(input => {
    const name = input.name || input.id;
    const value = parseInt(input.value);
    if (name.includes('priority')) data.priorityRating = value;
    if (name.includes('validity')) data.operationalizationValidity = value;
    if (name.includes('feasibility')) data.feasibilityRating = value;
  });

  const textareas = Array.from(document.querySelectorAll('textarea'));
  textareas.forEach(ta => {
    const id = ta.id;
    const value = ta.value || null;
    if (id.includes('reasoning')) data.qualitativeReasoning = value;
    if (id.includes('threshold')) data.thresholdSuggestion = value;
    if (id.includes('general') || id.includes('comment')) data.generalComments = value;
    if (id.includes('dissent')) data.dissentReason = value;
  });

  const dissentCheckbox = document.querySelector('input[type="checkbox"]#dissent');
  if (dissentCheckbox) data.dissentFlag = dissentCheckbox.checked;

  console.log('Submitting:', data);

  // Submit to API
  fetch('/api/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(result => {
    console.log('✅ SUCCESS! Response saved:', result);
    alert('✅ Your response has been saved!');
  })
  .catch(err => {
    console.error('❌ Error:', err);
    alert('❌ Still failed. Please contact the developer with your backup JSON file.');
  });
})();
```

---

## What NOT To Do:

- ❌ Don't refresh the page
- ❌ Don't close the browser tab
- ❌ Don't navigate to another indicator (unless you've saved)
- ❌ Don't close the browser

---

## Questions?

Contact the developer immediately with:
- The backup JSON file you downloaded
- A screenshot of the browser console
- Which indicator you were working on

---

**Your data is recoverable if the tab stays open! 🙏**
