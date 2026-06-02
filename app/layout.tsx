// @ts-nocheck
/* eslint-disable */
import "./globals.css";

export const metadata = {
  title: "CodeCheck.SA | منصة الامتثال الذكي لكود البناء السعودي",
  description:
    "منصة سعودية تعتمد على الذكاء الاصطناعي والرؤية الحاسوبية لمراجعة المخططات المعمارية ومطابقتها آلياً مع كود البناء السعودي (SBC) واشتراطات بلدي، بهدف تسريع إصدار الرخص ورفع جودة الامتثال.",
  keywords: [
    "كود البناء السعودي",
    "SBC",
    "مراجعة المخططات",
    "الذكاء الاصطناعي",
    "منصة بلدي",
    "CodeCheck",
    "وزارة البلديات والإسكان",
  ],
  applicationName: "CodeCheck.SA",
  openGraph: {
    title: "CodeCheck.SA — منصة الامتثال الذكي لكود البناء السعودي",
    description:
      "تدقيق آلي للمخططات المعمارية ومطابقتها مع كود البناء السعودي (SBC) عبر الذكاء الاصطناعي والرؤية الحاسوبية.",
    type: "website",
    locale: "ar_SA",
    siteName: "CodeCheck.SA",
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeCheck.SA — منصة الامتثال الذكي لكود البناء السعودي",
    description:
      "تدقيق آلي للمخططات المعمارية ومطابقتها مع كود البناء السعودي عبر الذكاء الاصطناعي.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3F5235",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@400;500;600;700&family=Tajawal:wght@300;400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
