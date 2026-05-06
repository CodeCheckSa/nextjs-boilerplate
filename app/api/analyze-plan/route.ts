// @ts-nocheck
/* eslint-disable */

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import knowledgeBase from '../../../data/sbc-knowledge.json';

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

مهمتك: تحليل الصورة، استخراج العناصر المعمارية، ومقارنتها بـ SBC.

قواعد صارمة:
1. حلل فقط ما تراه فعلياً. لا تخترع.
2. إذا الصورة غير واضحة أو ليست مخططاً، استخدم valid=false.
3. استشهد فقط بمراجع SBC من قاعدة المعرفة.
4. املأ كل الحقول: planType, compliance_score (0-100), total_items, critical_count, findings (3-8 ملاحظات على الأقل), recommendations, limitations.
5. كن صريحاً ومحايداً.
6. اللغة: عربية فصحى مهنية.
7. استخدم دائماً أداة submit_plan_analysis.

قاعدة المعرفة:
${JSON.stringify(knowledgeBase.entries, null, 2)}`;

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'مفتاح API غير مكوّن' }, { status: 500 });
    }
    const body = await request.json();
    const { image, mediaType } = body;
    if (!image || !mediaType) {
      return NextResponse.json({ error: 'يُرجى إرفاق صورة أو ملف' }, { status: 400 });
    }
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(mediaType)) {
      return NextResponse.json({ error: 'نوع الملف غير مدعوم' }, { status: 400 });
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
            { type: 'text', text: 'حلل المخطط واملأ كل حقول الأداة بدقة.' },
          ],
        },
      ],
    });

    const toolUseBlock = response.content.find((b) => b.type === 'tool_use');
    if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
      return NextResponse.json({ error: 'لم يتم استرجاع تحليل منظم' }, { status: 500 });
    }

    const analysis: any = toolUseBlock.input;
    if (analysis.valid === false) {
      return NextResponse.json(
        { error: analysis.errorMessage || 'لم يتم التعرف على المخطط', valid: false },
        { status: 400 }
      );
    }

    // حساب الإحصائيات تلقائياً إذا كانت ناقصة
    const findings = analysis.findings || [];
    if (analysis.total_items == null) analysis.total_items = findings.length;
    if (analysis.critical_count == null) {
      analysis.critical_count = findings.filter((f: any) => f.type === 'fail' || f.severity === 'high').length;
    }
    if (analysis.compliance_score == null) {
      if (findings.length > 0) {
        const pass = findings.filter((f: any) => f.type === 'pass').length;
        const warn = findings.filter((f: any) => f.type === 'warn').length;
        analysis.compliance_score = Math.round(((pass + warn * 0.5) / findings.length) * 100);
      } else {
        analysis.compliance_score = 0;
      }
    }

    return NextResponse.json({ ...analysis, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error('Plan analysis error:', error);
    return NextResponse.json({ error: 'حدث خطأ: ' + (error.message || 'غير محدد') }, { status: 500 });
  }
}
