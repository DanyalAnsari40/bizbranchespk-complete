/** Root layout – BizBranches */
import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { GlobalTopbar } from "@/components/global-topbar";
import GlobalContainer from "@/components/global-container";
import { AdBanner } from "@/components/ad-banner";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { CopyDeterrent } from "@/components/copy-deterrent";
import { Toaster } from "@/components/ui/toaster";
import { PwaRegister } from "@/components/pwa-register";
import { OfflineBanner } from "@/components/offline-banner";
import { Suspense } from "react";
import Script from "next/script";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

const defaultTitle = `${SITE_NAME} – Pakistan Free Business Listing Directory`;
const defaultDesc = "Pakistan's free business listing directory. Find local businesses by city and category. Add your business free, read reviews, and get contact details. Trusted across Pakistan.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: defaultTitle,
    template: `%s – ${SITE_NAME}`,
  },
  description: defaultDesc,
  keywords: "Pakistan business directory, free business listing Pakistan, Pakistani business listing site, add business free Pakistan, local businesses Pakistan",
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: defaultTitle,
    description: defaultDesc,
    images: [
      {
        url: "/local-business-directory-city-buildings.webp",
        width: 1200,
        height: 630,
        alt: "BizBranches – Pakistan free business listing directory",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDesc,
    images: ["/local-business-directory-city-buildings.webp"],
  },
  category: "business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/bizbranches.pk.png`,
    description: "BizBranches is a free business listing directory for Pakistan. It helps users find local businesses by city and category and allows business owners to add their listing for free.",
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "support@bizbranches.pk",
      telephone: "+923142552851",
      areaServed: { "@type": "Country", name: "Pakistan" },
    },
    areaServed: { "@type": "Country", name: "Pakistan" },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: "Free Pakistan business directory. Find local businesses by city and category. Add your business free.",
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en-PK",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <link rel="icon" href="/bizbranches.pk.png" type="image/png" />
        <link rel="apple-touch-icon" href="/bizbranches.pk.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="alternate" type="text/plain" href={`${SITE_URL}/llms.txt`} title="Site description for AI and LLMs" />
        {/* Organization + WebSite schema for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
        {/* ✅ Google Analytics 4 (GA4) - Production Only */}
        {process.env.NODE_ENV === 'production' && (
          <>
            <Script
              id="ga4-script"
              strategy="afterInteractive"
              src="https://www.googletagmanager.com/gtag/js?id=G-53ZYC74P6Q"
            />
            <Script id="ga4-inline" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-53ZYC74P6Q');
             `}
            </Script>
          </>
        )}

        {/* Microsoft Clarity - Production only */}
        {process.env.NODE_ENV === 'production' && (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "nrs1jpcy82");
            `}
          </Script>
        )}

        {/* ✅ Google AdSense: native script (no data-nscript) - Production only */}
        {process.env.NODE_ENV === 'production' && (
          <script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4083132987699578"
            crossOrigin="anonymous"
          />
        )}
      </head>

      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} pb-20 md:pb-0`} suppressHydrationWarning={true}>
        <CopyDeterrent />
        <Header />
        <AdBanner placement="header" />
        <Suspense fallback={null}>
          <GlobalTopbar />
        </Suspense>
        <GlobalContainer>{children}</GlobalContainer>
        <Footer />
        <MobileBottomNav />
        <Toaster />
        <PwaRegister />
        <OfflineBanner />
      </body>
    </html>
  );
}
