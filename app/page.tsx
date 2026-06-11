// @ts-nocheck
/* eslint-disable */
"use client";

import { useState, useEffect, useRef } from 'react';
import {
  Search, Upload, FileText, AlertTriangle, CheckCircle2, XCircle, ArrowLeft,
  BookOpen, Layers, Loader2, FileCheck2, ChevronLeft, Hash, Clock,
  Printer, Send, Building2, Target, TrendingUp, Shield, Zap, Sparkles, Info
} from 'lucide-react';

export default function CodeCheckSA() {
  const [activeTab, setActiveTab] = useState('upload');
  const [query, setQuery] = useState('');
  const [freeQuery, setFreeQuery] = useState('');
  const [activeAnswer, setActiveAnswer] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [uploadState, setUploadState] = useState('idle');
  const [scrolled, setScrolled] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@400;500;600;700&family=Tajawal:wght@300;400;500;700;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const cannedQuestions = [
    'ما الحد الأدنى لعرض الممرات في مباني التجمعات العامة؟',
    'متى تُلزم أنظمة الرش الآلي للمباني التجارية؟',
    'ما اشتراطات السلالم الرئيسية في المباني السكنية؟',
    'ما تصنيفات الإشغال في كود البناء السعودي؟',
  ];

  const handleQuery = async (q) => {
    setQuery(q);
    setActiveAnswer(null);
    setThinking(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الاستعلام');
      setActiveAnswer({ question: q, answer: data.answer });
    } catch (err) {
      setErrorMsg(err.message || 'حدث خطأ');
    } finally {
      setThinking(false);
    }
  };

  const handleFreeSubmit = (e) => {
    e.preventDefault();
    if (!freeQuery.trim()) return;
    handleQuery(freeQuery.trim());
    setFreeQuery('');
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('حجم الملف يتجاوز 5 ميغابايت. يُرجى استخدام ملف أصغر.');
      return;
    }
    setUploadedFileName(file.name);
    setUploadState('uploading');
    setErrorMsg('');
    setAnalysisData(null);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = reader.result;
        const base64 = result.split(',')[1];
        setUploadState('analyzing');
        const res = await fetch('/api/analyze-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, mediaType: file.type }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'فشل التحليل');
          setUploadState('error');
          return;
        }
        setAnalysisData(data);
        setUploadState('done');
      } catch (err) {
        setErrorMsg('فشل الاتصال بالخادم');
        setUploadState('error');
      }
    };
    reader.onerror = () => {
      setErrorMsg('فشل قراءة الملف');
      setUploadState('error');
    };
    reader.readAsDataURL(file);
  };

  const resetUpload = () => {
    setUploadState('idle');
    setAnalysisData(null);
    setErrorMsg('');
    setUploadedFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePrint = () => {
    if (!analysisData) return;
    const fileName = uploadedFileName || 'تحليل';
    const date = new Date(analysisData.timestamp || Date.now()).toLocaleString('ar-SA');
    const findings = analysisData.findings || [];
    const recommendations = analysisData.recommendations || [];
    const colors = { pass: '#3F5235', fail: '#A4502A', warn: '#B8860B' };
    const findingsHTML = findings.map((f) => `<div style="border:1px solid #ddd;border-right:3px solid ${colors[f.type] || '#888'};padding:12px;margin:8px 0;page-break-inside:avoid"><div style="font-weight:600;margin-bottom:4px">${f.title || ''}</div><div style="font-size:11px;color:#888;margin-bottom:6px">${f.article || ''}</div><div style="font-size:13px;margin-bottom:6px">${f.details || ''}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px"><div><strong>الملاحظ:</strong> ${f.observed || '-'}</div><div><strong>المطلوب:</strong> ${f.required || '-'}</div></div></div>`).join('');
    const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>تقرير ${fileName}</title><link href="https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@600&family=Tajawal:wght@400;700&display=swap" rel="stylesheet"><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Tajawal',Arial,sans-serif;padding:2cm;color:#1A1A1A;line-height:1.6;direction:rtl}h1{font-family:'Reem Kufi',serif;font-size:22px;margin-bottom:6px}h3{font-size:13px;margin:20px 0 10px;letter-spacing:0.05em;color:#666}.header{border-bottom:2px solid #1A1A1A;padding-bottom:14px;margin-bottom:16px}.header .meta{font-size:11px;color:#666;margin-top:4px}.summary{background:#F4EFE6;border-right:3px solid #3F5235;padding:12px;margin:12px 0;font-size:13px}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}.stat{border:1px solid #ddd;padding:12px;text-align:center}.stat .l{font-size:10px;color:#666}.stat .v{font-size:26px;font-weight:700;font-family:'Reem Kufi',serif}.recs{background:#F4EFE6;padding:12px;margin:12px 0}.recs li{list-style:none;padding:3px 0;font-size:12px;padding-right:14px;position:relative}.recs li::before{content:"←";position:absolute;right:0;color:#3F5235}.footer{margin-top:20px;padding-top:10px;border-top:1px solid #ddd;font-size:10px;color:#888;text-align:center}@media print{body{padding:1cm}}</style></head><body><div class="header"><h1>CodeCheck.SA — تقرير التحليل المعماري</h1><div class="meta">منصة الامتثال الذكي لكود البناء السعودي</div><div class="meta">تاريخ التحليل: ${date}</div><div class="meta">الملف: ${fileName}</div></div><h2 style="font-family:'Reem Kufi',serif;font-size:17px;margin-bottom:8px">${analysisData.planType || 'تحليل المخطط'}</h2>${analysisData.summary ? `<div class="summary"><strong>الملخص:</strong> ${analysisData.summary}</div>` : ''}<div class="stats"><div class="stat"><div class="l">معدل الامتثال</div><div class="v">%${analysisData.compliance_score ?? 0}</div></div><div class="stat"><div class="l">البنود المراجعة</div><div class="v">${analysisData.total_items ?? findings.length}</div></div><div class="stat"><div class="l">ملاحظات حرجة</div><div class="v" style="color:#A4502A">${analysisData.critical_count ?? 0}</div></div></div>${findings.length ? `<h3>الملاحظات التفصيلية</h3>${findingsHTML}` : '<div style="padding:12px;background:#F4EFE6;border-right:3px solid #3F5235;font-size:13px;margin:12px 0">لم يُرجع التحليل ملاحظات تفصيلية لهذا المخطط.</div>'}${recommendations.length ? `<h3>التوصيات</h3><div class="recs"><ul>${recommendations.map((r) => `<li>${r}</li>`).join('')}</ul></div>` : ''}${analysisData.limitations ? `<h3>حدود التحليل</h3><div style="font-size:11px;padding:10px;border:1px solid #ddd">${analysisData.limitations}</div>` : ''}<div class="footer">CodeCheck.SA © 2026</div></body></html>`;
    const w = window.open('', '_blank', 'width=900,height=900');
    if (!w) {
      alert('يُرجى السماح بالنوافذ المنبثقة في إعدادات المتصفح');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    setTimeout(() => { try { w.print(); } catch (e) {} }, 600);
  };

    const sbcCodes = [
    { code: 'MOMAH 2024', title: 'اشتراطات المباني السكنية', icon: Target },
    { code: 'SBC-1101', title: 'المباني السكنية', icon: Building2 },
    { code: 'SBC-1102', title: 'الصحي والميكانيكي والكهربائي', icon: FileText },
    { code: 'SBC-602', title: 'ترشيد الطاقة', icon: Sparkles },
    { code: 'SBC-301', title: 'الأحمال والزلازل', icon: Layers },
    { code: 'SBC-801', title: 'الحماية من الحرائق', icon: Shield },
    { code: 'SBC-201', title: 'كود البناء العام', icon: BookOpen },
    { code: 'SBC-401', title: 'الكهربائي', icon: Zap },
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
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
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
              <div className="display text-base md:text-lg leading-none">CodeCheck<span className="text-[#6B7F5C]">.SA</span></div>
              <div className="text-[9px] md:text-[10px] tracking-widest text-[var(--ink)]/60 mt-0.5">منصة الامتثال الذكي لكود البناء السعودي</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#problem" className="hover:text-[#3F5235] transition">المشكلة</a>
            <a href="#demo" className="hover:text-[#3F5235] transition">العرض التفاعلي</a>
            <a href="#integration" className="hover:text-[#3F5235] transition">التكامل</a>
            <a href="#vision" className="hover:text-[#3F5235] transition">رؤية 2030</a>
          </nav>
        </div>
      </header>

      <section className="relative grid-bg overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-12 md:pt-20 pb-20 md:pb-32">
          <div className="flex items-center gap-3 text-[10px] md:text-xs tracking-widest text-[#3F5235] mb-6 md:mb-8 fade-up">
            <div className="w-8 md:w-12 h-px bg-[#3F5235]"></div>
            <span>مقترح استراتيجي فني — وزارة البلديات والإسكان</span>
          </div>
          <h1 className="display text-4xl md:text-7xl leading-[1.05] max-w-5xl fade-up" style={{ animationDelay: '0.1s' }}>
            من <span className="relative inline-block">
              <span className="relative z-10">مراجعة بشرية</span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-[#6B7F5C]/30 -z-0"></span>
            </span> تستغرق أيام،
            <br />
            إلى <span className="text-[#3F5235]">تدقيق آلي</span> في ثوانٍ.
          </h1>
          <p className="text-base md:text-xl text-[var(--ink)]/70 mt-6 md:mt-8 max-w-3xl leading-relaxed fade-up" style={{ animationDelay: '0.2s' }}>
            منصة سعودية تعتمد على الذكاء الاصطناعي والرؤية الحاسوبية لمراجعة المخططات المعمارية ومطابقتها آلياً مع كود البناء السعودي (SBC) واشتراطات بلدي،
            بهدف تسريع إصدار الرخص ورفع جودة الامتثال.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--line)] mt-12 md:mt-16 border border-[var(--line)] fade-up" style={{ animationDelay: '0.3s' }}>
            {[
              { v: '%85', l: 'تخفيض زمن المراجعة' },
              { v: '13', l: 'مجلد من أكواد SBC' },
              { v: '8000+', l: 'صفحة معتمدة 2024' },
              { v: 'بلدي', l: 'تكامل مع المنصة' },
            ].map((s, i) => (
              <div key={i} className="bg-[var(--paper)] p-4 md:p-6">
                <div className="display text-2xl md:text-4xl text-[#3F5235] arabic-numerals">{s.v}</div>
                <div className="text-[10px] md:text-xs text-[var(--ink)]/60 mt-2 leading-relaxed">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] bg-[#EBE5D6]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-20">
          <div className="flex items-center gap-3 text-[10px] md:text-xs tracking-widest text-[#3F5235] mb-6">
            <div className="w-8 md:w-12 h-px bg-[#3F5235]"></div>
            <span>الأكواد المدمجة في المحرك</span>
          </div>
          <h2 className="display text-2xl md:text-4xl leading-tight mb-10 md:mb-12">
            ثمانية مراجع تنظيمية،
            <br />
            فهرسة في <span className="arabic-numerals">118</span> إدخالاً موثّقاً.
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {sbcCodes.map((c, i) => {
              const Icon = c.icon;
              return (
                <div key={i} className="bg-[var(--paper)] border border-[var(--line)] p-4 md:p-6 hover:border-[#3F5235] transition group">
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-[#3F5235] mb-3 md:mb-4" />
                  <div className="text-[10px] md:text-xs tracking-widest text-[var(--ink)]/50 mb-1">{c.code}</div>
                  <div className="display text-sm md:text-lg leading-tight">{c.title}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="problem" className="border-t border-[var(--line)] bg-[var(--ink)] text-[var(--paper)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="flex items-center gap-3 text-[10px] md:text-xs tracking-widest text-[#6B7F5C] mb-6">
            <div className="w-8 md:w-12 h-px bg-[#6B7F5C]"></div>
            <span>المشكلة الجوهرية</span>
          </div>
          <h2 className="display text-2xl md:text-5xl leading-tight max-w-4xl mb-10 md:mb-16">
            مراجعة المخططات اليوم تعتمد على الإنسان — والإنسان بطيء، مكلف، ومُعرّض للخطأ.
          </h2>
          <div className="grid md:grid-cols-3 gap-px bg-[var(--paper)]/10">
            {[
              { icon: Clock, title: 'الوقت', body: 'مراجعة المخطط الواحد تستغرق من 5 إلى 14 يوم عمل بحسب التعقيد، مما يؤخر دورة رأس المال في القطاع العقاري.' },
              { icon: AlertTriangle, title: 'الخطأ البشري', body: 'تفاوت بين المراجعين في تطبيق الكود، وإغفال غير مقصود لاشتراطات حرجة خاصة في مباني الإشغال العالي.' },
              { icon: Layers, title: 'تشتت المرجعيات', body: 'آلاف الصفحات موزعة على 13 مجلد SBC، مع تحديثات دورية، يصعب على المراجع تتبعها بدقة.' },
            ].map((item, i) => (
              <div key={i} className="bg-[var(--ink)] p-6 md:p-8">
                <item.icon className="w-6 h-6 md:w-7 md:h-7 text-[#6B7F5C] mb-4 md:mb-6" />
                <div className="display text-lg md:text-xl mb-3">{item.title}</div>
                <p className="text-[var(--paper)]/70 leading-relaxed text-xs md:text-sm">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="bg-[var(--paper)] border-t border-[var(--line)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="flex items-center gap-3 text-[10px] md:text-xs tracking-widest text-[#3F5235] mb-6">
            <div className="w-8 md:w-12 h-px bg-[#3F5235]"></div>
            <span>عرض تفاعلي مباشر</span>
          </div>
          <h2 className="display text-2xl md:text-5xl leading-tight max-w-4xl mb-3 md:mb-4">
            جرّب المنصة الآن.
          </h2>
          <p className="text-sm md:text-base text-[var(--ink)]/60 mb-8 md:mb-12 max-w-2xl">
            ارفع مخططاً معمارياً للحصول على تحليل امتثال آلي، أو اطرح سؤالاً على محرك المعرفة المدعوم بـ SBC.
          </p>

          <div className="flex gap-px bg-[var(--ink)] p-px w-fit mb-6 md:mb-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 md:px-6 py-2.5 md:py-3 text-xs md:text-sm transition flex items-center gap-2 ${activeTab === 'upload' ? 'bg-[var(--paper)] text-[var(--ink)]' : 'bg-[var(--ink)] text-[var(--paper)]'}`}
            >
              <Upload className="w-4 h-4" /> تحليل المخطط
            </button>
            <button
              onClick={() => setActiveTab('qa')}
              className={`px-3 md:px-6 py-2.5 md:py-3 text-xs md:text-sm transition flex items-center gap-2 ${activeTab === 'qa' ? 'bg-[var(--paper)] text-[var(--ink)]' : 'bg-[var(--ink)] text-[var(--paper)]'}`}
            >
              <BookOpen className="w-4 h-4" /> محرك المعرفة
            </button>
          </div>

          {activeTab === 'upload' && (
            <div className="bg-white border border-[var(--line)] shadow-sm">
              <div className="border-b border-[var(--line)] p-3 md:p-4 flex items-center gap-3 bg-[#F9F6EF]">
                <div className="w-2 h-2 rounded-full bg-[#3F5235] animate-pulse"></div>
                <span className="text-[10px] md:text-xs tracking-wider text-[var(--ink)]/60">PLAN ANALYZER — رؤية حاسوبية + RAG</span>
              </div>

              <div className="p-4 md:p-10">
                {uploadState === 'idle' && (
                  <div className="text-center py-8 md:py-12 border-2 border-dashed border-[var(--line)] hover:border-[#3F5235] transition">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Upload className="w-8 h-8 md:w-10 md:h-10 mx-auto text-[var(--ink)]/40 mb-3 md:mb-4" />
                    <div className="display text-base md:text-xl mb-2 px-4">رفع المخطط الهندسي</div>
                    <div className="text-xs md:text-sm text-[var(--ink)]/60 mb-5 md:mb-6 px-4">صيغ مدعومة: JPG, PNG, PDF — حد أقصى 5MB</div>
                    <button
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      className="bg-[var(--ink)] text-[var(--paper)] px-5 md:px-6 py-2.5 md:py-3 text-xs md:text-sm tracking-wider hover:bg-[#3F5235] transition"
                    >
                      اختر ملف (كاميرا / معرض / ملف)
                    </button>
                    <div className="text-[10px] md:text-xs text-[var(--ink)]/40 mt-4 px-4">على الجوال ستظهر خيارات: التقاط صورة، اختيار من المعرض، تصفح الملفات</div>
                    {errorMsg && (
                      <div className="mt-4 mx-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs md:text-sm">{errorMsg}</div>
                    )}
                  </div>
                )}

                {uploadState === 'uploading' && (
                  <div className="py-12 text-center">
                    <Loader2 className="w-8 h-8 mx-auto text-[#3F5235] animate-spin mb-4" />
                    <div className="text-sm">جاري رفع الملف: {uploadedFileName}</div>
                  </div>
                )}

                {uploadState === 'analyzing' && (
                  <div className="py-8 md:py-12">
                    <div className="relative mx-auto w-48 h-48 md:w-64 md:h-64 border border-[var(--line)] bg-[#F9F6EF] overflow-hidden mb-6">
                      <div className="absolute inset-4 border border-[#3F5235]/30">
                        <div className="absolute inset-2 grid grid-cols-3 gap-1 opacity-40">
                          {[...Array(9)].map((_, i) => (<div key={i} className="border border-[#3F5235]"></div>))}
                        </div>
                      </div>
                      <div className="scan-line"></div>
                    </div>
                    <div className="text-center px-4">
                      <div className="display text-lg md:text-xl mb-3">جاري تحليل المخطط...</div>
                      <div className="text-[10px] md:text-xs text-[var(--ink)]/50 space-y-1.5 max-w-sm mx-auto text-right">
                        <div className="flex items-center justify-end gap-2"><span>قراءة الصورة بالرؤية الحاسوبية</span><CheckCircle2 className="w-3 h-3 text-[#3F5235]" /></div>
                        <div className="flex items-center justify-end gap-2"><span>استخراج العناصر المعمارية</span><CheckCircle2 className="w-3 h-3 text-[#3F5235]" /></div>
                        <div className="flex items-center justify-end gap-2"><span>مطابقة مع SBC والاشتراطات</span><Loader2 className="w-3 h-3 animate-spin" /></div>
                        <div className="flex items-center justify-end gap-2 opacity-40"><span>توليد التقرير التفصيلي</span><div className="w-3 h-3 border border-current rounded-full"></div></div>
                      </div>
                    </div>
                  </div>
                )}

                {uploadState === 'error' && (
                  <div className="py-12 text-center px-4">
                    <XCircle className="w-10 h-10 mx-auto text-[#A4502A] mb-4" />
                    <div className="display text-lg mb-3">تعذّر التحليل</div>
                    <div className="text-sm text-[var(--ink)]/70 mb-6 max-w-md mx-auto">{errorMsg}</div>
                    <button onClick={resetUpload} className="bg-[var(--ink)] text-[var(--paper)] px-5 py-2.5 text-xs tracking-wider hover:bg-[#3F5235] transition">
                      حاول مرة أخرى
                    </button>
                  </div>
                )}

                {uploadState === 'done' && analysisData && (
                  <div className="fade-up">
                    <div className="flex flex-wrap items-center justify-between mb-6 md:mb-8 pb-4 md:pb-6 border-b border-[var(--line)] gap-3">
                      <div>
                        <div className="text-[10px] md:text-xs text-[var(--ink)]/50 mb-1">تقرير الامتثال — {analysisData.planType || 'مخطط'}</div>
                        <div className="display text-lg md:text-2xl">{uploadedFileName || 'تحليل المخطط'}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handlePrint}
                          className="flex items-center gap-2 bg-[#3F5235] text-[var(--paper)] px-3 md:px-4 py-2 text-[10px] md:text-xs tracking-wider hover:bg-[var(--ink)] transition cursor-pointer"
                        >
                          <Printer className="w-3 h-3 md:w-4 md:h-4" /> طباعة التقرير
                        </button>
                        <button onClick={resetUpload} className="text-[10px] md:text-xs text-[var(--ink)]/60 hover:text-[var(--ink)] px-3 py-2 border border-[var(--line)]">
                          عرض جديد
                        </button>
                      </div>
                    </div>

                    {analysisData.summary && (
                      <div className="mb-6 p-4 bg-[#F9F6EF] border-r-2 border-[#3F5235]">
                        <div className="text-[10px] tracking-widest text-[var(--ink)]/50 mb-2">الملخص</div>
                        <div className="text-sm md:text-base leading-relaxed">{analysisData.summary}</div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-px bg-[var(--line)] mb-6 md:mb-8 border border-[var(--line)]">
                      <div className="bg-white p-3 md:p-6">
                        <div className="text-[10px] md:text-xs text-[var(--ink)]/50 mb-1 md:mb-2">معدل الامتثال</div>
                        <div className="display text-2xl md:text-4xl arabic-numerals">%{analysisData.compliance_score ?? 0}</div>
                      </div>
                      <div className="bg-white p-3 md:p-6">
                        <div className="text-[10px] md:text-xs text-[var(--ink)]/50 mb-1 md:mb-2">البنود المراجعة</div>
                        <div className="display text-2xl md:text-4xl arabic-numerals">{analysisData.total_items ?? (analysisData.findings && analysisData.findings.length) ?? 0}</div>
                      </div>
                      <div className="bg-white p-3 md:p-6">
                        <div className="text-[10px] md:text-xs text-[var(--ink)]/50 mb-1 md:mb-2">ملاحظات حرجة</div>
                        <div className="display text-2xl md:text-4xl text-[#A4502A] arabic-numerals">{analysisData.critical_count ?? 0}</div>
                      </div>
                    </div>

                    {(!analysisData.findings || analysisData.findings.length === 0) && (
                      <div className="mb-6 p-5 md:p-6 bg-[#F9F6EF] border border-[var(--line)] border-r-2 border-r-[#3F5235] flex items-start gap-3">
                        <Info className="w-5 h-5 text-[#3F5235] flex-shrink-0 mt-0.5" />
                        <div className="text-xs md:text-sm text-[var(--ink)]/75 leading-relaxed">
                          لم يُرجع التحليل ملاحظات تفصيلية لهذا المخطط. قد يعود ذلك إلى وضوح المخطط، أو محدودية العناصر القابلة للفحص، أو الحاجة إلى مقياس واضح. يُرجى مراجعة الملخص وحدود التحليل أدناه، أو تجربة مخطط بدقة أعلى.
                        </div>
                      </div>
                    )}

                    {analysisData.findings && analysisData.findings.length > 0 && (
                      <>
                        <div className="text-[10px] md:text-xs tracking-widest text-[var(--ink)]/50 mb-3">الملاحظات التفصيلية</div>
                        <div className="space-y-3 mb-6">
                          {analysisData.findings.map((f, i) => {
                            const colorMap = { pass: '#3F5235', fail: '#A4502A', warn: '#B8860B' };
                            const Icon = f.type === 'pass' ? CheckCircle2 : f.type === 'fail' ? XCircle : AlertTriangle;
                            return (
                              <div key={i} className="bg-white border border-[var(--line)] p-3 md:p-4">
                                <div className="flex items-start gap-3 mb-2">
                                  <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colorMap[f.type] }} />
                                  <div className="flex-1">
                                    <div className="text-sm md:text-base font-medium">{f.title}</div>
                                    <div className="text-[10px] md:text-xs text-[var(--ink)]/50 mt-0.5">{f.article}</div>
                                  </div>
                                </div>
                                {f.details && (
                                  <div className="text-xs md:text-sm text-[var(--ink)]/80 leading-relaxed mr-8">{f.details}</div>
                                )}
                                <div className="grid grid-cols-2 gap-3 mt-3 mr-8 text-[10px] md:text-xs">
                                  <div>
                                    <span className="text-[var(--ink)]/50">الملاحظ: </span>
                                    <span style={{ color: colorMap[f.type] }}>{f.observed}</span>
                                  </div>
                                  <div>
                                    <span className="text-[var(--ink)]/50">المطلوب: </span>
                                    <span>{f.required}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {analysisData.recommendations && analysisData.recommendations.length > 0 && (
                      <div className="mb-6 p-4 bg-[#F9F6EF] border border-[var(--line)]">
                        <div className="text-[10px] tracking-widest text-[var(--ink)]/50 mb-3">التوصيات</div>
                        <ul className="space-y-2">
                          {analysisData.recommendations.map((r, i) => (
                            <li key={i} className="text-xs md:text-sm flex gap-2">
                              <span className="text-[#3F5235]">←</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysisData.limitations && (
                      <div className="text-[10px] md:text-xs text-[var(--ink)]/60 leading-relaxed bg-white p-3 md:p-4 border border-[var(--line)]">
                        <strong>حدود التحليل:</strong> {analysisData.limitations}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'qa' && (
            <div className="bg-white border border-[var(--line)] shadow-sm">
              <div className="border-b border-[var(--line)] p-3 md:p-4 flex items-center gap-3 bg-[#F9F6EF]">
                <div className="w-2 h-2 rounded-full bg-[#3F5235] animate-pulse"></div>
                <span className="text-[10px] md:text-xs tracking-wider text-[var(--ink)]/60">SBC RAG ENGINE — متصل بقاعدة المعرفة</span>
              </div>

              <div className="p-4 md:p-10">
                <form onSubmit={handleFreeSubmit} className="mb-6 md:mb-8 flex gap-2">
                  <input
                    type="text"
                    value={freeQuery}
                    onChange={(e) => setFreeQuery(e.target.value)}
                    placeholder="اكتب سؤالك حول كود البناء السعودي..."
                    className="flex-1 px-3 md:px-4 py-2.5 md:py-3 border border-[var(--line)] focus:border-[#3F5235] outline-none text-sm md:text-base bg-white"
                  />
                  <button
                    type="submit"
                    disabled={thinking || !freeQuery.trim()}
                    className="bg-[var(--ink)] text-[var(--paper)] px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm flex items-center gap-2 hover:bg-[#3F5235] transition disabled:opacity-50"
                  >
                    <Send className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden md:inline">بحث</span>
                  </button>
                </form>

                {!activeAnswer && !thinking && !errorMsg && (
                  <div>
                    <div className="text-xs md:text-sm text-[var(--ink)]/60 mb-3 md:mb-4">أو جرّب أحد الأسئلة الشائعة:</div>
                    <div className="grid md:grid-cols-2 gap-2 md:gap-3">
                      {cannedQuestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleQuery(q)}
                          className="text-right p-3 md:p-4 border border-[var(--line)] hover:border-[#3F5235] hover:bg-[#F9F6EF] transition"
                        >
                          <div className="flex items-start gap-2 md:gap-3">
                            <Search className="w-4 h-4 text-[#3F5235] mt-1 flex-shrink-0" />
                            <div className="text-xs md:text-sm leading-relaxed">{q}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {thinking && (
                  <div className="py-8 md:py-12 text-center">
                    <Loader2 className="w-8 h-8 mx-auto text-[#3F5235] animate-spin mb-4" />
                    <div className="text-xs md:text-sm text-[var(--ink)]/60">يبحث المحرك في قاعدة المعرفة...</div>
                  </div>
                )}

                {errorMsg && !thinking && (
                  <div className="py-6 px-4 bg-red-50 border border-red-200 text-red-700 text-xs md:text-sm">
                    {errorMsg}
                    <button onClick={() => { setErrorMsg(''); setActiveAnswer(null); }} className="block mt-3 text-[10px] underline">العودة</button>
                  </div>
                )}

                {activeAnswer && !thinking && (
                  <div className="fade-up">
                    <button
                      onClick={() => { setActiveAnswer(null); setQuery(''); }}
                      className="text-[10px] md:text-xs text-[var(--ink)]/60 hover:text-[var(--ink)] flex items-center gap-1 mb-4 md:mb-6"
                    >
                      <ChevronLeft className="w-3 h-3" /> سؤال جديد
                    </button>

                    <div className="border-r-2 border-[#3F5235] pr-3 md:pr-4 mb-4 md:mb-6">
                      <div className="text-[10px] md:text-xs text-[var(--ink)]/50 mb-1">السؤال</div>
                      <div className="text-sm md:text-base">{activeAnswer.question}</div>
                    </div>

                    <div className="bg-[#F9F6EF] p-4 md:p-6">
                      <div className="flex items-center gap-2 text-[10px] md:text-xs text-[#3F5235] mb-3">
                        <FileCheck2 className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="tracking-wider">CodeCheck SBC Engine</span>
                      </div>
                      <p className="leading-loose text-xs md:text-base text-[var(--ink)]/90 whitespace-pre-wrap">{activeAnswer.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="integration" className="border-t border-[var(--line)] bg-[#EBE5D6]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16">
            <div>
              <div className="flex items-center gap-3 text-[10px] md:text-xs tracking-widest text-[#3F5235] mb-6">
                <div className="w-8 md:w-12 h-px bg-[#3F5235]"></div>
                <span>التكامل المؤسسي</span>
              </div>
              <h2 className="display text-2xl md:text-4xl leading-tight mb-4 md:mb-6">
                لا نبني بديلاً.
                <br />
                نبني <span className="text-[#3F5235]">طبقة ذكية فوق</span> ما هو قائم.
              </h2>
              <p className="text-sm md:text-base text-[var(--ink)]/70 leading-loose">
                المنصة مصممة لتعمل كطبقة تدقيق آلي تتكامل مع منصة بلدي، نظام إتمام، ومنصة الدفاع المدني (سلامة)
                دون الحاجة لاستبدال أي نظام قائم. وتتوسع تدريجياً وفق خارطة طريق واضحة بعد البيئة التجريبية.
              </p>
            </div>
            <div className="space-y-px bg-[var(--line)]">
              {[
  { name: 'منصة بلدي', role: 'استيراد بيانات الأرض والاشتراطات', status: 'هدف البيئة التجريبية' },
  { name: 'نظام إتمام', role: 'إصدار الرخصة بعد الموافقة', status: 'هدف ما بعد التجربة' },
  { name: 'سلامة — الدفاع المدني', role: 'مراجعة اشتراطات الحريق', status: 'تنسيق مستقبلي' },
  { name: 'كود البناء السعودي SBC', role: 'المرجعية الفنية الأساسية', status: 'مدمج بالكامل' },
].map((item, i) => (
                <div key={i} className="bg-[#EBE5D6] p-4 md:p-5 flex items-center justify-between gap-3">
                  <div>
                    <div className="display text-sm md:text-base">{item.name}</div>
                    <div className="text-[10px] md:text-xs text-[var(--ink)]/60 mt-1">{item.role}</div>
                  </div>
                  <div className="text-[10px] md:text-xs tracking-wider text-[#3F5235] border border-[#3F5235]/30 px-2 py-1 whitespace-nowrap">
                    {item.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="roadmap" className="border-t border-[var(--line)] bg-[var(--paper)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="flex items-center gap-3 text-[10px] md:text-xs tracking-widest text-[#3F5235] mb-6">
            <div className="w-8 md:w-12 h-px bg-[#3F5235]"></div>
            <span>خارطة الطريق</span>
          </div>
          <h2 className="display text-2xl md:text-5xl leading-tight max-w-4xl mb-10 md:mb-16">
            ثلاث مراحل تحويلية،
            <br />
            مدتها 18 شهراً.
          </h2>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              { phase: '01', title: 'النموذج الأولي', duration: '6 أشهر', items: ['محرك RAG كامل على SBC', 'تحليل PDF للمخططات البسيطة', 'لوحة معاينة للمراجع', 'اختبار مع 10 مكاتب هندسية'] },
              { phase: '02', title: 'التكامل التشغيلي', duration: '6 أشهر', items: ['API مع منصة بلدي', 'دعم صيغة DWG و IFC', 'إصدار التقارير المختومة', 'تشغيل تجريبي في 3 بلديات'] },
              { phase: '03', title: 'التوسع الوطني', duration: '6 أشهر', items: ['تغطية كاملة لجميع البلديات', 'دعم BIM متقدم', 'لوحة تحكم وزارية', 'مؤشرات أداء وطنية'] },
            ].map((p, i) => (
              <div key={i} className="border-t border-[var(--ink)] pt-4 md:pt-6">
                <div className="display text-3xl md:text-5xl text-[var(--ink)]/20 mb-2 md:mb-4 arabic-numerals">{p.phase}</div>
                <div className="display text-lg md:text-2xl mb-1">{p.title}</div>
                <div className="text-[10px] md:text-xs tracking-widest text-[#3F5235] mb-4 md:mb-6">{p.duration}</div>
                <ul className="space-y-2 md:space-y-3">
                  {p.items.map((item, j) => (
                    <li key={j} className="text-xs md:text-sm text-[var(--ink)]/70 flex items-start gap-2">
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

      <section id="vision" className="bg-[var(--ink)] text-[var(--paper)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="flex items-center gap-3 text-[10px] md:text-xs tracking-widest text-[#6B7F5C] mb-6">
            <div className="w-8 md:w-12 h-px bg-[#6B7F5C]"></div>
            <span>التوافق الاستراتيجي</span>
          </div>
          <h2 className="display text-2xl md:text-5xl leading-tight max-w-4xl mb-3 md:mb-4">
            موائمة مع <span className="text-[#6B7F5C]">رؤية المملكة 2030</span>.
          </h2>
          <p className="text-sm md:text-base text-[var(--paper)]/60 mb-10 md:mb-16 max-w-2xl">
            تساهم المنصة في تحقيق أربع ركائز رئيسية من رؤية 2030 من خلال رفع كفاءة العمليات الحكومية وتسريع دورة الترخيص.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--paper)]/10 mb-12 md:mb-20">
            {[
              { icon: Sparkles, title: 'جودة الحياة', body: 'تجربة ترخيص أسرع وأكثر شفافية للمواطن والمستثمر.' },
              { icon: Zap, title: 'التحول الرقمي', body: 'أتمتة كاملة لإجراءات يدوية تستهلك وقت الجهات الحكومية.' },
              { icon: Target, title: 'كفاءة الإنفاق', body: 'تخفيض ساعات العمل البشري المخصصة لمراجعة المخططات.' },
              { icon: TrendingUp, title: 'تنويع الاقتصاد', body: 'تسريع دورة رأس المال في القطاع العقاري والإنشائي.' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-[var(--ink)] p-4 md:p-6">
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-[#6B7F5C] mb-3 md:mb-4" />
                  <div className="display text-sm md:text-lg mb-2 md:mb-3">{item.title}</div>
                  <p className="text-[10px] md:text-xs text-[var(--paper)]/70 leading-relaxed">{item.body}</p>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-[10px] md:text-xs tracking-widest text-[#6B7F5C] mb-6">
            <div className="w-8 md:w-12 h-px bg-[#6B7F5C]"></div>
            <span>قياسات الأداء المتوقعة (يومياً)</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--paper)]/10">
            {[
              { v: '200+', l: 'مخطط معماري يومياً' },
              { v: '3 د', l: 'متوسط زمن التحليل' },
              { v: '%92', l: 'دقة الكشف المستهدفة' },
              { v: '1500+', l: 'ساعة عمل موفّرة شهرياً' },
            ].map((s, i) => (
              <div key={i} className="bg-[var(--ink)] p-4 md:p-6">
                <div className="display text-2xl md:text-4xl text-[#6B7F5C] arabic-numerals">{s.v}</div>
                <div className="text-[10px] md:text-xs text-[var(--paper)]/60 mt-2 leading-relaxed">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[var(--ink)] border-t border-[var(--paper)]/10 text-[var(--paper)]/50 text-[10px] md:text-xs">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 text-center">
          <div>CodeCheck.SA — مقترح استراتيجي فني | جميع الحقوق محفوظة © 2026</div>
          <div className="tracking-widest">صُمم بمعايير حكومية</div>
        </div>
      </footer>
    </div>
  );
}
