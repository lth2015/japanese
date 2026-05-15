import "server-only"

import { GoogleGenAI, Type } from "@google/genai"

let cached: GoogleGenAI | null = null

function getClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY?.trim()
  if (!key) return null
  if (!cached) cached = new GoogleGenAI({ apiKey: key })
  return cached
}

export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY?.trim()
}

export type DrillNaturalnessFeedback = {
  naturalVersion: string
  businessVersion: string
  casualVersion: string
  explanation: string
}

const DRILL_SYSTEM_INSTRUCTION = `你是日语写作教练。学习者具备 N2/N1 阅读水平，但口语 / 写作输出能力较弱。
任务：根据中文意图和学习者的日语原句，给出三档自然表达（自然 / 商务敬語 / 朋友口语）以及一句简洁中文点评。

规则：
- 三档版本必须语义等价、传达相同信息。
- "natural"：最常用、不卑不亢的丁宁体（です・ます），日常工作沟通最常听到的说法。
- "business"：敬語（尊敬語 / 謙譲語），用于上司、客户、第一次接触场景。
- "casual"：朋友、同期、私下闲聊用的简体口语，可以使用缩约和语气词。
- "explanation"：用 1-2 句中文指出学习者原句的具体问题（语法 / 词汇 / register / 自然度）；若原句已经自然，则简短说明它为什么自然，再点出可以更地道的细微调整。**绝不输出"很好"这类无信息反馈**。
- 全部输出避免罗马字、避免英文术语，直接给目标语言例句。`

const DRILL_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    naturalVersion: { type: Type.STRING },
    businessVersion: { type: Type.STRING },
    casualVersion: { type: Type.STRING },
    explanation: { type: Type.STRING },
  },
  required: ["naturalVersion", "businessVersion", "casualVersion", "explanation"],
  propertyOrdering: ["naturalVersion", "businessVersion", "casualVersion", "explanation"],
}

export async function generateDrillNaturalnessFeedback(input: {
  chinese: string
  userInput: string
  reference: string
}): Promise<DrillNaturalnessFeedback | null> {
  const ai = getClient()
  if (!ai) return null

  const prompt = `中文意图：${input.chinese}
参考日语（语料库自带的一种自然说法）：${input.reference}
学习者写的日语：${input.userInput}

请按 JSON schema 输出三档版本和一句中文点评。`

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: DRILL_SYSTEM_INSTRUCTION,
      temperature: 0.4,
      responseMimeType: "application/json",
      responseSchema: DRILL_RESPONSE_SCHEMA,
    },
  })

  const text = response.text
  if (!text) throw new Error("Gemini returned empty response")

  const parsed = JSON.parse(text) as DrillNaturalnessFeedback
  return {
    naturalVersion: parsed.naturalVersion.trim(),
    businessVersion: parsed.businessVersion.trim(),
    casualVersion: parsed.casualVersion.trim(),
    explanation: parsed.explanation.trim(),
  }
}
