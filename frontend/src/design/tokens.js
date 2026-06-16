/**
 * MikroWize Design Tokens
 * Based on Stitch "MikroWize Network Manager" project
 * Material Design 3 color system with Inter font
 */

export const colors = {
  primary: {
    DEFAULT: '#003d7c',
    container: '#0054a6',
    on: '#ffffff',
    onContainer: '#afcbff',
    fixed: '#d6e3ff',
    fixedDim: '#a9c7ff',
    onFixed: '#001b3d',
    onFixedVariant: '#00468c',
  },
  secondary: {
    DEFAULT: '#575f67',
    container: '#d8e1ea',
    on: '#ffffff',
    onContainer: '#5b646b',
    fixed: '#dbe4ed',
    fixedDim: '#bfc8d0',
    onFixed: '#141d23',
    onFixedVariant: '#3f484f',
  },
  tertiary: {
    DEFAULT: '#6a2b00',
    container: '#8f3c00',
    on: '#ffffff',
    onContainer: '#ffbb99',
    fixed: '#ffdbcb',
    fixedDim: '#ffb691',
  },
  surface: {
    DEFAULT: '#f9f9ff',
    dim: '#d9d9e1',
    bright: '#f9f9ff',
    containerLowest: '#ffffff',
    containerLow: '#f2f3fb',
    container: '#ededf5',
    containerHigh: '#e7e8ef',
    containerHighest: '#e1e2ea',
    variant: '#e1e2ea',
    on: '#191c21',
    onVariant: '#424751',
    inverse: '#2e3036',
    inverseOn: '#f0f0f8',
    inversePrimary: '#a9c7ff',
    tint: '#185eb0',
  },
  background: {
    DEFAULT: '#f9f9ff',
    on: '#191c21',
  },
  error: {
    DEFAULT: '#ba1a1a',
    container: '#ffdad6',
    on: '#ffffff',
    onContainer: '#93000a',
  },
  outline: {
    DEFAULT: '#727783',
    variant: '#c2c6d3',
  },
  success: {
    DEFAULT: '#1a7c3b',
    container: '#a8f5b8',
    on: '#ffffff',
    onContainer: '#002109',
  },
  warning: {
    DEFAULT: '#7c5800',
    container: '#ffdea3',
    on: '#ffffff',
    onContainer: '#271900',
  },
  info: {
    DEFAULT: '#0054a6',
    container: '#d1e4ff',
    on: '#ffffff',
    onContainer: '#001b3d',
  },
}

export const typography = {
  fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
}

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
}

export const borderRadius = {
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
}

export const shadows = {
  sm: '0 1px 2px rgba(25, 28, 33, 0.05)',
  md: '0 2px 6px rgba(25, 28, 33, 0.08)',
  lg: '0 4px 12px rgba(25, 28, 33, 0.12)',
  xl: '0 8px 24px rgba(25, 28, 33, 0.16)',
}

export default { colors, typography, spacing, borderRadius, shadows }
