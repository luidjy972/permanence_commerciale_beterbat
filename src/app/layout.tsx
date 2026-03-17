import type { Metadata } from 'next'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'Beterbat — Gestion Commerciale',
  description: 'Application de gestion commerciale et planning de permanence',
  icons: {
    icon: 'https://www.beterbat.com/front/theme/images/icons/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var theme = localStorage.getItem('theme') || 'dark';
              if (theme === 'dark') document.documentElement.classList.add('dark');
            })();
          `,
        }} />
      </head>
      <body className="min-h-screen bg-theme-page overflow-x-hidden">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
