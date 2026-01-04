import { useState, useCallback } from 'react'

export interface QuickPhrase {
  trigger: string
  expansion: string
  description?: string
  category?: string
}

const DEFAULT_PHRASES: QuickPhrase[] = [
  {
    trigger: '.skincheck',
    expansion: 'Full body skin examination performed. No suspicious lesions identified. Patient counseled on sun protection and self-examination.',
    description: 'Full skin check note',
    category: 'Examination'
  },
  {
    trigger: '.acne',
    expansion: 'Inflammatory papules and pustules noted on [face/chest/back]. [Mild/Moderate/Severe] severity.',
    description: 'Acne examination',
    category: 'Examination'
  },
  {
    trigger: '.biopsy',
    expansion: 'Risks, benefits, and alternatives of skin biopsy discussed. Patient consented to procedure. Site prepped with alcohol, anesthetized with 1% lidocaine with epinephrine.',
    description: 'Biopsy procedure note',
    category: 'Procedure'
  },
  {
    trigger: '.botox',
    expansion: 'Botulinum toxin injection performed. Patient tolerated well. Post-procedure instructions provided.',
    description: 'Botox injection note',
    category: 'Procedure'
  },
  {
    trigger: '.excision',
    expansion: 'Informed consent obtained. Site marked and prepped with alcohol and betadine. Local anesthesia achieved with 1% lidocaine with epinephrine. Elliptical excision performed. Hemostasis achieved with electrocautery. Wound closed in layers.',
    description: 'Excision procedure note',
    category: 'Procedure'
  },
  {
    trigger: '.mole',
    expansion: 'Pigmented lesion measuring [size]mm noted on [location]. [Asymmetric/Symmetric] with [regular/irregular] borders. Color [uniform/variegated]. Dermoscopy performed.',
    description: 'Mole examination',
    category: 'Examination'
  },
  {
    trigger: '.rosacea',
    expansion: 'Facial erythema with papules and pustules consistent with rosacea. [Mild/Moderate/Severe] severity. No ocular involvement noted.',
    description: 'Rosacea examination',
    category: 'Diagnosis'
  },
  {
    trigger: '.eczema',
    expansion: 'Erythematous, scaly patches with evidence of excoriation consistent with atopic dermatitis. [Localized to/Generalized involving] [location].',
    description: 'Eczema examination',
    category: 'Diagnosis'
  },
  {
    trigger: '.sunprotection',
    expansion: 'Patient counseled on sun protection including broad-spectrum SPF 30+ sunscreen, protective clothing, and avoiding peak sun hours. Advised on monthly self-skin examinations.',
    description: 'Sun protection counseling',
    category: 'Counseling'
  },
  {
    trigger: '.isotretinoin',
    expansion: 'Isotretinoin risks, benefits, and alternatives discussed including teratogenicity, psychiatric effects, and lab monitoring requirements. iPledge enrollment reviewed. Patient verbalized understanding.',
    description: 'Isotretinoin counseling',
    category: 'Counseling'
  }
]

export function useQuickPhrases() {
  // Load custom phrases from localStorage
  const [customPhrases, setCustomPhrases] = useState<QuickPhrase[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dermis_quick_phrases')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  const allPhrases = [...DEFAULT_PHRASES, ...customPhrases]

  const expandPhrase = useCallback((text: string): { expanded: boolean; newText: string } => {
    // Check if text ends with a trigger (after a space or at start)
    for (const phrase of allPhrases) {
      const triggerPattern = new RegExp(`(^|\\s)(${phrase.trigger.replace('.', '\\.')})$`)
      const match = text.match(triggerPattern)

      if (match) {
        const prefix = text.substring(0, text.length - phrase.trigger.length)
        return {
          expanded: true,
          newText: prefix + phrase.expansion
        }
      }
    }

    return { expanded: false, newText: text }
  }, [allPhrases])

  const addCustomPhrase = useCallback((phrase: QuickPhrase) => {
    const updated = [...customPhrases, phrase]
    setCustomPhrases(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dermis_quick_phrases', JSON.stringify(updated))
    }
  }, [customPhrases])

  const removeCustomPhrase = useCallback((trigger: string) => {
    const updated = customPhrases.filter(p => p.trigger !== trigger)
    setCustomPhrases(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dermis_quick_phrases', JSON.stringify(updated))
    }
  }, [customPhrases])

  const updateCustomPhrase = useCallback((oldTrigger: string, newPhrase: QuickPhrase) => {
    const updated = customPhrases.map(p => p.trigger === oldTrigger ? newPhrase : p)
    setCustomPhrases(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dermis_quick_phrases', JSON.stringify(updated))
    }
  }, [customPhrases])

  return {
    phrases: allPhrases,
    defaultPhrases: DEFAULT_PHRASES,
    customPhrases,
    expandPhrase,
    addCustomPhrase,
    removeCustomPhrase,
    updateCustomPhrase
  }
}
