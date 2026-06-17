import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  Activity, RefreshCw, Download, Pin, GitCompare, X, ChevronDown,
  Cpu, MemoryStick, Wifi, Radio, Network, Users, Clock, AlertTriangle,
  CheckCircle2, XCircle, TrendingUp, TrendingDown, Maximize2, Minimize2
} from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { mockDevices } from '../mock/data'

/* ═══════════════════════════════════════════════════════════════
   MOCK TIME-SERIES DATA GENERATOR
   ═══════════════════════════════════════════════════════════════ */

const DEVICE_COLORS = [
  '#003d7c', '#6a2b00', '#1a7c3b', '#7c5800', '#ba1a1a',
  '#0054a6', '#575f67', '#0061A4', '#6750A4', '#d65000',
]

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateTimeSeriesData(points, base, variance, seed) {
  const rng = seededRandom(seed)
  const data = []
  let value = base
  for (let i = 0; i < points; i++) {
    const change = (rng() - 0.5) * variance
    value = Math.max(0, Math.min(100, value + change))
    data.push(Math.round(value * 10) / 10)
  }
  return data
}

function generateTimeSeriesDataBounded(points, min, max, base, variance, seed) {
  const rng = seededRandom(seed)
  const data = []
  let value = base
  for (let i = 0; i < points; i++) {
    const change = (rng() - 0.5) * variance
    value = Math.max(min, Math.min(max, value + change))
    data.push(Math.round(value * 10) / 10)
  }
  return data
}

function generateInterfaceTraffic(points, seed) {
  const rng = seededRandom(seed)
  const tx = []
  const rx = []
  let txVal = 45000000
  let rxVal = 120000000
  for (let i = 0; i < points; i++) {
    txVal = Math.max(1000000, Math.min(200000000, txVal + (rng() - 0.48) * 10000000))
    rxVal = Math.max(5000000, Math.min(300000000, rxVal + (rng() - 0.47) * 15000000))
    tx.push(Math.round(txVal))
    rx.push(Math.round(rxVal))
  }
  return { tx, rx }
}

function generateWirelessData(points, seed) {
  const rng = seededRandom(seed)
  const rssi = []
  const ccq = []
  const noise = []
  let rssiVal = -45
  let ccqVal = 85
  let noiseVal = -95
  for (let i = 0; i < points; i++) {
    rssiVal = Math.max(-80, Math.min(-30, rssiVal + (rng() - 0.5) * 4))
    ccqVal = Math.max(40, Math.min(100, ccqVal + (rng() - 0.5) * 6))
    noiseVal = Math.max(-100, Math.min(-80, noiseVal + (rng() - 0.5) * 3))
    rssi.push(Math.round(rssiVal))
    ccq.push(Math.round(ccqVal))
    noise.push(Math.round(noiseVal))
  }
  return { rssi, ccq, noise }
}

function generateBGPSessions(points, seed) {
  const rng = seededRandom(seed)
  const data = []
  let state = 1 // 1 = established
  for (let i = 0; i < points; i++) {
    if (rng() < 0.05) state = state === 1 ? 0 : 1
    data.push(state)
  }
  return data
}

function generatePPPoESessions(points, seed) {
  const rng = seededRandom(seed)
  const data = []
  let val = 320
  for (let i = 0; i < points; i++) {
    val = Math.max(200, Math.min(500, val + Math.round((rng() - 0.48) * 30)))
    data.push(val)
  }
  return data
}

const POINTS_COUNT = 24

function generateAllMetrics(deviceId) {
  const seed = parseInt(deviceId) * 137 + 42
  return {
    cpu: generateTimeSeriesData(POINTS_COUNT, 25, 12, seed),
    ram: generateTimeSeriesData(POINTS_COUNT, 40, 8, seed + 1),
    interfaceTraffic: generateInterfaceTraffic(POINTS_COUNT, seed + 2),
    wireless: generateWirelessData(POINTS_COUNT, seed + 3),
    bgpSessions: generateBGPSessions(POINTS_COUNT, seed + 4),
    pppoeSessions: generatePPPoESessions(POINTS_COUNT, seed + 5),
  }
}

/* ═══════════════════════════════════════════════════════════════
   TIME RANGE HELPERS
   ═══════════════════════════════════════════════════════════════ */

const TIME_RANGES = [
  { label: 'Last 1h', value: '1h', minutes: 60 },
  { label: 'Last 6h', value: '6h', minutes: 360 },
  { label: 'Last 24h', value: '24h', minutes: 1440 },
  { label: 'Last 7d', value: '7d', minutes: 10080 },
  { label: 'Last 30d', value: '30d', minutes: 43200 },
  { label: 'Custom', value: 'custom', minutes: null },
]

const REFRESH_INTERVALS = [
  { label: '30s', value: '30s', ms: 30000 },
  { label: '1m', value: '1m', ms: 60000 },
  { label: '5m', value: '5m', ms: 300000 },
  { label: 'Manual', value: 'manual', ms: null },
]

function getTimeLabels(rangeValue) {
  const now = new Date()
  const labels = []
  const count = POINTS_COUNT
  let stepMs
  switch (rangeValue) {
    case '1h': stepMs = 2.5 * 60 * 1000; break
    case '6h': stepMs = 15 * 60 * 1000; break
    case '24h': stepMs = 60 * 60 * 1000; break
    case '7d': stepMs = 6 * 60 * 60 * 1000; break
    case '30d': stepMs = 24 * 60 * 60 * 1000; break
    default: stepMs = 60 * 60 * 1000; break
  }
  for (let i = count - 1; i >= 0; i--) {
    const t = new Date(now.getTime() - i * stepMs)
    if (rangeValue === '1h' || rangeValue === '6h') {
      labels.push(t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    } else if (rangeValue === '24h') {
      labels.push(t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    } else {
      labels.push(t.toLocaleDateString([], { month: 'short', day: 'numeric' }))
    }
  }
  return labels
}

/* ═══════════════════════════════════════════════════════════════
   SVG CHART COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

const CHART_MARGIN = { top: 16, right: 16, bottom: 32, left: 48 }

function formatBytes(bytes) {
  if (bytes >= 1000000000) return (bytes / 1000000000).toFixed(1) + ' Gbps'
  if (bytes >= 1000000) return (bytes / 1000000).toFixed(1) + ' Mbps'
  if (bytes >= 1000) return (bytes / 1000).toFixed(1) + ' Kbps'
  return bytes + ' bps'
}

/* ── Tooltip hook ── */
function useChartTooltip() {
  const [tooltip, setTooltip] = useState(null)
  return { tooltip, setTooltip }
}

/* ── Generic SVG Line Chart ── */
function LineChart({
  dataSets, // [{ data: number[], color: string, label: string }]
  width = 600,
  height = 250,
  yMin,
  yMax,
  yLabel,
  xLabels,
  thresholds = [], // [{ value: number, color: string, label: string }]
  tooltip,
  setTooltip,
  formatY = (v) => v.toString(),
  title,
}) {
  const m = CHART_MARGIN
  const innerW = width - m.left - m.right
  const innerH = height - m.top - m.bottom

  const allValues = dataSets.flatMap(ds => ds.data)
  const dataMin = yMin !== undefined ? yMin : Math.min(...allValues)
  const dataMax = yMax !== undefined ? yMax : Math.max(...allValues)
  const range = dataMax - dataMin || 1

  const scaleX = (i) => m.left + (i / (POINTS_COUNT - 1)) * innerW
  const scaleY = (v) => m.top + innerH - ((v - dataMin) / range) * innerH

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const chartX = x - m.left
    const idx = Math.round((chartX / innerW) * (POINTS_COUNT - 1))
    if (idx >= 0 && idx < POINTS_COUNT) {
      const values = dataSets.map(ds => ({ label: ds.label, value: ds.data[idx], color: ds.color }))
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, idx, values, xLabel: xLabels?.[idx] || '' })
    }
  }

  const handleMouseLeave = () => setTooltip(null)

  // Grid lines
  const gridLines = 5
  const gridValues = Array.from({ length: gridLines }, (_, i) => dataMin + (range * i) / (gridLines - 1))

  return (
    <div className="relative" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minHeight: `${height}px` }}>
        {/* Grid */}
        {gridValues.map((v, i) => (
          <g key={i}>
            <line x1={m.left} y1={scaleY(v)} x2={width - m.right} y2={scaleY(v)} stroke="var(--color-outline-variant, #c2c6d3)" strokeWidth="0.5" strokeDasharray="4,4" />
            <text x={m.left - 6} y={scaleY(v) + 4} textAnchor="end" className="text-[10px]" fill="var(--color-on-surface-variant, #424751)">{formatY(Math.round(v * 10) / 10)}</text>
          </g>
        ))}

        {/* X axis labels */}
        {xLabels && xLabels.map((label, i) => {
          if (i % Math.max(1, Math.floor(POINTS_COUNT / 6)) !== 0 && i !== POINTS_COUNT - 1) return null
          return (
            <text key={i} x={scaleX(i)} y={height - 6} textAnchor="middle" className="text-[9px]" fill="var(--color-on-surface-variant, #424751)">{label}</text>
          )
        })}

        {/* Y axis label */}
        {yLabel && (
          <text x={12} y={height / 2} textAnchor="middle" transform={`rotate(-90, 12, ${height / 2})`} className="text-[10px]" fill="var(--color-on-surface-variant, #424751)">{yLabel}</text>
        )}

        {/* Threshold lines */}
        {thresholds.map((t, i) => (
          <g key={`th-${i}`}>
            <line x1={m.left} y1={scaleY(t.value)} x2={width - m.right} y2={scaleY(t.value)} stroke={t.color} strokeWidth="1.5" strokeDasharray="6,3" opacity="0.7" />
            <text x={width - m.right + 2} y={scaleY(t.value) - 4} className="text-[9px]" fill={t.color}>{t.label}</text>
          </g>
        ))}

        {/* Data lines */}
        {dataSets.map((ds, di) => {
          const points = ds.data.map((v, i) => `${scaleX(i)},${scaleY(v)}`).join(' ')
          return (
            <g key={di}>
              {/* Area fill */}
              <polygon
                points={`${m.left},${scaleY(dataMin)} ${ds.data.map((v, i) => `${scaleX(i)},${scaleY(v)}`).join(' ')} ${scaleX(POINTS_COUNT - 1)},${scaleY(dataMin)}`}
                fill={ds.color}
                opacity="0.06"
              />
              {/* Line */}
              <polyline
                points={points}
                fill="none"
                stroke={ds.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Dots on hover points */}
              {ds.data.map((v, i) => (
                <circle
                  key={i}
                  cx={scaleX(i)}
                  cy={scaleY(v)}
                  r="3"
                  fill={ds.color}
                  opacity={tooltip && tooltip.idx === i ? 1 : 0}
                  className="transition-opacity"
                />
              ))}
            </g>
          )
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-50 bg-surface-container-highest border border-outline-variant rounded-lg px-3 py-2 shadow-lg text-xs"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <p className="font-medium text-on-surface mb-1">{tooltip.xLabel}</p>
          {tooltip.values.map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} />
              <span className="text-on-surface-variant">{v.label}:</span>
              <span className="font-medium text-on-surface">{formatY(v.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Stacked Area Chart (Interface Traffic) ── */
function StackedAreaChart({
  txData,
  rxData,
  width = 600,
  height = 250,
  xLabels,
  tooltip,
  setTooltip,
}) {
  const m = CHART_MARGIN
  const innerW = width - m.left - m.right
  const innerH = height - m.top - m.bottom

  const allValues = [...txData, ...rxData]
  const maxVal = Math.max(...allValues) * 1.1
  const minVal = 0
  const range = maxVal - minVal || 1

  const scaleX = (i) => m.left + (i / (POINTS_COUNT - 1)) * innerW
  const scaleY = (v) => m.top + innerH - ((v - minVal) / range) * innerH

  const gridLines = 5
  const gridValues = Array.from({ length: gridLines }, (_, i) => (maxVal * i) / (gridLines - 1))

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const chartX = x - m.left
    const idx = Math.round((chartX / innerW) * (POINTS_COUNT - 1))
    if (idx >= 0 && idx < POINTS_COUNT) {
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        idx,
        values: [
          { label: 'TX', value: txData[idx], color: '#0054a6' },
          { label: 'RX', value: rxData[idx], color: '#1a7c3b' },
        ],
        xLabel: xLabels?.[idx] || '',
      })
    }
  }

  const handleMouseLeave = () => setTooltip(null)

  const txPoints = txData.map((v, i) => `${scaleX(i)},${scaleY(v)}`).join(' ')
  const rxPoints = rxData.map((v, i) => `${scaleX(i)},${scaleY(v)}`).join(' ')

  const txAreaPoints = `${m.left},${scaleY(0)} ${txData.map((v, i) => `${scaleX(i)},${scaleY(v)}`).join(' ')} ${scaleX(POINTS_COUNT - 1)},${scaleY(0)}`
  const rxAreaPoints = `${m.left},${scaleY(0)} ${rxData.map((v, i) => `${scaleX(i)},${scaleY(v)}`).join(' ')} ${scaleX(POINTS_COUNT - 1)},${scaleY(0)}`

  return (
    <div className="relative" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minHeight: `${height}px` }}>
        {gridValues.map((v, i) => (
          <g key={i}>
            <line x1={m.left} y1={scaleY(v)} x2={width - m.right} y2={scaleY(v)} stroke="var(--color-outline-variant, #c2c6d3)" strokeWidth="0.5" strokeDasharray="4,4" />
            <text x={m.left - 6} y={scaleY(v) + 4} textAnchor="end" className="text-[10px]" fill="var(--color-on-surface-variant, #424751)">{formatBytes(Math.round(v))}</text>
          </g>
        ))}
        {xLabels && xLabels.map((label, i) => {
          if (i % Math.max(1, Math.floor(POINTS_COUNT / 6)) !== 0 && i !== POINTS_COUNT - 1) return null
          return <text key={i} x={scaleX(i)} y={height - 6} textAnchor="middle" className="text-[9px]" fill="var(--color-on-surface-variant, #424751)">{label}</text>
        })}
        <text x={12} y={height / 2} textAnchor="middle" transform={`rotate(-90, 12, ${height / 2})`} className="text-[10px]" fill="var(--color-on-surface-variant, #424751)">Throughput</text>

        <polygon points={txAreaPoints} fill="#0054a6" opacity="0.15" />
        <polygon points={rxAreaPoints} fill="#1a7c3b" opacity="0.15" />
        <polyline points={txPoints} fill="none" stroke="#0054a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={rxPoints} fill="none" stroke="#1a7c3b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {txData.map((v, i) => (
          <g key={i}>
            <circle cx={scaleX(i)} cy={scaleY(v)} r="3" fill="#0054a6" opacity={tooltip && tooltip.idx === i ? 1 : 0} />
            <circle cx={scaleX(i)} cy={scaleY(rxData[i])} r="3" fill="#1a7c3b" opacity={tooltip && tooltip.idx === i ? 1 : 0} />
          </g>
        ))}
      </svg>

      {tooltip && (
        <div className="absolute pointer-events-none z-50 bg-surface-container-highest border border-outline-variant rounded-lg px-3 py-2 shadow-lg text-xs" style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}>
          <p className="font-medium text-on-surface mb-1">{tooltip.xLabel}</p>
          {tooltip.values.map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} />
              <span className="text-on-surface-variant">{v.label}:</span>
              <span className="font-medium text-on-surface">{formatBytes(v.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Bar Chart (PPPoE Sessions) ── */
function BarChart({
  data,
  width = 600,
  height = 250,
  xLabels,
  thresholds = [],
  tooltip,
  setTooltip,
  color = '#003d7c',
  yLabel = 'Sessions',
}) {
  const m = CHART_MARGIN
  const innerW = width - m.left - m.right
  const innerH = height - m.top - m.bottom

  const maxVal = Math.max(...data) * 1.15
  const minVal = 0
  const range = maxVal - minVal || 1

  const barWidth = Math.max(4, (innerW / POINTS_COUNT) * 0.6)
  const gap = innerW / POINTS_COUNT

  const scaleY = (v) => m.top + innerH - ((v - minVal) / range) * innerH

  const gridLines = 5
  const gridValues = Array.from({ length: gridLines }, (_, i) => (maxVal * i) / (gridLines - 1))

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const chartX = x - m.left
    const idx = Math.round(chartX / gap)
    if (idx >= 0 && idx < POINTS_COUNT) {
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        idx,
        values: [{ label: yLabel, value: data[idx], color }],
        xLabel: xLabels?.[idx] || '',
      })
    }
  }

  const handleMouseLeave = () => setTooltip(null)

  return (
    <div className="relative" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minHeight: `${height}px` }}>
        {gridValues.map((v, i) => (
          <g key={i}>
            <line x1={m.left} y1={scaleY(v)} x2={width - m.right} y2={scaleY(v)} stroke="var(--color-outline-variant, #c2c6d3)" strokeWidth="0.5" strokeDasharray="4,4" />
            <text x={m.left - 6} y={scaleY(v) + 4} textAnchor="end" className="text-[10px]" fill="var(--color-on-surface-variant, #424751)">{Math.round(v)}</text>
          </g>
        ))}
        {xLabels && xLabels.map((label, i) => {
          if (i % Math.max(1, Math.floor(POINTS_COUNT / 6)) !== 0 && i !== POINTS_COUNT - 1) return null
          return <text key={i} x={m.left + i * gap + gap / 2} y={height - 6} textAnchor="middle" className="text-[9px]" fill="var(--color-on-surface-variant, #424751)">{label}</text>
        })}
        {yLabel && <text x={12} y={height / 2} textAnchor="middle" transform={`rotate(-90, 12, ${height / 2})`} className="text-[10px]" fill="var(--color-on-surface-variant, #424751)">{yLabel}</text>}

        {thresholds.map((t, i) => (
          <g key={`th-${i}`}>
            <line x1={m.left} y1={scaleY(t.value)} x2={width - m.right} y2={scaleY(t.value)} stroke={t.color} strokeWidth="1.5" strokeDasharray="6,3" opacity="0.7" />
            <text x={width - m.right + 2} y={scaleY(t.value) - 4} className="text-[9px]" fill={t.color}>{t.label}</text>
          </g>
        ))}

        {data.map((v, i) => {
          const x = m.left + i * gap + (gap - barWidth) / 2
          const y = scaleY(v)
          const h = scaleY(0) - y
          const isHighlighted = tooltip && tooltip.idx === i
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={h}
              fill={color}
              opacity={isHighlighted ? 1 : 0.75}
              rx="2"
              className="transition-opacity"
            />
          )
        })}
      </svg>

      {tooltip && (
        <div className="absolute pointer-events-none z-50 bg-surface-container-highest border border-outline-variant rounded-lg px-3 py-2 shadow-lg text-xs" style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}>
          <p className="font-medium text-on-surface mb-1">{tooltip.xLabel}</p>
          {tooltip.values.map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} />
              <span className="text-on-surface-variant">{v.label}:</span>
              <span className="font-medium text-on-surface">{v.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── BGP Session State Chart ── */
function BGPStateChart({ data, width = 600, height = 120, xLabels }) {
  const m = { top: 12, right: 16, bottom: 28, left: 48 }
  const innerW = width - m.left - m.right
  const innerH = height - m.top - m.bottom
  const barWidth = Math.max(4, (innerW / POINTS_COUNT) * 0.6)
  const gap = innerW / POINTS_COUNT

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minHeight: `${height}px` }}>
      {/* Labels */}
      <text x={m.left - 6} y={m.top + innerH * 0.25 + 4} textAnchor="end" className="text-[9px]" fill="var(--color-on-surface-variant, #424751)">Down</text>
      <text x={m.left - 6} y={m.top + innerH * 0.75 + 4} textAnchor="end" className="text-[9px]" fill="var(--color-on-surface-variant, #424751)">Established</text>
      <line x1={m.left} y1={m.top + innerH / 2} x2={width - m.right} y2={m.top + innerH / 2} stroke="var(--color-outline-variant, #c2c6d3)" strokeWidth="0.5" strokeDasharray="4,4" />

      {data.map((v, i) => {
        const x = m.left + i * gap + (gap - barWidth) / 2
        const y = v === 1 ? m.top : m.top + innerH / 2
        const h = innerH / 2
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={h}
            fill={v === 1 ? '#1a7c3b' : '#ba1a1a'}
            opacity="0.8"
            rx="1"
          />
        )
      })}

      {xLabels && xLabels.map((label, i) => {
        if (i % Math.max(1, Math.floor(POINTS_COUNT / 6)) !== 0 && i !== POINTS_COUNT - 1) return null
        return <text key={i} x={m.left + i * gap + gap / 2} y={height - 6} textAnchor="middle" className="text-[9px]" fill="var(--color-on-surface-variant, #424751)">{label}</text>
      })}
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MULTI-SELECT DEVICE DROPDOWN
   ═══════════════════════════════════════════════════════════════ */

function DeviceSelector({ devices, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  const label = selected.length === 0
    ? 'Select devices...'
    : selected.length === 1
      ? devices.find(d => d.id === selected[0])?.hostname || '1 device'
      : `${selected.length} devices selected`

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm text-on-surface hover:bg-surface-container-low transition-colors min-w-[200px]"
      >
        <span className="flex-1 text-left truncate">{label}</span>
        <ChevronDown size={16} className={`text-on-surface-variant transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-72 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-outline-variant">
            <p className="text-xs font-medium text-on-surface-variant px-2">Select devices to monitor</p>
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {devices.map(device => {
              const isSelected = selected.includes(device.id)
              return (
                <button
                  key={device.id}
                  onClick={() => toggle(device.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-surface-container'}`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-outline-variant'}`}>
                    {isSelected && <CheckCircle2 size={12} className="text-on-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{device.hostname}</p>
                    <p className="text-xs text-on-surface-variant">{device.ip} · {device.site}</p>
                  </div>
                  <Badge variant={device.status === 'online' ? 'online' : device.status === 'warning' ? 'warning' : 'offline'}>
                    {device.status}
                  </Badge>
                </button>
              )
            })}
          </div>
          {selected.length > 0 && (
            <div className="p-2 border-t border-outline-variant flex justify-between">
              <button onClick={() => onChange([])} className="text-xs text-on-surface-variant hover:text-on-surface transition-colors">
                Clear all
              </button>
              <span className="text-xs text-on-surface-variant">{selected.length} selected</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   CHART CARD WRAPPER
   ═══════════════════════════════════════════════════════════════ */

function ChartCard({ title, icon: Icon, children, onExport, onPin, isPinned, className = '', badge }) {
  const [expanded, setExpanded] = useState(false)

  const handleExport = () => {
    const svgEl = document.querySelector(`[data-chart="${title}"] svg`)
    if (!svgEl) return
    const svgData = new XMLSerializer().serializeToString(svgEl)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    canvas.width = 1200
    canvas.height = 500
    img.onload = () => {
      ctx.fillStyle = '#f9f9ff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const link = document.createElement('a')
      link.download = `mikrowize-${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    if (onExport) onExport()
  }

  return (
    <Card className={`${className} ${expanded ? 'fixed inset-4 z-[100] overflow-auto' : ''}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          {Icon && <Icon size={18} className="text-primary" />}
          <CardTitle className="mb-0">{title}</CardTitle>
          {badge}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onPin}
            className={`p-1.5 rounded-lg transition-colors ${isPinned ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}
            title={isPinned ? 'Unpin from dashboard' : 'Pin to dashboard'}
          >
            <Pin size={14} className={isPinned ? 'fill-current' : ''} />
          </button>
          <button
            onClick={handleExport}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
            title="Export as PNG"
          >
            <Download size={14} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
            title={expanded ? 'Minimize' : 'Expand'}
          >
            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </CardHeader>
      <div data-chart={title}>
        {children}
      </div>
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════════════
   LEGEND COMPONENT
   ═══════════════════════════════════════════════════════════════ */

function ChartLegend({ items }) {
  return (
    <div className="flex flex-wrap gap-4 mt-3 px-1">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-xs text-on-surface-variant">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN LIVE METRICS PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function LiveMetrics() {
  const [selectedDevices, setSelectedDevices] = useState(['1', '2'])
  const [timeRange, setTimeRange] = useState('1h')
  const [refreshInterval, setRefreshInterval] = useState('30s')
  const [compareMode, setCompareMode] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [pinnedCharts, setPinnedCharts] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)

  // Tooltip states per chart
  const cpuTooltip = useChartTooltip()
  const ramTooltip = useChartTooltip()
  const trafficTooltip = useChartTooltip()
  const wirelessTooltip = useChartTooltip()
  const pppoeTooltip = useChartTooltip()

  // Generate metrics for selected devices
  const deviceMetrics = useMemo(() => {
    const map = {}
    selectedDevices.forEach(id => {
      map[id] = generateAllMetrics(id)
    })
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDevices, refreshKey])

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval === 'manual') return
    const ms = REFRESH_INTERVALS.find(r => r.value === refreshInterval)?.ms
    if (!ms) return
    const timer = setInterval(() => {
      setLastRefresh(new Date())
      setRefreshKey(k => k + 1)
    }, ms)
    return () => clearInterval(timer)
  }, [refreshInterval])

  const handleManualRefresh = () => {
    setLastRefresh(new Date())
    setRefreshKey(k => k + 1)
  }

  const togglePin = (chartTitle) => {
    setPinnedCharts(prev =>
      prev.includes(chartTitle)
        ? prev.filter(c => c !== chartTitle)
        : [...prev, chartTitle]
    )
  }

  const xLabels = useMemo(() => getTimeLabels(timeRange), [timeRange])

  // Build data sets for compare mode
  const cpuDataSets = useMemo(() => {
    return selectedDevices.map((id, idx) => ({
      data: deviceMetrics[id]?.cpu || [],
      color: DEVICE_COLORS[idx % DEVICE_COLORS.length],
      label: mockDevices.find(d => d.id === id)?.hostname || `Device ${id}`,
    }))
  }, [selectedDevices, deviceMetrics])

  const ramDataSets = useMemo(() => {
    return selectedDevices.map((id, idx) => ({
      data: deviceMetrics[id]?.ram || [],
      color: DEVICE_COLORS[idx % DEVICE_COLORS.length],
      label: mockDevices.find(d => d.id === id)?.hostname || `Device ${id}`,
    }))
  }, [selectedDevices, deviceMetrics])

  const wirelessDataSets = useMemo(() => {
    return selectedDevices.map((id, idx) => ({
      data: deviceMetrics[id]?.wireless?.rssi || [],
      color: DEVICE_COLORS[idx % DEVICE_COLORS.length],
      label: mockDevices.find(d => d.id === id)?.hostname || `Device ${id}`,
    }))
  }, [selectedDevices, deviceMetrics])

  const ccqDataSets = useMemo(() => {
    return selectedDevices.map((id, idx) => ({
      data: deviceMetrics[id]?.wireless?.ccq || [],
      color: DEVICE_COLORS[idx % DEVICE_COLORS.length],
      label: mockDevices.find(d => d.id === id)?.hostname || `Device ${id}`,
    }))
  }, [selectedDevices, deviceMetrics])

  // Summary stats
  const latestCpu = selectedDevices.length > 0
    ? Math.round(selectedDevices.reduce((sum, id) => {
        const cpu = deviceMetrics[id]?.cpu
        return sum + (cpu ? cpu[cpu.length - 1] : 0)
      }, 0) / selectedDevices.length)
    : 0

  const latestRam = selectedDevices.length > 0
    ? Math.round(selectedDevices.reduce((sum, id) => {
        const ram = deviceMetrics[id]?.ram
        return sum + (ram ? ram[ram.length - 1] : 0)
      }, 0) / selectedDevices.length)
    : 0

  const totalPppoe = selectedDevices.reduce((sum, id) => {
    const pppoe = deviceMetrics[id]?.pppoeSessions
    return sum + (pppoe ? pppoe[pppoe.length - 1] : 0)
  }, 0)

  const bgpEstablished = selectedDevices.reduce((sum, id) => {
    const bgp = deviceMetrics[id]?.bgpSessions
    return sum + (bgp ? bgp[bgp.length - 1] : 0)
  }, 0)

  const avgRssi = selectedDevices.length > 0
    ? Math.round(selectedDevices.reduce((sum, id) => {
        const rssi = deviceMetrics[id]?.wireless?.rssi
        return sum + (rssi ? rssi[rssi.length - 1] : 0)
      }, 0) / selectedDevices.length)
    : 0

  const avgCcq = selectedDevices.length > 0
    ? Math.round(selectedDevices.reduce((sum, id) => {
        const ccq = deviceMetrics[id]?.wireless?.ccq
        return sum + (ccq ? ccq[ccq.length - 1] : 0)
      }, 0) / selectedDevices.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <Activity size={24} className="text-primary" />
            Live Metrics
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Real-time device monitoring and performance charts
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <Clock size={14} />
          <span>Last refresh: {lastRefresh.toLocaleTimeString()}</span>
          <button
            onClick={handleManualRefresh}
            className="p-1.5 rounded-lg hover:bg-surface-container transition-colors"
            title="Refresh now"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Device Selector */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Devices</label>
            <DeviceSelector
              devices={mockDevices}
              selected={selectedDevices}
              onChange={setSelectedDevices}
            />
          </div>

          {/* Time Range */}
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Time Range</label>
            <div className="flex gap-1">
              {TIME_RANGES.map(tr => (
                <button
                  key={tr.value}
                  onClick={() => setTimeRange(tr.value)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    timeRange === tr.value
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {tr.label}
                </button>
              ))}
            </div>
          </div>

          {/* Refresh Interval */}
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Auto-Refresh</label>
            <div className="flex gap-1">
              {REFRESH_INTERVALS.map(ri => (
                <button
                  key={ri.value}
                  onClick={() => setRefreshInterval(ri.value)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    refreshInterval === ri.value
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {ri.label}
                </button>
              ))}
            </div>
          </div>

          {/* Compare Mode Toggle */}
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Compare</label>
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                compareMode
                  ? 'bg-primary-container text-on-primary-container'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <GitCompare size={14} />
              {compareMode ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        {/* Selected device chips */}
        {selectedDevices.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-outline-variant">
            {selectedDevices.map((id, idx) => {
              const device = mockDevices.find(d => d.id === id)
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-container-high"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DEVICE_COLORS[idx % DEVICE_COLORS.length] }} />
                  <span className="text-on-surface">{device?.hostname}</span>
                  <button
                    onClick={() => setSelectedDevices(selectedDevices.filter(s => s !== id))}
                    className="text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              )
            })}
          </div>
        )}
      </Card>

      {/* No devices selected */}
      {selectedDevices.length === 0 && (
        <Card className="py-12 text-center">
          <Activity size={48} className="text-outline mx-auto mb-4" />
          <p className="text-lg font-medium text-on-surface">No devices selected</p>
          <p className="text-sm text-on-surface-variant mt-1">Select one or more devices above to view live metrics</p>
        </Card>
      )}

      {/* Summary Stats */}
      {selectedDevices.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            title="Avg CPU"
            value={`${latestCpu}%`}
            icon={Cpu}
            trend={latestCpu > 70 ? 'down' : 'up'}
            trendValue={latestCpu > 70 ? 'High load' : 'Normal'}
          />
          <StatCard
            title="Avg RAM"
            value={`${latestRam}%`}
            icon={MemoryStick}
            trend={latestRam > 80 ? 'down' : 'up'}
            trendValue={latestRam > 80 ? 'High usage' : 'Normal'}
          />
          <StatCard
            title="PPPoE Sessions"
            value={totalPppoe}
            icon={Users}
            trend={totalPppoe > 450 ? 'down' : 'neutral'}
            trendValue={totalPppoe > 450 ? 'Near limit' : 'Healthy'}
          />
          <StatCard
            title="BGP State"
            value={bgpEstablished > 0 ? 'Up' : 'Down'}
            icon={Network}
            trend={bgpEstablished > 0 ? 'up' : 'down'}
            trendValue={`${bgpEstablished}/${selectedDevices.length} established`}
          />
          <StatCard
            title="Avg RSSI"
            value={`${avgRssi} dBm`}
            icon={Wifi}
            trend={avgRssi > -50 ? 'up' : avgRssi > -70 ? 'neutral' : 'down'}
            trendValue={avgRssi > -50 ? 'Excellent' : avgRssi > -70 ? 'Good' : 'Weak'}
          />
          <StatCard
            title="Avg CCQ"
            value={`${avgCcq}%`}
            icon={Radio}
            trend={avgCcq > 70 ? 'up' : 'down'}
            trendValue={avgCcq > 70 ? 'Good' : 'Degraded'}
          />
        </div>
      )}

      {/* Charts Grid */}
      {selectedDevices.length > 0 && (
        <>
          {/* Row 1: CPU + RAM */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CPU Chart */}
            <ChartCard
              title="CPU Usage"
              icon={Cpu}
              onPin={() => togglePin('cpu')}
              isPinned={pinnedCharts.includes('cpu')}
              badge={
                compareMode && selectedDevices.length > 1 ? (
                  <Badge variant="info">Compare</Badge>
                ) : null
              }
            >
              <LineChart
                dataSets={cpuDataSets}
                yMin={0}
                yMax={100}
                yLabel="%"
                xLabels={xLabels}
                thresholds={[
                  { value: 75, color: '#7c5800', label: 'Warn' },
                  { value: 90, color: '#ba1a1a', label: 'Crit' },
                ]}
                tooltip={cpuTooltip.tooltip}
                setTooltip={cpuTooltip.setTooltip}
                formatY={(v) => `${v}%`}
              />
              <ChartLegend items={cpuDataSets.map(ds => ({ label: ds.label, color: ds.color }))} />
            </ChartCard>

            {/* RAM Chart */}
            <ChartCard
              title="RAM Usage"
              icon={MemoryStick}
              onPin={() => togglePin('ram')}
              isPinned={pinnedCharts.includes('ram')}
              badge={
                compareMode && selectedDevices.length > 1 ? (
                  <Badge variant="info">Compare</Badge>
                ) : null
              }
            >
              <LineChart
                dataSets={ramDataSets}
                yMin={0}
                yMax={100}
                yLabel="%"
                xLabels={xLabels}
                thresholds={[
                  { value: 80, color: '#7c5800', label: 'Warn' },
                  { value: 95, color: '#ba1a1a', label: 'Crit' },
                ]}
                tooltip={ramTooltip.tooltip}
                setTooltip={ramTooltip.setTooltip}
                formatY={(v) => `${v}%`}
              />
              <ChartLegend items={ramDataSets.map(ds => ({ label: ds.label, color: ds.color }))} />
            </ChartCard>
          </div>

          {/* Row 2: Interface Traffic (full width) */}
          <ChartCard
            title="Interface Traffic"
            icon={Network}
            onPin={() => togglePin('traffic')}
            isPinned={pinnedCharts.includes('traffic')}
          >
            {selectedDevices.length === 1 ? (
              <StackedAreaChart
                txData={deviceMetrics[selectedDevices[0]]?.interfaceTraffic?.tx || []}
                rxData={deviceMetrics[selectedDevices[0]]?.interfaceTraffic?.rx || []}
                xLabels={xLabels}
                tooltip={trafficTooltip.tooltip}
                setTooltip={trafficTooltip.setTooltip}
              />
            ) : (
              // In compare mode, show TX for each device
              <LineChart
                dataSets={selectedDevices.map((id, idx) => ({
                  data: deviceMetrics[id]?.interfaceTraffic?.tx.map(v => v / 1000000) || [],
                  color: DEVICE_COLORS[idx % DEVICE_COLORS.length],
                  label: `${mockDevices.find(d => d.id === id)?.hostname} TX`,
                }))}
                yMin={0}
                yLabel="Mbps"
                xLabels={xLabels}
                tooltip={trafficTooltip.tooltip}
                setTooltip={trafficTooltip.setTooltip}
                formatY={(v) => `${v.toFixed(1)} Mbps`}
              />
            )}
            <ChartLegend items={[
              { label: 'TX', color: '#0054a6' },
              { label: 'RX', color: '#1a7c3b' },
            ]} />
          </ChartCard>

          {/* Row 3: Wireless + BGP */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Wireless Metrics */}
            <ChartCard
              title="Wireless Metrics"
              icon={Wifi}
              onPin={() => togglePin('wireless')}
              isPinned={pinnedCharts.includes('wireless')}
              badge={
                compareMode && selectedDevices.length > 1 ? (
                  <Badge variant="info">Compare</Badge>
                ) : null
              }
            >
              <div className="space-y-4">
                {/* RSSI */}
                <div>
                  <p className="text-xs font-medium text-on-surface-variant mb-2">RSSI (dBm)</p>
                  <LineChart
                    dataSets={compareMode ? wirelessDataSets : [{
                      data: deviceMetrics[selectedDevices[0]]?.wireless?.rssi || [],
                      color: '#003d7c',
                      label: 'RSSI',
                    }]}
                    yMin={-90}
                    yMax={-20}
                    yLabel="dBm"
                    xLabels={xLabels}
                    thresholds={[
                      { value: -70, color: '#7c5800', label: 'Fair' },
                      { value: -80, color: '#ba1a1a', label: 'Poor' },
                    ]}
                    tooltip={wirelessTooltip.tooltip}
                    setTooltip={wirelessTooltip.setTooltip}
                    formatY={(v) => `${v} dBm`}
                  />
                </div>
                {/* CCQ */}
                <div>
                  <p className="text-xs font-medium text-on-surface-variant mb-2">CCQ (%)</p>
                  <LineChart
                    dataSets={compareMode ? ccqDataSets : [{
                      data: deviceMetrics[selectedDevices[0]]?.wireless?.ccq || [],
                      color: '#1a7c3b',
                      label: 'CCQ',
                    }]}
                    yMin={0}
                    yMax={100}
                    yLabel="%"
                    xLabels={xLabels}
                    thresholds={[
                      { value: 50, color: '#7c5800', label: 'Low' },
                    ]}
                    tooltip={wirelessTooltip.tooltip}
                    setTooltip={wirelessTooltip.setTooltip}
                    formatY={(v) => `${v}%`}
                  />
                </div>
              </div>
              <ChartLegend items={[
                { label: 'RSSI', color: '#003d7c' },
                { label: 'CCQ', color: '#1a7c3b' },
              ]} />
            </ChartCard>

            {/* BGP Session State */}
            <ChartCard
              title="BGP Session State"
              icon={Network}
              onPin={() => togglePin('bgp')}
              isPinned={pinnedCharts.includes('bgp')}
            >
              <div className="space-y-3">
                {selectedDevices.map((id, idx) => {
                  const device = mockDevices.find(d => d.id === id)
                  const bgpData = deviceMetrics[id]?.bgpSessions || []
                  const currentState = bgpData[bgpData.length - 1]
                  return (
                    <div key={id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DEVICE_COLORS[idx % DEVICE_COLORS.length] }} />
                          <span className="text-xs font-medium text-on-surface">{device?.hostname}</span>
                        </div>
                        <Badge variant={currentState === 1 ? 'online' : 'offline'}>
                          {currentState === 1 ? 'Established' : 'Down'}
                        </Badge>
                      </div>
                      <BGPStateChart
                        data={bgpData}
                        xLabels={idx === selectedDevices.length - 1 ? xLabels : undefined}
                      />
                    </div>
                  )
                })}
              </div>
              <ChartLegend items={[
                { label: 'Established', color: '#1a7c3b' },
                { label: 'Down', color: '#ba1a1a' },
              ]} />
            </ChartCard>
          </div>

          {/* Row 4: PPPoE Sessions */}
          <ChartCard
            title="PPPoE Sessions"
            icon={Users}
            onPin={() => togglePin('pppoe')}
            isPinned={pinnedCharts.includes('pppoe')}
            badge={
              compareMode && selectedDevices.length > 1 ? (
                <Badge variant="info">Compare</Badge>
              ) : null
            }
          >
            {compareMode && selectedDevices.length > 1 ? (
              <LineChart
                dataSets={selectedDevices.map((id, idx) => ({
                  data: deviceMetrics[id]?.pppoeSessions || [],
                  color: DEVICE_COLORS[idx % DEVICE_COLORS.length],
                  label: mockDevices.find(d => d.id === id)?.hostname || `Device ${id}`,
                }))}
                yMin={0}
                yLabel="Sessions"
                xLabels={xLabels}
                thresholds={[
                  { value: 450, color: '#7c5800', label: 'Warn' },
                  { value: 480, color: '#ba1a1a', label: 'Limit' },
                ]}
                tooltip={pppoeTooltip.tooltip}
                setTooltip={pppoeTooltip.setTooltip}
              />
            ) : (
              <BarChart
                data={deviceMetrics[selectedDevices[0]]?.pppoeSessions || []}
                xLabels={xLabels}
                thresholds={[
                  { value: 450, color: '#7c5800', label: 'Warn (450)' },
                  { value: 480, color: '#ba1a1a', label: 'Limit (480)' },
                ]}
                tooltip={pppoeTooltip.tooltip}
                setTooltip={pppoeTooltip.setTooltip}
                color="#003d7c"
              />
            )}
            <ChartLegend items={compareMode
              ? selectedDevices.map((id, idx) => ({
                  label: mockDevices.find(d => d.id === id)?.hostname || `Device ${id}`,
                  color: DEVICE_COLORS[idx % DEVICE_COLORS.length],
                }))
              : [{ label: 'Active Sessions', color: '#003d7c' }]
            } />
          </ChartCard>
        </>
      )}

      {/* Pinned Charts Summary */}
      {pinnedCharts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Pin size={16} className="text-primary" />
              <CardTitle className="mb-0">Pinned to Dashboard</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setPinnedCharts([])}>
              Clear all
            </Button>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            {pinnedCharts.map(chart => (
              <span key={chart} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                <Pin size={10} className="fill-current" />
                {chart.toUpperCase()}
                <button
                  onClick={() => setPinnedCharts(prev => prev.filter(c => c !== chart))}
                  className="ml-1 hover:text-on-primary transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
