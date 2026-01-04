import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const DERMATOLOGY_VISION_PROMPT = `You are an expert dermatologist analyzing clinical photographs of skin lesions.
Your role is to provide detailed, objective clinical observations to assist healthcare providers.

When analyzing images, provide:
1. **Lesion Description**: Detailed description including size estimate, color characteristics, and morphology
2. **ABCDE Assessment**: Evaluate each criterion (Asymmetry, Border, Color, Diameter, Evolution if changes noted)
3. **Clinical Observations**: Note any concerning features or characteristics
4. **Follow-up Recommendation**: Suggest appropriate next steps (e.g., biopsy, dermoscopy, monitoring, reassurance)

Return your analysis as valid JSON with this exact structure:
{
  "description": "Detailed lesion description",
  "size_estimate": "Approximate size in mm",
  "color": "Color characteristics",
  "borders": "Border description",
  "texture": "Surface texture",
  "abcde": {
    "asymmetry": "Assessment of symmetry",
    "border": "Border regularity assessment",
    "color": "Color variation assessment",
    "diameter": "Size assessment",
    "evolution": "Note on evolution if applicable"
  },
  "clinical_observations": "Additional observations",
  "concerning_features": ["list", "of", "concerns"],
  "follow_up_recommendation": "Recommended action"
}

Be objective and descriptive. Always recommend appropriate follow-up when features are concerning.`

export async function POST(request: NextRequest) {
  try {
    const { image, mimeType } = await request.json()

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      )
    }

    // Validate base64 image
    if (!image.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image format. Expected base64 data URL' },
        { status: 400 }
      )
    }

    // Extract base64 data and mime type
    const matches = image.match(/^data:image\/([a-z]+);base64,(.+)$/)
    if (!matches) {
      return NextResponse.json(
        { error: 'Invalid base64 image format' },
        { status: 400 }
      )
    }

    const imageType = matches[1]
    const base64Data = matches[2]

    // Validate image type and convert to media type
    const normalizedType = imageType.toLowerCase()
    let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

    if (normalizedType === 'jpeg' || normalizedType === 'jpg') {
      mediaType = 'image/jpeg'
    } else if (normalizedType === 'png') {
      mediaType = 'image/png'
    } else if (normalizedType === 'gif') {
      mediaType = 'image/gif'
    } else if (normalizedType === 'webp') {
      mediaType = 'image/webp'
    } else {
      return NextResponse.json(
        { error: `Unsupported image type: ${imageType}. Allowed: JPEG, PNG, GIF, WebP` },
        { status: 400 }
      )
    }

    console.log(`Analyzing ${imageType} image with Claude Vision...`)

    // Call Claude Vision API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: 'Analyze this dermatological image and provide a detailed assessment following the JSON structure specified in the system prompt.',
            },
          ],
        },
      ],
      system: DERMATOLOGY_VISION_PROMPT,
    })

    // Extract the text content
    const textContent = response.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response')
    }

    // Parse the JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response')
    }

    const analysis = JSON.parse(jsonMatch[0])

    console.log('✓ Vision analysis complete')

    return NextResponse.json({
      success: true,
      analysis,
      model: 'claude-sonnet-4-20250514',
    })
  } catch (error) {
    console.error('Error analyzing photo:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to analyze photo: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to analyze photo' },
      { status: 500 }
    )
  }
}
