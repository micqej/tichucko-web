import type { Metadata } from 'next'
import { Fraunces, Quicksand } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--font-fraunces',
  display: 'swap',
})

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Tichučko — Rozprávky na dobrú noc',
  description:
    'Krátke rozprávky na dobrú noc pre deti od 0 do 13 rokov. Každá rozprávka trvá 3–5 minút a učí hodnoty: dôvera, odvaha, úcta k starším.',
  openGraph: {
    title: 'Tichučko — Rozprávky na dobrú noc',
    description: 'Každý večer nová rozprávka šitá na mieru veku vášho dieťatka.',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Tichučko',
    locale: 'sk_SK',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk" className={`${fraunces.variable} ${quicksand.variable}`}>
      <body>{children}</body>
    </html>
  )
}
