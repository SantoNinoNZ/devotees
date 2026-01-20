'use client';

import { ConfigProvider, theme, App } from 'antd';
import { ReactNode } from 'react';

const SANTO_NINO_THEME = {
  token: {
    colorPrimary: '#B91C1C',
    colorLink: '#B91C1C',
    colorSuccess: '#16A34A',
    colorWarning: '#D97706',
    colorError: '#DC2626',
    borderRadius: 8,
    fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  components: {
    Button: {
      primaryColor: '#FFFFFF',
    },
    Menu: {
      itemSelectedBg: 'rgba(185, 28, 28, 0.1)',
      itemSelectedColor: '#B91C1C',
    },
  },
};

interface Props {
  children: ReactNode;
}

export default function AntdProvider({ children }: Props) {
  return (
    <ConfigProvider
      theme={{
        ...SANTO_NINO_THEME,
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
