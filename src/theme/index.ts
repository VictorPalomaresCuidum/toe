import { Platform, StyleSheet } from 'react-native';

// ─── HP Design Tokens ─────────────────────────────────────────────────────────

export const colors = {
  // Brand & Accent
  primary: '#024ad8',
  primaryBright: '#296ef9',
  primaryDeep: '#0e3191',
  primarySoft: '#c9e0fc',
  onPrimary: '#ffffff',

  // Ink
  ink: '#1a1a1a',
  inkDeep: '#000000',
  inkSoft: '#292929',
  onInk: '#ffffff',
  charcoal: '#3d3d3d',
  graphite: '#636363',

  // Surfaces
  canvas: '#ffffff',
  paper: '#ffffff',
  cloud: '#f7f7f7',
  fog: '#e8e8e8',
  steel: '#c2c2c2',
  hairline: '#e8e8e8',
  hairlineStrong: '#c2c2c2',

  // Link
  link: '#024ad8',
  linkPressed: '#0e3191',

  // Accents
  bloomCoral: '#ff5050',
  bloomRose: '#f9d4d2',
  bloomDeep: '#b3262b',
  bloomWine: '#5a1313',
  stormMist: '#8ebdce',
  stormSea: '#7fadbe',
  stormDeep: '#356373',
  error: '#b3262b',
};

export const rounded = {
  none: 0,
  xs: 2,
  sm: 3,
  md: 4,
  lg: 8,
  xl: 16,
  pill: 9999,
  full: 9999,
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  section: 80,
};

// Forma DJR Micro substitute: Inter on web, system elsewhere
const fontFamily = Platform.select({
  web: 'Inter, Arial, sans-serif',
  default: undefined,
});

export const typography = {
  displayXxl: { fontFamily, fontSize: 72, fontWeight: '500' as const, lineHeight: 72 },
  displayXl: { fontFamily, fontSize: 56, fontWeight: '500' as const, lineHeight: 56 },
  displayLg: { fontFamily, fontSize: 44, fontWeight: '500' as const, lineHeight: 44 },
  displayMd: { fontFamily, fontSize: 32, fontWeight: '500' as const, lineHeight: 32 },
  displaySm: { fontFamily, fontSize: 24, fontWeight: '500' as const, lineHeight: 28 },
  displayXs: { fontFamily, fontSize: 20, fontWeight: '500' as const, lineHeight: 20 },
  bodyLg: { fontFamily, fontSize: 18, fontWeight: '400' as const, lineHeight: 24 },
  bodyMd: { fontFamily, fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  bodyEmphasis: { fontFamily, fontSize: 16, fontWeight: '500' as const, lineHeight: 22 },
  captionMd: { fontFamily, fontSize: 14, fontWeight: '400' as const, lineHeight: 21 },
  captionSm: { fontFamily, fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  captionBold: { fontFamily, fontSize: 14, fontWeight: '700' as const, lineHeight: 18 },
  linkMd: { fontFamily, fontSize: 16, fontWeight: '500' as const, lineHeight: 22 },
  buttonMd: {
    fontFamily,
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0.7,
    textTransform: 'uppercase' as const,
  },
  buttonSm: {
    fontFamily,
    fontSize: 12.6,
    fontWeight: '700' as const,
    lineHeight: 12.6,
    letterSpacing: 0.126,
  },
  priceMd: { fontFamily, fontSize: 24, fontWeight: '500' as const, lineHeight: 28 },
};

// ─── Shadow helpers ────────────────────────────────────────────────────────────

export const shadows = {
  // Level 1 — Hairline border (applied separately as borderWidth/borderColor)
  hairline: {
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  // Level 2 — Soft Lift
  softLift: Platform.select({
    web: {
      boxShadow: '0 2px 8px rgba(26,26,26,0.08)',
    },
    default: {
      shadowColor: colors.ink,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
  }),
  // Level 3 — Floating Modal
  floatingModal: Platform.select({
    web: {
      boxShadow: '0 8px 24px rgba(26,26,26,0.12)',
    },
    default: {
      shadowColor: colors.ink,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
    },
  }),
};

// ─── Shared component styles ───────────────────────────────────────────────────

export const componentStyles = StyleSheet.create({
  // Buttons
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: rounded.md,
    height: 44,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnInk: {
    backgroundColor: colors.ink,
    borderRadius: rounded.md,
    height: 44,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnOutline: {
    backgroundColor: colors.canvas,
    borderRadius: rounded.md,
    height: 44,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnOutlineInk: {
    backgroundColor: colors.canvas,
    borderRadius: rounded.md,
    height: 44,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnLabel: {
    ...typography.buttonMd,
    color: colors.onPrimary,
  },
  btnLabelInk: {
    ...typography.buttonMd,
    color: colors.onPrimary,
  },
  btnLabelOutline: {
    ...typography.buttonMd,
    color: colors.primary,
  },
  btnLabelOutlineInk: {
    ...typography.buttonMd,
    color: colors.ink,
  },

  // Cards
  cardProduct: {
    backgroundColor: colors.canvas,
    borderRadius: rounded.xl,
    padding: spacing.xl,
    ...shadows.softLift,
  },
  cardCloud: {
    backgroundColor: colors.cloud,
    borderRadius: rounded.xl,
    padding: spacing.xxl,
  },

  // Utility strip (top bar)
  utilityStrip: {
    backgroundColor: colors.ink,
    height: 36,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Nav bar
  navBar: {
    backgroundColor: colors.canvas,
    height: 64,
    paddingHorizontal: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },

  // Dark slab (ink band)
  inkSlab: {
    backgroundColor: colors.ink,
    padding: spacing.xxl,
  },

  // Badge pill
  badgePillInk: {
    backgroundColor: colors.ink,
    borderRadius: rounded.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  badgePillOutline: {
    backgroundColor: colors.canvas,
    borderRadius: rounded.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  badgeSaleCoral: {
    backgroundColor: colors.bloomCoral,
    borderRadius: rounded.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },

  // Category tab
  categoryTab: {
    backgroundColor: colors.canvas,
    borderRadius: rounded.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  categoryTabActive: {
    backgroundColor: colors.ink,
    borderRadius: rounded.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },

  // FAQ row
  faqRow: {
    backgroundColor: colors.canvas,
    borderRadius: rounded.lg,
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
});
