import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ZoomIn, ZoomOut, Maximize2, Download, Filter, X, Layers, ChevronDown, ChevronUp } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { mockDevices } from '../mock/data'

// ─── Constants ───────────────────────────────────────────────────────────────

const NODE_RADIUS = 28
const NODE_HIT_PADDING = 8
const MINIMAP_W = 180
const MINIMAP_H = 120
const MINIMAP_PAD = 16
const CANVAS_BG = '#f9f9ff'
const GRID_COLOR = '#e1e2ea'
const EDGE_COLOR = '#c2c6d3'
const EDGE_HIGHLIGHT = '#0054a6'
const FONT = '11px Inter, system-ui, sans-serif'
const FONT_BOLD = 'bold 11px Inter, system-ui, sans-serif'
const FONT_LABEL = '10px Inter, system-ui, sans-serif'
const FONT_TOOLTIP = '12px Inter, system-ui, sans-serif'
const FONT_TOOLTIP_BOLD = 'bold 12px Inter, system-ui, sans-serif'

const STATUS_COLORS = {
  online: { fill: '#1a7c3b', stroke: '#0f5c2a', label: 'Online' },
  offline: { fill: '#ba1a1a', stroke: '#93000a', label: 'Offline' },
  warning: { fill: '#7c5800', stroke: '#5c4200', label: 'Warning' },
}

const DEVICE_TYPE_ICONS = {
  core: '★',
  branch: '◆',
  ap: '📡',
  switch: '⬡',
  pppoe: '⚡',
}

// ─── Layout Engine ───────────────────────────────────────────────────────────

function computeLayout(devices, canvasW, canvasH) {
  if (!devices.length) return new Map()

  const cx = canvasW / 2
  const cy = canvasH / 2
  const positions = new Map()

  // Find core device (tag 'core' or first online router)
  const coreIdx = devices.findIndex(d => d.tags?.includes('core'))
  const ordered = [...devices]
  if (coreIdx > 0) {
    const [core] = ordered.splice(coreIdx, 1)
    ordered.unshift(core)
  }

  ordered.forEach((device, i) => {
    if (i === 0) {
      positions.set(device.id, { x: cx, y: cy })
    } else {
      const angle = ((i - 1) / (ordered.length - 1)) * Math.PI * 2 - Math.PI / 2
      const radius = Math.min(canvasW, canvasH) * 0.32
      positions.set(device.id, {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      })
    }
  })

  return positions
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDeviceType(device) {
  if (device.tags?.includes('core')) return 'core'
  if (device.tags?.includes('branch')) return 'branch'
  if (device.tags?.includes('ap')) return 'ap'
  if (device.tags?.includes('switch')) return 'switch'
  if (device.tags?.includes('pppoe')) return 'pppoe'
  return 'core'
}

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TopologyMap() {
  const canvasRef = useRef(null)
  const minimapRef = useRef(null)
  const navigate = useNavigate()
  const animFrameRef = useRef(null)
  const dragRef = useRef({ dragging: false, nodeDragging: false, lastX: 0, lastY: 0, draggedNode: null })

  // View state
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)

  // Interaction state
  const [hoveredNode, setHoveredNode] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showLayerPanel, setShowLayerPanel] = useState(false)

  // Filters
  const [filterSite, setFilterSite] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Layer toggles
  const [showL2, setShowL2] = useState(true)
  const [showL3, setShowL3] = useState(true)
  const [showBGP, setShowBGP] = useState(true)

  // Canvas dimensions
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 })
  const containerRef = useRef(null)

  // ─── Derived data ─────────────────────────────────────────────────────────

  const sites = useMemo(() => {
    const s = new Set(mockDevices.map(d => d.site))
    return ['all', ...Array.from(s)]
  }, [])

  const filteredDevices = useMemo(() => {
    let devices = mockDevices

    if (filterSite !== 'all') devices = devices.filter(d => d.site === filterSite)
    if (filterType !== 'all') devices = devices.filter(d => getDeviceType(d) === filterType)
    if (filterStatus !== 'all') devices = devices.filter(d => d.status === filterStatus)

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      devices = devices.filter(d =>
        d.hostname.toLowerCase().includes(q) ||
        d.ip.toLowerCase().includes(q) ||
        d.model.toLowerCase().includes(q)
      )
    }

    return devices
  }, [filterSite, filterType, filterStatus, searchQuery])

  const devicePositions = useMemo(
    () => computeLayout(filteredDevices, canvasSize.w, canvasSize.h),
    [filteredDevices, canvasSize.w, canvasSize.h]
  )

  // Core device for star topology edges
  const coreDevice = useMemo(() => {
    return filteredDevices.find(d => d.tags?.includes('core')) || filteredDevices[0]
  }, [filteredDevices])

  // ─── Resize observer ──────────────────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setCanvasSize({ w: Math.floor(width), h: Math.floor(height) })
      }
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // ─── Coordinate transforms ────────────────────────────────────────────────

  const screenToWorld = useCallback((sx, sy) => {
    return {
      x: (sx - panX) / zoom,
      y: (sy - panY) / zoom,
    }
  }, [zoom, panX, panY])

  const worldToScreen = useCallback((wx, wy) => {
    return {
      x: wx * zoom + panX,
      y: wy * zoom + panY,
    }
  }, [zoom, panX, panY])

  // ─── Hit testing ──────────────────────────────────────────────────────────

  const findNodeAt = useCallback((screenX, screenY) => {
    const world = screenToWorld(screenX, screenY)
    for (const device of filteredDevices) {
      const pos = devicePositions.get(device.id)
      if (!pos) continue
      if (dist(world, pos) <= NODE_RADIUS + NODE_HIT_PADDING) {
        return device
      }
    }
    return null
  }, [filteredDevices, devicePositions, screenToWorld])

  // ─── Drawing ──────────────────────────────────────────────────────────────

  const drawNode = useCallback((ctx, device, pos, isHovered, isSearched) => {
    const { x, y } = pos
    const colors = STATUS_COLORS[device.status] || STATUS_COLORS.online
    const type = getDeviceType(device)
    const icon = DEVICE_TYPE_ICONS[type] || '●'

    // Glow for hovered / searched
    if (isHovered || isSearched) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(x, y, NODE_RADIUS + 8, 0, Math.PI * 2)
      ctx.fillStyle = isHovered ? 'rgba(0,84,166,0.15)' : 'rgba(26,124,59,0.15)'
      ctx.fill()
      ctx.restore()
    }

    // Node circle
    ctx.save()
    ctx.beginPath()
    ctx.arc(x, y, NODE_RADIUS, 0, Math.PI * 2)

    // Gradient fill
    const grad = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, NODE_RADIUS)
    grad.addColorStop(0, isHovered ? '#5cb85c' : colors.fill)
    grad.addColorStop(1, colors.stroke)
    ctx.fillStyle = grad
    ctx.fill()

    ctx.strokeStyle = isHovered ? '#0054a6' : colors.stroke
    ctx.lineWidth = isHovered ? 3 : 2
    ctx.stroke()
    ctx.restore()

    // Device type icon
    ctx.save()
    ctx.fillStyle = '#ffffff'
    ctx.font = FONT_BOLD
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(icon, x, y - 1)
    ctx.restore()

    // Hostname label
    ctx.save()
    ctx.fillStyle = '#191c21'
    ctx.font = FONT
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(device.hostname, x, y + NODE_RADIUS + 6)
    ctx.restore()

    // IP label
    ctx.save()
    ctx.fillStyle = '#424751'
    ctx.font = FONT_LABEL
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(device.ip, x, y + NODE_RADIUS + 20)
    ctx.restore()

    // Alert badge
    if (device.alerts > 0) {
      const badgeX = x + NODE_RADIUS - 4
      const badgeY = y - NODE_RADIUS + 4
      ctx.save()
      ctx.beginPath()
      ctx.arc(badgeX, badgeY, 9, 0, Math.PI * 2)
      ctx.fillStyle = '#ba1a1a'
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 9px Inter, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(device.alerts), badgeX, badgeY)
      ctx.restore()
    }
  }, [])

  const drawEdge = useCallback((ctx, from, to, highlight) => {
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.strokeStyle = highlight ? EDGE_HIGHLIGHT : EDGE_COLOR
    ctx.lineWidth = highlight ? 2.5 : 1.5
    ctx.setLineDash(showBGP ? [] : [6, 4])
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
  }, [showBGP])

  const drawGrid = useCallback((ctx, w, h) => {
    const step = 40 * zoom
    const offsetX = panX % step
    const offsetY = panY % step

    ctx.save()
    ctx.strokeStyle = GRID_COLOR
    ctx.lineWidth = 0.5
    ctx.beginPath()

    for (let x = offsetX; x < w; x += step) {
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
    }
    for (let y = offsetY; y < h; y += step) {
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
    }

    ctx.stroke()
    ctx.restore()
  }, [zoom, panX, panY])

  const drawMinimap = useCallback(() => {
    const miniCanvas = minimapRef.current
    if (!miniCanvas || !filteredDevices.length) return

    const ctx = miniCanvas.getContext('2d')
    const w = MINIMAP_W
    const h = MINIMAP_H

    ctx.clearRect(0, 0, w, h)

    // Background
    ctx.fillStyle = '#f2f3fb'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#c2c6d3'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, w, h)

    // Compute bounding box of all nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const device of filteredDevices) {
      const pos = devicePositions.get(device.id)
      if (!pos) continue
      minX = Math.min(minX, pos.x)
      minY = Math.min(minY, pos.y)
      maxX = Math.max(maxX, pos.x)
      maxY = Math.max(maxY, pos.y)
    }

    const rangeX = maxX - minX || 1
    const rangeY = maxY - minY || 1
    const scale = Math.min(
      (w - MINIMAP_PAD * 2) / rangeX,
      (h - MINIMAP_PAD * 2) / rangeY
    ) * 0.9

    const offsetX = (w - rangeX * scale) / 2
    const offsetY = (h - rangeY * scale) / 2

    const toMini = (wx, wy) => ({
      x: (wx - minX) * scale + offsetX,
      y: (wy - minY) * scale + offsetY,
    })

    // Draw edges
    if (coreDevice) {
      const corePos = devicePositions.get(coreDevice.id)
      if (corePos) {
        const mCore = toMini(corePos.x, corePos.y)
        for (const device of filteredDevices) {
          if (device.id === coreDevice.id) continue
          const pos = devicePositions.get(device.id)
          if (!pos) continue
          const mPos = toMini(pos.x, pos.y)
          ctx.beginPath()
          ctx.moveTo(mCore.x, mCore.y)
          ctx.lineTo(mPos.x, mPos.y)
          ctx.strokeStyle = EDGE_COLOR
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }
    }

    // Draw nodes
    for (const device of filteredDevices) {
      const pos = devicePositions.get(device.id)
      if (!pos) continue
      const m = toMini(pos.x, pos.y)
      const colors = STATUS_COLORS[device.status] || STATUS_COLORS.online
      ctx.beginPath()
      ctx.arc(m.x, m.y, 4, 0, Math.PI * 2)
      ctx.fillStyle = colors.fill
      ctx.fill()
    }

    // Viewport rectangle
    const tl = worldToScreen(0, 0)
    const br = worldToScreen(canvasSize.w, canvasSize.h)

    const mTl = toMini(tl.x, tl.y)
    const mBr = toMini(br.x, br.y)

    ctx.strokeStyle = '#0054a6'
    ctx.lineWidth = 1.5
    ctx.strokeRect(
      Math.max(0, mTl.x),
      Math.max(0, mTl.y),
      Math.min(w, mBr.x) - Math.max(0, mTl.x),
      Math.min(h, mBr.y) - Math.max(0, mTl.y)
    )
  }, [filteredDevices, devicePositions, coreDevice, worldToScreen, canvasSize])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const w = canvasSize.w
    const h = canvasSize.h

    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Background
    ctx.fillStyle = CANVAS_BG
    ctx.fillRect(0, 0, w, h)

    // Grid
    drawGrid(ctx, w, h)

    // Edges (star topology from core)
    if (coreDevice) {
      const corePos = devicePositions.get(coreDevice.id)
      if (corePos) {
        for (const device of filteredDevices) {
          if (device.id === coreDevice.id) continue
          const pos = devicePositions.get(device.id)
          if (!pos) continue

          const isHighlighted =
            hoveredNode && (hoveredNode.id === device.id || hoveredNode.id === coreDevice.id)

          drawEdge(ctx, corePos, pos, isHighlighted)
        }
      }
    }

    // Nodes
    const searchLower = searchQuery.toLowerCase()
    for (const device of filteredDevices) {
      const pos = devicePositions.get(device.id)
      if (!pos) continue
      const isHovered = hoveredNode?.id === device.id
      const isSearched = searchQuery.trim() && (
        device.hostname.toLowerCase().includes(searchLower) ||
        device.ip.toLowerCase().includes(searchLower)
      )
      drawNode(ctx, device, pos, isHovered, isSearched)
    }

    // Minimap
    drawMinimap()
  }, [canvasSize, drawGrid, drawEdge, drawNode, drawMinimap, filteredDevices, devicePositions, coreDevice, hoveredNode, searchQuery])

  // Animation loop
  useEffect(() => {
    let running = true
    const loop = () => {
      if (!running) return
      draw()
      animFrameRef.current = requestAnimationFrame(loop)
    }
    loop()
    return () => {
      running = false
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [draw])

  // ─── Mouse handlers ───────────────────────────────────────────────────────

  const handleMouseDown = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    const node = findNodeAt(sx, sy)

    if (node) {
      dragRef.current = { dragging: false, nodeDragging: true, lastX: e.clientX, lastY: e.clientY, draggedNode: node }
    } else {
      dragRef.current = { dragging: true, nodeDragging: false, lastX: e.clientX, lastY: e.clientY, draggedNode: null }
    }
  }, [findNodeAt])

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top

    if (dragRef.current.dragging) {
      const dx = e.clientX - dragRef.current.lastX
      const dy = e.clientY - dragRef.current.lastY
      setPanX(prev => prev + dx)
      setPanY(prev => prev + dy)
      dragRef.current.lastX = e.clientX
      dragRef.current.lastY = e.clientY
      return
    }

    if (dragRef.current.nodeDragging && dragRef.current.draggedNode) {
      const dx = (e.clientX - dragRef.current.lastX) / zoom
      const dy = (e.clientY - dragRef.current.lastY) / zoom
      const pos = devicePositions.get(dragRef.current.draggedNode.id)
      if (pos) {
        // We mutate the position map directly for drag — need a state update
        // For simplicity, we'll use a ref-based approach and force re-render
        pos.x += dx
        pos.y += dy
      }
      dragRef.current.lastX = e.clientX
      dragRef.current.lastY = e.clientY
      return
    }

    const node = findNodeAt(sx, sy)
    setHoveredNode(node)
    if (node) {
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      canvasRef.current.style.cursor = 'pointer'
    } else {
      canvasRef.current.style.cursor = 'grab'
    }
  }, [findNodeAt, zoom, devicePositions])

  const handleMouseUp = useCallback((e) => {
    const wasNodeDragging = dragRef.current.nodeDragging
    const draggedNode = dragRef.current.draggedNode
    dragRef.current = { dragging: false, nodeDragging: false, lastX: 0, lastY: 0, draggedNode: null }

    // If it was a click (not a drag), navigate
    if (wasNodeDragging && draggedNode) {
      const dx = Math.abs(e.clientX - dragRef.current.lastX)
      const dy = Math.abs(e.clientY - dragRef.current.lastY)
      if (dx < 3 && dy < 3) {
        navigate(`/devices/${draggedNode.id}`)
      }
    }
  }, [navigate])

  const handleClick = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    const node = findNodeAt(sx, sy)
    if (node) {
      navigate(`/devices/${node.id}`)
    }
  }, [findNodeAt, navigate])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
    const newZoom = Math.max(0.2, Math.min(5, zoom * zoomFactor))

    // Zoom toward mouse position
    const worldX = (mx - panX) / zoom
    const worldY = (my - panY) / zoom

    setZoom(newZoom)
    setPanX(mx - worldX * newZoom)
    setPanY(my - worldY * newZoom)
  }, [zoom, panX, panY])

  // ─── Controls ─────────────────────────────────────────────────────────────

  const handleZoomIn = () => {
    setZoom(prev => Math.min(5, prev * 1.25))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(0.2, prev / 1.25))
  }

  const handleResetView = () => {
    setZoom(1)
    setPanX(0)
    setPanY(0)
  }

  const handleExportPNG = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `topology-${new Date().toISOString().slice(0, 10)}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const activeFilters = [filterSite, filterType, filterStatus].filter(f => f !== 'all').length

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Topology Map</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {filteredDevices.length} device{filteredDevices.length !== 1 ? 's' : ''} shown
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleExportPNG} title="Export PNG">
            <Download size={16} />
            <span className="hidden sm:inline">Export PNG</span>
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search devices..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-surface-container-lowest rounded-lg border border-outline-variant text-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <Button
          variant={showFilters || activeFilters > 0 ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          Filters
          {activeFilters > 0 && (
            <span className="ml-1 w-5 h-5 rounded-full bg-on-primary text-primary text-[10px] font-bold flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </Button>

        {/* Layer toggle */}
        <Button
          variant={showLayerPanel ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setShowLayerPanel(!showLayerPanel)}
        >
          <Layers size={16} />
          <span className="hidden sm:inline">Layers</span>
        </Button>

        {/* Zoom controls */}
        <div className="flex items-center gap-1 ml-auto">
          <Button variant="ghost" size="sm" onClick={handleZoomOut} title="Zoom out">
            <ZoomOut size={16} />
          </Button>
          <span className="text-xs text-on-surface-variant w-12 text-center font-medium">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="sm" onClick={handleZoomIn} title="Zoom in">
            <ZoomIn size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleResetView} title="Reset view">
            <Maximize2 size={16} />
          </Button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-on-surface">Filters</span>
            {activeFilters > 0 && (
              <button
                onClick={() => { setFilterSite('all'); setFilterType('all'); setFilterStatus('all') }}
                className="text-xs text-primary hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Site</label>
              <select
                value={filterSite}
                onChange={e => setFilterSite(e.target.value)}
                className="w-full h-9 px-3 bg-surface-container-lowest rounded-lg border border-outline-variant text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20"
              >
                {sites.map(s => (
                  <option key={s} value={s}>{s === 'all' ? 'All Sites' : s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Device Type</label>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="w-full h-9 px-3 bg-surface-container-lowest rounded-lg border border-outline-variant text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20"
              >
                <option value="all">All Types</option>
                <option value="core">Core Router</option>
                <option value="branch">Branch Router</option>
                <option value="ap">Access Point</option>
                <option value="switch">Switch</option>
                <option value="pppoe">PPPoE Concentrator</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full h-9 px-3 bg-surface-container-lowest rounded-lg border border-outline-variant text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20"
              >
                <option value="all">All Statuses</option>
                <option value="online">Online</option>
                <option value="warning">Warning</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Layer panel */}
      {showLayerPanel && (
        <Card className="p-4">
          <div className="text-sm font-semibold text-on-surface mb-3">Layer Visibility</div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showL2}
                onChange={e => setShowL2(e.target.checked)}
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
              />
              <span className="text-sm text-on-surface">Layer 2 (Data Link)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showL3}
                onChange={e => setShowL3(e.target.checked)}
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
              />
              <span className="text-sm text-on-surface">Layer 3 (Network)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showBGP}
                onChange={e => setShowBGP(e.target.checked)}
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
              />
              <span className="text-sm text-on-surface">BGP Sessions</span>
            </label>
          </div>
        </Card>
      )}

      {/* Canvas area */}
      <div className="flex-1 relative min-h-[400px] rounded-xl border border-outline-variant overflow-hidden bg-surface-container-lowest">
        <div ref={containerRef} className="absolute inset-0">
          <canvas
            ref={canvasRef}
            width={canvasSize.w}
            height={canvasSize.h}
            style={{ width: canvasSize.w, height: canvasSize.h }}
            className="block"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleClick}
            onWheel={handleWheel}
          />
        </div>

        {/* Minimap */}
        <div className="absolute bottom-3 right-3 rounded-lg border border-outline-variant shadow-lg overflow-hidden bg-surface-container-lowest">
          <canvas
            ref={minimapRef}
            width={MINIMAP_W}
            height={MINIMAP_H}
            className="block"
          />
        </div>

        {/* Tooltip */}
        {hoveredNode && (
          <div
            className="absolute z-50 pointer-events-none"
            style={{
              left: tooltipPos.x + 16,
              top: tooltipPos.y - 10,
            }}
          >
            <div className="bg-surface-container-highest border border-outline-variant rounded-lg shadow-xl p-3 min-w-[220px]">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[hoveredNode.status]?.fill }}
                />
                <span className="font-semibold text-sm text-on-surface truncate">{hoveredNode.hostname}</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">IP Address</span>
                  <span className="text-on-surface font-medium">{hoveredNode.ip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Model</span>
                  <span className="text-on-surface font-medium">{hoveredNode.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">CPU</span>
                  <span className="text-on-surface font-medium">{hoveredNode.cpu}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">RAM</span>
                  <span className="text-on-surface font-medium">{hoveredNode.ram}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Alerts</span>
                  <span className={`font-medium ${hoveredNode.alerts > 0 ? 'text-error' : 'text-on-surface'}`}>
                    {hoveredNode.alerts}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Uptime</span>
                  <span className="text-on-surface font-medium">{hoveredNode.uptime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Site</span>
                  <span className="text-on-surface font-medium">{hoveredNode.site}</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-outline-variant text-[10px] text-on-surface-variant text-center">
                Click to view device details
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute top-3 left-3 bg-surface-container-lowest/90 backdrop-blur-sm border border-outline-variant rounded-lg p-3 shadow-sm">
          <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Status</div>
          <div className="space-y-1.5">
            {Object.entries(STATUS_COLORS).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: val.fill }} />
                <span className="text-[11px] text-on-surface">{val.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
