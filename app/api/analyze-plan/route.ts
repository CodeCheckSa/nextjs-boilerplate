// app/api/analyze-plan/route.ts
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import sbcKnowledge from '@/data/sbc-knowledge.json';

export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-haiku-4-5-20251001';

const KB_COMPACT = (sbcKnowledge as any).entries
  .map((e: any) => `[${e.id}] ${e.code} ${e.section} — ${e.title}: ${e.content} (المصدر: ${e.source})`)
  .join('\n');

const EXTRACTION_TOOL = {
  name: 'extract_plan_elements',
  description: 'استخراج العناصر المعمارية المرئية من المخطط. استخرج كل ما تراه بدقة دون أي تقييم أو حكم على الامتثال.',
  input_schema: {
    type: 'object' as const,
    properties: {
      planType: { type: 'string', description: 'نوع المخطط (فيلا، دوبلكس، عمارة سكنية، مخطط دور، إلخ)' },
      occupancy: { type: 'string', description: 'التصنيف الإشغالي المرجح: R-3 أو R-2 أو غير محدد' },
      floors_count: { type: 'integer', description: 'عدد الطوابق الظاهرة أو المذكورة' },
      units_count: { type: 'integer', description: 'عدد الوحدات السكنية' },
      spaces: {
        type: 'array',
        description: 'كل الفراغات المرئية بالاسم (مجلس، نوم، مطبخ، حمام، صالة، مستودع، إلخ)',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'اسم الفراغ كما هو مكتوب' },
            floor: { type: 'string', description: 'الدور (أرضي/أول/ثاني)' },
            written_dimension: { type: 'string', description: 'البعد أو المساحة المكتوبة صراحة، أو فارغ إن لم تُكتب' },
          },
          required: ['name'],
        },
      },
      exits_count: { type: 'integer', description: 'عدد المخارج/المداخل المرئية' },
      stairs_count: { type: 'integer', description: 'عدد السلالم المرئية' },
      shared_walls: { type: 'string', description: 'وصف الجدران المشتركة بين الوحدات إن وجدت، أو "لا يوجد"' },
      written_measurements: {
        type: 'array',
        items: { type: 'string' },
        description: 'كل قياس رقمي مكتوب صراحة على المخطط (ارتدادات، عروض، مساحات، ارتفاعات)',
      },
      scale_present: { type: 'boolean', description: 'هل يوجد مقياس رسم ظاهر' },
      other_elements: {
        type: 'array',
        items: { type: 'string' },
        description: 'عناصر إضافية مرئية: مواقف، أسوار، ملاحق، فتحات تهوية، شبابيك، إلخ',
      },
      quality_notes: { type: 'string', description: 'ملاحظات على جودة الصورة أو وضوح المخطط' },
    },
    required: ['planType', 'floors_count', 'spaces'],
  },
};

const EXTRACTION_PROMPT = `أنت محلل رؤية حاسوبية متخصص في المخططات المعمارية السعودية.
مهمتك الوحيدة: استخراج كل العناصر المرئية من المخطط بدقة وحياد، عبر أداة extract_plan_elements.

قواعد:
1. استخرج كل فراغ مسمّى تراه — لا تتجاهل أي فراغ.
2. انقل القياسات المكتوبة حرفياً. لا تخمّن أي قياس غير مكتوب.
3. لا تقيّم ولا تحكم على الامتثال — الاستخراج فقط.
4. اكتب الأسماء بالعربية كما تظهر في المخطط.`;
const COMPLIANCE_TOOL = {
  name: 'submit_compliance_report',
  description: 'إرسال تقرير الامتثال النهائي المبني على العناصر المستخرجة وقاعدة المعرفة التنظيمية.',
  input_schema: {
    type: 'object' as const,
    properties: {
      planType: { type: 'string', description: 'نوع المخطط' },
      summary: { type: 'string', description: 'ملخص عربي مهني للتحليل (3-5 جمل)' },
      findings: {
        type: 'array',
        minItems: 5,
        description: 'ملاحظات التدقيق التفصيلية. إلزامي: ملاحظة لكل عنصر معماري مستخرج قابل للتقييم.',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['pass', 'fail', 'warn'], description: 'pass=مطابق، fail=مخالف، warn=يتطلب مراجعة يدوية' },
            title: { type: 'string', description: 'عنوان الملاحظة' },
            article: { type: 'string', description: 'المرجع التنظيمي الرسمي من قاعدة المعرفة (مثال: SBC 1101 — القسم 4.2)' },
            details: { type: 'string', description: 'شرح الملاحظة' },
            observed: { type: 'string', description: 'ما رُصد في المخطط' },
            required: { type: 'string', description: 'ما يتطلبه الكود' },
          },
          required: ['type', 'title', 'article', 'observed', 'required'],
        },
      },
      recommendations: {
        type: 'array',
        items: { type: 'string' },
        description: 'توصيات عملية للمصمم أو مقدم الطلب',
      },
      limitations: { type: 'string', description: 'حدود التحليل: قياسات غير متاحة، جودة صورة، عناصر تتطلب فحصاً ميدانياً' },
    },
    required: ['planType', 'summary', 'findings', 'limitations'],
  },
};

function buildCompliancePrompt(extraction: any): string {
  return `أنت مدقق امتثال معتمد لكود البناء السعودي SBC 2024 واشتراطات إنشاء المباني السكنية (قرار وزاري 4500943139).

قاعدة المعرفة التنظيمية (118 إدخالاً موثقاً):
${KB_COMPACT}

=== العناصر المستخرجة من المخطط (حقائق مؤكدة من طبقة الرؤية) ===
${JSON.stringify(extraction, null, 2)}

مهمتك: عبر أداة submit_compliance_report، أنشئ ملاحظة تدقيق لكل عنصر مستخرج قابل للتقييم. القائمة أعلاه حقائق مثبتة — لا تشكك فيها ولا تطلب التحقق منها.

قواعد إلزامية:
1. لكل فراغ في spaces: ملاحظة تقارن وجوده ومتطلباته مع قاعدة المعرفة (الفراغات الإلزامية، الإضاءة والتهوية الطبيعية، المساحات الدنيا إن وُجد بُعد مكتوب).
2. للتصنيف الإشغالي وعدد الطوابق والوحدات: ملاحظة مطابقة مع متطلبات التصنيف.
3. للمخارج والسلالم والجدران المشتركة: ملاحظة لكل عنصر وفق متطلبات الحريق والإخلاء.
4. لكل قياس مكتوب في written_measurements: ملاحظة تقارنه بالحد النظامي من قاعدة المعرفة.
5. كل ملاحظة تستشهد بمرجع محدد من قاعدة المعرفة في حقل article. إذا لم تجد مرجعاً مباشراً: type=warn و article="يتطلب مراجعة يدوية — خارج نطاق قاعدة المعرفة الحالية".
6. ممنوع اختراع أرقام. القياس غير المكتوب يُذكر غيابه في observed ويُصنف warn.
7. مزيج واقعي من pass/fail/warn حسب ما يستحقه كل عنصر — لا تجامل ولا تتشدد.
8. اللغة: عربية فصحى مهنية.`;
}
export async function POST(request: Request) {
  try {
    const { image, mediaType } = await request.json();

    if (!image || !mediaType) {
      return NextResponse.json({ error: 'الملف أو نوعه مفقود' }, { status: 400 });
    }

    const fileBlock =
      mediaType === 'application/pdf'
        ? { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: image } }
        : { type: 'image' as const, source: { type: 'base64' as const, media_type: mediaType, data: image } };

    const extractionResponse = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: EXTRACTION_PROMPT,
      tools: [EXTRACTION_TOOL],
      tool_choice: { type: 'tool', name: 'extract_plan_elements' },
      messages: [
        {
          role: 'user',
          content: [
            fileBlock as any,
            { type: 'text', text: 'استخرج كل العناصر المعمارية المرئية من هذا المخطط.' },
          ],
        },
      ],
    });

    const extractionBlock = extractionResponse.content.find((b: any) => b.type === 'tool_use');
    if (!extractionBlock) {
      return NextResponse.json({ error: 'تعذّر استخراج عناصر المخطط. جرّب صورة أوضح.' }, { status: 422 });
    }
    const extraction = (extractionBlock as any).input;

    const complianceResponse = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: buildCompliancePrompt(extraction),
      tools: [COMPLIANCE_TOOL],
      tool_choice: { type: 'tool', name: 'submit_compliance_report' },
      messages: [
        {
          role: 'user',
          content: 'أنشئ تقرير الامتثال الكامل الآن. ملاحظة لكل عنصر مستخرج قابل للتقييم.',
        },
      ],
    });

    const reportBlock = complianceResponse.content.find((b: any) => b.type === 'tool_use');
    if (!reportBlock) {
      return NextResponse.json({ error: 'تعذّر توليد تقرير الامتثال. حاول مرة أخرى.' }, { status: 422 });
    }
    const report = (reportBlock as any).input;

    const findings = Array.isArray(report.findings) ? report.findings : [];
    const passCount = findings.filter((f: any) => f.type === 'pass').length;
    const failCount = findings.filter((f: any) => f.type === 'fail').length;
    const warnCount = findings.filter((f: any) => f.type === 'warn').length;
    const totalItems = findings.length;

    const complianceScore =
      totalItems > 0 ? Math.round((100 * (passCount + 0.5 * warnCount)) / totalItems) : 0;

    return NextResponse.json({
      planType: report.planType || extraction.planType || 'مخطط سكني',
      summary: report.summary || '',
      compliance_score: complianceScore,
      total_items: totalItems,
      critical_count: failCount,
      findings,
      recommendations: Array.isArray(report.recommendations) ? report.recommendations : [],
      limitations: report.limitations || '',
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error('analyze-plan error:', err?.message || err);

    if (err?.status === 429) {
      return NextResponse.json({ error: 'تجاوز حد الطلبات. انتظر دقيقة وحاول مجدداً.' }, { status: 429 });
    }
    if (err?.status === 400 && String(err?.message || '').includes('image')) {
      return NextResponse.json({ error: 'تعذّرت قراءة الصورة. تأكد من الصيغة (JPG/PNG/PDF) والحجم.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'حدث خطأ أثناء التحليل. حاول مرة أخرى.' }, { status: 500 });
  }
}
