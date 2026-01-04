import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const results = []

    // Update Maria Santos - Blue Cross Blue Shield
    const { data: maria, error: mariaError } = await supabase
      .from('patients')
      .update({
        insurance_primary: {
          carrier: 'Blue Cross Blue Shield',
          plan: 'PPO Select',
          memberId: 'MS123456789',
          groupId: 'GRP001',
          subscriber: 'Maria Santos',
          relationship: 'self'
        }
      })
      .eq('id', '7824ccc8-9139-41dd-b859-8cc47d16d16b')
      .select()

    results.push({
      patient: 'Maria Santos',
      success: !mariaError,
      error: mariaError?.message,
      data: maria
    })

    // Update Tyler Johnson - Aetna
    const { data: tyler, error: tylerError } = await supabase
      .from('patients')
      .update({
        insurance_primary: {
          carrier: 'Aetna',
          plan: 'HMO',
          memberId: 'TJ987654321',
          groupId: 'GRP002',
          subscriber: 'Tyler Johnson',
          relationship: 'self'
        }
      })
      .eq('id', 'ef9496ef-793d-4b83-9ab4-560ed13ef4d3')
      .select()

    results.push({
      patient: 'Tyler Johnson',
      success: !tylerError,
      error: tylerError?.message,
      data: tyler
    })

    // Update Rebecca Chen - UnitedHealthcare
    const { data: rebecca, error: rebeccaError } = await supabase
      .from('patients')
      .update({
        insurance_primary: {
          carrier: 'UnitedHealthcare',
          plan: 'Choice Plus',
          memberId: 'RC555666777',
          groupId: 'GRP003',
          subscriber: 'Rebecca Chen',
          relationship: 'self'
        }
      })
      .eq('id', '4dda17c7-4f5c-4ff9-bd5c-2cdb2067a9e6')
      .select()

    results.push({
      patient: 'Rebecca Chen',
      success: !rebeccaError,
      error: rebeccaError?.message,
      data: rebecca
    })

    // Update David Williams - Medicare
    const { data: david, error: davidError } = await supabase
      .from('patients')
      .update({
        insurance_primary: {
          carrier: 'Medicare',
          plan: 'Part B',
          memberId: 'DW111222333A',
          subscriber: 'David Williams',
          relationship: 'self'
        }
      })
      .eq('id', 'b56bb913-7a72-4472-9d3e-b3694daf55b8')
      .select()

    results.push({
      patient: 'David Williams',
      success: !davidError,
      error: davidError?.message,
      data: david
    })

    return NextResponse.json({
      success: true,
      message: 'Sample insurance data added to all test patients',
      results
    })
  } catch (error: any) {
    console.error('Error seeding insurance data:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
