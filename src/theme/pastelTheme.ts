import type { ThemeConfig } from 'antd';

export const pastelTheme: ThemeConfig = {
  token: {
    // Colors
    colorPrimary: '#DA7756', // Terracotta / Burnt Orange
    colorInfo: '#DA7756',
    colorBgBase: '#F2F0E9',  // Main Beige
    colorBgContainer: '#FCFAF7', // Slightly lighter beige for cards/inputs
    colorText: '#45423C',    // Warm Charcoal
    colorTextSecondary: '#8A8680',
    colorBorder: '#E0DDD5',
    
    // Radii - Softer corners
    borderRadius: 8,
    borderRadiusLG: 12,
    
    // Typography
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  components: {
    Layout: {
      bodyBg: '#F2F0E9',
      siderBg: '#EBE8E2', // Slightly darker beige for sidebar
    },
    Button: {
      primaryShadow: '0 2px 0 rgba(218, 119, 86, 0.15)',
    },
    Input: {
      activeBorderColor: '#DA7756',
      hoverBorderColor: '#E89A7D',
    },
    Select: {
      colorPrimary: '#DA7756',
    }
  }
};