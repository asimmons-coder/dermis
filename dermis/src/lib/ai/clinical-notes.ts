import Anthropic from '@anthropic-ai/sdk'
import type { AISuggestions, DiagnosisCode, ProcedureCode } from '@/types/database'
import {
  validateClinicalInput,
  validateClinicalNoteGeneration,
  sanitizeLesionAnalysis,
  AI_DISCLAIMER,
} from './guardrails'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface PatientContext {
  age: number
  sex: string
  allergies?: string[]
  medications?: string[]
  relevantHistory?: string[]
  skinType?: string
  skinCancerHistory?: boolean
}

export interface ClinicalNoteInput {
  quickInput: string
  chiefComplaint?: string
  patientContext: PatientContext
  encounterType: 'office_visit' | 'procedure' | 'cosmetic_consult' | 'follow_up'
}

export interface GeneratedNote {
  subjective: string
  objective: string
  assessment: string
  plan: string
  fullNote: string
  suggestions: AISuggestions
}

const DERMATOLOGY_SYSTEM_PROMPT = `You are a medical documentation assistant for dermatology. Your role is to help providers create complete, professional clinical notes by expanding their brief observations into proper SOAP format.

⚠️ CRITICAL SAFETY RULES (NEVER VIOLATE):

1. HEDGING LANGUAGE IS MANDATORY
   - NEVER: "patient has acne", "diagnosis is rosacea", "this is melanoma"
   - ALWAYS: "findings consistent with", "clinical appearance suggestive of", "consider"

2. NEVER FABRICATE SPECIFIC CLINICAL FINDINGS
   - DO NOT invent: specific lesion sizes, exact counts, precise locations not mentioned
   - DO expand: "rash on arms" → "erythematous eruption noted on bilateral upper extremities"
   - DO infer reasonable context: "skin check" → assume full body exam, document as "skin examination performed"

3. CODE SUGGESTIONS MUST BE LABELED
   - All ICD-10/CPT suggestions: "[SUGGESTED - PROVIDER TO VERIFY]"
   - Never present codes as final/definitive

DOCUMENTATION PHILOSOPHY - BE HELPFUL:

Your goal is to produce a note that is 80% complete and ready for quick provider review, not a skeleton with placeholders. Providers are busy - they gave you the key clinical information, now create professional documentation.

WHEN TO USE [PROVIDER TO COMPLETE]:
ONLY for:
- Missing critical diagnoses/assessment when unclear
- Missing treatment specifics (which medication? what dose?)
- Contradictory information that needs clarification
- True ambiguity that affects medical decision-making

DO NOT use [PROVIDER TO COMPLETE] for:
- Standard ROS elements (assume reviewed and pertinent findings documented)
- Normal exam sections for body areas not mentioned (assume normal/not remarkable)
- General medical history (use patient age/context to infer typical care)
- Follow-up plans (infer reasonable next steps based on condition)

VISIT TYPE TEMPLATES - Use these as frameworks:

ANNUAL SKIN CHECK:
- Subjective: Patient presents for annual total body skin examination. [Include any history of skin cancers, sun exposure, family history if provided]
- Objective: Complete skin examination performed from scalp to toes. [Document any lesions mentioned by provider]. Remaining skin without suspicious lesions.
- Assessment: [Based on findings - if none mentioned, say "No clinically suspicious lesions identified on today's examination"]
- Plan: Findings discussed with patient. [If lesions found: recommend biopsy/monitoring]. Continue annual screening.

ACNE VISIT:
- Subjective: Patient reports [improvement/no change/worsening] of acne. Current regimen: [if mentioned, otherwise say "previously prescribed topical therapy"]
- Objective: Facial examination reveals [expand on what provider said - use terms like "scattered inflammatory papules", "comedonal lesions"]
- Assessment: Acne vulgaris, [mild/moderate/severe based on description]
- Plan: [Continue current regimen if effective, or suggest "Provider may consider adjusting therapy" if not improving]

LESION EVALUATION:
- Subjective: Patient presents with concern regarding lesion on [location]. [Duration, changes if mentioned]
- Objective: Examination reveals [detailed description of lesion using dermatologic terms - size, color, borders, etc.]
- Assessment: Clinical findings consistent with [most likely diagnosis based on description]. Differential considerations include [list].
- Plan: [Biopsy recommended if concerning, reassurance if benign-appearing]

DOCUMENTATION STYLE:

Subjective:
- Start with chief complaint/reason for visit
- Include relevant history, timeline, associated symptoms
- Note pertinent positives/negatives
- If brief input: Expand with reasonable context (e.g., "lesion" → "patient reports noticing lesion approximately [timeframe if mentioned, otherwise 'recently']")

Objective:
- Document exam findings in proper terminology
- Expand: "red rash" → "erythematous macular eruption"
- Expand: "dry skin" → "xerotic changes noted with fine scaling"
- If area examined: describe findings. If area not mentioned: don't fabricate it, just document what was examined
- Use dermatologic descriptors: morphology (macule, papule, plaque), distribution, color, secondary changes

Assessment:
- ALWAYS use hedging: "Findings consistent with...", "Clinical presentation suggestive of...", "Differential includes..."
- List primary consideration first, then differentials
- NEVER: "Patient has actinic keratosis" ❌
- ALWAYS: "Clinical findings consistent with actinic keratosis" ✓

Plan:
- Document what provider indicated
- For standard care: Infer reasonable next steps (e.g., "Continue current management" for stable conditions)
- For treatments: If medication mentioned without dose, use "[PROVIDER TO DETERMINE SPECIFIC AGENT/DOSE]"
- Include patient education, follow-up timing
- Mark any AI-suggested treatments: "[SUGGESTED FOR PROVIDER CONSIDERATION]"

EXAMPLES OF GOOD vs. BAD EXPANSION:

Provider input: "Patient here for skin check, found AK on left forearm"

❌ BAD (Too sparse):
Subjective: [PROVIDER TO COMPLETE]
Objective: [PROVIDER TO COMPLETE]
Assessment: [PROVIDER TO COMPLETE]

✓ GOOD (Helpful expansion):
Subjective: Patient presents for annual total body skin examination. History of sun exposure per routine outdoor activities.
Objective: Complete skin examination performed. Hyperkeratotic papule noted on left dorsal forearm, approximately 4-5mm, consistent with actinic damage. Remaining skin examination without additional suspicious lesions.
Assessment: Clinical findings consistent with actinic keratosis of left forearm.
Plan: Lesion treated with cryotherapy today. Patient educated on sun protection. Continue annual skin surveillance. Return PRN for new or changing lesions.

Provider input: "Acne not better on current meds"

❌ BAD:
Subjective: [PROVIDER TO COMPLETE - what medications?]
Objective: [PROVIDER TO COMPLETE]

✓ GOOD:
Subjective: Patient returns for acne follow-up. Reports inadequate improvement with current topical regimen.
Objective: Facial examination reveals persistent inflammatory papules and pustules on cheeks and forehead, consistent with moderate acne activity.
Assessment: Acne vulgaris, moderate severity, inadequate response to current therapy.
Plan: Discussed treatment escalation options with patient. [PROVIDER TO DETERMINE SPECIFIC NEW REGIMEN]. Follow-up in 8-12 weeks to assess response. Patient educated on proper application technique and expected timeline for improvement.

Your job is to be a skilled medical scribe who creates complete, professional documentation from brief provider notes. Be helpful, be thorough, but never violate the hedging language requirements or fabricate specific clinical measurements.`

export async function generateClinicalNote(input: ClinicalNoteInput): Promise<GeneratedNote> {
  const { quickInput, chiefComplaint, patientContext, encounterType } = input

  // STEP 1: Validate input before generating
  const inputValidation = validateClinicalInput(quickInput, chiefComplaint)
  if (!inputValidation.isValid) {
    throw new Error(inputValidation.error || 'Invalid clinical input')
  }

  const patientSummary = buildPatientSummary(patientContext)

  const userPrompt = `Generate a complete, professional SOAP note for this dermatology ${encounterType.replace('_', ' ')}.

Patient Context: ${patientSummary}
Chief Complaint: ${chiefComplaint || 'Not specified'}

Provider's Brief Input:
${quickInput}

INSTRUCTIONS:
1. Create a professionally complete note (80% ready for provider signature)
2. Expand the provider's brief input into proper clinical documentation
3. Use standard dermatology terminology and proper SOAP structure
4. For common visit types (skin checks, acne, rashes), use standard documentation patterns
5. ALWAYS use hedging language in Assessment: "findings consistent with", never "patient has"
6. Only use [PROVIDER TO COMPLETE] for truly missing critical information
7. Infer reasonable standard elements (exam performed, findings discussed, education provided)

Format your response as JSON:
{
  "subjective": "Complete subjective section with patient history",
  "objective": "Complete objective section with exam findings in dermatologic terms",
  "assessment": "Assessment using hedging language (findings consistent with...)",
  "plan": "Complete plan with reasonable next steps",
  "icd10_codes": [{"code": "...", "description": "..."}],
  "cpt_codes": [{"code": "...", "description": "...", "units": 1}],
  "differentials": ["..."]
}

Remember: Be helpful and thorough. Create documentation that saves the provider time, not a skeleton with placeholders.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: DERMATOLOGY_SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: userPrompt }
    ],
  })

  // Extract the text content
  const textContent = response.content.find(c => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  // Parse the JSON response
  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Could not parse JSON from response')
  }

  const parsed = JSON.parse(jsonMatch[0])

  const fullNote = formatFullNote(parsed)

  const preliminaryOutput = {
    subjective: parsed.subjective,
    objective: parsed.objective,
    assessment: parsed.assessment,
    plan: parsed.plan,
    fullNote,
    suggestions: {
      icd10: parsed.icd10_codes || [],
      cpt: parsed.cpt_codes || [],
      differentials: parsed.differentials || [],
    },
  }

  // STEP 2: Validate and sanitize output
  const validation = validateClinicalNoteGeneration(
    { quickInput, chiefComplaint },
    preliminaryOutput
  )

  // Log warnings for provider review
  if (validation.warnings.length > 0) {
    console.warn('Clinical note validation warnings:', validation.warnings)
  }

  // Throw errors if critical issues found
  if (!validation.isValid) {
    console.error('Clinical note validation errors:', validation.errors)
    throw new Error(
      `AI-generated note failed safety validation: ${validation.errors.join('; ')}`
    )
  }

  // Return validated and sanitized output with ensured arrays
  return {
    ...validation.validatedOutput,
    suggestions: {
      icd10: validation.validatedOutput.suggestions.icd10 || [],
      cpt: validation.validatedOutput.suggestions.cpt || [],
      differentials: validation.validatedOutput.suggestions.differentials
    }
  }
}

function buildPatientSummary(ctx: PatientContext): string {
  // Handle different sex formats: 'M'/'F', 'male'/'female', 'Male'/'Female'
  const sexLower = (ctx.sex || '').toLowerCase()
  const sexDisplay =
    sexLower === 'm' || sexLower === 'male' ? 'male' :
    sexLower === 'f' || sexLower === 'female' ? 'female' :
    'patient'

  const parts = [`${ctx.age}-year-old ${sexDisplay}`]
  
  if (ctx.skinType) {
    parts.push(`Fitzpatrick skin type ${ctx.skinType}`)
  }
  
  if (ctx.skinCancerHistory) {
    parts.push('history of skin cancer')
  }
  
  if (ctx.allergies && ctx.allergies.length > 0) {
    parts.push(`Allergies: ${ctx.allergies.join(', ')}`)
  }
  
  if (ctx.medications && ctx.medications.length > 0) {
    parts.push(`Current medications: ${ctx.medications.join(', ')}`)
  }
  
  if (ctx.relevantHistory && ctx.relevantHistory.length > 0) {
    parts.push(`Relevant history: ${ctx.relevantHistory.join(', ')}`)
  }
  
  return parts.join('. ')
}

function formatFullNote(parsed: Record<string, unknown>): string {
  return `${AI_DISCLAIMER}

${'='.repeat(80)}

SUBJECTIVE:
${parsed.subjective}

OBJECTIVE:
${parsed.objective}

ASSESSMENT:
${parsed.assessment}

PLAN:
${parsed.plan}

${'='.repeat(80)}

📋 SUGGESTED CODES - VERIFY BEFORE SUBMISSION:
These are AI-generated suggestions based on documentation. Provider must verify accuracy and appropriate documentation support before using.

ICD-10: ${parsed.icd10_codes && Array.isArray(parsed.icd10_codes)
    ? parsed.icd10_codes.map((c: any) => `${c.code} - ${c.description}`).join(', ')
    : 'None suggested'}

CPT: ${parsed.cpt_codes && Array.isArray(parsed.cpt_codes)
    ? parsed.cpt_codes.map((c: any) => `${c.code} - ${c.description}`).join(', ')
    : 'None suggested'}

⚠️ DIFFERENTIAL CONSIDERATIONS FOR PROVIDER REVIEW:
${parsed.differentials && Array.isArray(parsed.differentials)
    ? parsed.differentials.join('\n')
    : 'None listed'}`
}

// Specialized function for expanding lesion descriptions
export async function expandLesionDescription(
  briefDescription: string,
  bodyLocation: string
): Promise<string> {
  // Validate input
  if (!briefDescription || briefDescription.trim().length < 5) {
    throw new Error('Lesion description must be at least 5 characters')
  }

  const LESION_ANALYSIS_PROMPT = `You are a medical documentation assistant for dermatology. Your role is to DESCRIBE visible characteristics only, NOT to diagnose.

CRITICAL RULES:
1. NEVER diagnose: Do not say "this is melanoma", "appears to be BCC", etc.
2. ONLY describe objective characteristics: size, color, shape, border, texture, surface features
3. Use descriptive terminology: "pigmented", "irregular borders", "asymmetric", "raised", "scaly"
4. AVOID diagnostic terms: Use "atypical features" instead of "malignant", "concerning features" instead of "cancerous"
5. Always end with: "Clinical correlation and dermoscopic examination recommended"

Your output should read like a clinical description, not a diagnosis.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: LESION_ANALYSIS_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Provide a detailed clinical DESCRIPTION (not diagnosis) for this lesion on the ${bodyLocation}:

"${briefDescription}"

Remember: Describe visible characteristics only. Do not diagnose. Include the required disclaimer.`,
      },
    ],
  })

  const textContent = response.content.find(c => c.type === 'text')
  const rawDescription = textContent && textContent.type === 'text' ? textContent.text : briefDescription

  // Apply guardrails to sanitize any diagnostic language that slipped through
  const sanitizedDescription = sanitizeLesionAnalysis(rawDescription)

  return sanitizedDescription
}

// Function to suggest codes based on documentation
export async function suggestCodes(
  noteText: string,
  proceduresPerformed: string[]
): Promise<AISuggestions> {
  const CODING_SYSTEM_PROMPT = `You are a dermatology coding assistant. You suggest ICD-10 and CPT codes based on clinical documentation.

CRITICAL RULES:
1. ONLY suggest codes that are CLEARLY SUPPORTED by the documentation
2. NEVER suggest highly specific codes without sufficient documentation detail
3. When in doubt, suggest unspecified codes or multiple options
4. Include caveats: "Verify documentation supports...", "Consider also..."
5. For procedures, codes require documented: location, size/number, method, medical necessity
6. NEVER suggest codes for diagnoses that weren't documented
7. Include disclaimers that provider must verify codes before submission

Your suggestions are STARTING POINTS only - the provider has final responsibility for code selection.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: CODING_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Based on this clinical note, suggest ICD-10 and CPT codes.

⚠️ IMPORTANT: Your suggestions must be clearly labeled as requiring verification.

Clinical Note:
${noteText}

Procedures performed: ${proceduresPerformed.join(', ') || 'None specified'}

Respond in JSON format:
{
  "icd10": [{"code": "...", "description": "... [VERIFY: documentation supports this code]"}],
  "cpt": [{"code": "...", "description": "... [VERIFY: includes required elements]", "units": 1}],
  "notes": "Important considerations for code selection..."
}

Remember: Provider must verify each code has appropriate documentation support before submission.`,
      },
    ],
  })

  const textContent = response.content.find(c => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    return { icd10: [], cpt: [] }
  }

  try {
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])

      // Add disclaimer prefixes to each code
      if (parsed.icd10) {
        parsed.icd10 = parsed.icd10.map((code: any) => ({
          ...code,
          description: code.description.includes('[VERIFY')
            ? code.description
            : `${code.description} [VERIFY BEFORE SUBMISSION]`,
        }))
      }

      if (parsed.cpt) {
        parsed.cpt = parsed.cpt.map((code: any) => ({
          ...code,
          description: code.description.includes('[VERIFY')
            ? code.description
            : `${code.description} [VERIFY DOCUMENTATION SUPPORTS]`,
        }))
      }

      return {
        icd10: parsed.icd10 || [],
        cpt: parsed.cpt || [],
        differentials: parsed.differentials || [],
      }
    }
  } catch (error) {
    console.error('Error parsing code suggestions:', error)
  }

  return { icd10: [], cpt: [] }
}
