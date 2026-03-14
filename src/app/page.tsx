'use client'

import React, { useState, useCallback } from 'react'
import DrawingCanvas from '@/components/DrawingCanvas'
import AIGuessDisplay from '@/components/AIGuessDisplay'

interface AIGuess {
  text: string
  confidence?: number
  timestamp: Date
}

export default function Home() {
  const [guesses, setGuesses] = useState<AIGuess[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [currentGuess, setCurrentGuess] = useState<string>('')
  const [canvasData, setCanvasData] = useState<string>('')
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  // 处理AI猜测请求
  const requestAIGuess = useCallback(async (imageData: string) => {
    if (!imageData || imageData === canvasData) return

    setIsThinking(true)
    setCurrentGuess('')

    try {
      const response = await fetch('/api/guess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData }),
      })

      const data = await response.json()

      if (data.success && data.guess) {
        const newGuess: AIGuess = {
          text: data.guess,
          confidence: data.confidence,
          timestamp: new Date()
        }

        setCurrentGuess(data.guess)
        setGuesses(prev => [newGuess, ...prev])
      } else {
        setCurrentGuess('识别失败，请重试')
        console.error('AI Guess Error:', data.error)
      }
    } catch (error) {
      setCurrentGuess('网络错误，请检查连接')
      console.error('Request Error:', error)
    } finally {
      setIsThinking(false)
    }
  }, [canvasData])

  // 防抖处理画布变化
  const handleCanvasChange = useCallback((newCanvasData: string) => {
    setCanvasData(newCanvasData)

    // 清除之前的定时器
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // 设置新的定时器，延迟2秒后发送AI猜测请求
    const timer = setTimeout(() => {
      requestAIGuess(newCanvasData)
    }, 2000)

    setDebounceTimer(timer)
  }, [debounceTimer, requestAIGuess])

  // 处理绘画状态变化
  const handleDrawingChange = useCallback((drawing: boolean) => {
    setIsDrawing(drawing)

    if (!drawing && canvasData) {
      // 停止绘画时，延迟1秒后发送AI猜测请求
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      const timer = setTimeout(() => {
        requestAIGuess(canvasData)
      }, 1000)

      setDebounceTimer(timer)
    }
  }, [canvasData, debounceTimer, requestAIGuess])

  // 手动触发AI猜测
  const handleManualGuess = useCallback(() => {
    if (canvasData) {
      requestAIGuess(canvasData)
    }
  }, [canvasData, requestAIGuess])

  // 清除猜测历史
  const clearHistory = useCallback(() => {
    setGuesses([])
    setCurrentGuess('')
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            AI 你画我猜
          </h1>
          <p className="text-lg text-gray-600">
            在画布上绘画，让AI来猜测你画的是什么！
          </p>
        </header>

        {/* 控制按钮 */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={handleManualGuess}
            disabled={isThinking || !canvasData}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isThinking ? 'AI思考中...' : '立即猜测'}
          </button>

          <button
            onClick={clearHistory}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            清除历史
          </button>
        </div>

        {/* 状态指示器 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isDrawing ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">
              {isDrawing ? '正在绘画...' : '等待绘画'}
            </span>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* 左侧：画布区域 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-xl p-6">
              <DrawingCanvas
                onDrawingChange={handleDrawingChange}
                onCanvasChange={handleCanvasChange}
                width={700}
                height={500}
              />
            </div>
          </div>

          {/* 右侧：AI猜测结果 */}
          <div className="lg:col-span-1">
            <AIGuessDisplay
              guesses={guesses}
              isThinking={isThinking}
              currentGuess={currentGuess}
            />
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">使用说明</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">🎨 绘画技巧</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 尽量画清晰的物品或场景</li>
                <li>• 使用简洁的线条</li>
                <li>• 避免过于复杂的细节</li>
                <li>• 可以调整画笔大小和颜色</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">🤖 AI提示</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• AI会在你停止绘画后自动猜测</li>
                <li>• 也可以手动点击&quot;立即猜测&quot;</li>
                <li>• 猜测结果包含置信度显示</li>
                <li>• 支持多种物品和场景识别</li>
              </ul>
            </div>
          </div>
        </div>

        {/* API配置提示 */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>注意：</strong> 使用前请确保在 <code className="bg-yellow-100 px-1 rounded">.env.local</code> 文件中配置了有效的 Google Gemini API Key。
          </p>
        </div>
      </div>
    </div>
  )
}
