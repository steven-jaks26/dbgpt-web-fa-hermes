import { ChatContext, ChatContextProvider } from '@/app/chat-context';
import { DEFAULT_UI_LANGUAGE, isRtlLanguage, normalizeUiLanguage } from '@/app/i18n';
import SideBar from '@/components/layout/side-bar';
import { NewTaskProvider } from '@/modules/new-task';
import FloatHelper from '@/new-components/layout/FloatHelper';
import { STORAGE_LANG_KEY, STORAGE_USERINFO_KEY, STORAGE_USERINFO_VALID_TIME_KEY } from '@/utils/constants/index';
import { App, ConfigProvider, MappingAlgorithm, theme } from 'antd';
import faIR from 'antd/locale/fa_IR';
import classNames from 'classnames';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useContext, useEffect, useState } from 'react';
import moment from 'moment';
import 'moment/locale/fa';
import 'moment/locale/zh-cn';
import { useTranslation } from 'react-i18next';
import '../app/i18n';
import '../nprogress.css';
import '../styles/globals.css';
// import TopProgressBar from '@/components/layout/top-progress-bar';

const antdDarkTheme: MappingAlgorithm = (seedToken, mapToken) => {
  return {
    ...theme.darkAlgorithm(seedToken, mapToken),
    colorBgBase: '#232734',
    colorBorder: '#828282',
    colorBgContainer: '#232734',
  };
};

function CssWrapper({ children }: { children: React.ReactElement }) {
  const { mode } = useContext(ChatContext);
  const { i18n } = useTranslation();

  useEffect(() => {
    if (mode) {
      document.body?.classList?.add(mode);
      if (mode === 'light') {
        document.body?.classList?.remove('dark');
      } else {
        document.body?.classList?.remove('light');
      }
    }
  }, [mode]);

  useEffect(() => {
    const language = normalizeUiLanguage(
      window.localStorage.getItem(STORAGE_LANG_KEY) || i18n.language || DEFAULT_UI_LANGUAGE,
    );
    if (i18n.language !== language) {
      void i18n.changeLanguage(language);
    }
    const rtl = isRtlLanguage(language);
    document.documentElement.lang = rtl ? 'fa-IR' : language;
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    document.body.dir = rtl ? 'rtl' : 'ltr';
    document.body.classList.toggle('rtl', rtl);
    document.body.classList.toggle('ltr', !rtl);
    window.localStorage.setItem(STORAGE_LANG_KEY, language);
    moment.locale(language === 'fa' ? 'fa' : language === 'zh' ? 'zh-cn' : 'en');
  }, [i18n, i18n.language]);

  return (
    <div>
      {/* <TopProgressBar /> */}
      {children}
    </div>
  );
}

function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isMenuExpand, mode } = useContext(ChatContext);
  const { i18n } = useTranslation();
  const [isLogin, setIsLogin] = useState(false);

  const router = useRouter();

  // 登录检测
  const handleAuth = async () => {
    setIsLogin(false);
    // 如果已有登录信息，直接展示首页
    // if (localStorage.getItem(STORAGE_USERINFO_KEY)) {
    //   setIsLogin(true);
    //   return;
    // }

    // MOCK User info
    const user = {
      user_channel: `dbgpt`,
      user_no: `001`,
      nick_name: `dbgpt`,
    };
    if (user) {
      localStorage.setItem(STORAGE_USERINFO_KEY, JSON.stringify(user));
      localStorage.setItem(STORAGE_USERINFO_VALID_TIME_KEY, Date.now().toString());
      setIsLogin(true);
    }
  };

  useEffect(() => {
    handleAuth();
  }, []);

  if (!isLogin && !router.pathname.startsWith('/share')) {
    return null;
  }

  const renderContent = () => {
    // Hide sidebar for mobile, share pages, and task replay mode (from_task)
    const hideSidebar =
      router.pathname.includes('mobile') || router.pathname.startsWith('/share') || !!router.query.from_task;

    if (router.pathname.includes('mobile') || router.pathname.startsWith('/share')) {
      return <>{children}</>;
    }
    return (
      <div className='flex w-screen h-screen overflow-hidden'>
        <Head>
          <meta name='viewport' content='initial-scale=1.0, width=device-width, maximum-scale=1' />
        </Head>
        {router.pathname !== '/construct/app/extra' && !hideSidebar && (
          <div className={classNames('transition-[width]', isMenuExpand ? 'w-60' : 'w-20', 'hidden', 'md:block')}>
            <SideBar />
          </div>
        )}
        <div className='flex flex-col flex-1 relative overflow-hidden'>{children}</div>
        {!hideSidebar && <FloatHelper />}
      </div>
    );
  };

  return (
    <ConfigProvider
      direction={isRtlLanguage(i18n.language) ? 'rtl' : 'ltr'}
      locale={faIR}
      theme={{
        token: {
          colorPrimary: '#176c68',
          colorInfo: '#176c68',
          colorSuccess: '#19734a',
          colorWarning: '#a66a16',
          colorError: '#b94a48',
          colorBgLayout: mode === 'dark' ? '#111817' : '#f7f8f5',
          colorBgContainer: mode === 'dark' ? '#18211f' : '#ffffff',
          colorBorder: mode === 'dark' ? '#34433e' : '#d9e2de',
          colorText: mode === 'dark' ? '#f1f5f2' : '#182321',
          colorTextSecondary: mode === 'dark' ? '#a7b5b0' : '#687773',
          borderRadius: 8,
        },
        algorithm: mode === 'dark' ? antdDarkTheme : undefined,
      }}
    >
      <App>{renderContent()}</App>
    </ConfigProvider>
  );
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChatContextProvider>
      <NewTaskProvider>
        <CssWrapper>
          <LayoutWrapper>
            <Component {...pageProps} />
          </LayoutWrapper>
        </CssWrapper>
      </NewTaskProvider>
    </ChatContextProvider>
  );
}

export default MyApp;
