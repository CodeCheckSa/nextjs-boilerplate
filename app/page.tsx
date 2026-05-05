"use client";

import { useState, useEffect, useRef } from 'react';
import {
  Search, Upload, FileText, AlertTriangle, CheckCircle2, XCircle, ArrowLeft,
  BookOpen, Layers, Loader2, FileCheck2, ChevronLeft, Hash, Clock
} from 'lucide-react';

export default function CodeCheckSA() {
  const [activeTab, setActiveTab] = useState('qa');
  const [query, setQuery] = useState('');
  const [activeAnswer, setActiveAnswer] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [uploadState, setUploadState] = useState('idle');
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@400;500;600;700&family=Tajawal:wght@300;400;500;700;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sbcDatabase = [
    {
      keywords: ['ممر', 'ممرات', 'عرض الممر', 'سبل الهروب'],
      question: 'ما الحد الأدنى لعرض الممرات في مباني التجمعات العامة؟',
      reference: 'SBC 201 — متطلبات سبل الهروب',
      article: 'المادة 1004.2',
      answer: 'يتراوح الحد الأدنى لعرض الممرات بين 1100 ملم و1500 ملم بناءً على عدد الأشخاص المخدومين ودرجة الخطورة. للممرات في مباني التجمعات (Group A) التي تخدم أكثر من 50 شخصاً، الحد الأدنى المطلوب هو 1500 ملم. لا يجوز أن يقل العرض الفعلي عن مجموع متطلبات السعة المحسوبة بمعامل 5 ملم/شخص للممرات الأفقية.',
      relatedArticles: ['1004.1 — تحديد السعة', '1005.1 — قياس العرض', '1018.2 — الممرات المسقوفة']
    },
    {
      keywords: ['رش', 'حريق', 'إطفاء', 'دفاع مدني'],
      question: 'متى تُلزم أنظمة الرش الآلي للمباني التجارية؟',
      reference: 'SBC 801 — كود الحماية من الحرائق',
      article: 'المادة 903.2',
      answer: 'تُلزم أنظمة الرش الآلي للمباني التجارية في الحالات التالية: (أ) إذا تجاوزت مساحة الدور الواحد 1000 م²، (ب) إذا تجاوز الارتفاع الإجمالي للمبنى 12 م من منسوب وصول مركبات الإطفاء، (ج) للاستخدامات الخاصة عالية الخطورة كالمستودعات ومراكز التسوق والفنادق وفق اشتراطات الدفاع المدني، (د) المباني التي تخدم إشغالاً يزيد عن 100 شخص في طابق واحد.',
      relatedArticles: ['903.3 — معايير التصميم', '903.4 — مصادر المياه', '907.2 — أنظمة الإنذار']
    },
    {
      keywords: ['درج', 'سلم', 'درجات', 'قائمة'],
      question: 'ما اشتراطات السلالم الرئيسية في المباني السكنية متعددة الطوابق؟',
      reference: 'SBC 201 — متطلبات السلالم',
      article: 'المادة 1011.5',
      answer: 'الحد الأدنى لعرض السلم الرئيسي 1100 ملم بين الحوائط الجانبية. ارتفاع القائمة (Riser) لا يتجاوز 180 ملم ولا يقل عن 100 ملم. عمق النائمة (Tread) لا يقل عن 280 ملم. يجب توفير درابزين على جانب واحد على الأقل بارتفاع 850-960 ملم. الحد الأقصى لعدد الدرجات في الشقة الواحدة 16 درجة قبل البسطة.',
      relatedArticles: ['1011.6 — البسطات', '1011.11 — الدرابزين', '1023.1 — الدرج الخارجي']
    },
    {
      keywords: ['ارتداد', 'ارتدادات', 'سكني'],
      question: 'ما اشتراطات الارتدادات للأراضي السكنية؟',
      reference: 'اشتراطات البلديات السعودية',
      article: 'تتفاوت حسب البلدية',
      answer: 'الارتدادات تخضع لاشتراطات البلدية المعنية على منصة بلدي وتختلف حسب المنطقة واستخدام الأرض. القيم الإرشادية الشائعة للأراضي السكنية: ارتداد أمامي 3-5 م، جانبي 2-3 م، خلفي 2-3 م. للأراضي ذات الواجهتين أو الزاوية تُطبق اشتراطات إضافية. يتم استرداد القيم الدقيقة آلياً من قاعدة بيانات البلدية عند إدخال رقم الصك.',
      relatedArticles: ['دليل اشتراطات البناء — بلدي', 'لائحة استخدامات الأراضي', 'اشتراطات الأبراج السكنية']
    }
  ];

  const handleQuery = (q) => {
    setQuery(q);
    setActiveAnswer(null);
    setThinking(true);
    setTimeout(() => {
      const match = sbcDatabase.find(item =>
        item.keywords.some(k => q.includes(k))
      ) || sbcDatabase[0];
      setActiveAnswer(match);
      setThinking(false);
    }, 1400);
  };

  const handleUpload = () => {
    setUploadState('uploading');
    setTimeout(() => setUploadState('analyzing'), 1200);
    setTimeout(() => setUploadState('done'), 4000);
  };

  const findings = [
    { type: 'pass', title: 'الارتداد الأمامي', value: '4.2 م', required: '≥ 3.0 م', article: 'بلدي — اشتراطات الحي', icon: CheckCircle2 },
    { type: 'fail', title: 'عرض الممر الرئيسي', value: '1.05 م', required: '≥ 1.50 م', article: 'SBC 201 — 1004.2', icon: XCircle },
    { type: 'warn', title: 'فتحات التهوية للمطبخ', value: 'غير محددة', required: 'مطلوبة', article: 'SBC 501 — 401.3', icon: AlertTriangle },
    { type: 'pass', title: 'ارتفاع السقف الصافي', value: '2.85 م', required: '≥ 2.40 م', article: 'SBC 201 — 1208.2', icon: CheckCircle2 },
    { type: 'fail', title: 'مخارج الطوارئ', value: '1 مخرج', required: '≥ 2 مخرج', article: 'SBC 201 — 1006.2', icon: XCircle },
    { type: 'pass', title: 'مساحة النوافذ للإضاءة', value: '12.4%', required: '≥ 10%', article: 'SBC 201 — 1205.2', icon: CheckCircle2 },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-[#F4EFE6] text-[#1A1A1A]" style={{ fontFamily: "'Tajawal', sans-serif" }}>
      <style>{`
        :root {
          --ink: #1A1A1A;
          --paper: #F4EFE6;
          --olive: #3F5235;
          --olive-light: #6B7F5C;
          --rust: #A4502A;
          --line: rgba(26, 26, 26, 0.12);
        }
        .display { font-family: 'Reem Kufi', serif; font-weight: 600; letter-spacing: -0.01em; }
        .grid-bg {
          background-image:
            linear-gradient(to right, rgba(26,26,26,0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(26,26,26,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .arabic-numerals { font-feature-settings: 'lnum' 1; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.5s ease-out forwards; }
        .scan-line {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, transparent 0%, rgba(63,82,53,0.15) 50%, transparent 100%);
          animation: scan 2s linear infinite;
        }
        @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
      `}</style>

      <header className={`sticky top-0 z-50 transition-all ${scrolled ? 'bg-[#F4EFE6]/95 backdrop-blur-sm border-b border-[var(--line)]' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--ink)] flex items-center justify-center">
              <div className="grid grid-cols-2 gap-0.5">
                <div className="w-1.5 h-1.5 bg-[var(--paper)]"></div>
                <div className="w-1.5 h-1.5 bg-[var(--paper)]"></div>
                <div className="w-1.5 h-1.5 bg-[var(--paper)]"></div>
                <div className="w-1.5 h-1.5 bg-[#6B7F5C]"></div>
              </div>
            </div>
            <div>
              <div className="display text-lg leading-none">CodeCheck<span className="text-[#6B7F5C]">.SA</span></div>
              <div className="text-[10px] tracking-widest text-[var(--ink)]/60 mt-0.5">منصة الامتثال الذكي لكود البناء السعودي</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#problem" className="hover:text-[#3F5235] transition">المشكلة</a>
            <a href="#demo" className="hover:text-[#3F5235] transition">العرض التفاعلي</a>
            <a href="#integration" className="hover:text-[#3F5235] transition">التكامل</a>
            <a href="#roadmap" className="hover:text-[#3F5235] transition">خارطة الطريق</a>
          </nav>
          <button className="hidden md:block text-xs tracking-widest border border-[var(--ink)] px-4 py-2 hover:bg-[var(--ink)] hover:text-[var(--paper)] transition">
            طلب اجتماع
          </button>
        </div>
      </header>

      <section ref={heroRef} className="relative grid-bg overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-32">
          <div className="flex items-center gap-3 text-xs tracking-widest text-[#3F5235] mb-8 fade-up">
            <div className="w-12 h-px bg-[#3F5235]"></div>
            <span>مقترح فني — وزارة الشؤون البلدية والقروية والإسكان</span>
          </div>
          <h1 className="display text-5xl md:text-7xl leading-[1.05] max-w-5xl fade-up" style={{ animationDelay: '0.1s' }}>
            من <span className="relative inline-block">
              <span className="relative z-10">مراجعة بشرية</span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-[#6B7F5C]/30 -z-0"></span>
            </span> تستغرق أيام،
            <br />
            إلى <span className="text-[#3F5235]">تدقيق آلي</span> في ثوانٍ.
          </h1>
          <p className="text-lg md:text-xl text-[var(--ink)]/70 mt-8 max-w-3xl leading-relaxed fade-up" style={{ animationDelay: '0.2s' }}>
            منصة سعودية تعتمد على الذكاء الاصطناعي والرؤية الحاسوبية لمراجعة المخططات المعمارية ومطابقتها آلياً مع كود البناء السعودي (SBC) واشتراطات بلدي،
            بهدف تسريع إصدار الرخص ورفع جودة الامتثال.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--line)] mt-16 border border-[var(--line)] fade-up" style={{ animationDelay: '0.3s' }}>
            {[
              { v: '%85', l: 'تخفيض زمن المراجعة المتوقع' },
              { v: '500+', l: 'صفحة من كود البناء السعودي' },
              { v: 'SBC', l: 'مرجعية معتمدة من اللجنة الوطنية' },
              { v: 'بلدي', l: 'تكامل مقترح مع المنصة' },
            ].map((s, i) => (
              <div key={i} className="bg-[var(--paper)] p-6">
                <div className="display text-3xl md:text-4xl text-[#3F5235] arabic-numerals">{s.v}</div>
                <div className="text-xs text-[var(--ink)]/60 mt-2 leading-relaxed">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="problem" className="border-t border-[var(--line)] bg-[var(--ink)] text-[var(--paper)]">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="flex items-center gap-3 text-xs tracking-widest text-[#6B7F5C] mb-6">
            <div className="w-12 h-px bg-[#6B7F5C]"></div>
            <span>المشكلة الجوهرية</span>
          </div>
          <h2 className="display text-4xl md:text-5xl leading-tight max-w-4xl mb-16">
            مراجعة المخططات اليوم تعتمد على الإنسان — والإنسان بطيء، مكلف، ومُعرّض للخطأ.
          </h2>
          <div className="grid md:grid-cols-3 gap-px bg-[var(--paper)]/10">
            {[
              { icon: Clock, title: 'الوقت', body: 'مراجعة المخطط الواحد تستغرق من 5 إلى 14 يوم عمل بحسب التعقيد، مما يؤخر دورة رأس المال في القطاع العقاري.' },
              { icon: AlertTriangle, title: 'الخطأ البشري', body: 'تفاوت بين المراجعين في تطبيق الكود، وإغفال غير مقصود لاشتراطات حرجة خاصة في مباني الإشغال العالي.' },
              { icon: Layers, title: 'تشتت المرجعيات', body: '500+ صفحة موزعة على 9 مجلدات SBC، مع تحديثات دورية، يصعب على المراجع تتبعها بدقة.' },
            ].map((item, i) => (
              <div key={i} className="bg-[var(--ink)] p-8">
                <item.icon className="w-7 h-7 text-[#6B7F5C] mb-6" />
                <div className="display text-xl mb-3">{item.title}</div>
                <p className="text-[var(--paper)]/70 leading-relaxed text-sm">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="bg-[var(--paper)] border-t border-[var(--line)]">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="flex items-center gap-3 text-xs tracking-widest text-[#3F5235] mb-6">
            <div className="w-12 h-px bg-[#3F5235]"></div>
            <span>عرض تفاعلي مباشر</span>
          </div>
          <h2 className="display text-4xl md:text-5xl leading-tight max-w-4xl mb-4">
            جرّب المنصة الآن.
          </h2>
          <p className="text-[var(--ink)]/60 mb-12 max-w-2xl">
            هذا عرض تفاعلي حقيقي يعمل في متصفحك. تستطيع طرح سؤال على محرك المعرفة، أو محاكاة رفع مخطط للحصول على تقرير امتثال أولي.
          </p>

          <div className="flex gap-px bg-[var(--ink)] p-px w-fit mb-8">
            <button
              onClick={() => setActiveTab('qa')}
              className={`px-6 py-3 text-sm transition flex items-center gap-2 ${activeTab === 'qa' ? 'bg-[var(--paper)] text-[var(--ink)]' : 'bg-[var(--ink)] text-[var(--paper)]'}`}
            >
              <BookOpen className="w-4 h-4" /> محرك المعرفة
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-3 text-sm transition flex items-center gap-2 ${activeTab === 'upload' ? 'bg-[var(--paper)] text-[var(--ink)]' : 'bg-[var(--ink)] text-[var(--paper)]'}`}
            >
              <Upload className="w-4 h-4" /> تحليل المخطط
            </button>
          </div>

          {activeTab === 'qa' && (
            <div className="bg-white border border-[var(--line)] shadow-sm">
              <div className="border-b border-[var(--line)] p-4 flex items-center gap-3 bg-[#F9F6EF]">
                <div className="w-2 h-2 rounded-full bg-[#3F5235] animate-pulse"></div>
                <span className="text-xs tracking-wider text-[var(--ink)]/60">SBC RAG ENGINE — متصل بقاعدة البيانات الكاملة</span>
              </div>

              <div className="p-6 md:p-10">
                {!activeAnswer && !thinking && (
                  <div>
                    <div className="text-sm text-[var(--ink)]/60 mb-4">جرّب أحد الأسئلة الشائعة:</div>
                    <div className="grid md:grid-cols-2 gap-3">
                      {sbcDatabase.map((item, i) => (
                        <button
                          key={i}
                          onClick={() => handleQuery(item.question)}
                          className="text-right p-4 border border-[var(--line)] hover:border-[#3F5235] hover:bg-[#F9F6EF] transition group"
                        >
                          <div className="flex items-start gap-3">
                            <Search className="w-4 h-4 text-[#3F5235] mt-1 flex-shrink-0" />
                            <div>
                              <div className="text-sm leading-relaxed">{item.question}</div>
                              <div className="text-xs text-[var(--ink)]/50 mt-2">{item.reference}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {thinking && (
                  <div className="py-12 text-center">
                    <Loader2 className="w-8 h-8 mx-auto text-[#3F5235] animate-spin mb-4" />
                    <div className="text-sm text-[var(--ink)]/60">يبحث المحرك في 9 مجلدات SBC و500+ صفحة...</div>
                    <div className="mt-6 max-w-md mx-auto">
                      <div className="text-xs text-[var(--ink)]/40 space-y-1.5 text-right">
                        <div>← استخراج المفاهيم الدلالية من السؤال</div>
                        <div>← البحث في قاعدة المتجهات (Vector DB)</div>
                        <div>← ترتيب المراجع حسب الصلة</div>
                        <div>← توليد الإجابة مع الاستشهاد</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeAnswer && !thinking && (
                  <div className="fade-up">
                    <button
                      onClick={() => { setActiveAnswer(null); setQuery(''); }}
                      className="text-xs text-[var(--ink)]/60 hover:text-[var(--ink)] flex items-center gap-1 mb-6"
                    >
                      <ChevronLeft className="w-3 h-3" /> سؤال جديد
                    </button>

                    <div className="border-r-2 border-[#3F5235] pr-4 mb-6">
                      <div className="text-xs text-[var(--ink)]/50 mb-1">السؤال</div>
                      <div className="text-base">{activeAnswer.question}</div>
                    </div>

                    <div className="bg-[#F9F6EF] p-6 mb-6">
                      <div className="flex items-center gap-2 text-xs text-[#3F5235] mb-3">
                        <FileCheck2 className="w-4 h-4" />
                        <span className="tracking-wider">{activeAnswer.reference}</span>
                        <span className="text-[var(--ink)]/30">/</span>
                        <span>{activeAnswer.article}</span>
                      </div>
                      <p className="leading-loose text-[var(--ink)]/90">{activeAnswer.answer}</p>
                    </div>

                    <div>
                      <div className="text-xs tracking-widest text-[var(--ink)]/50 mb-3">مراجع ذات صلة</div>
                      <div className="space-y-2">
                        {activeAnswer.relatedArticles.map((art, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm py-2 border-b border-[var(--line)]">
                            <Hash className="w-3 h-3 text-[#3F5235]" />
                            <span className="text-[var(--ink)]/70">{art}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="bg-white border border-[var(--line)] shadow-sm">
              <div className="border-b border-[var(--line)] p-4 flex items-center gap-3 bg-[#F9F6EF]">
                <div className="w-2 h-2 rounded-full bg-[#3F5235] animate-pulse"></div>
                <span className="text-xs tracking-wider text-[var(--ink)]/60">PLAN ANALYZER — رؤية حاسوبية + RAG</span>
              </div>

              <div className="p-6 md:p-10">
                {uploadState === 'idle' && (
                  <div className="text-center py-12 border-2 border-dashed border-[var(--line)] hover:border-[#3F5235] transition">
                    <Upload className="w-10 h-10 mx-auto text-[var(--ink)]/40 mb-4" />
                    <div className="display text-xl mb-2">ارفع مخطط معماري للتحليل</div>
                    <div className="text-sm text-[var(--ink)]/60 mb-6">صيغ مدعومة: PDF, DWG, IFC, JPG</div>
                    <button
                      onClick={handleUpload}
                      className="bg-[var(--ink)] text-[var(--paper)] px-6 py-3 text-sm tracking-wider hover:bg-[#3F5235] transition"
                    >
                      محاكاة رفع مخطط نموذجي
                    </button>
                    <div className="text-xs text-[var(--ink)]/40 mt-4">* يستخدم العرض مخطط فيلا سكنية افتراضي</div>
                  </div>
                )}

                {uploadState === 'uploading' && (
                  <div className="py-12 text-center">
                    <Loader2 className="w-8 h-8 mx-auto text-[#3F5235] animate-spin mb-4" />
                    <div className="text-sm">جاري رفع الملف...</div>
                  </div>
                )}

                {uploadState === 'analyzing' && (
                  <div className="py-12">
                    <div className="relative mx-auto w-64 h-64 border border-[var(--line)] bg-[#F9F6EF] overflow-hidden mb-6">
                      <div className="absolute inset-4 border border-[#3F5235]/30">
                        <div className="absolute inset-2 grid grid-cols-3 gap-1 opacity-40">
                          {[...Array(9)].map((_,i)=>(<div key={i} className="border border-[#3F5235]"></div>))}
                        </div>
                      </div>
                      <div className="scan-line"></div>
                    </div>
                    <div className="text-center">
                      <div className="display text-xl mb-3">جاري تحليل المخطط...</div>
                      <div className="text-xs text-[var(--ink)]/50 space-y-1.5 max-w-sm mx-auto text-right">
                        <div className="flex items-center justify-end gap-2"><span>كشف الجدران والفتحات</span><CheckCircle2 className="w-3 h-3 text-[#3F5235]" /></div>
                        <div className="flex items-center justify-end gap-2"><span>استخراج القياسات</span><CheckCircle2 className="w-3 h-3 text-[#3F5235]" /></div>
                        <div className="flex items-center justify-end gap-2"><span>مطابقة مع SBC 201</span><Loader2 className="w-3 h-3 animate-spin" /></div>
                        <div className="flex items-center justify-end gap-2 opacity-40"><span>توليد التقرير</span><div className="w-3 h-3 border border-current rounded-full"></div></div>
                      </div>
                    </div>
                  </div>
                )}

                {uploadState === 'done' && (
                  <div className="fade-up">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--line)]">
                      <div>
                        <div className="text-xs text-[var(--ink)]/50 mb-1">تقرير الامتثال — مخطط رقم</div>
                        <div className="display text-2xl">VL-2026-0847</div>
                      </div>
                      <button
                        onClick={() => setUploadState('idle')}
                        className="text-xs text-[var(--ink)]/60 hover:text-[var(--ink)]"
                      >
                        عرض جديد →
                      </button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-px bg-[var(--line)] mb-8 border border-[var(--line)]">
                      <div className="bg-white p-6">
                        <div className="text-xs text-[var(--ink)]/50 mb-2">معدل الامتثال</div>
                        <div className="display text-4xl arabic-numerals">%67</div>
                      </div>
                      <div className="bg-white p-6">
                        <div className="text-xs text-[var(--ink)]/50 mb-2">إجمالي البنود المراجعة</div>
                        <div className="display text-4xl arabic-numerals">42</div>
                      </div>
                      <div className="bg-white p-6">
                        <div className="text-xs text-[var(--ink)]/50 mb-2">الملاحظات الحرجة</div>
                        <div className="display text-4xl text-[#A4502A] arabic-numerals">2</div>
                      </div>
                    </div>

                    <div className="text-xs tracking-widest text-[var(--ink)]/50 mb-3">الملاحظات التفصيلية</div>
                    <div className="space-y-px bg-[var(--line)] border border-[var(--line)]">
                      {findings.map((f, i) => {
                        const Icon = f.icon;
                        const colorMap = { pass: '#3F5235', fail: '#A4502A', warn: '#B8860B' };
                        return (
                          <div key={i} className="bg-white p-4 grid grid-cols-12 gap-4 items-center">
                            <Icon className="w-5 h-5 col-span-1" style={{ color: colorMap[f.type] }} />
                            <div className="col-span-5 md:col-span-4">
                              <div className="text-sm font-medium">{f.title}</div>
                              <div className="text-xs text-[var(--ink)]/50 mt-0.5">{f.article}</div>
                            </div>
                            <div className="col-span-3 md:col-span-3 text-sm">
                              <span className="text-[var(--ink)]/50 text-xs">القيمة: </span>
                              <span style={{ color: colorMap[f.type] }}>{f.value}</span>
                            </div>
                            <div className="col-span-3 md:col-span-4 text-sm text-left md:text-right">
                              <span className="text-[var(--ink)]/50 text-xs">المطلوب: </span>
                              <span>{f.required}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6 text-xs text-[var(--ink)]/50 leading-relaxed bg-[#F9F6EF] p-4 border-r-2 border-[#3F5235]">
                      <strong>ملاحظة:</strong> هذا التقرير عرض توضيحي مولّد على بيانات افتراضية لأغراض الإرشاد فقط، ولا يُعتمد كمستند رسمي. التقرير الإنتاجي يُختم رقمياً ويُربط بمنصة بلدي.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="integration" className="border-t border-[var(--line)] bg-[#EBE5D6]">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <div className="flex items-center gap-3 text-xs tracking-widest text-[#3F5235] mb-6">
                <div className="w-12 h-px bg-[#3F5235]"></div>
                <span>التكامل المؤسسي</span>
              </div>
              <h2 className="display text-4xl leading-tight mb-6">
                لا نبني بديلاً.
                <br />
                نبني <span className="text-[#3F5235]">طبقة ذكية فوق</span> ما هو قائم.
              </h2>
              <p className="text-[var(--ink)]/70 leading-loose">
                المنصة مصممة لتعمل كطبقة تدقيق آلي تتكامل مع منصة بلدي، نظام إتمام، ومنصة الدفاع المدني (سلامة)
                دون الحاجة لاستبدال أي نظام قائم. النموذج يحترم الهوية المؤسسية للجهات الحكومية.
              </p>
            </div>
            <div className="space-y-px bg-[var(--line)]">
              {[
                { name: 'منصة بلدي', role: 'استيراد بيانات الأرض والاشتراطات', status: 'API مقترح' },
                { name: 'نظام إتمام', role: 'إصدار الرخصة بعد الموافقة', status: 'تكامل مرحلي' },
                { name: 'سلامة — الدفاع المدني', role: 'مراجعة اشتراطات الحريق', status: 'تنسيق مطلوب' },
                { name: 'كود البناء السعودي SBC', role: 'المرجعية الفنية الأساسية', status: 'مدمج بالكامل' },
              ].map((item, i) => (
                <div key={i} className="bg-[#EBE5D6] p-5 flex items-center justify-between">
                  <div>
                    <div className="display text-base">{item.name}</div>
                    <div className="text-xs text-[var(--ink)]/60 mt-1">{item.role}</div>
                  </div>
                  <div className="text-xs tracking-wider text-[#3F5235] border border-[#3F5235]/30 px-2 py-1">
                    {item.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="roadmap" className="border-t border-[var(--line)] bg-[var(--paper)]">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="flex items-center gap-3 text-xs tracking-widest text-[#3F5235] mb-6">
            <div className="w-12 h-px bg-[#3F5235]"></div>
            <span>خارطة الطريق</span>
          </div>
          <h2 className="display text-4xl md:text-5xl leading-tight max-w-4xl mb-16">
            ثلاث مراحل تحويلية،
            <br />
            مدتها 18 شهراً.
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                phase: '01',
                title: 'النموذج الأولي',
                duration: '6 أشهر',
                items: ['محرك RAG كامل على SBC', 'تحليل PDF للمخططات البسيطة', 'لوحة معاينة للمراجع', 'اختبار مع 10 مكاتب هندسية']
              },
              {
                phase: '02',
                title: 'التكامل التشغيلي',
                duration: '6 أشهر',
                items: ['API مع منصة بلدي', 'دعم صيغة DWG و IFC', 'إصدار التقارير المختومة', 'تشغيل تجريبي في 3 بلديات']
              },
              {
                phase: '03',
                title: 'التوسع الوطني',
                duration: '6 أشهر',
                items: ['تغطية كاملة لجميع البلديات', 'دعم BIM متقدم', 'لوحة تحكم وزارية', 'مؤشرات أداء وطنية']
              },
            ].map((p, i) => (
              <div key={i} className="border-t border-[var(--ink)] pt-6">
                <div className="display text-5xl text-[var(--ink)]/20 mb-4 arabic-numerals">{p.phase}</div>
                <div className="display text-2xl mb-1">{p.title}</div>
                <div className="text-xs tracking-widest text-[#3F5235] mb-6">{p.duration}</div>
                <ul className="space-y-3">
                  {p.items.map((item, j) => (
                    <li key={j} className="text-sm text-[var(--ink)]/70 flex items-start gap-2">
                      <div className="w-1 h-1 bg-[#3F5235] mt-2 flex-shrink-0"></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--ink)] text-[var(--paper)]">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="flex items-center gap-3 text-xs tracking-widest text-[#6B7F5C] mb-6">
            <div className="w-12 h-px bg-[#6B7F5C]"></div>
            <span>الخطوة التالية</span>
          </div>
          <h2 className="display text-4xl md:text-6xl leading-tight max-w-4xl mb-12">
            نقترح ورشة فنية لمدة ساعتين، لاستعراض التفاصيل التقنية والإجابة على استفسارات الفريق.
          </h2>
          <div className="flex flex-col md:flex-row gap-4">
            <button className="bg-[var(--paper)] text-[var(--ink)] px-8 py-4 text-sm tracking-wider hover:bg-[#6B7F5C] hover:text-[var(--paper)] transition flex items-center justify-between gap-4 group">
              <span>طلب ورشة فنية</span>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
            </button>
            <button className="border border-[var(--paper)]/30 px-8 py-4 text-sm tracking-wider hover:bg-[var(--paper)]/5 transition flex items-center justify-between gap-4">
              <span>تحميل المقترح الفني (PDF)</span>
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-[var(--ink)] border-t border-[var(--paper)]/10 text-[var(--paper)]/50 text-xs">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>CodeCheck.SA — مقترح فني | جميع الحقوق محفوظة © 2026</div>
          <div className="tracking-widest">صُمم بمعايير حكومية</div>
        </div>
      </footer>
    </div>
  );
}
