'use client'

import { useState } from 'react'
import {
  Scissors,
  Circle,
  Snowflake,
  Target,
  Syringe,
  X,
  Check,
  Plus,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle
} from 'lucide-react'
import BodyDiagram, { LesionMarker } from './BodyDiagram'

// Procedure category type
type ProcedureCategory = 'medical' | 'cosmetic'

// Procedure definitions with CPT codes
const MEDICAL_PROCEDURES = {
  shave_biopsy: {
    name: 'Shave Biopsy',
    icon: Scissors,
    color: 'blue',
    cptCodes: [
      { code: '11102', description: 'Tangential biopsy, skin, single lesion' },
      { code: '11103', description: 'Tangential biopsy, skin, each additional lesion' }
    ],
    fields: ['site', 'laterality', 'size', 'anesthesia', 'hemostasis', 'specimen_jar', 'pathology_lab'],
    defaultValues: {
      anesthesia: '1% lidocaine with epinephrine',
      hemostasis: 'Aluminum chloride',
      pathology_lab: 'DermPath Diagnostics'
    }
  },
  punch_biopsy: {
    name: 'Punch Biopsy',
    icon: Circle,
    color: 'purple',
    cptCodes: [
      { code: '11104', description: 'Punch biopsy, skin, single lesion' },
      { code: '11105', description: 'Punch biopsy, skin, each additional lesion' },
      { code: '11106', description: 'Incisional biopsy, skin' }
    ],
    fields: ['site', 'laterality', 'punch_size', 'anesthesia', 'sutures', 'specimen_jar', 'pathology_lab'],
    defaultValues: {
      punch_size: '4mm',
      anesthesia: '1% lidocaine with epinephrine',
      sutures: '4-0 Nylon',
      pathology_lab: 'DermPath Diagnostics'
    }
  },
  cryotherapy: {
    name: 'Cryotherapy',
    icon: Snowflake,
    color: 'cyan',
    cptCodes: [
      { code: '17000', description: 'Destruction, premalignant lesion, first lesion' },
      { code: '17003', description: 'Destruction, premalignant lesions, 2-14 lesions, each' },
      { code: '17004', description: 'Destruction, premalignant lesions, 15 or more lesions' }
    ],
    fields: ['sites', 'lesion_count', 'freeze_duration', 'freeze_cycles', 'lesion_description'],
    defaultValues: {
      freeze_duration: '10-15 seconds',
      freeze_cycles: '2 freeze-thaw cycles',
      lesion_description: 'Actinic keratosis'
    }
  },
  destruction: {
    name: 'Destruction (Benign)',
    icon: Target,
    color: 'orange',
    cptCodes: [
      { code: '17110', description: 'Destruction, benign lesions, up to 14' },
      { code: '17111', description: 'Destruction, benign lesions, 15 or more' }
    ],
    fields: ['sites', 'lesion_count', 'method', 'lesion_type'],
    defaultValues: {
      method: 'Electrodesiccation',
      lesion_type: 'Seborrheic keratosis'
    }
  },
  excision_benign: {
    name: 'Excision (Benign)',
    icon: Scissors,
    color: 'green',
    cptCodes: [
      { code: '11400', description: 'Excision, benign lesion, trunk/arms/legs; ≤0.5cm' },
      { code: '11401', description: 'Excision, benign lesion, trunk/arms/legs; 0.6-1.0cm' },
      { code: '11402', description: 'Excision, benign lesion, trunk/arms/legs; 1.1-2.0cm' },
      { code: '11403', description: 'Excision, benign lesion, trunk/arms/legs; 2.1-3.0cm' },
      { code: '11406', description: 'Excision, benign lesion, trunk/arms/legs; >4.0cm' }
    ],
    fields: ['site', 'laterality', 'size', 'margins', 'anesthesia', 'closure', 'sutures', 'specimen_jar', 'pathology_lab'],
    defaultValues: {
      margins: '1-2mm',
      anesthesia: '1% lidocaine with epinephrine',
      closure: 'Layered closure',
      sutures: '4-0 Vicryl deep, 5-0 Nylon superficial',
      pathology_lab: 'DermPath Diagnostics'
    }
  },
  excision_malignant: {
    name: 'Excision (Malignant)',
    icon: Scissors,
    color: 'red',
    cptCodes: [
      { code: '11600', description: 'Excision, malignant lesion, trunk/arms/legs; ≤0.5cm' },
      { code: '11601', description: 'Excision, malignant lesion, trunk/arms/legs; 0.6-1.0cm' },
      { code: '11602', description: 'Excision, malignant lesion, trunk/arms/legs; 1.1-2.0cm' },
      { code: '11603', description: 'Excision, malignant lesion, trunk/arms/legs; 2.1-3.0cm' },
      { code: '11606', description: 'Excision, malignant lesion, trunk/arms/legs; >4.0cm' }
    ],
    fields: ['site', 'laterality', 'size', 'margins', 'anesthesia', 'closure', 'sutures', 'specimen_jar', 'pathology_lab', 'clinical_diagnosis'],
    defaultValues: {
      margins: '4mm',
      anesthesia: '1% lidocaine with epinephrine',
      closure: 'Layered closure',
      sutures: '4-0 Vicryl deep, 5-0 Nylon superficial',
      pathology_lab: 'DermPath Diagnostics',
      clinical_diagnosis: 'Basal cell carcinoma'
    }
  },
  id_abscess: {
    name: 'I&D Abscess',
    icon: Syringe,
    color: 'amber',
    cptCodes: [
      { code: '10060', description: 'I&D abscess, simple or single' },
      { code: '10061', description: 'I&D abscess, complicated or multiple' }
    ],
    fields: ['site', 'laterality', 'size', 'anesthesia', 'drainage', 'packing', 'culture'],
    defaultValues: {
      anesthesia: '1% lidocaine',
      drainage: 'Purulent material expressed',
      packing: 'Iodoform gauze packing placed',
      culture: 'Wound culture sent'
    }
  }
}

// Cosmetic procedure definitions
const COSMETIC_PROCEDURES = {
  botox: {
    name: 'Botox / Neurotoxin',
    icon: Syringe,
    color: 'pink',
    cptCodes: [
      { code: '64612', description: 'Chemodenervation of muscle(s); muscle(s) innervated by facial nerve' },
      { code: '64615', description: 'Chemodenervation of muscle(s); muscle(s) innervated by facial, trigeminal, cervical spinal and accessory nerves, bilateral' }
    ],
    fields: ['treatment_area', 'product', 'units', 'dilution', 'injection_sites'],
    defaultValues: {
      product: 'Botox Cosmetic (onabotulinumtoxinA)',
      dilution: '2.5ml NS per 100 units',
      units: '20'
    }
  },
  filler: {
    name: 'Dermal Filler',
    icon: Syringe,
    color: 'rose',
    cptCodes: [
      { code: '11950', description: 'Subcutaneous injection of filling material; 1cc or less' },
      { code: '11951', description: 'Subcutaneous injection of filling material; 1.1 to 5.0cc' },
      { code: '11952', description: 'Subcutaneous injection of filling material; 5.1 to 10.0cc' },
      { code: '11954', description: 'Subcutaneous injection of filling material; over 10.0cc' }
    ],
    fields: ['treatment_area', 'product', 'volume', 'technique', 'anesthesia'],
    defaultValues: {
      product: 'Juvederm Ultra Plus XC',
      technique: 'Serial puncture with linear threading',
      anesthesia: 'Topical + product contains lidocaine'
    }
  },
  chemical_peel: {
    name: 'Chemical Peel',
    icon: Target,
    color: 'violet',
    cptCodes: [
      { code: '15780', description: 'Dermabrasion; total face' },
      { code: '15781', description: 'Dermabrasion; segmental, face' },
      { code: '15782', description: 'Dermabrasion; regional, other than face' },
      { code: '15783', description: 'Dermabrasion; superficial, any site' }
    ],
    fields: ['treatment_area', 'peel_type', 'peel_agent', 'application_time', 'layers'],
    defaultValues: {
      peel_type: 'Superficial',
      peel_agent: 'Glycolic acid 30%',
      application_time: '2-3 minutes',
      layers: '1'
    }
  },
  laser_treatment: {
    name: 'Laser Treatment',
    icon: Snowflake,
    color: 'indigo',
    cptCodes: [
      { code: '96920', description: 'Laser treatment for inflammatory skin disease; total area less than 250 sq cm' },
      { code: '96921', description: 'Laser treatment for inflammatory skin disease; 250 to 500 sq cm' },
      { code: '96922', description: 'Laser treatment for inflammatory skin disease; over 500 sq cm' },
      { code: '17106', description: 'Destruction of cutaneous vascular lesions; less than 10 sq cm' }
    ],
    fields: ['treatment_area', 'laser_type', 'settings', 'passes', 'cooling', 'indication'],
    defaultValues: {
      laser_type: 'IPL',
      passes: '2-3',
      cooling: 'Contact cooling'
    }
  },
  microneedling: {
    name: 'Microneedling',
    icon: Target,
    color: 'teal',
    cptCodes: [
      { code: '17999', description: 'Unlisted procedure, skin, mucous membrane and subcutaneous tissue' }
    ],
    fields: ['treatment_area', 'device', 'needle_depth', 'passes', 'serum', 'anesthesia'],
    defaultValues: {
      device: 'SkinPen',
      needle_depth: '1.0-1.5mm',
      passes: '3-4 passes',
      anesthesia: 'Topical lidocaine 23%'
    }
  },
  prp: {
    name: 'PRP Treatment',
    icon: Syringe,
    color: 'yellow',
    cptCodes: [
      { code: '0232T', description: 'Injection(s), platelet rich plasma, any site' }
    ],
    fields: ['treatment_area', 'blood_draw', 'centrifuge_settings', 'prp_volume', 'technique'],
    defaultValues: {
      blood_draw: '60ml whole blood',
      centrifuge_settings: '3500 RPM x 15 min',
      prp_volume: '6-8ml',
      technique: 'Injection with microneedling'
    }
  },
  sclerotherapy: {
    name: 'Sclerotherapy',
    icon: Syringe,
    color: 'sky',
    cptCodes: [
      { code: '36465', description: 'Injection of non-compounded foam sclerosant; single incompetent extremity truncal vein' },
      { code: '36468', description: 'Injection of sclerosant; spider veins, limb or trunk, per session' },
      { code: '36470', description: 'Injection of sclerosant; single incompetent vein' }
    ],
    fields: ['treatment_area', 'sclerosant', 'concentration', 'volume', 'vein_size', 'vessels_treated'],
    defaultValues: {
      sclerosant: 'Polidocanol (Asclera)',
      concentration: '0.5%',
      vein_size: '1-3mm spider veins'
    }
  }
}

// Combined procedure templates
const PROCEDURE_TEMPLATES = {
  ...MEDICAL_PROCEDURES,
  ...COSMETIC_PROCEDURES
}

const BODY_SITES = [
  'Scalp', 'Forehead', 'Temple', 'Cheek', 'Nose', 'Lip', 'Chin', 'Ear', 'Neck',
  'Chest', 'Back', 'Abdomen', 'Shoulder', 'Upper arm', 'Forearm', 'Wrist', 'Hand', 'Finger',
  'Hip', 'Thigh', 'Knee', 'Lower leg', 'Ankle', 'Foot', 'Toe'
]

const LATERALITY = ['Left', 'Right', 'Midline', 'Bilateral']

const PUNCH_SIZES = ['2mm', '3mm', '4mm', '5mm', '6mm', '8mm']

interface Procedure {
  id: string
  type: keyof typeof PROCEDURE_TEMPLATES
  data: Record<string, string | number>
  cptCode: { code: string; description: string }
  note: string
  timestamp: Date
}

interface ProcedureTemplatesProps {
  onProcedureAdd: (procedure: Procedure) => void
  onCptCodeAdd: (code: { code: string; description: string }) => void
  onNoteAppend: (text: string) => void
}

export default function ProcedureTemplates({
  onProcedureAdd,
  onCptCodeAdd,
  onNoteAppend
}: ProcedureTemplatesProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [category, setCategory] = useState<ProcedureCategory>('medical')
  const [selectedProcedure, setSelectedProcedure] = useState<keyof typeof PROCEDURE_TEMPLATES | null>(null)
  const [formData, setFormData] = useState<Record<string, string | number>>({})
  const [completedProcedures, setCompletedProcedures] = useState<Procedure[]>([])
  const [bodyMarkers, setBodyMarkers] = useState<LesionMarker[]>([])
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null)

  const handleProcedureSelect = (procedureType: keyof typeof PROCEDURE_TEMPLATES) => {
    const template = PROCEDURE_TEMPLATES[procedureType]
    setSelectedProcedure(procedureType)
    setFormData(template.defaultValues || {})
    setBodyMarkers([])
    setSelectedMarkerId(null)
  }

  const handleBodySiteSelect = (site: string) => {
    // Map body diagram site to form site field
    const siteMapping: Record<string, string> = {
      'Scalp': 'Scalp',
      'Forehead': 'Forehead',
      'Face': 'Cheek',
      'Neck': 'Neck',
      'Right Shoulder': 'Shoulder',
      'Left Shoulder': 'Shoulder',
      'Right Upper Arm': 'Upper arm',
      'Left Upper Arm': 'Upper arm',
      'Chest': 'Chest',
      'Right Forearm': 'Forearm',
      'Left Forearm': 'Forearm',
      'Abdomen': 'Abdomen',
      'Right Hand': 'Hand',
      'Left Hand': 'Hand',
      'Right Thigh': 'Thigh',
      'Left Thigh': 'Thigh',
      'Right Knee': 'Knee',
      'Left Knee': 'Knee',
      'Right Lower Leg': 'Lower leg',
      'Left Lower Leg': 'Lower leg',
      'Right Foot': 'Foot',
      'Left Foot': 'Foot',
      'Upper Back': 'Back',
      'Lower Back': 'Back',
      'Posterior Scalp': 'Scalp',
      'Posterior Neck': 'Neck',
      'Right Posterior Shoulder': 'Shoulder',
      'Left Posterior Shoulder': 'Shoulder',
      'Right Posterior Upper Arm': 'Upper arm',
      'Left Posterior Upper Arm': 'Upper arm',
      'Right Posterior Forearm': 'Forearm',
      'Left Posterior Forearm': 'Forearm',
      'Right Posterior Hand': 'Hand',
      'Left Posterior Hand': 'Hand',
      'Buttocks': 'Hip',
      'Right Posterior Thigh': 'Thigh',
      'Left Posterior Thigh': 'Thigh',
      'Right Posterior Knee': 'Knee',
      'Left Posterior Knee': 'Knee',
      'Right Calf': 'Lower leg',
      'Left Calf': 'Lower leg',
      'Right Heel': 'Foot',
      'Left Heel': 'Foot',
    }

    const mappedSite = siteMapping[site] || site
    const laterality = site.includes('Right') ? 'Right' : site.includes('Left') ? 'Left' : 'Midline'

    setFormData(prev => ({
      ...prev,
      site: mappedSite,
      laterality: laterality
    }))
  }

  const handleFieldChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const generateProcedureNote = (procedureType: keyof typeof PROCEDURE_TEMPLATES, data: Record<string, string | number>): string => {
    const template = PROCEDURE_TEMPLATES[procedureType]

    switch (procedureType) {
      case 'shave_biopsy':
        return `SHAVE BIOPSY: ${data.laterality || ''} ${data.site || ''}, ${data.size || ''}mm lesion. Anesthesia: ${data.anesthesia || 'local anesthesia'}. The lesion was removed by tangential excision. Hemostasis achieved with ${data.hemostasis || 'aluminum chloride'}. Specimen placed in formalin, labeled "${data.specimen_jar || 'A'}", sent to ${data.pathology_lab || 'pathology'}.`

      case 'punch_biopsy':
        return `PUNCH BIOPSY: ${data.laterality || ''} ${data.site || ''}, ${data.punch_size || '4mm'} punch biopsy performed. Anesthesia: ${data.anesthesia || 'local anesthesia'}. Wound closed with ${data.sutures || 'sutures'}. Specimen placed in formalin, labeled "${data.specimen_jar || 'A'}", sent to ${data.pathology_lab || 'pathology'}.`

      case 'cryotherapy':
        const lesionCount = parseInt(data.lesion_count as string) || 1
        return `CRYOTHERAPY: ${lesionCount} ${data.lesion_description || 'lesion'}${lesionCount > 1 ? 's' : ''} treated with liquid nitrogen. Sites: ${data.sites || 'as marked'}. Freeze time: ${data.freeze_duration || '10-15 seconds'} x ${data.freeze_cycles || '2 cycles'}. Patient educated on expected blister formation and wound care.`

      case 'destruction':
        const count = parseInt(data.lesion_count as string) || 1
        return `DESTRUCTION: ${count} ${data.lesion_type || 'lesion'}${count > 1 ? 's' : ''} destroyed via ${data.method || 'electrodesiccation'}. Sites: ${data.sites || 'as marked'}. Wound care instructions provided.`

      case 'excision_benign':
        return `EXCISION (BENIGN): ${data.laterality || ''} ${data.site || ''}, ${data.size || ''}cm lesion excised with ${data.margins || '1-2mm'} margins. Anesthesia: ${data.anesthesia || 'local anesthesia'}. ${data.closure || 'Layered closure'} with ${data.sutures || 'sutures'}. Specimen placed in formalin, labeled "${data.specimen_jar || 'A'}", sent to ${data.pathology_lab || 'pathology'}.`

      case 'excision_malignant':
        return `EXCISION (MALIGNANT): ${data.laterality || ''} ${data.site || ''}, clinical ${data.clinical_diagnosis || 'malignancy'}, ${data.size || ''}cm lesion excised with ${data.margins || '4mm'} margins. Anesthesia: ${data.anesthesia || 'local anesthesia'}. ${data.closure || 'Layered closure'} with ${data.sutures || 'sutures'}. Specimen placed in formalin, labeled "${data.specimen_jar || 'A'}", sent to ${data.pathology_lab || 'pathology'}. Margins marked with suture at 12 o'clock.`

      case 'id_abscess':
        return `I&D ABSCESS: ${data.laterality || ''} ${data.site || ''}, ${data.size || ''}cm abscess. Anesthesia: ${data.anesthesia || 'local anesthesia'}. Incision made, ${data.drainage || 'purulent material expressed'}. ${data.packing || 'Wound packed'}. ${data.culture || 'Culture sent'}. Patient to follow up in 48-72 hours for recheck and packing change.`

      // Cosmetic procedures
      case 'botox':
        return `NEUROTOXIN INJECTION: ${data.treatment_area || 'facial muscles'}. Product: ${data.product || 'Botox Cosmetic'}. Total units: ${data.units || '20'}. Dilution: ${data.dilution || 'standard'}. Injection sites: ${data.injection_sites || 'as marked'}. Patient tolerated procedure well. Reviewed post-procedure instructions including avoiding lying down for 4 hours, no strenuous exercise for 24 hours. Results expected in 3-14 days.`

      case 'filler':
        const volume = parseFloat(data.volume as string) || 1
        return `DERMAL FILLER INJECTION: ${data.treatment_area || 'facial area'}. Product: ${data.product || 'hyaluronic acid filler'}, ${volume}ml total. Technique: ${data.technique || 'injection'}. Anesthesia: ${data.anesthesia || 'topical'}. Patient tolerated procedure well. Reviewed post-procedure care: ice as needed, avoid pressure to treated areas, massage if lumps noted. Emergency instructions provided regarding vascular occlusion signs.`

      case 'chemical_peel':
        return `CHEMICAL PEEL: ${data.peel_type || 'Superficial'} peel to ${data.treatment_area || 'face'}. Agent: ${data.peel_agent || 'glycolic acid'}. Application time: ${data.application_time || '2-3 minutes'}. Layers: ${data.layers || '1'}. Neutralized and removed. Patient tolerated well. Post-peel instructions reviewed: sun avoidance, gentle skincare, expected peeling in 3-7 days.`

      case 'laser_treatment':
        return `LASER TREATMENT: ${data.treatment_area || 'treatment area'} treated with ${data.laser_type || 'laser'}. Indication: ${data.indication || 'as indicated'}. Settings: ${data.settings || 'per protocol'}. Passes: ${data.passes || '2-3'}. Cooling: ${data.cooling || 'contact cooling'}. Patient tolerated procedure well. Post-procedure care reviewed: sun avoidance, gentle skincare, expected downtime discussed.`

      case 'microneedling':
        return `MICRONEEDLING: ${data.treatment_area || 'face'} treated with ${data.device || 'microneedling device'}. Needle depth: ${data.needle_depth || '1.0mm'}. Passes: ${data.passes || '3-4'}. Serum applied: ${data.serum || 'hyaluronic acid'}. Anesthesia: ${data.anesthesia || 'topical lidocaine'}. Patient tolerated procedure well. Post-procedure instructions: avoid sun, makeup, and active skincare for 24-48 hours.`

      case 'prp':
        return `PRP TREATMENT: ${data.treatment_area || 'treatment area'}. Blood draw: ${data.blood_draw || '60ml'}. Centrifuge: ${data.centrifuge_settings || 'standard protocol'}. PRP volume obtained: ${data.prp_volume || '6-8ml'}. Application technique: ${data.technique || 'injection'}. Patient tolerated procedure well. Post-procedure care reviewed.`

      case 'sclerotherapy':
        return `SCLEROTHERAPY: ${data.treatment_area || 'lower extremity veins'}. Sclerosant: ${data.sclerosant || 'polidocanol'} ${data.concentration || '0.5%'}. Volume used: ${data.volume || 'as needed'}. Vein characteristics: ${data.vein_size || 'spider veins'}. Vessels treated: ${data.vessels_treated || 'multiple'}. Compression applied. Patient instructed to wear compression stockings and walk regularly. Avoid sun exposure to treated areas.`

      default:
        return ''
    }
  }

  const selectCptCode = (procedureType: keyof typeof PROCEDURE_TEMPLATES, data: Record<string, string | number>): { code: string; description: string } => {
    const template = PROCEDURE_TEMPLATES[procedureType]

    // For procedures with count-based CPT selection
    if (procedureType === 'cryotherapy') {
      const count = parseInt(data.lesion_count as string) || 1
      if (count >= 15) return template.cptCodes[2]
      if (count > 1) return template.cptCodes[1]
      return template.cptCodes[0]
    }

    if (procedureType === 'destruction') {
      const count = parseInt(data.lesion_count as string) || 1
      if (count >= 15) return template.cptCodes[1]
      return template.cptCodes[0]
    }

    // For size-based CPT selection (excisions)
    if (procedureType === 'excision_benign' || procedureType === 'excision_malignant') {
      const size = parseFloat(data.size as string) || 0.5
      if (size <= 0.5) return template.cptCodes[0]
      if (size <= 1.0) return template.cptCodes[1]
      if (size <= 2.0) return template.cptCodes[2]
      if (size <= 3.0) return template.cptCodes[3]
      return template.cptCodes[4]
    }

    // Filler volume-based CPT selection
    if (procedureType === 'filler') {
      const vol = parseFloat(data.volume as string) || 1
      if (vol <= 1.0) return template.cptCodes[0]
      if (vol <= 5.0) return template.cptCodes[1]
      if (vol <= 10.0) return template.cptCodes[2]
      return template.cptCodes[3]
    }

    // Default to first CPT code
    return template.cptCodes[0]
  }

  const handleSubmitProcedure = () => {
    if (!selectedProcedure) return

    const note = generateProcedureNote(selectedProcedure, formData)
    const cptCode = selectCptCode(selectedProcedure, formData)

    const procedure: Procedure = {
      id: crypto.randomUUID(),
      type: selectedProcedure,
      data: formData,
      cptCode,
      note,
      timestamp: new Date()
    }

    // Add to completed procedures
    setCompletedProcedures(prev => [...prev, procedure])

    // Notify parent components
    onProcedureAdd(procedure)
    onCptCodeAdd(cptCode)
    onNoteAppend(note)

    // Reset form
    setSelectedProcedure(null)
    setFormData({})
  }

  const renderField = (field: string) => {
    switch (field) {
      case 'site':
        return (
          <div key={field}>
            <label className="label">Site</label>
            <select
              value={formData.site as string || ''}
              onChange={(e) => handleFieldChange('site', e.target.value)}
              className="input"
            >
              <option value="">Select site...</option>
              {BODY_SITES.map(site => (
                <option key={site} value={site}>{site}</option>
              ))}
            </select>
          </div>
        )

      case 'sites':
        return (
          <div key={field}>
            <label className="label">Sites (describe locations)</label>
            <input
              type="text"
              value={formData.sites as string || ''}
              onChange={(e) => handleFieldChange('sites', e.target.value)}
              className="input"
              placeholder="e.g., Left forearm x2, Right temple x1"
            />
          </div>
        )

      case 'laterality':
        return (
          <div key={field}>
            <label className="label">Laterality</label>
            <div className="flex flex-wrap gap-2">
              {LATERALITY.map(lat => (
                <button
                  key={lat}
                  type="button"
                  onClick={() => handleFieldChange('laterality', lat)}
                  className={`px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${
                    formData.laterality === lat
                      ? 'bg-dermis-500 text-white'
                      : 'bg-clinical-100 text-clinical-600 hover:bg-clinical-200'
                  }`}
                >
                  {lat}
                </button>
              ))}
            </div>
          </div>
        )

      case 'size':
        return (
          <div key={field}>
            <label className="label">Size (cm)</label>
            <input
              type="number"
              step="0.1"
              value={formData.size as number || ''}
              onChange={(e) => handleFieldChange('size', e.target.value)}
              className="input w-24"
              placeholder="e.g., 0.8"
            />
          </div>
        )

      case 'punch_size':
        return (
          <div key={field}>
            <label className="label">Punch Size</label>
            <div className="flex flex-wrap gap-2">
              {PUNCH_SIZES.map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleFieldChange('punch_size', size)}
                  className={`px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${
                    formData.punch_size === size
                      ? 'bg-purple-500 text-white'
                      : 'bg-clinical-100 text-clinical-600 hover:bg-clinical-200'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )

      case 'lesion_count':
        return (
          <div key={field}>
            <label className="label">Number of Lesions</label>
            <input
              type="number"
              min="1"
              value={formData.lesion_count as number || 1}
              onChange={(e) => handleFieldChange('lesion_count', e.target.value)}
              className="input w-24"
            />
          </div>
        )

      case 'anesthesia':
        return (
          <div key={field}>
            <label className="label">Anesthesia</label>
            <select
              value={formData.anesthesia as string || ''}
              onChange={(e) => handleFieldChange('anesthesia', e.target.value)}
              className="input"
            >
              <option value="1% lidocaine with epinephrine">1% lidocaine with epinephrine</option>
              <option value="1% lidocaine">1% lidocaine (no epi)</option>
              <option value="2% lidocaine with epinephrine">2% lidocaine with epinephrine</option>
              <option value="Topical anesthesia">Topical anesthesia</option>
              <option value="None">None</option>
            </select>
          </div>
        )

      case 'hemostasis':
        return (
          <div key={field}>
            <label className="label">Hemostasis</label>
            <select
              value={formData.hemostasis as string || ''}
              onChange={(e) => handleFieldChange('hemostasis', e.target.value)}
              className="input"
            >
              <option value="Aluminum chloride">Aluminum chloride</option>
              <option value="Ferric subsulfate (Monsel's)">Ferric subsulfate (Monsel's)</option>
              <option value="Electrocautery">Electrocautery</option>
              <option value="Pressure">Pressure</option>
            </select>
          </div>
        )

      case 'sutures':
        return (
          <div key={field}>
            <label className="label">Sutures</label>
            <input
              type="text"
              value={formData.sutures as string || ''}
              onChange={(e) => handleFieldChange('sutures', e.target.value)}
              className="input"
              placeholder="e.g., 4-0 Nylon"
            />
          </div>
        )

      case 'specimen_jar':
        return (
          <div key={field}>
            <label className="label">Specimen Jar Label</label>
            <input
              type="text"
              value={formData.specimen_jar as string || ''}
              onChange={(e) => handleFieldChange('specimen_jar', e.target.value)}
              className="input w-24"
              placeholder="A, B, C..."
            />
          </div>
        )

      case 'pathology_lab':
        return (
          <div key={field}>
            <label className="label">Pathology Lab</label>
            <select
              value={formData.pathology_lab as string || ''}
              onChange={(e) => handleFieldChange('pathology_lab', e.target.value)}
              className="input"
            >
              <option value="DermPath Diagnostics">DermPath Diagnostics</option>
              <option value="Quest Diagnostics">Quest Diagnostics</option>
              <option value="LabCorp">LabCorp</option>
            </select>
          </div>
        )

      case 'margins':
        return (
          <div key={field}>
            <label className="label">Surgical Margins</label>
            <select
              value={formData.margins as string || ''}
              onChange={(e) => handleFieldChange('margins', e.target.value)}
              className="input"
            >
              <option value="1-2mm">1-2mm (standard)</option>
              <option value="3mm">3mm</option>
              <option value="4mm">4mm (BCC/SCC)</option>
              <option value="5mm">5mm</option>
              <option value="1cm">1cm (melanoma)</option>
            </select>
          </div>
        )

      case 'closure':
        return (
          <div key={field}>
            <label className="label">Closure Type</label>
            <select
              value={formData.closure as string || ''}
              onChange={(e) => handleFieldChange('closure', e.target.value)}
              className="input"
            >
              <option value="Simple closure">Simple closure</option>
              <option value="Layered closure">Layered closure</option>
              <option value="Complex closure">Complex closure</option>
              <option value="Second intention">Second intention (no closure)</option>
            </select>
          </div>
        )

      case 'freeze_duration':
      case 'freeze_cycles':
      case 'lesion_description':
      case 'lesion_type':
      case 'method':
      case 'drainage':
      case 'packing':
      case 'culture':
      case 'clinical_diagnosis':
        return (
          <div key={field}>
            <label className="label">{field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
            <input
              type="text"
              value={formData[field] as string || ''}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className="input"
            />
          </div>
        )

      // Cosmetic procedure fields
      case 'treatment_area':
        return (
          <div key={field}>
            <label className="label">Treatment Area</label>
            <select
              value={formData.treatment_area as string || ''}
              onChange={(e) => handleFieldChange('treatment_area', e.target.value)}
              className="input"
            >
              <option value="">Select area...</option>
              <option value="Glabella (frown lines)">Glabella (frown lines)</option>
              <option value="Forehead (horizontal lines)">Forehead (horizontal lines)</option>
              <option value="Crow's feet">Crow's feet</option>
              <option value="Perioral (lip lines)">Perioral (lip lines)</option>
              <option value="Nasolabial folds">Nasolabial folds</option>
              <option value="Marionette lines">Marionette lines</option>
              <option value="Lips">Lips</option>
              <option value="Cheeks / midface">Cheeks / midface</option>
              <option value="Jawline">Jawline</option>
              <option value="Chin">Chin</option>
              <option value="Under eyes (tear troughs)">Under eyes (tear troughs)</option>
              <option value="Temples">Temples</option>
              <option value="Neck (platysmal bands)">Neck (platysmal bands)</option>
              <option value="Full face">Full face</option>
              <option value="Décolletage">Décolletage</option>
              <option value="Hands">Hands</option>
              <option value="Lower extremities">Lower extremities</option>
            </select>
          </div>
        )

      case 'product':
        return (
          <div key={field}>
            <label className="label">Product</label>
            <select
              value={formData.product as string || ''}
              onChange={(e) => handleFieldChange('product', e.target.value)}
              className="input"
            >
              <option value="">Select product...</option>
              <optgroup label="Neurotoxins">
                <option value="Botox Cosmetic (onabotulinumtoxinA)">Botox Cosmetic (onabotulinumtoxinA)</option>
                <option value="Dysport (abobotulinumtoxinA)">Dysport (abobotulinumtoxinA)</option>
                <option value="Xeomin (incobotulinumtoxinA)">Xeomin (incobotulinumtoxinA)</option>
                <option value="Jeuveau (prabotulinumtoxinA)">Jeuveau (prabotulinumtoxinA)</option>
                <option value="Daxxify (daxibotulinumtoxinA)">Daxxify (daxibotulinumtoxinA)</option>
              </optgroup>
              <optgroup label="Hyaluronic Acid Fillers">
                <option value="Juvederm Ultra XC">Juvederm Ultra XC</option>
                <option value="Juvederm Ultra Plus XC">Juvederm Ultra Plus XC</option>
                <option value="Juvederm Voluma XC">Juvederm Voluma XC</option>
                <option value="Juvederm Volbella XC">Juvederm Volbella XC</option>
                <option value="Juvederm Vollure XC">Juvederm Vollure XC</option>
                <option value="Restylane">Restylane</option>
                <option value="Restylane Lyft">Restylane Lyft</option>
                <option value="Restylane Silk">Restylane Silk</option>
                <option value="Restylane Kysse">Restylane Kysse</option>
                <option value="Restylane Contour">Restylane Contour</option>
                <option value="RHA Collection">RHA Collection</option>
                <option value="Belotero Balance">Belotero Balance</option>
                <option value="Versa">Versa</option>
              </optgroup>
              <optgroup label="Biostimulators">
                <option value="Sculptra (PLLA)">Sculptra (PLLA)</option>
                <option value="Radiesse">Radiesse</option>
              </optgroup>
            </select>
          </div>
        )

      case 'units':
        return (
          <div key={field}>
            <label className="label">Units</label>
            <input
              type="number"
              min="1"
              value={formData.units as number || ''}
              onChange={(e) => handleFieldChange('units', e.target.value)}
              className="input w-24"
              placeholder="e.g., 20"
            />
          </div>
        )

      case 'volume':
        return (
          <div key={field}>
            <label className="label">Volume (ml/cc)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={formData.volume as number || ''}
              onChange={(e) => handleFieldChange('volume', e.target.value)}
              className="input w-24"
              placeholder="e.g., 1.0"
            />
          </div>
        )

      case 'dilution':
      case 'injection_sites':
      case 'technique':
      case 'peel_type':
      case 'peel_agent':
      case 'application_time':
      case 'layers':
      case 'laser_type':
      case 'settings':
      case 'passes':
      case 'cooling':
      case 'indication':
      case 'device':
      case 'needle_depth':
      case 'serum':
      case 'blood_draw':
      case 'centrifuge_settings':
      case 'prp_volume':
      case 'sclerosant':
      case 'concentration':
      case 'vein_size':
      case 'vessels_treated':
        return (
          <div key={field}>
            <label className="label">{field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
            <input
              type="text"
              value={formData[field] as string || ''}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className="input"
            />
          </div>
        )

      default:
        return null
    }
  }

  const getColorClasses = (color: string, selected: boolean) => {
    const colors: Record<string, { bg: string; hover: string; selected: string; icon: string }> = {
      // Medical procedure colors
      blue: { bg: 'bg-blue-50', hover: 'hover:bg-blue-100', selected: 'bg-blue-500 text-white', icon: 'text-blue-600' },
      purple: { bg: 'bg-purple-50', hover: 'hover:bg-purple-100', selected: 'bg-purple-500 text-white', icon: 'text-purple-600' },
      cyan: { bg: 'bg-cyan-50', hover: 'hover:bg-cyan-100', selected: 'bg-cyan-500 text-white', icon: 'text-cyan-600' },
      orange: { bg: 'bg-orange-50', hover: 'hover:bg-orange-100', selected: 'bg-orange-500 text-white', icon: 'text-orange-600' },
      green: { bg: 'bg-green-50', hover: 'hover:bg-green-100', selected: 'bg-green-500 text-white', icon: 'text-green-600' },
      red: { bg: 'bg-red-50', hover: 'hover:bg-red-100', selected: 'bg-red-500 text-white', icon: 'text-red-600' },
      amber: { bg: 'bg-amber-50', hover: 'hover:bg-amber-100', selected: 'bg-amber-500 text-white', icon: 'text-amber-600' },
      // Cosmetic procedure colors
      pink: { bg: 'bg-pink-50', hover: 'hover:bg-pink-100', selected: 'bg-pink-500 text-white', icon: 'text-pink-600' },
      rose: { bg: 'bg-rose-50', hover: 'hover:bg-rose-100', selected: 'bg-rose-500 text-white', icon: 'text-rose-600' },
      violet: { bg: 'bg-violet-50', hover: 'hover:bg-violet-100', selected: 'bg-violet-500 text-white', icon: 'text-violet-600' },
      indigo: { bg: 'bg-indigo-50', hover: 'hover:bg-indigo-100', selected: 'bg-indigo-500 text-white', icon: 'text-indigo-600' },
      teal: { bg: 'bg-teal-50', hover: 'hover:bg-teal-100', selected: 'bg-teal-500 text-white', icon: 'text-teal-600' },
      yellow: { bg: 'bg-yellow-50', hover: 'hover:bg-yellow-100', selected: 'bg-yellow-500 text-white', icon: 'text-yellow-600' },
      sky: { bg: 'bg-sky-50', hover: 'hover:bg-sky-100', selected: 'bg-sky-500 text-white', icon: 'text-sky-600' },
    }
    const c = colors[color] || colors.blue
    return selected ? c.selected : `${c.bg} ${c.hover}`
  }

  const getIconColorClass = (color: string) => {
    const iconColors: Record<string, string> = {
      blue: 'text-blue-600', purple: 'text-purple-600', cyan: 'text-cyan-600',
      orange: 'text-orange-600', green: 'text-green-600', red: 'text-red-600',
      amber: 'text-amber-600', pink: 'text-pink-600', rose: 'text-rose-600',
      violet: 'text-violet-600', indigo: 'text-indigo-600', teal: 'text-teal-600',
      yellow: 'text-yellow-600', sky: 'text-sky-600'
    }
    return iconColors[color] || 'text-blue-600'
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-clinical-50 to-dermis-50/50 border-b border-clinical-100"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-dermis-100 flex items-center justify-center">
            <Scissors className="w-4 h-4 text-dermis-600" />
          </div>
          <div className="text-left">
            <h3 className="font-display font-semibold text-clinical-800">Procedure Documentation</h3>
            <p className="text-xs text-clinical-500">Quick templates for common procedures</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {completedProcedures.length > 0 && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
              {completedProcedures.length} documented
            </span>
          )}
          {isExpanded ? <ChevronUp className="w-5 h-5 text-clinical-400" /> : <ChevronDown className="w-5 h-5 text-clinical-400" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 sm:p-6">
          {/* Category Tabs */}
          {!selectedProcedure && (
            <div className="mb-4">
              <div className="flex rounded-lg bg-clinical-100 p-1">
                <button
                  onClick={() => setCategory('medical')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    category === 'medical'
                      ? 'bg-white text-clinical-800 shadow-sm'
                      : 'text-clinical-600 hover:text-clinical-800'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Scissors className="w-4 h-4" />
                    Medical
                  </span>
                </button>
                <button
                  onClick={() => setCategory('cosmetic')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    category === 'cosmetic'
                      ? 'bg-white text-clinical-800 shadow-sm'
                      : 'text-clinical-600 hover:text-clinical-800'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Syringe className="w-4 h-4" />
                    Cosmetic
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Procedure Buttons */}
          {!selectedProcedure && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {Object.entries(category === 'medical' ? MEDICAL_PROCEDURES : COSMETIC_PROCEDURES).map(([key, template]) => {
                const Icon = template.icon
                return (
                  <button
                    key={key}
                    onClick={() => handleProcedureSelect(key as keyof typeof PROCEDURE_TEMPLATES)}
                    className={`p-4 rounded-lg border-2 border-transparent transition-all text-left ${getColorClasses(template.color, false)} hover:border-clinical-200`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${getIconColorClass(template.color)}`} />
                    <div className="font-medium text-sm text-clinical-800">{template.name}</div>
                    <div className="text-xs text-clinical-500 mt-1">{template.cptCodes[0].code}</div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Procedure Form */}
          {selectedProcedure && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = PROCEDURE_TEMPLATES[selectedProcedure].icon
                    return <Icon className="w-5 h-5 text-dermis-600" />
                  })()}
                  <h4 className="font-semibold text-clinical-800">
                    {PROCEDURE_TEMPLATES[selectedProcedure].name}
                  </h4>
                </div>
                <button
                  onClick={() => {
                    setSelectedProcedure(null)
                    setFormData({})
                    setBodyMarkers([])
                    setSelectedMarkerId(null)
                  }}
                  className="p-1 hover:bg-clinical-100 rounded"
                >
                  <X className="w-4 h-4 text-clinical-400" />
                </button>
              </div>

              {/* Body Diagram + Form Fields Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Body Diagram */}
                <div className="lg:col-span-1">
                  <BodyDiagram
                    markers={bodyMarkers}
                    onMarkersChange={setBodyMarkers}
                    onSiteSelect={handleBodySiteSelect}
                    selectedMarkerId={selectedMarkerId || undefined}
                    onMarkerSelect={setSelectedMarkerId}
                  />
                </div>

                {/* Form Fields */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {PROCEDURE_TEMPLATES[selectedProcedure].fields.map(field => renderField(field))}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-clinical-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-clinical-500" />
                  <span className="text-xs font-medium text-clinical-500 uppercase tracking-wide">Note Preview</span>
                </div>
                <p className="text-sm text-clinical-700">
                  {generateProcedureNote(selectedProcedure, formData) || 'Fill in the fields above to generate the procedure note...'}
                </p>
              </div>

              {/* CPT Code */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-clinical-500">CPT Code:</span>
                <span className="px-2 py-1 bg-dermis-100 text-dermis-700 rounded font-mono font-medium">
                  {selectCptCode(selectedProcedure, formData).code}
                </span>
                <span className="text-clinical-600 text-xs hidden sm:inline">
                  {selectCptCode(selectedProcedure, formData).description}
                </span>
              </div>

              <button
                onClick={handleSubmitProcedure}
                className="btn-primary w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Procedure to Note
              </button>
            </div>
          )}

          {/* Completed Procedures */}
          {completedProcedures.length > 0 && !selectedProcedure && (
            <div className="mt-6 pt-6 border-t border-clinical-100">
              <h4 className="text-sm font-semibold text-clinical-700 mb-3">Documented Procedures</h4>
              <div className="space-y-2">
                {completedProcedures.map(proc => (
                  <div key={proc.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-600" />
                      <div>
                        <span className="font-medium text-clinical-800">
                          {PROCEDURE_TEMPLATES[proc.type].name}
                        </span>
                        <span className="text-clinical-500 mx-2">•</span>
                        <span className="font-mono text-sm text-clinical-600">{proc.cptCode.code}</span>
                      </div>
                    </div>
                    <span className="text-xs text-clinical-500">
                      {proc.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
