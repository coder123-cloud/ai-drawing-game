'use client'

import React from 'react'

interface AIGuess {
  text: string
  confidence?: number
  timestamp: Date
}

interface AIGuessDisplayProps {
  guesses: AIGuess[]
  isThinking: boolean
  currentGuess?: string
}

export default function AIGuessDisplay({
  guesses,
  isThinking,
  currentGuess
}: AIGuessDisplayProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
          AI 猜测结果
        </h2>

        {/* 当前猜测 */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
          {isThinking ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-600 font-medium">AI正在思考中...</span>
            </div>
          ) : currentGuess ? (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">AI的猜测:</p>
              <p className="text-2xl font-bold text-blue-600">{currentGuess}</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">开始绘画让AI来猜测你画的是什么吧！</p>
            </div>
          )}
        </div>

        {/* 历史猜测记录 */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">猜测历史</h3>

          {guesses.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              暂无猜测记录
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {guesses.map((guess, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{guess.text}</p>
                    {guess.confidence && (
                      <div className="flex items-center mt-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${guess.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600">
                          {Math.round(guess.confidence)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 ml-3">
                    {formatTime(guess.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 猜测统计 */}
        {guesses.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm text-gray-600">
              <span>总猜测次数: {guesses.length}</span>
              <span>平均置信度: {
                Math.round(
                  guesses.reduce((sum, g) => sum + (g.confidence || 0), 0) / guesses.length
                )
              }%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}