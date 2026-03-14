'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'

interface DrawingCanvasProps {
  onDrawingChange?: (isDrawing: boolean) => void
  onCanvasChange?: (canvasData: string) => void
  width?: number
  height?: number
}

export default function DrawingCanvas({
  onDrawingChange,
  onCanvasChange,
  width = 800,
  height = 600
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null)
  const [brushSize, setBrushSize] = useState(5)
  const [brushColor, setBrushColor] = useState('#000000')

  // 初始化画布
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置画布样式
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = brushColor
    ctx.lineWidth = brushSize

    // 设置白色背景
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    setContext(ctx)
  }, [width, height, brushColor, brushSize])

  // 开始绘画
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!context) return

    setIsDrawing(true)
    onDrawingChange?.(true)

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    context.beginPath()
    context.moveTo(x, y)
  }, [context, onDrawingChange])

  // 绘画中
  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !context) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    context.lineTo(x, y)
    context.stroke()

    // 通知父组件画布内容变化
    const canvasData = canvas.toDataURL('image/png')
    onCanvasChange?.(canvasData)
  }, [isDrawing, context, onCanvasChange])

  // 结束绘画
  const stopDrawing = useCallback(() => {
    if (!context) return

    setIsDrawing(false)
    onDrawingChange?.(false)
    context.closePath()
  }, [context, onDrawingChange])

  // 清除画布
  const clearCanvas = useCallback(() => {
    if (!context) return

    const canvas = canvasRef.current
    if (!canvas) return

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)

    const canvasData = canvas.toDataURL('image/png')
    onCanvasChange?.(canvasData)
  }, [context, width, height, onCanvasChange])

  // 更新画笔设置
  useEffect(() => {
    if (context) {
      context.strokeStyle = brushColor
      context.lineWidth = brushSize
    }
  }, [brushColor, brushSize, context])

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 画布工具栏 */}
      <div className="flex items-center gap-4 p-4 bg-gray-100 rounded-lg">
        <div className="flex items-center gap-2">
          <label htmlFor="brushSize" className="text-sm font-medium">
            画笔大小:
          </label>
          <input
            type="range"
            id="brushSize"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-20"
          />
          <span className="text-sm">{brushSize}px</span>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="brushColor" className="text-sm font-medium">
            颜色:
          </label>
          <input
            type="color"
            id="brushColor"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            className="w-10 h-10 rounded border"
          />
        </div>

        <button
          onClick={clearCanvas}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          清除画布
        </button>
      </div>

      {/* 画布 */}
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden shadow-lg">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="bg-white cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {/* 提示信息 */}
      <div className="text-sm text-gray-600 text-center">
        <p>在画布上绘画，AI会猜测你画的内容</p>
        <p>支持鼠标和触摸操作</p>
      </div>
    </div>
  )
}