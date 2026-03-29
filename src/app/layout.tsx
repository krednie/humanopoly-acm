import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Humanopoly",
  description: "Human Monopoly Game Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(event) {
                if (event.filename && event.filename.includes('chrome-extension://')) {
                  event.stopImmediatePropagation();
                }
              }, true);
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-dotted text-[#2d3436] antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
