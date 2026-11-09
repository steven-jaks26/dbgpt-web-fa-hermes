import { createCache, StyleProvider } from '@ant-design/cssinjs';
import Document, { DocumentContext, Head, Html, Main, NextScript } from 'next/document';
import { doExtraStyle } from '../genAntdCss';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const cache = createCache();
    let fileName = '';
    const originalRenderPage = ctx.renderPage;
    ctx.renderPage = () =>
      originalRenderPage({
        enhanceApp: App => props => (
          <StyleProvider cache={cache} hashPriority='high'>
            <App {...props} />
          </StyleProvider>
        ),
      });
    const initialProps = await Document.getInitialProps(ctx);

    fileName = doExtraStyle({
      cache,
    });

    return {
      ...initialProps,
      styles: (
        <>
          {initialProps.styles}
          {/* 1.2 inject css */}
          {fileName && <link rel='stylesheet' href={`/${fileName}`} />}
        </>
      ),
    };
  }

  render() {
    // Persian is the default UI language; CssWrapper updates lang/dir after
    // hydration when the user has a persisted English or Chinese choice.
    return (
      <Html lang='fa-IR' dir='rtl'>
        <Head>
          <link rel='icon' href='/favicon.ico' />
          <meta name='description' content='دستیار دادهٔ هوش مصنوعی DB-GPT' />
          <meta property='og:description' content='دستیار داده‌محور DB-GPT' />
          <meta property='og:title' content='DB-GPT' />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
