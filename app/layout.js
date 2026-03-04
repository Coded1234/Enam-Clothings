import { Toaster } from "react-hot-toast";
import { Providers } from "./providers";
import "./globals.css";

export const metadata = {
  title: "The Fashion Gallery - Premium Fashion",
  description: "The Fashion Gallery - Premium Fashion & Clothing",
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
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
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
