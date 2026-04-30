import type {Metadata} from 'next';
import {Geist, Geist_Mono, JetBrains_Mono} from 'next/font/google';
import './globals.css';
import {cn} from '@/lib/utils';
import ReactQueryProvider from '@/lib/provider/ReactQueryProvider';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono'
});

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
});

export const metadata: Metadata = {
  metadataBase: new URL('https://yourdomain.vercel.app'), // Replace with your actual URL
  title: 'App name',
  description: 'App name description',
  icons: {
    icon: [
      {url: '/assets/logo.png', type: 'image/png', sizes: '32x32'},
      {url: '/assets/logo.png', type: 'image/png', sizes: '192x192'}
    ],
    apple: '/assets/logo.png'
  },
  openGraph: {
    title: 'App name',
    description: 'App name description',
    url: 'https://yourdomain.vercel.app/',
    type: 'website',
    images: [
      {
        url: '/assets/logo.png', // Replace with your actual image path of logo
        width: 1200,
        height: 630,
        alt: 'App name Preview'
      }
    ]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        'h-full',
        'antialiased',
        geistSans.variable,
        geistMono.variable,
        'font-mono',
        jetbrainsMono.variable
      )}
    >
      <body className="min-h-full flex flex-col">
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}
