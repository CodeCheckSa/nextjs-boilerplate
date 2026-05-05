// @ts-nocheck
/* eslint-disable */

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import knowledgeBase from '../../../data/sbc-knowledge.json';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `أنت مساعد متخصص في كود البناء السعودي SBC ضمن منصة CodeCheck.SA.

قواعد صارمة يجب اتباعها بدقة تامة:

1. أجب فقط من قاعدة المعرفة المرفقة أدناه. لا تستخدم أي معلومات خارجها مهما كانت معرفتك بالموضوع.

2. إذا لم يكن السؤال مغطى في قاعدة المعرفة، رد بالنص الحرفي التالي بدون أي إضافة:
"هذا السؤال خارج نطاق قاعدة المعرفة الحالية. للإجابة الدقيقة، يُرجى الرجوع للوثائق الرسمية على sbc.gov.sa أو استشارة مكتب هندسي معتمد."

3. اذكر دائماً المصدر في نهاية إجابتك بهذا التنسيق:
"المرجع: [الكود]، [القسم]"

4. لا تخمّن أرقام مواد أو قيم رقمية غير موجودة في قاعدة المعرفة.

5. أجب باللغة العربية الفصحى المهنية، بأسلوب مختصر ومباشر (150-300 كلمة كحد أقصى).

6. إذا كان السؤال غامضاً، اطلب توضيحاً من المستخدم.

7. لا تذكر أبداً أنك "ذكاء اصطناعي" أو "Claude" — قدم نفسك كمحرك CodeCheck.SA.

قاعدة المعرفة الكاملة (${knowledgeBase.entries.length} إدخال):
${JSON.stringify(knowledgeBase.entries, null, 2)}`;

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'مفتاح API غير مكوّن. يُرجى إعداد ANTHROPIC_API_KEY في بيئة Vercel.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const query = body.query;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'يُرجى تقديم سؤال صحيح.' },
        { status: 400 }
      );
    }

    if (query.length > 500) {
      return NextResponse.json(
        { error: 'السؤال طويل جداً. الحد الأقصى 500 حرف.' },
        { status: 400 }
      );
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: query.trim() }
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const answer = textBlock && textBlock.type === 'text' ? textBlock.text : 'لم أتمكن من توليد إجابة.';

    return NextResponse.json({
      answer,
      query: query.trim(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء معالجة السؤال. يُرجى المحاولة لاحقاً.' },
      { status: 500 }
    );
  }
}
