import { Toaster } from "react-hot-toast";
import { Providers } from "./providers";
import "./globals.css";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){const t=localStorage.getItem('theme');const theme=t||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.classList.add(theme);})();`,
          }}
        />
      </head>
      <body>
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
