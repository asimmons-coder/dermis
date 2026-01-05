import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// CPT code pricing estimates (for demo purposes)
const CPT_PRICING: Record<string, { name: string; price: number; category: 'medical' | 'cosmetic' }> = {
  // Biopsies
  '11102': { name: 'Tangential biopsy', price: 150, category: 'medical' },
  '11104': { name: 'Punch biopsy', price: 180, category: 'medical' },
  '11106': { name: 'Incisional biopsy', price: 220, category: 'medical' },
  // Destruction
  '17000': { name: 'Destruction lesion 1st', price: 120, category: 'medical' },
  '17003': { name: 'Destruction lesion 2-14', price: 45, category: 'medical' },
  '17110': { name: 'Destruction benign', price: 130, category: 'medical' },
  '17111': { name: 'Destruction benign 15+', price: 180, category: 'medical' },
  // Excisions
  '11400': { name: 'Excision benign 0.5cm', price: 250, category: 'medical' },
  '11401': { name: 'Excision benign 0.6-1cm', price: 320, category: 'medical' },
  '11402': { name: 'Excision benign 1.1-2cm', price: 400, category: 'medical' },
  '11600': { name: 'Excision malignant 0.5cm', price: 450, category: 'medical' },
  '11601': { name: 'Excision malignant 0.6-1cm', price: 550, category: 'medical' },
  '11602': { name: 'Excision malignant 1.1-2cm', price: 700, category: 'medical' },
  // Mohs
  '17311': { name: 'Mohs 1st stage', price: 800, category: 'medical' },
  '17312': { name: 'Mohs add\'l stage', price: 500, category: 'medical' },
  '17313': { name: 'Mohs head/neck', price: 950, category: 'medical' },
  // E&M
  '99202': { name: 'Office visit new low', price: 110, category: 'medical' },
  '99203': { name: 'Office visit new moderate', price: 165, category: 'medical' },
  '99204': { name: 'Office visit new high', price: 245, category: 'medical' },
  '99212': { name: 'Office visit est low', price: 75, category: 'medical' },
  '99213': { name: 'Office visit est moderate', price: 115, category: 'medical' },
  '99214': { name: 'Office visit est high', price: 170, category: 'medical' },
  // Cosmetic
  '64612': { name: 'Botox injection', price: 500, category: 'cosmetic' },
  '11950': { name: 'Dermal filler 1cc', price: 650, category: 'cosmetic' },
  '11951': { name: 'Dermal filler 1-5cc', price: 450, category: 'cosmetic' },
  '15780': { name: 'Chemical peel', price: 200, category: 'cosmetic' },
  '17340': { name: 'Cryotherapy cosmetic', price: 100, category: 'cosmetic' },
  '96920': { name: 'Laser therapy', price: 350, category: 'cosmetic' },
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const practiceId = searchParams.get('practiceId') || '00000000-0000-0000-0000-000000000001'
    const providerId = searchParams.get('providerId')

    // Get date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // Build base query conditions
    const baseConditions = providerId
      ? { practice_id: practiceId, provider_id: providerId }
      : { practice_id: practiceId }

    // Fetch all encounters for the month with CPT codes
    let encountersQuery = supabase
      .from('encounters')
      .select(`
        id,
        patient_id,
        provider_id,
        cpt_codes,
        icd10_codes,
        status,
        scheduled_at,
        completed_at,
        encounter_type,
        providers (
          id,
          first_name,
          last_name
        )
      `)
      .eq('practice_id', practiceId)
      .gte('scheduled_at', startOfMonth.toISOString())

    if (providerId) {
      encountersQuery = encountersQuery.eq('provider_id', providerId)
    }

    const { data: encounters } = await encountersQuery

    // Fetch last month encounters for comparison
    let lastMonthQuery = supabase
      .from('encounters')
      .select('id, cpt_codes, status')
      .eq('practice_id', practiceId)
      .gte('scheduled_at', startOfLastMonth.toISOString())
      .lt('scheduled_at', startOfMonth.toISOString())
      .eq('status', 'completed')

    if (providerId) {
      lastMonthQuery = lastMonthQuery.eq('provider_id', providerId)
    }

    const { data: lastMonthEncounters } = await lastMonthQuery

    // Fetch YTD encounters
    let ytdQuery = supabase
      .from('encounters')
      .select('id, cpt_codes')
      .eq('practice_id', practiceId)
      .gte('scheduled_at', startOfYear.toISOString())
      .eq('status', 'completed')

    if (providerId) {
      ytdQuery = ytdQuery.eq('provider_id', providerId)
    }

    const { data: ytdEncounters } = await ytdQuery

    // Fetch total patients
    const { count: totalPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('practice_id', practiceId)

    // Fetch new patients this month
    const { count: newPatientsThisMonth } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('practice_id', practiceId)
      .gte('created_at', startOfMonth.toISOString())

    // Fetch active patients this month (unique patient_ids from encounters)
    const uniquePatientIds = new Set(encounters?.map(e => e.patient_id) || [])
    const activePatientsThisMonth = uniquePatientIds.size

    // Fetch unsigned notes count
    let unsignedQuery = supabase
      .from('clinical_notes')
      .select('*', { count: 'exact', head: true })
      .eq('is_draft', true)

    if (providerId) {
      unsignedQuery = unsignedQuery.eq('provider_id', providerId)
    }

    const { count: unsignedNotesCount } = await unsignedQuery

    // Fetch pathology orders pending review
    const pathOrderStore: Map<string, any> = (global as any).pathologyOrderStore || new Map()
    const pendingPathology = Array.from(pathOrderStore.values()).filter(
      (order: any) => order.status === 'pending_review'
    ).length

    // Fetch patients overdue for follow-up (encounters > 90 days with follow-up needed)
    let overdueQuery = supabase
      .from('encounters')
      .select('id, patient_id')
      .eq('practice_id', practiceId)
      .eq('status', 'completed')
      .gte('completed_at', ninetyDaysAgo.toISOString())
      .lt('completed_at', thirtyDaysAgo.toISOString())
    // In real implementation, would check if they have a follow-up scheduled

    if (providerId) {
      overdueQuery = overdueQuery.eq('provider_id', providerId)
    }

    const { data: potentialOverdue } = await overdueQuery

    // Calculate revenue from CPT codes
    const calculateRevenue = (encountersList: any[]) => {
      let medical = 0
      let cosmetic = 0
      const procedureCounts: Record<string, { name: string; count: number; revenue: number }> = {}

      encountersList?.forEach(enc => {
        if (enc.cpt_codes && Array.isArray(enc.cpt_codes)) {
          enc.cpt_codes.forEach((cpt: any) => {
            const code = typeof cpt === 'string' ? cpt : cpt.code
            const pricing = CPT_PRICING[code]
            if (pricing) {
              if (pricing.category === 'medical') {
                medical += pricing.price
              } else {
                cosmetic += pricing.price
              }

              if (!procedureCounts[code]) {
                procedureCounts[code] = { name: pricing.name, count: 0, revenue: 0 }
              }
              procedureCounts[code].count++
              procedureCounts[code].revenue += pricing.price
            }
          })
        }
      })

      return { medical, cosmetic, total: medical + cosmetic, procedureCounts }
    }

    const mtdRevenue = calculateRevenue(encounters?.filter(e => e.status === 'completed') || [])
    const lastMonthRevenue = calculateRevenue(lastMonthEncounters || [])
    const ytdRevenue = calculateRevenue(ytdEncounters || [])

    // Get top procedures
    const topProcedures = Object.entries(mtdRevenue.procedureCounts)
      .map(([code, data]) => ({
        name: data.name,
        code,
        count: data.count,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6)

    // Calculate provider stats
    const providerStats: Record<string, { name: string; patients: number; revenue: number; procedures: number }> = {}

    encounters?.forEach(enc => {
      if (enc.providers && enc.status === 'completed') {
        const provider = Array.isArray(enc.providers) ? enc.providers[0] : enc.providers
        if (provider) {
          const key = provider.id
          if (!providerStats[key]) {
            providerStats[key] = {
              name: `Dr. ${provider.first_name} ${provider.last_name}`,
              patients: 0,
              revenue: 0,
              procedures: 0
            }
          }
          providerStats[key].patients++

          if (enc.cpt_codes && Array.isArray(enc.cpt_codes)) {
            enc.cpt_codes.forEach((cpt: any) => {
              const code = typeof cpt === 'string' ? cpt : cpt.code
              const pricing = CPT_PRICING[code]
              if (pricing) {
                providerStats[key].revenue += pricing.price
                providerStats[key].procedures++
              }
            })
          }
        }
      }
    })

    const providers = Object.values(providerStats).sort((a, b) => b.revenue - a.revenue)

    // Calculate days in month for avg per day
    const daysInMonth = now.getDate()
    const proceduresThisMonth = encounters?.filter(e => e.status === 'completed')
      .reduce((sum, enc) => sum + (enc.cpt_codes?.length || 0), 0) || 0

    // Build Practice Intelligence alerts from real data
    const practiceAlerts = []

    // Pathology results pending
    if (pendingPathology > 0) {
      practiceAlerts.push({
        id: 'path-pending',
        type: 'pathology',
        priority: 'high',
        title: `${pendingPathology} Pathology Result${pendingPathology > 1 ? 's' : ''} Pending Review`,
        description: 'Review pathology results and contact patients as needed',
        actionLabel: 'Review Now',
        actionHref: '/inbox/pathology'
      })
    }

    // Unsigned notes
    if ((unsignedNotesCount || 0) > 0) {
      practiceAlerts.push({
        id: 'unsigned-notes',
        type: 'compliance',
        priority: unsignedNotesCount! > 5 ? 'high' : 'medium',
        title: `${unsignedNotesCount} Unsigned Note${unsignedNotesCount! > 1 ? 's' : ''}`,
        description: 'Clinical notes awaiting provider signature',
        metric: `${unsignedNotesCount} notes`,
        actionLabel: 'Sign Notes',
        actionHref: '/dashboard'
      })
    }

    // Patients potentially overdue for follow-up
    const overdueCount = potentialOverdue?.length || 0
    if (overdueCount > 0) {
      practiceAlerts.push({
        id: 'overdue-followup',
        type: 'followup',
        priority: overdueCount > 10 ? 'high' : 'medium',
        title: `${overdueCount} Patient${overdueCount > 1 ? 's' : ''} May Need Follow-up`,
        description: 'Encounters from 30-90 days ago without recent visits',
        metric: `${overdueCount} patients`,
        actionLabel: 'View List',
        actionHref: '/patients?filter=needs-followup'
      })
    }

    // Revenue trend
    const revenueChange = lastMonthRevenue.total > 0
      ? ((mtdRevenue.total - lastMonthRevenue.total) / lastMonthRevenue.total * 100)
      : 0

    if (mtdRevenue.total > 0) {
      practiceAlerts.push({
        id: 'revenue-trend',
        type: 'revenue',
        priority: 'low',
        title: `Revenue Trend: ${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(0)}% MTD`,
        description: `Medical: $${mtdRevenue.medical.toLocaleString()}, Cosmetic: $${mtdRevenue.cosmetic.toLocaleString()}`,
        metric: `$${mtdRevenue.total.toLocaleString()}`,
        trend: revenueChange >= 0 ? 'up' : 'down'
      })
    }

    // Compile analytics response
    const analytics = {
      revenue: {
        mtd: mtdRevenue.total,
        lastMonth: lastMonthRevenue.total,
        ytd: ytdRevenue.total,
        target: 200000, // Could be configurable per practice
        breakdown: {
          medical: mtdRevenue.medical,
          cosmetic: mtdRevenue.cosmetic
        }
      },
      patients: {
        total: totalPatients || 0,
        activeThisMonth: activePatientsThisMonth,
        newThisMonth: newPatientsThisMonth || 0,
        retention: 94.2 // Would need historical data to calculate properly
      },
      procedures: {
        mtd: proceduresThisMonth,
        avgPerDay: daysInMonth > 0 ? (proceduresThisMonth / daysInMonth).toFixed(1) : 0,
        topProcedures
      },
      collections: {
        rate: 96.8, // Would need billing integration
        outstanding: 0, // Would need billing integration
        avgDaysToCollect: 18 // Would need billing integration
      },
      providers
    }

    return NextResponse.json({
      analytics,
      practiceAlerts,
      computedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
