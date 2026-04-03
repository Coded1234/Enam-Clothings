import { Toaster } from "react-hot-toast";
import Script from "next/script";
import { Poppins } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  ),
  title: {
    default: "Diamond Aura Gallery - Premium Fashion",
    template: `%s | Diamond Aura Gallery`,
  },
  description:
    "Diamond Aura Gallery is a premium fashion and clothing brand. We sell high-quality products at affordable prices.",
  keywords: [
    "fashion",
    "clothing",
    "premium fashion",
    "online store",
    "women's fashion",
    "men's fashion",
  ],
  openGraph: {
    type: "website",
    siteName: "Diamond Aura Gallery",
    title: "Diamond Aura Gallery - Premium Fashion",
    description:
      "Diamond Aura Gallery is a premium fashion and clothing brand. We sell high-quality products at affordable prices.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Diamond Aura Gallery - Premium Fashion",
    description:
      "Diamond Aura Gallery is a premium fashion and clothing brand. We sell high-quality products at affordable prices.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={poppins.variable}>
      <head>
        <Script id="theme-matcher" strategy="beforeInteractive">
          {`(function(){try{const t=localStorage.getItem('theme');const theme=(t==='dark'||t==='light')?t:'light';document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(theme);}catch(e){document.documentElement.classList.add('light');}})();`}
        </Script>

        {/* Google Analytics 4 */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-09ED5YL58F"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-09ED5YL58F');
          `}
        </Script>

        {/* Facebook/Meta Pixel */}
        {process.env.NEXT_PUBLIC_FB_PIXEL_ID && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${process.env.NEXT_PUBLIC_FB_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
      </head>
      <body suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { background: "#333", color: "#fff" },
              success: { iconTheme: { primary: "#667eea", secondary: "#fff" } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
