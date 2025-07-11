import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ID Card Station - QR Scanner & Face Verification',
  description: 'Security station for QR code scanning and face verification',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
