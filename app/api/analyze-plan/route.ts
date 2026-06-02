// @ts-nocheck
/* eslint-disable */

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import knowledgeBase from '../../../data/sbc-knowledge.json';

export const maxDuration = 60; // مهلة التحليل حتى 60 ثانية (تحليل الرؤية قد يطول)

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ANALYSIS_TOOL = {
  name: "submit_plan_analysis",
  description: "إرسال نتيجة تحليل المخطط المعماري بصيغة هيكلية",
  input_schema: {
    type: "object",
    properties: {
      valid: { type: "boolean" },
      errorMessage: { type: "string" },
      planType: { type: "string" },
      summary: { type: "string" },
      compliance_score: { type: "number" },
      total_items: { type: "number" },
      critical_count: { type: "number" },
      findings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["pass", "fail", "warn"] },
            title: { type: "string" },
            observed: { type: "string" },
            required: { type: "string" },
            article: { type: "string" },
            severity: { type: "string", enum: ["high", "medium", "low"] },
            details: { type: "string" }
          },
          required: ["type", "title", "observed", "required", "article", "details"]
        }
      },
      recommendations: { type: "array", items: { type: "string" } },
      limitations: { type: "string" }
    },
    required: ["valid", "summary", "findings"]
  }
};

const SYSTEM_PROMPT = `أنت مهندس استشاري سعودي خبير في كود البناء السعودي SBC، تعمل ضمن منصة CodeCheck.SA.

مهمتك: تحليل الصورة، استخراج العناصر المعمارية الظاهرة، ومقارنتها بـ SBC.

قواعد صارمة لا تُخرَق إطلاقاً:
1. حلل فقط ما تراه بوضوح. **ممنوع منعاً باتاً تخمين أي قياس أو بعد غير مكتوب صراحة على المخطط.** إذا لم يكن البعد مقروءاً، اذكر ذلك في limitations ولا تخترع رقماً.
2. إذا الصورة غير واضحة، أو ليست مخططاً معمارياً (صورة شخصية، نص، مستند عشوائي)، استخدم valid=false مع errorMessage يوضح السبب بلطف.
3. استشهد فقط بمراجع SBC الموجودة في قاعدة المعرفة المرفقة. **ممنوع اختراع أرقام مواد.** إن لم تجد مرجعاً مناسباً، اذكر الملاحظة كـ"تحتاج مراجعة يدوية" دون رقم مادة مخترع.
4. كن صريحاً تماماً عن حدود التحليل في حقل limitations (مثل: عدم وجود مقياس، جودة صورة منخفضة، عناصر غير مكتملة).
5. قدم تقييماً متوازناً ومحايداً (نقاط مطابقة + مخالفات + توصيات).
6. اللغة: عربية فصحى مهنية دقيقة.
7. استخدم دائماً أداة submit_plan_analysis.

قاعدة المعرفة (المصدر الوحيد المسموح للاستشهاد):
${JSON.stringify(knowledgeBase.entries, null, 2)}`;

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'مفتاح API غير مكوّن' }, { status: 500 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
    }

    const { image, mediaType } = body || {};

    if (!image || !mediaType) {
      return NextResponse.json({ error: 'يُرجى إرفاق صورة أو ملف المخطط' }, { status: 400 });
    }

    // تحقق من نوع الملف
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(mediaType)) {
      return NextResponse.json({ error: 'نوع الملف غير مدعوم. الصيغ المقبولة: JPG, PNG, WebP, PDF' }, { status: 400 });
    }

    // تحقق من سلامة البيانات (base64 غير فارغ أو تالف)
    if (typeof image !== 'string' || image.length < 100) {
      return NextResponse.json({ error: 'الملف تالف أو فارغ. يُرجى إعادة الرفع.' }, { status: 400 });
    }

    // تحقق من الحجم على الخادم (≈ حجم base64 * 0.75)
    const approxBytes = (image.length * 3) / 4;
    if (approxBytes > 5.5 * 1024 * 1024) {
      return NextResponse.json({ error: 'حجم الملف يتجاوز الحد المسموح (5MB).' }, { status: 400 });
    }

    const contentBlock = mediaType === 'application/pdf'
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: image } }
      : { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } };

    let response;
    try {
      response = await client.messages.create({
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
              { type: 'text', text: 'حلل المخطط واملأ كل حقول الأداة بدقة، دون تخمين أي قياس غير ظاهر.' },
            ],
          },
        ],
      });
    } catch (apiErr) {
      // أخطاء من Anthropic (صورة غير مقروءة، حد المعدل، إلخ)
      const msg = apiErr?.message || '';
      if (msg.includes('rate') || apiErr?.status === 429) {
        return NextResponse.json({ error: 'الخدمة مزدحمة حالياً. حاول بعد لحظات.' }, { status: 429 });
      }
      if (msg.includes('image') || msg.includes('media') || apiErr?.status === 400) {
        return NextResponse.json({ error: 'تعذّرت قراءة الملف. تأكد أنه صورة أو PDF صالح وواضح.' }, { status: 400 });
      }
      return NextResponse.json({ error: 'تعذّر إجراء التحليل حالياً. حاول لاحقاً.' }, { status: 502 });
    }

    const toolUseBlock = response.content.find((b) => b.type === 'tool_use');
    if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
      return NextResponse.json({ error: 'لم يتم استرجاع تحليل منظم. حاول مرة أخرى.' }, { status: 500 });
    }

    const analysis = toolUseBlock.input;

    if (analysis.valid === false) {
      return NextResponse.json(
        { error: analysis.errorMessage || 'لم يتم التعرف على الملف كمخطط معماري. يُرجى رفع مخطط واضح.', valid: false },
        { status: 400 }
      );
    }

    // حساب الإحصائيات تلقائياً إذا كانت ناقصة
    const findings = analysis.findings || [];
    if (analysis.total_items == null) analysis.total_items = findings.length;
    if (analysis.critical_count == null) {
      analysis.critical_count = findings.filter((f) => f.type === 'fail' || f.severity === 'high').length;
    }
    if (analysis.compliance_score == null) {
      if (findings.length > 0) {
        const pass = findings.filter((f) => f.type === 'pass').length;
        const warn = findings.filter((f) => f.type === 'warn').length;
        analysis.compliance_score = Math.round(((pass + warn * 0.5) / findings.length) * 100);
      } else {
        analysis.compliance_score = 0;
      }
    }

    return NextResponse.json({ ...analysis, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Plan analysis error:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع. يُرجى المحاولة لاحقاً.' }, { status: 500 });
  }
}
