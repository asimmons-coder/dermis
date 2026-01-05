'use client'

import { useState } from 'react'
import { RotateCcw, Trash2, MapPin } from 'lucide-react'

export interface LesionMarker {
  id: string
  x: number
  y: number
  view: 'front' | 'back'
  label: string
  anatomicalSite: string
}

interface BodyDiagramProps {
  markers: LesionMarker[]
  onMarkersChange: (markers: LesionMarker[]) => void
  onSiteSelect?: (site: string) => void
  selectedMarkerId?: string
  onMarkerSelect?: (id: string | null) => void
}

// Anatomical regions mapped to coordinates (percentage-based)
const ANATOMICAL_REGIONS = {
  front: [
    { name: 'Scalp', bounds: { x: [35, 65], y: [0, 8] } },
    { name: 'Forehead', bounds: { x: [35, 65], y: [8, 14] } },
    { name: 'Face', bounds: { x: [35, 65], y: [14, 22] } },
    { name: 'Neck', bounds: { x: [40, 60], y: [22, 28] } },
    { name: 'Right Shoulder', bounds: { x: [15, 35], y: [28, 35] } },
    { name: 'Left Shoulder', bounds: { x: [65, 85], y: [28, 35] } },
    { name: 'Right Upper Arm', bounds: { x: [10, 25], y: [35, 48] } },
    { name: 'Left Upper Arm', bounds: { x: [75, 90], y: [35, 48] } },
    { name: 'Chest', bounds: { x: [35, 65], y: [28, 45] } },
    { name: 'Right Forearm', bounds: { x: [5, 20], y: [48, 62] } },
    { name: 'Left Forearm', bounds: { x: [80, 95], y: [48, 62] } },
    { name: 'Abdomen', bounds: { x: [35, 65], y: [45, 58] } },
    { name: 'Right Hand', bounds: { x: [0, 12], y: [62, 72] } },
    { name: 'Left Hand', bounds: { x: [88, 100], y: [62, 72] } },
    { name: 'Groin', bounds: { x: [40, 60], y: [58, 65] } },
    { name: 'Right Thigh', bounds: { x: [30, 48], y: [65, 80] } },
    { name: 'Left Thigh', bounds: { x: [52, 70], y: [65, 80] } },
    { name: 'Right Knee', bounds: { x: [32, 48], y: [80, 86] } },
    { name: 'Left Knee', bounds: { x: [52, 68], y: [80, 86] } },
    { name: 'Right Lower Leg', bounds: { x: [32, 48], y: [86, 95] } },
    { name: 'Left Lower Leg', bounds: { x: [52, 68], y: [86, 95] } },
    { name: 'Right Foot', bounds: { x: [32, 48], y: [95, 100] } },
    { name: 'Left Foot', bounds: { x: [52, 68], y: [95, 100] } },
  ],
  back: [
    { name: 'Posterior Scalp', bounds: { x: [35, 65], y: [0, 8] } },
    { name: 'Posterior Neck', bounds: { x: [40, 60], y: [8, 18] } },
    { name: 'Right Posterior Shoulder', bounds: { x: [15, 35], y: [18, 28] } },
    { name: 'Left Posterior Shoulder', bounds: { x: [65, 85], y: [18, 28] } },
    { name: 'Upper Back', bounds: { x: [35, 65], y: [18, 38] } },
    { name: 'Right Posterior Upper Arm', bounds: { x: [10, 25], y: [28, 42] } },
    { name: 'Left Posterior Upper Arm', bounds: { x: [75, 90], y: [28, 42] } },
    { name: 'Lower Back', bounds: { x: [35, 65], y: [38, 52] } },
    { name: 'Right Posterior Forearm', bounds: { x: [5, 20], y: [42, 58] } },
    { name: 'Left Posterior Forearm', bounds: { x: [80, 95], y: [42, 58] } },
    { name: 'Buttocks', bounds: { x: [35, 65], y: [52, 65] } },
    { name: 'Right Posterior Hand', bounds: { x: [0, 12], y: [58, 68] } },
    { name: 'Left Posterior Hand', bounds: { x: [88, 100], y: [58, 68] } },
    { name: 'Right Posterior Thigh', bounds: { x: [30, 48], y: [65, 80] } },
    { name: 'Left Posterior Thigh', bounds: { x: [52, 70], y: [65, 80] } },
    { name: 'Right Posterior Knee', bounds: { x: [32, 48], y: [80, 86] } },
    { name: 'Left Posterior Knee', bounds: { x: [52, 68], y: [80, 86] } },
    { name: 'Right Calf', bounds: { x: [32, 48], y: [86, 95] } },
    { name: 'Left Calf', bounds: { x: [52, 68], y: [86, 95] } },
    { name: 'Right Heel', bounds: { x: [32, 48], y: [95, 100] } },
    { name: 'Left Heel', bounds: { x: [52, 68], y: [95, 100] } },
  ]
}

function getAnatomicalSite(x: number, y: number, view: 'front' | 'back'): string {
  const regions = ANATOMICAL_REGIONS[view]
  for (const region of regions) {
    if (
      x >= region.bounds.x[0] && x <= region.bounds.x[1] &&
      y >= region.bounds.y[0] && y <= region.bounds.y[1]
    ) {
      return region.name
    }
  }
  return view === 'front' ? 'Anterior Body' : 'Posterior Body'
}

export default function BodyDiagram({
  markers,
  onMarkersChange,
  onSiteSelect,
  selectedMarkerId,
  onMarkerSelect
}: BodyDiagramProps) {
  const [view, setView] = useState<'front' | 'back'>('front')
  const [hoveredSite, setHoveredSite] = useState<string | null>(null)

  const handleDiagramClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const anatomicalSite = getAnatomicalSite(x, y, view)
    const markerCount = markers.filter(m => m.view === view).length + 1

    const newMarker: LesionMarker = {
      id: `marker-${Date.now()}`,
      x,
      y,
      view,
      label: `${markerCount}`,
      anatomicalSite
    }

    onMarkersChange([...markers, newMarker])
    onSiteSelect?.(anatomicalSite)
    onMarkerSelect?.(newMarker.id)
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setHoveredSite(getAnatomicalSite(x, y, view))
  }

  const removeMarker = (id: string) => {
    onMarkersChange(markers.filter(m => m.id !== id))
    if (selectedMarkerId === id) {
      onMarkerSelect?.(null)
    }
  }

  const clearAllMarkers = () => {
    onMarkersChange([])
    onMarkerSelect?.(null)
  }

  const currentViewMarkers = markers.filter(m => m.view === view)

  return (
    <div className="bg-white rounded-xl border border-clinical-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-clinical-800 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-dermis-600" />
          Body Location
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-clinical-200 overflow-hidden">
            <button
              onClick={() => setView('front')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                view === 'front'
                  ? 'bg-dermis-600 text-white'
                  : 'bg-white text-clinical-600 hover:bg-clinical-50'
              }`}
            >
              Front
            </button>
            <button
              onClick={() => setView('back')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                view === 'back'
                  ? 'bg-dermis-600 text-white'
                  : 'bg-white text-clinical-600 hover:bg-clinical-50'
              }`}
            >
              Back
            </button>
          </div>
          {markers.length > 0 && (
            <button
              onClick={clearAllMarkers}
              className="p-1.5 text-clinical-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear all markers"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Hover indicator */}
      {hoveredSite && (
        <div className="text-center text-sm text-clinical-600 mb-2">
          Click to mark: <span className="font-medium text-dermis-700">{hoveredSite}</span>
        </div>
      )}

      {/* Body Diagram SVG */}
      <div className="relative flex justify-center">
        <svg
          viewBox="0 0 200 400"
          className="w-full max-w-[200px] h-auto cursor-crosshair"
          onClick={handleDiagramClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredSite(null)}
        >
          {/* Body outline - simplified anatomical shape */}
          {view === 'front' ? (
            <g fill="none" stroke="#94a3b8" strokeWidth="1.5">
              {/* Head */}
              <ellipse cx="100" cy="30" rx="25" ry="28" fill="#f8fafc" />
              {/* Neck */}
              <path d="M 90 55 L 90 70 L 110 70 L 110 55" fill="#f8fafc" />
              {/* Torso */}
              <path d="M 60 70 L 60 180 Q 70 200 100 200 Q 130 200 140 180 L 140 70 Q 125 60 100 60 Q 75 60 60 70" fill="#f8fafc" />
              {/* Left Arm */}
              <path d="M 60 70 Q 30 80 20 140 Q 15 170 10 200 Q 5 220 15 230 Q 25 220 30 200 Q 40 160 50 120 Q 55 100 60 90" fill="#f8fafc" />
              {/* Right Arm */}
              <path d="M 140 70 Q 170 80 180 140 Q 185 170 190 200 Q 195 220 185 230 Q 175 220 170 200 Q 160 160 150 120 Q 145 100 140 90" fill="#f8fafc" />
              {/* Left Leg */}
              <path d="M 70 195 Q 60 250 65 300 Q 68 350 70 390 L 85 390 Q 88 350 85 300 Q 82 250 90 200" fill="#f8fafc" />
              {/* Right Leg */}
              <path d="M 130 195 Q 140 250 135 300 Q 132 350 130 390 L 115 390 Q 112 350 115 300 Q 118 250 110 200" fill="#f8fafc" />
            </g>
          ) : (
            <g fill="none" stroke="#94a3b8" strokeWidth="1.5">
              {/* Head (back) */}
              <ellipse cx="100" cy="30" rx="25" ry="28" fill="#f8fafc" />
              {/* Neck */}
              <path d="M 90 55 L 90 70 L 110 70 L 110 55" fill="#f8fafc" />
              {/* Back torso */}
              <path d="M 60 70 L 60 180 Q 70 200 100 200 Q 130 200 140 180 L 140 70 Q 125 60 100 60 Q 75 60 60 70" fill="#f8fafc" />
              {/* Left Arm */}
              <path d="M 60 70 Q 30 80 20 140 Q 15 170 10 200 Q 5 220 15 230 Q 25 220 30 200 Q 40 160 50 120 Q 55 100 60 90" fill="#f8fafc" />
              {/* Right Arm */}
              <path d="M 140 70 Q 170 80 180 140 Q 185 170 190 200 Q 195 220 185 230 Q 175 220 170 200 Q 160 160 150 120 Q 145 100 140 90" fill="#f8fafc" />
              {/* Left Leg */}
              <path d="M 70 195 Q 60 250 65 300 Q 68 350 70 390 L 85 390 Q 88 350 85 300 Q 82 250 90 200" fill="#f8fafc" />
              {/* Right Leg */}
              <path d="M 130 195 Q 140 250 135 300 Q 132 350 130 390 L 115 390 Q 112 350 115 300 Q 118 250 110 200" fill="#f8fafc" />
              {/* Spine line (back view indicator) */}
              <line x1="100" y1="65" x2="100" y2="190" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 2" />
            </g>
          )}

          {/* Markers */}
          {currentViewMarkers.map((marker, index) => (
            <g key={marker.id}>
              <circle
                cx={marker.x * 2}
                cy={marker.y * 4}
                r="10"
                fill={selectedMarkerId === marker.id ? '#059669' : '#dc2626'}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkerSelect?.(marker.id)
                }}
              />
              <text
                x={marker.x * 2}
                y={marker.y * 4 + 4}
                textAnchor="middle"
                fill="white"
                fontSize="10"
                fontWeight="bold"
                className="pointer-events-none"
              >
                {marker.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Marker list */}
      {markers.length > 0 && (
        <div className="mt-4 border-t border-clinical-100 pt-4">
          <h4 className="text-sm font-medium text-clinical-700 mb-2">Marked Locations ({markers.length})</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {markers.map((marker) => (
              <div
                key={marker.id}
                className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                  selectedMarkerId === marker.id
                    ? 'bg-dermis-50 border border-dermis-200'
                    : 'bg-clinical-50 hover:bg-clinical-100'
                } cursor-pointer transition-colors`}
                onClick={() => {
                  setView(marker.view)
                  onMarkerSelect?.(marker.id)
                }}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full text-white text-xs flex items-center justify-center ${
                    selectedMarkerId === marker.id ? 'bg-emerald-600' : 'bg-red-600'
                  }`}>
                    {marker.label}
                  </span>
                  <span className="text-clinical-700">
                    {marker.anatomicalSite}
                    <span className="text-clinical-400 ml-1">({marker.view})</span>
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeMarker(marker.id)
                  }}
                  className="p-1 text-clinical-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-clinical-500 mt-3 text-center">
        Click on the diagram to mark lesion locations
      </p>
    </div>
  )
}
