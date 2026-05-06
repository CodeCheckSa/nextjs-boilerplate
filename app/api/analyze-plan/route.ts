// @ts-nocheck
/* eslint-disable */

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import knowledgeBase from '../../../data/sbc-knowledge.json';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `أنت مهندس استشاري سعودي خبير في كود البناء السعودي SBC، تعمل ضمن منصة CodeCheck.SA لتحليل المخططات المعمارية بدقة وحياد.

مهمتك: تحليل المخطط أو الصورة المرفوعة، استخراج العناصر المعمارية الظاهرة، ومقارنتها بمتطلبات SBC.

قواعد صارمة لا يجوز خرقها:
1. حلل فقط ما تراه فعلياً وبوضوح في الصورة. لا تخترع عناصر أو قياسات غير ظاهرة.
2. إذا كانت الصورة غير واضحة، أو ليست مخططاً معمارياً، أو غير قابلة للتحليل الهندسي، أعد valid=false مع سبب واضح.
3. استشهد فقط بمراجع SBC الموجودة في قاعدة المعرفة المرفقة. لا تخترع أرقام مواد.
4. كن صريحاً عن حدود التحليل (مثلاً: لا يمكن قراءة الأبعاد بدون مقياس).
5. قدّم تقييماً متوازناً: نقاط مطابقة + مخالفات محتملة + توصيات.
6. اللغة: عربية فصحى مهنية، دقيقة، بدون مبالغة.

أعد إجابتك بصيغة JSON خالصة (بدون أي نص أو علامات markdown خارج JSON):

{
  "valid": true,
  "errorMessage": "",
  "planType": "نوع المخطط (مسقط أفقي، واجهة، قطاع، إلخ)",
  "summary": "ملخص في 1-2 جملة",
  "compliance_score": 75,
  "total_items": 8,
  "critical_count": 2,
  "findings": [
    {
      "type": "pass",
      "title": "العنوان المختصر",
      "observed": "ما لوحظ فعلياً",
      "required": "المطلوب حسب SBC",
      "article": "SBC 201 - 1004.2",
      "severity": "low",
      "details": "شرح تفصيلي"
    }
  ],
  "recommendations": ["توصية 1", "توصية 2"],
  "limitations": "حدود التحليل بصراحة"
}

قاعدة المعرفة (المصدر الوحيد المسموح للاستشهاد):
${JSON.stringify(knowledgeBase.entries, null, 2)}`;

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'مفتاح API غير مكوّن' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { image, mediaType } = body;

    if (!image || !mediaType) {
      return NextResponse.json(
        { error: 'يُرجى إرفاق صورة أو ملف المخطط' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(mediaType)) {
      return NextResponse.json(
        { error: 'نوع الملف غير مدعوم. الصيغ المقبولة: JPG, PNG, WebP, PDF' },
        { status: 400 }
      );
    }

    const contentBlock = mediaType === 'application/pdf'
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: image } }
      : { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } };

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            contentBlock,
            { type: 'text', text: 'حلل هذا المخطط أو الصورة. أعد التقرير بصيغة JSON كما هو محدد بدقة.' },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    let answerText = textBlock && textBlock.type === 'text' ? textBlock.text : '';

    answerText = answerText.replace(/```json\s*|```\s*/g, '').trim();
    const jsonStart = answerText.indexOf('{');
    const jsonEnd = answerText.lastIndexOf('}');
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      answerText = answerText.slice(jsonStart, jsonEnd + 1);
    }

    let analysis;
    try {
      analysis = JSON.parse(answerText);
    } catch (e) {
      return NextResponse.json(
        { error: 'تعذر قراءة نتائج التحليل. يُرجى المحاولة مرة أخرى.' },
        { status: 500 }
      );
    }

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
      { error: 'حدث خطأ أثناء التحليل. يُرجى المحاولة لاحقاً.' },
      { status: 500 }
    );
  }
}
