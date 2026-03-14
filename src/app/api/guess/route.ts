import { NextRequest, NextResponse } from 'next/server'
import { createGeminiAPI } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const { imageData } = await request.json()

    if (!imageData) {
      return NextResponse.json(
        { error: '请提供图片数据' },
        { status: 400 }
      )
    }

    // 验证图片数据格式
    if (typeof imageData !== 'string' || !imageData.startsWith('data:image/')) {
      return NextResponse.json(
        { error: '无效的图片数据格式' },
        { status: 400 }
      )
    }

    // 创建 Gemini API 实例
    const geminiAPI = createGeminiAPI()

    // 调用 API 进行图片识别
    const result = await geminiAPI.recognizeDrawing(imageData)

    if (result.error) {
      return NextResponse.json(
        { error: `AI识别失败: ${result.error}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      guess: result.text,
      confidence: result.confidence
    })

  } catch (error) {
    console.error('Guess API Error:', error)

    // 根据错误类型返回不同的错误信息
    if (error instanceof Error) {
      if (error.message.includes('GOOGLE_GEMINI_API_KEY')) {
        return NextResponse.json(
          { error: '服务器配置错误：缺少 API 密钥' },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { error: `处理请求时出错: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: '未知错误发生' },
      { status: 500 }
    )
  }
}