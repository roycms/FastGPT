import { Html, Head, Main, NextScript } from 'next/document';
import Navbar from '@/pages/Navbar'; // 确保路径正确

export default function Document() {
  return (
    <Html>
      <Head></Head>
      <body>
        <Navbar />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
