import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TaskFlow - 업무 관리 시스템',
  description: '효율적인 업무 진행 관리를 위한 현대적인 솔루션',
  keywords: '업무관리, 프로젝트관리, 팀협업, 태스크, 일정관리',
  authors: [{ name: 'TaskFlow Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#0052CC',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
} 