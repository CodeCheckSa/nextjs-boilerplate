// app/api/analyze-plan/route.ts
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import sbcKnowledge from '@/data/sbc-knowledge.json';
import { prepareFileForClaude } from '@/lib/prepare-file';
import { del } from '@vercel/blob';

export const runtime = 'nodejs';
export const maxDuration = 300;

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
  description: 'إرسال تقرير الامتثال النهائي. المصفوفة findings إلزامية ويجب أن تحوي 6 إلى 10 ملاحظات — التقرير بدونها مرفوض.',
  input_schema: {
    type: 'object' as const,
    properties: {
      findings: {
        type: 'array',
        minItems: 5,
        maxItems: 12,
        description: 'ملاحظات التدقيق. أنشئها أولاً قبل أي حقل آخر. اختر أهم 6-10 عناصر مستخرجة وأنشئ ملاحظة لكل منها.',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['pass', 'fail', 'warn'], description: 'pass=مطابق، fail=مخالف، warn=يتطلب مراجعة يدوية' },
            title: { type: 'string', description: 'عنوان الملاحظة' },
            article: { type: 'string', description: 'المرجع التنظيمي من قاعدة المعرفة (مثال: SBC 1101 — القسم 4.2)' },
            details: { type: 'string', description: 'شرح موجز (جملة إلى جملتين)' },
            observed: { type: 'string', description: 'ما رُصد في المخطط' },
            required: { type: 'string', description: 'ما يتطلبه الكود' },
          },
          required: ['type', 'title', 'article', 'observed', 'required'],
        },
      },
      planType: { type: 'string', description: 'نوع المخطط' },
      summary: { type: 'string', description: 'ملخص عربي مهني (3-4 جمل)' },
      recommendations: {
        type: 'array',
        items: { type: 'string' },
        description: 'توصيات عملية (3-5 توصيات قصيرة)',
      },
      limitations: { type: 'string', description: 'حدود التحليل بإيجاز' },
    },
    required: ['findings', 'planType', 'summary', 'limitations'],
  },
};

function buildCompliancePrompt(extraction: any): string {
  return `أنت مدقق امتثال معتمد لكود البناء السعودي SBC 2024 واشتراطات إنشاء المباني السكنية (قرار وزاري 4500943139).

قاعدة المعرفة التنظيمية (118 إدخالاً موثقاً):
${KB_COMPACT}

=== العناصر المستخرجة من المخطط (حقائق مؤكدة من طبقة الرؤية) ===
${JSON.stringify(extraction, null, 2)}

مهمتك عبر أداة submit_compliance_report:

أولاً وقبل كل شيء: ابنِ المصفوفة findings — اختر أهم 6 إلى 10 عناصر من القائمة المستخرجة أعلاه (الفراغات، التصنيف، الطوابق، المخارج، السلالم، الجدران المشتركة، القياسات المكتوبة) وأنشئ ملاحظة تدقيق لكل عنصر. القائمة حقائق مثبتة — التقييم الكيفي عليها ممكن ومطلوب حتى بدون قياسات دقيقة.

قواعد:
1. كل ملاحظة تستشهد بمرجع من قاعدة المعرفة في article. لا مرجع مباشر؟ type=warn و article="يتطلب مراجعة يدوية".
2. ممنوع اختراع أرقام. القياس غير المكتوب: type=warn مع ذكر غيابه في observed.
3. مزيج واقعي pass/fail/warn حسب ما يستحقه كل عنصر.
4. التقرير الذي تكون فيه findings فارغة مرفوض تلقائياً وسيُعاد إليك.
5. اللغة: عربية فصحى مهنية، موجزة.`;
}

export async function POST(request: Request) {
  let blobUrl: string | null = null;
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'رابط الملف مفقود' }, { status: 400 });
    }
    blobUrl = url;

    const fileBlock = await prepareFileForClaude(url);

    // ---------- المرحلة 1: الاستخراج ----------
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

    // ---------- المرحلة 2: التدقيق مع الرفض والإعادة ----------
    const systemPrompt = buildCompliancePrompt(extraction);
    let messages: any[] = [
      {
        role: 'user',
        content: 'أنشئ تقرير الامتثال الآن. ابدأ بالمصفوفة findings: ملاحظة لكل عنصر من أهم 6-10 عناصر مستخرجة.',
      },
    ];

    let report: any = null;

    for (let attempt = 0; attempt < 1; attempt++) {
      const resp = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 5000,
        system: systemPrompt,
        tools: [COMPLIANCE_TOOL],
        tool_choice: { type: 'tool', name: 'submit_compliance_report' },
        messages,
      });

      const block = resp.content.find((b: any) => b.type === 'tool_use');
      const candidate = block ? (block as any).input : null;

      if (candidate && Array.isArray(candidate.findings) && candidate.findings.length > 0) {
        report = candidate;
        break;
      }

      console.error(
        `compliance attempt ${attempt} rejected — stop_reason: ${resp.stop_reason}, findings: ${candidate ? JSON.stringify(candidate.findings) : 'no tool_use'}`
      );

      if (!block) break;

      // رفض رسمي عبر tool_result — الموديل ملزم بإعادة المحاولة
      messages = [
        ...messages,
        { role: 'assistant', content: resp.content },
        {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: (block as any).id,
              is_error: true,
              content:
                'مرفوض: المصفوفة findings فارغة. أعد إرسال التقرير كاملاً عبر الأداة، وابدأ ببناء findings: ملاحظة واحدة لكل عنصر من العناصر المستخرجة (الفراغات، التصنيف، الطوابق، المخارج، السلالم، الجدران المشتركة) — بين 6 و10 ملاحظات إلزامياً.',
            },
          ],
        },
      ];
    }

    if (!report) {
      return NextResponse.json({ error: 'تعذّر توليد ملاحظات التدقيق. حاول مرة أخرى.' }, { status: 422 });
    }

    // ---------- الإحصائيات تُحسب في الخادم ----------
    const findings = report.findings;
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
  } finally {
    if (blobUrl) await del(blobUrl).catch(() => {});
  }
}
