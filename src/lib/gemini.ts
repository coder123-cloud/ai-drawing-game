interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
      role: string
    }
    finishReason: string
    index: number
  }>
  usageMetadata: {
    promptTokenCount: number
    candidatesTokenCount: number
    totalTokenCount: number
  }
}

interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text?: string
      inlineData?: {
        mimeType: string
        data: string
      }
    }>
    role: string
  }>
  generationConfig?: {
    temperature?: number
    topK?: number
    topP?: number
    maxOutputTokens?: number
  }
}

export class GeminiAPI {
  private apiKey: string
  private baseURL: string = 'https://generativelanguage.googleapis.com/v1beta'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * 将 base64 图片数据转换为 Gemini API 所需的格式
   */
  private formatImageData(imageData: string): string {
    // 移除 data:image/png;base64, 前缀
    const base64Data = imageData.split(',')[1] || imageData
    return base64Data
  }

  /**
   * 调用 Gemini API 进行图片识别
   */
  async recognizeDrawing(imageData: string): Promise<{
    text: string
    confidence?: number
    error?: string
  }> {
    try {
      const request: GeminiRequest = {
        contents: [
          {
            parts: [
              {
                text: "请观察这幅画，猜测用户画的是什么物品或场景。请用最简洁的中文回答，只说出你认为是物品或场景的名称。例如：如果画的是苹果，就回答'苹果'。"
              },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: this.formatImageData(imageData)
                }
              }
            ],
            role: "user"
          }
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 100
        }
      }

      const response = await fetch(
        `${this.baseURL}/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request)
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Gemini API Error: ${response.status} - ${errorData.error?.message || response.statusText}`)
      }

      const data: GeminiResponse = await response.json()

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini API')
      }

      const candidate = data.candidates[0]
      if (candidate.finishReason !== 'STOP') {
        throw new Error(`Generation stopped: ${candidate.finishReason}`)
      }

      const generatedText = candidate.content.parts[0]?.text?.trim()

      if (!generatedText) {
        throw new Error('Empty response from Gemini API')
      }

      // 尝试从响应中提取置信度信息（Gemini API 不直接提供置信度）
      // 这里使用启发式方法：基于响应的确定性程度来估算
      const confidence = this.estimateConfidence(generatedText)

      return {
        text: generatedText,
        confidence
      }

    } catch (error) {
      console.error('Gemini API Error:', error)
      return {
        text: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * 估算猜测的置信度（启发式方法）
   */
  private estimateConfidence(text: string): number {
    // 基于文本特征估算置信度
    if (text.length === 0) return 0

    let confidence = 70 // 基础置信度

    // 如果回答简洁（通常意味着更确定）
    if (text.length <= 4) {
      confidence += 20
    } else if (text.length <= 8) {
      confidence += 10
    }

    // 如果包含常见的物品名称（增加置信度）
    const commonObjects = [
      '苹果', '香蕉', '汽车', '房子', '太阳', '月亮', '星星', '树木', '花朵', '小猫', '小狗',
      '电脑', '手机', '书', '椅子', '桌子', '门', '窗户', '山', '河流', '海洋', '飞机', '火车'
    ]

    if (commonObjects.some(obj => text.includes(obj))) {
      confidence += 10
    }

    // 如果包含不确定的词语（降低置信度）
    const uncertainWords = ['可能', '也许', '好像', '似乎', '大概', '可能是', '应该是']
    if (uncertainWords.some(word => text.includes(word))) {
      confidence -= 20
    }

    return Math.min(Math.max(confidence, 0), 100)
  }

  /**
   * 测试 API 连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseURL}/models?key=${this.apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )

      return response.ok
    } catch (error) {
      console.error('API connection test failed:', error)
      return false
    }
  }
}

// 创建 Gemini API 实例
export function createGeminiAPI(): GeminiAPI {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY environment variable is not set')
  }

  return new GeminiAPI(apiKey)
}