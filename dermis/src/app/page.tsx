import Link from 'next/link'
import AppHeader from '@/components/AppHeader'
import {
  Stethoscope,
  Camera,
  Sparkles,
  FileText,
  Users,
  Calendar,
  ArrowRight,
  Shield,
  Zap,
  Brain
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-clinical-50 via-white to-dermis-50/30">
      <AppHeader />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-dermis-100 text-dermis-700 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI-First EMR for Dermatology
          </div>
          <h1 className="text-5xl font-display font-bold text-clinical-900 mb-6 leading-tight">
            Clinical documentation that{' '}
            <span className="text-dermis-600">thinks</span> like you do
          </h1>
          <p className="text-xl text-clinical-600 mb-8 leading-relaxed">
            Built for dermatologists who want to spend more time with patients and less time typing. 
            AI-powered notes, intelligent image tracking, and streamlined cosmetic workflows.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/dashboard" className="btn-primary text-base px-6 py-3">
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link href="/demo" className="btn-secondary text-base px-6 py-3">
              Try the Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {/* AI Clinical Notes */}
          <div className="card p-6 hover:shadow-clinical-md transition-shadow group">
            <div className="w-12 h-12 rounded-xl bg-dermis-100 flex items-center justify-center mb-4 group-hover:bg-dermis-200 transition-colors">
              <Brain className="w-6 h-6 text-dermis-600" />
            </div>
            <h3 className="text-lg font-display font-semibold text-clinical-800 mb-2">
              AI Clinical Notes
            </h3>
            <p className="text-clinical-600 text-sm mb-4">
              Speak or type brief observations. Claude expands them into complete SOAP notes with 
              appropriate dermatology terminology and ICD-10/CPT suggestions.
            </p>
            <Link href="/demo" className="text-dermis-600 text-sm font-medium inline-flex items-center gap-1 hover:gap-2 transition-all">
              Try it now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Image Intelligence */}
          <div className="card p-6 hover:shadow-clinical-md transition-shadow group">
            <div className="w-12 h-12 rounded-xl bg-accent-sky/10 flex items-center justify-center mb-4 group-hover:bg-accent-sky/20 transition-colors">
              <Camera className="w-6 h-6 text-accent-sky" />
            </div>
            <h3 className="text-lg font-display font-semibold text-clinical-800 mb-2">
              Derm Image Intelligence
            </h3>
            <p className="text-clinical-600 text-sm mb-4">
              Upload clinical photos with body location tagging. Claude Vision analyzes lesions
              using ABCDE criteria and provides clinical recommendations.
            </p>
            <Link href="/patients" className="text-accent-sky text-sm font-medium inline-flex items-center gap-1 hover:gap-2 transition-all">
              View patient photos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Cosmetic Flow */}
          <div className="card p-6 hover:shadow-clinical-md transition-shadow group">
            <div className="w-12 h-12 rounded-xl bg-accent-violet/10 flex items-center justify-center mb-4 group-hover:bg-accent-violet/20 transition-colors">
              <Sparkles className="w-6 h-6 text-accent-violet" />
            </div>
            <h3 className="text-lg font-display font-semibold text-clinical-800 mb-2">
              Cosmetic Consult Flow
            </h3>
            <p className="text-clinical-600 text-sm mb-4">
              Before/after photo tracking, treatment planning with pricing calculator,
              and comprehensive cosmetic procedure documentation.
            </p>
            <Link href="/patients" className="text-accent-violet text-sm font-medium inline-flex items-center gap-1 hover:gap-2 transition-all">
              Start consultation <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Dermis */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="card p-8 bg-gradient-to-br from-clinical-800 to-clinical-900 text-white">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-display font-bold mb-4">
                Built for the modern derm practice
              </h2>
              <p className="text-clinical-300 mb-6">
                Dermis understands that dermatology is unique—spanning medical, cosmetic, and 
                pathology workflows. We're building an EMR that handles all three seamlessly.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-dermis-500/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-dermis-400" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">10x faster documentation</h4>
                    <p className="text-sm text-clinical-400">AI expands your quick notes into complete clinical documentation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-dermis-500/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-dermis-400" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">HIPAA-ready architecture</h4>
                    <p className="text-sm text-clinical-400">Multi-tenant security with row-level access controls</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-dermis-500/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-dermis-400" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Multi-practice ready</h4>
                    <p className="text-sm text-clinical-400">Scale from one location to many with the same platform</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-clinical-700/50 rounded-xl p-6 font-mono text-sm">
              <div className="text-clinical-400 mb-2">// Provider quick input</div>
              <div className="text-dermis-300 mb-4">
                "43F, new lesion R forearm, irregular borders, 6mm, dark brown, 3 months"
              </div>
              <div className="text-clinical-400 mb-2">// AI-generated SOAP</div>
              <div className="text-clinical-100 whitespace-pre-wrap text-xs leading-relaxed">
{`SUBJECTIVE: 43-year-old female presents 
for evaluation of a new pigmented lesion 
on the right forearm, first noticed 
approximately 3 months ago...

OBJECTIVE: Right volar forearm: 6mm 
pigmented macule with irregular borders, 
variegated brown coloration...`}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-clinical-100 bg-white mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-dermis-100 flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-dermis-600" />
              </div>
              <span className="text-sm text-clinical-500">
                © 2025 Novice Group Dermatology. Powered by Dermis.
              </span>
            </div>
            <div className="text-sm text-clinical-500">
              Bloomfield, MI
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
