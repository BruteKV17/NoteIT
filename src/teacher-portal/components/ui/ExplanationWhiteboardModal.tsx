import { useState, useRef, useEffect } from 'react'
import { 
  Pencil, 
  Eraser, 
  RotateCcw, 
  Trash2, 
  Upload, 
  Link as LinkIcon, 
  Check, 
  X, 
  Palette, 
  Minus, 
  Square, 
  Circle as CircleIcon, 
  ArrowRight,
  Sparkles
} from 'lucide-react'

interface ExplanationWhiteboardModalProps {
  isOpen: boolean
  onClose: () => void
  onAttach: (whiteboardData: { imageDataUrl: string; resourceLinks: string[]; note: string }) => void
  studentName?: string
  topic?: string
}

export function ExplanationWhiteboardModal({
  isOpen,
  onClose,
  onAttach,
  studentName = 'Student',
  topic = 'Doubt Concept'
}: ExplanationWhiteboardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [tool, setTool] = useState<'pen' | 'eraser' | 'line' | 'arrow' | 'rect' | 'circle'>('pen')
  const [color, setColor] = useState<string>('#22C55E') // Default Moss Emerald Green
  const [lineWidth, setLineWidth] = useState<number>(3)
  
  const [isDrawing, setIsDrawing] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startY, setStartY] = useState(0)
  const [snapshot, setSnapshot] = useState<ImageData | null>(null)

  const [history, setHistory] = useState<ImageData[]>([])
  
  const [resourceLinkInput, setResourceLinkInput] = useState('')
  const [resourceLinks, setResourceLinks] = useState<string[]>([])
  const [explanationNote, setExplanationNote] = useState('')

  // Initialize Canvas
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Set resolution based on parent container
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width || 800
      canvas.height = 450

      // Fill background dark moss slate or white
      ctx.fillStyle = '#101712'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw light background grid
      ctx.strokeStyle = '#1D2A20'
      ctx.lineWidth = 1
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Save initial state to history
      saveState()
    }, 100)

    return () => clearTimeout(timer)
  }, [isOpen])

  const saveState = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setHistory((prev) => [...prev.slice(-10), imgData])
  }

  const handleUndo = () => {
    if (history.length <= 1) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const newHistory = [...history]
    newHistory.pop() // Remove current
    const prev = newHistory[newHistory.length - 1]
    if (prev) {
      ctx.putImageData(prev, 0, 0)
      setHistory(newHistory)
    }
  }

  const handleClear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#101712'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Grid
    ctx.strokeStyle = '#1D2A20'
    ctx.lineWidth = 1
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    saveState()
  }

  // Handle Image Upload onto Canvas
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Scale image nicely to fit canvas
        const maxWidth = canvas.width * 0.7
        const maxHeight = canvas.height * 0.7
        let w = img.width
        let h = img.height
        if (w > maxWidth) {
          h = (maxWidth / w) * h
          w = maxWidth
        }
        if (h > maxHeight) {
          w = (maxHeight / h) * w
          h = maxHeight
        }

        const x = (canvas.width - w) / 2
        const y = (canvas.height - h) / 2
        ctx.drawImage(img, x, y, w, h)
        saveState()
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // Helper to extract canvas relative coordinates from mouse or touch event
  const getCanvasCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    let clientX = 0
    let clientY = 0

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent<HTMLCanvasElement>).clientX
      clientY = (e as React.MouseEvent<HTMLCanvasElement>).clientY
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }

  // Mouse / Touch Event Handlers for Drawing
  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCanvasCoords(e)

    setIsDrawing(true)
    setStartX(x)
    setStartY(y)
    setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height))

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCanvasCoords(e)

    ctx.strokeStyle = tool === 'eraser' ? '#101712' : color
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 4 : lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(x, y)
      ctx.stroke()
    } else if (snapshot) {
      // Restore previous canvas state for shape preview
      ctx.putImageData(snapshot, 0, 0)
      ctx.beginPath()

      if (tool === 'line') {
        ctx.moveTo(startX, startY)
        ctx.lineTo(x, y)
        ctx.stroke()
      } else if (tool === 'arrow') {
        ctx.moveTo(startX, startY)
        ctx.lineTo(x, y)
        ctx.stroke()
        // Draw arrow head
        const angle = Math.atan2(y - startY, x - startX)
        const headLen = 12
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x - headLen * Math.cos(angle - Math.PI / 6), y - headLen * Math.sin(angle - Math.PI / 6))
        ctx.moveTo(x, y)
        ctx.lineTo(x - headLen * Math.cos(angle + Math.PI / 6), y - headLen * Math.sin(angle + Math.PI / 6))
        ctx.stroke()
      } else if (tool === 'rect') {
        ctx.strokeRect(startX, startY, x - startX, y - startY)
      } else if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2))
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI)
        ctx.stroke()
      }
    }
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    saveState()
  }

  const handleAddLink = () => {
    if (!resourceLinkInput.trim()) return
    setResourceLinks((prev) => [...prev, resourceLinkInput.trim()])
    setResourceLinkInput('')
  }

  const handleAttachSubmit = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    onAttach({
      imageDataUrl: dataUrl,
      resourceLinks,
      note: explanationNote.trim()
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="flex flex-col w-full max-w-5xl h-[90vh] bg-[#101712] border-2 border-[#233326] rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#233326] bg-[#162019]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#22C55E]/15 border border-[#22C55E] text-[#22C55E]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#22C55E]">
                WHITEBOARD EXPLANATION STUDIO
              </div>
              <h2 className="text-base font-bold text-[#F2F7F3]">
                Doubt Explanation for <span className="text-[#22C55E]">{studentName}</span> • {topic}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-[#233326] text-[#A0B2A3] hover:text-[#F2F7F3] hover:bg-[#1F2E23] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Studio Content Body */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          
          {/* Main Whiteboard Canvas */}
          <div className="flex-1 flex flex-col p-4 bg-[#080C09] min-w-0 overflow-hidden relative">
            
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 p-2.5 rounded-xl border border-[#233326] bg-[#101712]">
              
              {/* Drawing Tools */}
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: 'pen', label: 'Pen', icon: Pencil },
                    { id: 'eraser', label: 'Eraser', icon: Eraser },
                    { id: 'line', label: 'Line', icon: Minus },
                    { id: 'arrow', label: 'Arrow', icon: ArrowRight },
                    { id: 'rect', label: 'Rectangle', icon: Square },
                    { id: 'circle', label: 'Circle', icon: CircleIcon },
                  ] as const
                ).map((t) => {
                  const Icon = t.icon
                  const active = tool === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTool(t.id)}
                      title={t.label}
                      className={`p-2 rounded-lg transition-all cursor-pointer ${
                        active
                          ? 'bg-[#22C55E] text-white shadow-md'
                          : 'text-[#A0B2A3] hover:bg-[#162019] hover:text-[#F2F7F3]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  )
                })}
              </div>

              {/* Color Palette */}
              <div className="flex items-center gap-1.5 border-l border-r border-[#233326] px-3">
                {['#22C55E', '#38BDF8', '#F59E0B', '#FB7185', '#F2F7F3', '#101712'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setColor(c)
                      if (tool === 'eraser') setTool('pen')
                    }}
                    style={{ backgroundColor: c }}
                    className={`h-5 w-5 rounded-full border border-white/20 transition-transform cursor-pointer ${
                      color === c && tool !== 'eraser' ? 'scale-125 ring-2 ring-[#22C55E]' : 'hover:scale-110'
                    }`}
                  />
                ))}
              </div>

              {/* Brush Thickness */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#A0B2A3]">Size:</span>
                {[2, 5, 10].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setLineWidth(s)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                      lineWidth === s
                        ? 'border-[#22C55E] bg-[#22C55E]/15 text-[#22C55E]'
                        : 'border-[#233326] text-[#A0B2A3] hover:bg-[#162019]'
                    }`}
                  >
                    {s}px
                  </button>
                ))}
              </div>

              {/* Actions: Undo, Clear, Upload Image */}
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={handleUndo}
                  title="Undo last stroke"
                  className="p-2 rounded-lg border border-[#233326] text-[#A0B2A3] hover:text-[#F2F7F3] hover:bg-[#162019] transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  title="Clear Whiteboard"
                  className="p-2 rounded-lg border border-[#233326] text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <label className="p-2 rounded-lg border border-[#22C55E]/40 bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20 transition-colors cursor-pointer flex items-center gap-1 text-xs font-mono font-bold">
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Insert Diagram</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Canvas Viewport */}
            <div className="flex-1 w-full h-full relative rounded-xl border border-[#233326] overflow-hidden bg-[#101712] flex items-center justify-center">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-full cursor-crosshair touch-none"
              />
            </div>
          </div>

          {/* Right Sidebar Panel: Resource Links & Notes */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-[#233326] bg-[#101712] p-4 flex flex-col justify-between space-y-4">
            
            <div className="space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#A0B2A3] mb-1.5">
                  EXPLANATION NOTE / SUMMARY
                </label>
                <textarea
                  value={explanationNote}
                  onChange={(e) => setExplanationNote(e.target.value)}
                  rows={3}
                  placeholder="Add a step-by-step written summary or explanation note..."
                  className="w-full rounded-xl border border-[#233326] bg-[#162019] p-3 text-xs text-[#F2F7F3] placeholder:text-[#667869] focus:outline-none focus:border-[#22C55E]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#A0B2A3] mb-1.5">
                  ATTACH REFERENCE LINKS & URLS
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="url"
                    value={resourceLinkInput}
                    onChange={(e) => setResourceLinkInput(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="flex-1 rounded-xl border border-[#233326] bg-[#162019] px-3 py-2 text-xs text-[#F2F7F3] placeholder:text-[#667869] focus:outline-none focus:border-[#22C55E]"
                  />
                  <button
                    type="button"
                    onClick={handleAddLink}
                    className="p-2 rounded-xl bg-[#22C55E] text-white hover:bg-[#16A34A] transition-colors cursor-pointer"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </button>
                </div>

                {resourceLinks.length > 0 && (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {resourceLinks.map((link, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-[#233326] bg-[#162019] text-xs font-mono text-[#22C55E]">
                        <span className="truncate">{link}</span>
                        <button
                          onClick={() => setResourceLinks((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-[#A0B2A3] hover:text-rose-400"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Attach Trigger */}
            <div className="pt-3 border-t border-[#233326]">
              <button
                type="button"
                onClick={handleAttachSubmit}
                className="w-full py-3 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>ATTACH WHITEBOARD TO RESPONSE</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
