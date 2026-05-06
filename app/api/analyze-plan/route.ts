// @ts-nocheck
/* eslint-disable */

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import knowledgeBase from '../../../data/sbc-knowledge.json';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const ANALYSIS_TOOL = {
  name: "submit_plan_analysis",
  description: "إرسال نتيجة تحليل المخطط المعماري بصيغة هيكلية مضمونة",
  input_schema: {
    type: "object",
    properties: {
      valid: { type: "boolean", description: "هل الصورة قابلة للتحليل كمخطط معماري" },
      errorMessage: { type: "string", description: "في حالة valid=false، السبب بالعربية" },
      planType: { type: "string", description: "نوع المخطط (مسقط، واجهة، قطاع، إلخ)" },
      summary: { type: "string", description: "ملخص في 1-2 جملة بالعربية" },
      compliance_score: { type: "number", description: "معدل الامتثال من 0 إلى 100" },
      total_items: { type: "number", description: "إجمالي البنود المراجعة" },
      critical_count: { type: "number", description: "عدد المخالفات الحرجة" },
      findings: {
        type: "array",
        description: "قائمة الملاحظات التفصيلية",
        items: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["pass", "fail", "warn"] },
            title: { type: "string" },
            observed: { type: "string", description: "ما لوحظ في المخطط" },
            required: { type: "string", description: "المطلوب حسب SBC" },
            article: { type: "string", description: "المرجع مثل: SBC 201 - 1004.2" },
            severity: { type: "string", enum: ["high", "medium", "low"] },
            details: { type: "string", description: "شرح تفصيلي بالعربية" }
          },
          required: ["type", "title", "observed", "required", "article", "details"]
        }
      },
      recommendations: { type: "array", items: { type: "string" } },
      limitations: { type: "string", description: "حدود التحليل بصراحة" }
    },
    required: ["valid", "summary", "findings"]
  }
};

const SYSTEM_PROMPT = `أنت مهندس استشاري سعودي خبير في كود البناء السعودي SBC، تعمل ضمن منصة CodeCheck.SA.

مهمتك: تحليل الصورة المرفوعة، استخراج العناصر المعمارية الظاهرة، ومقارنتها بمتطلبات SBC.

قواعد صارمة:
1. حلل فقط ما تراه فعلياً في الصورة. لا تخترع عناصر أو قياسات.
2. إذا كانت الصورة غير واضحة أو ليست مخططاً معمارياً، استخدم valid=false مع errorMessage يوضح السبب.
3. استشهد فقط بمراجع SBC من قاعدة المعرفة المرفقة. لا تخترع أرقام مواد.
4. كن صريحاً عن حدود التحليل في حقل limitations.
5. قدّم تقييماً متوازناً ومحايداً.
6. اللغة: عربية فصحى مهنية ودقيقة.
7. استخدم دائماً أداة submit_plan_analysis لإرسال النتيجة.

قاعدة المعرفة (المصدر الوحيد المسموح للاستشهاد):
${JSON.stringify(knowledgeBase.entries, null, 2)}`;

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'مفتاح API غير مكوّن' }, { status: 500 });
    }

    const body = await request.json();
    const { image, mediaType } = body;

    if (!image || !mediaType) {
      return NextResponse.json({ error: 'يُرجى إرفاق صورة أو ملف المخطط' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(mediaType)) {
      return NextResponse.json({ error: 'نوع الملف غير مدعوم. الصيغ: JPG, PNG, WebP, PDF' }, { status: 400 });
    }

    const contentBlock = mediaType === 'application/pdf'
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: image } }
      : { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } };

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: [ANALYSIS_TOOL],
      tool_choice: { type: 'tool', name: 'submit_plan_analysis' },
      messages: [
        {
          role: 'user',
          content: [
            contentBlock,
            { type: 'text', text: 'حلل هذا المخطط أو الصورة واستخدم أداة submit_plan_analysis لإرسال النتيجة.' },
          ],
        },
      ],
    });

    const toolUseBlock = response.content.find((b) => b.type === 'tool_use');

    if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
      const textBlock = response.content.find((b) => b.type === 'text');
      const fallbackText = textBlock && textBlock.type === 'text' ? textBlock.text : '';
      return NextResponse.json(
        { error: 'لم يتم استرجاع تحليل منظم. ' + fallbackText.slice(0, 200) },
        { status: 500 }
      );
    }

    const analysis = toolUseBlock.input;

    if (analysis.valid === false) {
      return NextResponse.json(
        { error: analysis.errorMessage || 'لم يتم التعرف على المخطط', valid: false },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ...analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Plan analysis error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التحليل: ' + (error.message || 'غير محدد') },
      { status: 500 }
    );
  }
}
