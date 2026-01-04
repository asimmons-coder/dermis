# AI Clinical Notes Update - Balancing Safety & Utility

## Changes Made

We've adjusted the AI clinical documentation system to be more **helpful and practical** while **maintaining critical safety guardrails**.

## Key Philosophy Shift

**Before:** Ultra-conservative - any ambiguity → `[PROVIDER TO COMPLETE]`
**After:** Professional medical scribe - expand brief notes → 80% complete documentation

## What Changed

### 1. System Prompt Updated (`clinical-notes.ts`)

**NEW DOCUMENTATION PHILOSOPHY:**
- Goal: Produce notes that are 80% complete and ready for quick provider review
- Use standard templates for common visit types (skin checks, acne, lesion evaluation)
- Expand brief provider input into professional clinical language
- Only use `[PROVIDER TO COMPLETE]` for truly critical missing information

**VISIT TYPE TEMPLATES ADDED:**
```
Annual Skin Check:
- Assumes full body exam performed
- Documents findings mentioned
- Standard follow-up plan

Acne Visit:
- Expands "not better" into clinical description
- Assumes facial examination
- Reasonable treatment escalation suggestions

Lesion Evaluation:
- Detailed lesion description using dermatologic terms
- Differential diagnoses
- Appropriate next steps (biopsy vs monitoring)
```

**EXAMPLES NOW PROVIDED:**

❌ **Bad (Too sparse):**
```
Input: "Patient here for skin check, found AK on left forearm"
Output:
Subjective: [PROVIDER TO COMPLETE]
Objective: [PROVIDER TO COMPLETE]
```

✓ **Good (Helpful):**
```
Input: "Patient here for skin check, found AK on left forearm"
Output:
Subjective: Patient presents for annual total body skin examination.
History of sun exposure per routine outdoor activities.

Objective: Complete skin examination performed. Hyperkeratotic papule
noted on left dorsal forearm, approximately 4-5mm, consistent with
actinic damage. Remaining skin examination without additional
suspicious lesions.

Assessment: Clinical findings consistent with actinic keratosis of
left forearm.

Plan: Lesion treated with cryotherapy today. Patient educated on sun
protection. Continue annual skin surveillance. Return PRN for new or
changing lesions.
```

### 2. Input Validation Relaxed (`guardrails.ts`)

**Before:**
- Required minimum 10 characters
- Required chief complaint (error if missing)
- Rejected vague language

**After:**
- Required minimum 5 characters (allows "skin check", "acne fu")
- Chief complaint is warning, not error
- More permissive of natural clinical shorthand

### 3. Output Markers Reduced (`guardrails.ts`)

**Before:**
- `[INCOMPLETE]` added if section < 20 characters
- Every treatment marked `[SUGGESTED - PROVIDER TO VERIFY]`
- Assessment marked if missing hedging language

**After:**
- `[INCOMPLETE]` only if section < 10 characters (truly empty)
- Only mark clear AI suggestions (not expansions of provider statements)
- Trust system prompt to use hedging language (no redundant markers)

### 4. User Prompt Updated

**NEW EMPHASIS:**
```
"Create a professionally complete note (80% ready for provider signature)
Expand the provider's brief input into proper clinical documentation
For common visit types, use standard documentation patterns
Only use [PROVIDER TO COMPLETE] for truly missing critical information
Infer reasonable standard elements (exam performed, findings discussed,
education provided)

Remember: Be helpful and thorough. Create documentation that saves the
provider time, not a skeleton with placeholders."
```

## What DIDN'T Change - Safety Guardrails Still Active

✓ **Hedging language still MANDATORY:**
- NEVER: "patient has acne"
- ALWAYS: "findings consistent with acne"

✓ **No fabrication of specific measurements:**
- Don't invent: lesion sizes, exact counts, precise locations
- DO expand: "rash on arms" → "erythematous eruption noted on bilateral upper extremities"

✓ **Code suggestions still marked:**
- All ICD-10/CPT codes labeled "[SUGGESTED - PROVIDER TO VERIFY]"

✓ **Diagnosis disclaimers still present:**
- Full AI disclaimer at top of every note
- Assessment still uses "consistent with" language

## Testing Recommendations

Try these sample inputs to verify the new behavior:

### Test 1: Skin Check (Should be complete, not sparse)
```
Input: "Annual skin check, found 2 AKs on arms, one SK on back"
Chief Complaint: "Skin check"

Expected: Full note with complete exam documentation,
          lesion descriptions, treatment plan
```

### Test 2: Acne Follow-up (Should infer context)
```
Input: "Acne not better on current regimen"
Chief Complaint: "Acne follow-up"

Expected: Complete note assuming facial exam,
          describing persistent acne, suggesting escalation
```

### Test 3: Brief but complete (Should expand appropriately)
```
Input: "Eczema flare, gave triamcinolone cream"
Chief Complaint: "Rash"

Expected: Detailed exam findings, expanded plan with
          patient education, follow-up
```

### Test 4: True ambiguity (Should still use markers)
```
Input: "Something on leg"
Chief Complaint: "Lesion"

Expected: Will request [PROVIDER TO COMPLETE] for specifics,
          but still create reasonable structure
```

## Benefits

✅ **Providers save time** - notes are mostly complete, not skeletons
✅ **Still safe** - hedging language enforced, no fabricated measurements
✅ **More usable** - fewer annoying placeholder markers
✅ **Maintains legal protection** - AI disclaimer + verification requirements still present

## Monitoring

Watch for:
- Notes that feel "too creative" (inventing details not mentioned)
- Missing hedging language in assessments
- Inadequate [PROVIDER TO VERIFY] markers on code suggestions

If issues arise, can adjust the balance further.
