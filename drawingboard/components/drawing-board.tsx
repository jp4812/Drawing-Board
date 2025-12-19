"use client"

import type React from "react"

import { useRef, useEffect, useState, useCallback, useMemo } from "react"

interface Point {
  x: number
  y: number
}

interface Layer {
  id: string
  name: string
  isVisible: boolean
  opacity: number
}

interface Stroke {
  id: string
  points: Point[]
  color: string
  width: number
  timestamp: number
  layerId: string
}

interface ShapeStroke {
  id: string
  type: "circle" | "square" | "rectangle" | "triangle"
  startPoint: Point
  endPoint: Point
  color: string
  width: number
  timestamp: number
  layerId: string
}

class Deque<T> {
  private items: T[] = []
  private maxSize: number

  constructor(maxSize = 50) {
    this.maxSize = maxSize
  }

  pushRight(item: T): void {
    this.items.push(item)
    if (this.items.length > this.maxSize) {
      this.items.shift()
    }
  }

  slice(start: number, end?: number): T[] {
    return this.items.slice(start, end)
  }

  get length(): number {
    return this.items.length
  }

  clear(): void {
    this.items = []
  }
}

const Icons = {
  Download: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  Undo: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  ),
  Redo: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
      />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  ),
  Palette: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2"
      />
    </svg>
  ),
  Brush: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    </svg>
  ),
  Eye: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  ),
  EyeOff: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-4.753 4.753m7.371-1.368A9.01 9.01 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.063 10.063 0 01-5.891 4.153M12 12m0 0l3.6 3.6m-3.6-3.6L8.4 8.4"
      />
    </svg>
  ),
  Eraser: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 19l12-12M6 19L4 21h16l-2-2m0 0l12-12" />
    </svg>
  ),
  Pan: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m0 0l-2-1m2 1v2.5M10 7l-2 1m0 0L6 7m2 1v2.5"
      />
    </svg>
  ),
  Plus: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Shapes: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h10a4 4 0 004-4V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4z"
      />
    </svg>
  ),
}

export default function DrawingBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentStroke, setCurrentStroke] = useState<Point[]>([])
  const [showColorPicker, setShowColorPicker] = useState(false)

  const [activeTool, setActiveTool] = useState<"brush" | "pan">("brush")
  const [activeShape, setActiveShape] = useState<"none" | "circle" | "square" | "rectangle" | "triangle">("none")
  const [shapeStart, setShapeStart] = useState<Point | null>(null)
  const [shapePreview, setShapePreview] = useState<Point | null>(null)
  const [showShapesMenu, setShowShapesMenu] = useState(false)

  const [layers, setLayers] = useState<Layer[]>([{ id: "layer-1", name: "Layer 1", isVisible: true, opacity: 1 }])
  const [activeLayerId, setActiveLayerId] = useState("layer-1")

  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  const [undoStack, setUndoStack] = useState<Stroke[]>([])
  const [redoStack, setRedoStack] = useState<Stroke[]>([])

  const [historyDeque] = useState(() => new Deque<Stroke>(50))
  const [allStrokes, setAllStrokes] = useState<Stroke[]>([])
  const [allShapes, setAllShapes] = useState<ShapeStroke[]>([])
  const [timelinePosition, setTimelinePosition] = useState(0)
  const [isScrubbingTimeline, setIsScrubbingTimeline] = useState(false)

  const [strokeColor, setStrokeColor] = useState("#2563eb")
  const [strokeWidth, setStrokeWidth] = useState(3)

  const colorPalette = [
    "#2563eb",
    "#dc2626",
    "#16a34a",
    "#ca8a04",
    "#9333ea",
    "#c2410c",
    "#0891b2",
    "#be123c",
    "#000000",
    "#6b7280",
    "#f59e0b",
    "#ec4899",
  ]

  const getContext = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    return canvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
    })
  }, [])

  const drawShape = (
    ctx: CanvasRenderingContext2D,
    type: "circle" | "square" | "rectangle" | "triangle",
    startPoint: Point,
    endPoint: Point,
    color: string,
    width: number,
  ) => {
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    const dx = endPoint.x - startPoint.x
    const dy = endPoint.y - startPoint.y

    switch (type) {
      case "circle": {
        const radius = Math.sqrt(dx * dx + dy * dy)
        ctx.beginPath()
        ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2)
        ctx.stroke()
        break
      }
      case "rectangle": {
        ctx.beginPath()
        ctx.rect(startPoint.x, startPoint.y, dx, dy)
        ctx.stroke()
        break
      }
      case "square": {
        const size = Math.max(Math.abs(dx), Math.abs(dy))
        ctx.beginPath()
        ctx.rect(startPoint.x, startPoint.y, size, size)
        ctx.stroke()
        break
      }
      case "triangle": {
        const radius = Math.sqrt(dx * dx + dy * dy)
        ctx.beginPath()
        ctx.moveTo(startPoint.x, startPoint.y - radius)
        ctx.lineTo(
          startPoint.x + radius * Math.cos((7 * Math.PI) / 6),
          startPoint.y + radius * Math.sin((7 * Math.PI) / 6),
        )
        ctx.lineTo(
          startPoint.x + radius * Math.cos((11 * Math.PI) / 6),
          startPoint.y + radius * Math.sin((11 * Math.PI) / 6),
        )
        ctx.closePath()
        ctx.stroke()
        break
      }
    }
  }

  const scheduleRedraw = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const ctx = getContext()
      if (!ctx) return

      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

      ctx.save()
      ctx.translate(panOffset.x, panOffset.y)
      ctx.scale(zoomLevel, zoomLevel)

      const strokesToRender = isScrubbingTimeline ? historyDeque.slice(0, timelinePosition + 1) : allStrokes

      const sortedStrokes = strokesToRender.sort((a, b) => {
        const layerAIndex = layers.findIndex((l) => l.id === a.layerId)
        const layerBIndex = layers.findIndex((l) => l.id === b.layerId)
        return layerAIndex - layerBIndex
      })

      sortedStrokes.forEach((stroke) => {
        const layer = layers.find((l) => l.id === stroke.layerId)
        if (!layer || !layer.isVisible) return
        if (stroke.points.length < 2) return

        ctx.globalCompositeOperation = "source-over"

        ctx.globalAlpha = layer.opacity
        ctx.beginPath()
        ctx.strokeStyle = stroke.color
        ctx.lineWidth = stroke.width
        ctx.lineCap = "round"
        ctx.lineJoin = "round"

        if (stroke.points.length === 2) {
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
          ctx.lineTo(stroke.points[1].x, stroke.points[1].y)
        } else {
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y)

          for (let i = 1; i < stroke.points.length - 1; i++) {
            const currentPoint = stroke.points[i]
            const nextPoint = stroke.points[i + 1]
            const controlX = (currentPoint.x + nextPoint.x) / 2
            const controlY = (currentPoint.y + nextPoint.y) / 2
            ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, controlX, controlY)
          }

          const lastPoint = stroke.points[stroke.points.length - 1]
          ctx.lineTo(lastPoint.x, lastPoint.y)
        }

        ctx.stroke()
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = "source-over"
      })

      allShapes.forEach((shape) => {
        const layer = layers.find((l) => l.id === shape.layerId)
        if (!layer || !layer.isVisible) return

        ctx.globalAlpha = layer.opacity
        drawShape(ctx, shape.type, shape.startPoint, shape.endPoint, shape.color, shape.width)
        ctx.globalAlpha = 1
      })

      if (shapeStart && shapePreview && activeShape !== "none") {
        ctx.globalAlpha = 0.5
        drawShape(ctx, activeShape, shapeStart, shapePreview, strokeColor, strokeWidth)
        ctx.globalAlpha = 1
      }

      ctx.restore()
    })
  }, [
    allStrokes,
    allShapes,
    historyDeque,
    timelinePosition,
    isScrubbingTimeline,
    getContext,
    layers,
    zoomLevel,
    panOffset,
    shapeStart,
    shapePreview,
    activeShape,
    strokeColor,
    strokeWidth,
  ])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = getContext()
    if (!ctx) return

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`

      ctx.scale(dpr, dpr)
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      scheduleRedraw()
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [getContext, scheduleRedraw])

  const getEventPos = useCallback(
    (e: React.MouseEvent | React.TouchEvent): Point => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }

      const rect = canvas.getBoundingClientRect()
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

      const x = ((clientX - rect.left) * (canvas.width / rect.width)) / window.devicePixelRatio
      const y = ((clientY - rect.top) * (canvas.height / rect.height)) / window.devicePixelRatio

      return {
        x: (x - panOffset.x) / zoomLevel,
        y: (y - panOffset.y) / zoomLevel,
      }
    },
    [panOffset, zoomLevel],
  )

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()

      if (activeTool === "pan") {
        setIsPanning(true)
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
        setPanStart({
          x: clientX - rect.left - panOffset.x,
          y: clientY - rect.top - panOffset.y,
        })
        return
      }

      if (activeShape !== "none") {
        const pos = getEventPos(e)
        setShapeStart(pos)
        setShapePreview(pos)
        return
      }

      setIsDrawing(true)
      setIsScrubbingTimeline(false)

      const pos = getEventPos(e)
      setCurrentStroke([pos])
    },
    [activeTool, activeShape, getEventPos, panOffset],
  )

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (activeTool === "pan" && isPanning) {
        e.preventDefault()
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

        setPanOffset({
          x: clientX - rect.left - panStart.x,
          y: clientY - rect.top - panStart.y,
        })
        return
      }

      if (activeShape !== "none" && shapeStart) {
        const pos = getEventPos(e)
        setShapePreview(pos)
        scheduleRedraw()
        return
      }

      if (!isDrawing) return
      e.preventDefault()

      const pos = getEventPos(e)
      setCurrentStroke((prev) => {
        const newStroke = [...prev, pos]

        const ctx = getContext()
        if (ctx && newStroke.length >= 2) {
          ctx.save()
          ctx.translate(panOffset.x, panOffset.y)
          ctx.scale(zoomLevel, zoomLevel)

          const lastTwo = newStroke.slice(-2)
          ctx.beginPath()
          ctx.strokeStyle = strokeColor
          ctx.lineWidth = strokeWidth
          ctx.lineCap = "round"
          ctx.lineJoin = "round"

          ctx.globalCompositeOperation = "source-over"

          ctx.moveTo(lastTwo[0].x, lastTwo[0].y)
          ctx.lineTo(lastTwo[1].x, lastTwo[1].y)
          ctx.stroke()
          ctx.restore()
        }

        return newStroke
      })
    },
    [
      isDrawing,
      activeTool,
      activeShape,
      isPanning,
      shapeStart,
      getEventPos,
      getContext,
      strokeColor,
      strokeWidth,
      panOffset,
      zoomLevel,
      panStart,
      scheduleRedraw,
    ],
  )

  const endDrawing = useCallback(() => {
    if (activeTool === "pan") {
      setIsPanning(false)
      return
    }

    if (activeShape !== "none" && shapeStart && shapePreview) {
      const newShape: ShapeStroke = {
        id: `${Date.now()}-${Math.random()}`,
        type: activeShape,
        startPoint: shapeStart,
        endPoint: shapePreview,
        color: strokeColor,
        width: strokeWidth,
        timestamp: Date.now(),
        layerId: activeLayerId,
      }
      setAllShapes((prev) => [...prev, newShape])
      setShapeStart(null)
      setShapePreview(null)
      scheduleRedraw()
      return
    }

    if (!isDrawing || currentStroke.length < 2) {
      setIsDrawing(false)
      setCurrentStroke([])
      return
    }

    const newStroke: Stroke = {
      id: `${Date.now()}-${Math.random()}`,
      points: currentStroke,
      color: strokeColor,
      width: strokeWidth,
      timestamp: Date.now(),
      layerId: activeLayerId,
    }

    setUndoStack((prev) => [...prev, newStroke])
    setRedoStack([])
    historyDeque.pushRight(newStroke)
    setAllStrokes((prev) => [...prev, newStroke])
    setTimelinePosition(historyDeque.length - 1)

    setIsDrawing(false)
    setCurrentStroke([])
  }, [
    isDrawing,
    currentStroke,
    strokeColor,
    strokeWidth,
    historyDeque,
    activeTool,
    activeLayerId,
    activeShape,
    shapeStart,
    shapePreview,
    scheduleRedraw,
  ])

  const undo = useCallback(() => {
    if (undoStack.length === 0) return

    const lastStroke = undoStack[undoStack.length - 1]
    setUndoStack((prev) => prev.slice(0, -1))
    setRedoStack((prev) => [...prev, lastStroke])
    setAllStrokes((prev) => prev.slice(0, -1))

    scheduleRedraw()
  }, [undoStack, scheduleRedraw])

  const redo = useCallback(() => {
    if (redoStack.length === 0) return

    const strokeToRedo = redoStack[redoStack.length - 1]
    setRedoStack((prev) => prev.slice(0, -1))
    setUndoStack((prev) => [...prev, strokeToRedo])
    setAllStrokes((prev) => [...prev, strokeToRedo])

    scheduleRedraw()
  }, [redoStack, scheduleRedraw])

  const clearCanvas = useCallback(() => {
    setUndoStack([])
    setRedoStack([])
    setAllStrokes([])
    setAllShapes([])
    historyDeque.clear()
    setTimelinePosition(0)

    const ctx = getContext()
    if (ctx) {
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    }
  }, [historyDeque, getContext])

  const downloadCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const exportCanvas = document.createElement("canvas")
    const exportCtx = exportCanvas.getContext("2d")
    if (!exportCtx) return

    exportCanvas.width = canvas.width
    exportCanvas.height = canvas.height

    exportCtx.fillStyle = "#ffffff"
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)
    exportCtx.drawImage(canvas, 0, 0)

    const link = document.createElement("a")
    link.download = `art-canvas-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.png`
    link.href = exportCanvas.toDataURL("image/png", 1.0)
    link.click()
  }, [])

  const handleTimelineChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const position = Number.parseInt(e.target.value)
      setTimelinePosition(position)
      setIsScrubbingTimeline(true)
      scheduleRedraw()
    },
    [scheduleRedraw],
  )

  const addLayer = useCallback(() => {
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${layers.length + 1}`,
      isVisible: true,
      opacity: 1,
    }
    setLayers((prev) => [...prev, newLayer])
    setActiveLayerId(newLayer.id)
  }, [layers.length])

  const deleteLayer = useCallback(
    (layerId: string) => {
      if (layers.length === 1) return
      setLayers((prev) => prev.filter((l) => l.id !== layerId))
      if (activeLayerId === layerId) {
        setActiveLayerId(layers[0].id)
      }
    },
    [layers, activeLayerId],
  )

  const toggleLayerVisibility = useCallback(
    (layerId: string) => {
      setLayers((prev) => prev.map((l) => (l.id === layerId ? { ...l, isVisible: !l.isVisible } : l)))
      scheduleRedraw()
    },
    [scheduleRedraw],
  )

  const updateLayerName = useCallback((layerId: string, newName: string) => {
    setLayers((prev) => prev.map((l) => (l.id === layerId ? { ...l, name: newName } : l)))
  }, [])

  const stats = useMemo(
    () => ({
      totalActions: allStrokes.length + allShapes.length,
      historySize: historyDeque.length,
      undoSize: undoStack.length,
      redoSize: redoStack.length,
      totalPoints: allStrokes.reduce((sum, stroke) => sum + stroke.points.length, 0),
    }),
    [allStrokes, allShapes, historyDeque.length, undoStack.length, redoStack.length],
  )

  useEffect(() => {
    scheduleRedraw()
  }, [allStrokes, allShapes, scheduleRedraw])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "z":
            e.preventDefault()
            if (e.shiftKey) {
              redo()
            } else {
              undo()
            }
            break
          case "y":
            e.preventDefault()
            redo()
            break
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [undo, redo])

  return (
    <div className="flex h-screen bg-gray-50 flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">Art Canvas</h1>
      </div>

      <div className="flex flex-1">
        <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-2 shadow-sm">
          <button
            onClick={() => {
              setActiveTool("brush")
              setActiveShape("none")
            }}
            className={`p-3 rounded-lg transition-colors ${
              activeTool === "brush" && activeShape === "none"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            title="Brush Tool"
          >
            <Icons.Brush />
          </button>

          <button
            onClick={() => {
              setActiveTool("pan")
              setActiveShape("none")
            }}
            className={`p-3 rounded-lg transition-colors ${
              activeTool === "pan" ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:bg-gray-100"
            }`}
            title="Pan Tool"
          >
            <Icons.Pan />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowShapesMenu(!showShapesMenu)}
              className={`p-3 rounded-lg transition-colors ${
                activeShape !== "none" ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:bg-gray-100"
              }`}
              title="Shapes"
            >
              <Icons.Shapes />
            </button>

            {showShapesMenu && (
              <div className="absolute left-full ml-2 top-0 bg-white border border-gray-300 rounded-lg shadow-lg p-2 space-y-1 z-50">
                <button
                  onClick={() => {
                    setActiveShape("circle")
                    setActiveTool("brush")
                    setShowShapesMenu(false)
                  }}
                  className={`w-full px-3 py-2 text-sm rounded transition-colors text-left ${
                    activeShape === "circle" ? "bg-blue-100 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Circle
                </button>
                <button
                  onClick={() => {
                    setActiveShape("square")
                    setActiveTool("brush")
                    setShowShapesMenu(false)
                  }}
                  className={`w-full px-3 py-2 text-sm rounded transition-colors text-left ${
                    activeShape === "square" ? "bg-blue-100 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Square
                </button>
                <button
                  onClick={() => {
                    setActiveShape("rectangle")
                    setActiveTool("brush")
                    setShowShapesMenu(false)
                  }}
                  className={`w-full px-3 py-2 text-sm rounded transition-colors text-left ${
                    activeShape === "rectangle" ? "bg-blue-100 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Rectangle
                </button>
                <button
                  onClick={() => {
                    setActiveShape("triangle")
                    setActiveTool("brush")
                    setShowShapesMenu(false)
                  }}
                  className={`w-full px-3 py-2 text-sm rounded transition-colors text-left ${
                    activeShape === "triangle" ? "bg-blue-100 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Triangle
                </button>
              </div>
            )}
          </div>

          <div className="flex-1" />

          <div className="w-full px-2 space-y-2">
            <button
              onClick={undo}
              disabled={undoStack.length === 0}
              className="w-full p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Undo"
            >
              <Icons.Undo />
            </button>

            <button
              onClick={redo}
              disabled={redoStack.length === 0}
              className="w-full p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Redo"
            >
              <Icons.Redo />
            </button>

            <button
              onClick={clearCanvas}
              className="w-full p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              title="Clear"
            >
              <Icons.Trash />
            </button>

            <button
              onClick={downloadCanvas}
              className="w-full p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              title="Download"
            >
              <Icons.Download />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {activeTool === "brush" && activeShape === "none" && (
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 shadow-sm">
              <div className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-lg bg-gray-50">
                <Icons.Brush />
                <span className="text-sm font-medium min-w-[2rem]">{strokeWidth}px</span>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number.parseInt(e.target.value))}
                  className="w-20"
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="inline-flex items-center justify-center gap-2 h-9 px-3 rounded-md text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: strokeColor }} />
                  <Icons.Palette />
                </button>

                {showColorPicker && (
                  <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Choose Color</h4>
                        <button onClick={() => setShowColorPicker(false)} className="text-gray-400 hover:text-gray-600">
                          ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {colorPalette.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`w-8 h-8 rounded border-2 transition-all ${
                              strokeColor === color ? "border-gray-800 scale-110" : "border-gray-200 hover:scale-105"
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              setStrokeColor(color)
                              setShowColorPicker(false)
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                        <label className="text-sm text-gray-600">Custom:</label>
                        <input
                          type="color"
                          value={strokeColor}
                          onChange={(e) => setStrokeColor(e.target.value)}
                          className="w-8 h-8 rounded border cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1" />

              {historyDeque.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>
                    History: {timelinePosition + 1} / {historyDeque.length}
                  </span>
                </div>
              )}
            </div>
          )}

          {activeShape !== "none" && (
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 shadow-sm">
              <div className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-lg bg-gray-50">
                <Icons.Brush />
                <span className="text-sm font-medium min-w-[2rem]">{strokeWidth}px</span>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number.parseInt(e.target.value))}
                  className="w-20"
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="inline-flex items-center justify-center gap-2 h-9 px-3 rounded-md text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: strokeColor }} />
                  <Icons.Palette />
                </button>

                {showColorPicker && (
                  <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Choose Color</h4>
                        <button onClick={() => setShowColorPicker(false)} className="text-gray-400 hover:text-gray-600">
                          ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {colorPalette.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`w-8 h-8 rounded border-2 transition-all ${
                              strokeColor === color ? "border-gray-800 scale-110" : "border-gray-200 hover:scale-105"
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              setStrokeColor(color)
                              setShowColorPicker(false)
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                        <label className="text-sm text-gray-600">Custom:</label>
                        <input
                          type="color"
                          value={strokeColor}
                          onChange={(e) => setStrokeColor(e.target.value)}
                          className="w-8 h-8 rounded border cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1" />
              <span className="text-sm font-medium text-gray-600">Drawing {activeShape}</span>
            </div>
          )}

          {/* Canvas Area */}
          <div className="flex-1 relative overflow-hidden bg-gray-100">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full cursor-crosshair touch-none select-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={endDrawing}
              onMouseLeave={endDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={endDrawing}
              style={{ touchAction: "none" }}
            />

            {allStrokes.length === 0 && allShapes.length === 0 && !isDrawing && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-gray-400">
                  <div className="flex justify-center mb-2">
                    <Icons.Brush />
                  </div>
                  <p className="text-lg font-medium">Start Drawing</p>
                  <p className="text-sm">Click and drag to create your masterpiece</p>
                  <p className="text-xs mt-2">Use Ctrl+Z/Ctrl+Y for undo/redo</p>
                </div>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white rounded-lg border border-gray-300 shadow-md p-2">
              <button
                onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.1))}
                className="px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                −
              </button>
              <span className="text-sm font-medium text-gray-600 min-w-[3rem] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((prev) => Math.min(3, prev + 0.1))}
                className="px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                +
              </button>
              <div className="w-px h-4 bg-gray-300" />
              <button
                onClick={() => {
                  setZoomLevel(1)
                  setPanOffset({ x: 0, y: 0 })
                }}
                className="px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Status Bar */}
          <div className="bg-white border-t border-gray-200 px-4 py-2 text-xs text-gray-600 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span>Actions: {stats.totalActions}</span>
                <span>Points: {stats.totalPoints}</span>
                {isScrubbingTimeline && <span className="text-orange-600 font-medium">Timeline Mode</span>}
                {isDrawing && <span className="text-green-600 font-medium">Drawing...</span>}
              </div>
              <div className="text-right">
                <span>Made by Veer and Jemil</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-64 bg-white border-l border-gray-200 flex flex-col shadow-sm">
          <div className="p-3 border-b border-gray-200">
            <h3 className="font-semibold text-sm text-gray-800">Layers</h3>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {layers.map((layer) => (
                <div
                  key={layer.id}
                  className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                    activeLayerId === layer.id
                      ? "bg-blue-50 border-blue-300"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                  onClick={() => setActiveLayerId(layer.id)}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleLayerVisibility(layer.id)
                      }}
                      className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      {layer.isVisible ? <Icons.Eye /> : <Icons.EyeOff />}
                    </button>

                    <input
                      type="text"
                      value={layer.name}
                      onChange={(e) => updateLayerName(layer.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 text-sm bg-transparent border-0 outline-none text-gray-800 font-medium"
                    />

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteLayer(layer.id)
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      disabled={layers.length === 1}
                    >
                      <Icons.Trash />
                    </button>
                  </div>

                  <div className="mt-2 px-1">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <label>Opacity:</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={layer.opacity}
                        onChange={(e) => {
                          setLayers((prev) =>
                            prev.map((l) =>
                              l.id === layer.id ? { ...l, opacity: Number.parseFloat(e.target.value) } : l,
                            ),
                          )
                          scheduleRedraw()
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1"
                      />
                      <span>{Math.round(layer.opacity * 100)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 border-t border-gray-200">
            <button
              onClick={addLayer}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Icons.Plus />
              Add Layer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
