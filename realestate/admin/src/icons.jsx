import React from 'react';

// Minimal inline SVG icon set (no external icon dependency)
const S = ({ children, size = 20, stroke = 2, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

export const IconBed = (p) => (
  <S {...p}><path d="M2 9V5a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v4" /><path d="M2 13v5a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-5" /><path d="M2 13h20M2 16h20" /><path d="M6 9V7h4v2M14 9V7h4v2" /></S>
);
export const IconBath = (p) => (
  <S {...p}><path d="M4 12V5a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2" /><path d="M2 12h20v3a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" /><path d="M6 19v1M18 19v1" /></S>
);
export const IconArea = (p) => (
  <S {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h6V3M15 21v-6h6" /></S>
);
export const IconRupee = (p) => (
  <S {...p}><path d="M6 3h12M6 8h12M6 3c6 0 6 5 0 5M6 8l7 13" /></S>
);
export const IconPin = (p) => (
  <S {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></S>
);
export const IconPhone = (p) => (
  <S {...p}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8 10a16 16 0 0 0 6 6l1.3-1.4a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" /></S>
);
export const IconMail = (p) => (
  <S {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></S>
);
export const IconClock = (p) => (
  <S {...p}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></S>
);
export const IconArrowRight = (p) => (
  <S {...p}><path d="M5 12h14M13 6l6 6-6 6" /></S>
);
export const IconArrowLeft = (p) => (
  <S {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></S>
);
export const IconMenu = (p) => (
  <S {...p}><path d="M3 6h18M3 12h18M3 18h18" /></S>
);
export const IconX = (p) => (
  <S {...p}><path d="M18 6 6 18M6 6l12 12" /></S>
);
export const IconSearch = (p) => (
  <S {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></S>
);
export const IconChevronDown = (p) => (
  <S {...p}><path d="m6 9 6 6 6-6" /></S>
);
export const IconHome = (p) => (
  <S {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9 21v-6h6v6" /></S>
);
export const IconShield = (p) => (
  <S {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></S>
);
export const IconHandshake = (p) => (
  <S {...p}><path d="m11 17 2 2a1 1 0 1 0 3-3" /><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.9-3.9a2 2 0 0 0-2.7 0l-.9.9" /><path d="m8.5 16.5-1.5 1.5a1 1 0 1 1-3-3l3.9-3.9a2 2 0 0 1 2.7 0l.9.9" /><path d="m12 8 2.5-2.5a1 1 0 1 0-3-3L7.6 6.4a2 2 0 0 0 0 2.7l.9.9" /></S>
);
export const IconStar = ({ size = 18, filled = true, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />
  </svg>
);
export const IconQuote = ({ size = 40, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M10 7H6a3 3 0 0 0-3 3v7h7v-7H6.5A2.5 2.5 0 0 1 9 7.5V7h1Zm11 0h-4a3 3 0 0 0-3 3v7h7v-7h-3.5a2.5 2.5 0 0 1 2.5-2.5V7h1Z" />
  </svg>
);
export const IconCheck = (p) => (
  <S {...p}><path d="M20 6 9 17l-5-5" /></S>
);
export const IconEye = (p) => (
  <S {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></S>
);
export const IconKey = (p) => (
  <S {...p}><circle cx="7.5" cy="15.5" r="5.5" /><path d="m12 11 9-9M16 7l3 3M13.5 9.5 15 11" /></S>
);
export const IconBuilding = (p) => (
  <S {...p}><rect x="4" y="2" width="16" height="20" rx="1" /><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01M12 6h.01M12 10h.01M12 14h.01" /></S>
);
export const IconCalendar = (p) => (
  <S {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></S>
);
export const IconChart = (p) => (
  <S {...p}><path d="M3 3v18h18" /><path d="M7 15v-4M12 15V7M17 15v-7" /></S>
);
export const IconFilter = (p) => (
  <S {...p}><path d="M22 3H2l8 9.5V19l4 2v-8.5L22 3Z" /></S>
);
export const IconSparkle = (p) => (
  <S {...p}><path d="M12 3l1.9 5.7L19.5 10l-5.6 1.3L12 17l-1.9-5.7L4.5 10l5.6-1.3L12 3Z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></S>
);
export const IconWhatsapp = ({ size = 22, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.58-.35zM12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.83 9.83 0 0 1-1.51-5.26c0-5.44 4.43-9.87 9.88-9.87a9.8 9.8 0 0 1 6.98 2.9 9.8 9.8 0 0 1 2.89 6.98c0 5.45-4.43 9.88-9.86 9.88zm8.4-18.27A11.8 11.8 0 0 0 12.04 0C5.46 0 .1 5.35.1 11.94c0 2.1.55 4.16 1.6 5.97L0 24l6.27-1.64a11.9 11.9 0 0 0 5.77 1.47h.01c6.58 0 11.93-5.35 11.93-11.94 0-3.19-1.24-6.19-3.53-8.36z" />
  </svg>
);
export const IconPlay = (p) => (
  <S {...p}><circle cx="12" cy="12" r="10" /><path d="m10 8 6 4-6 4V8Z" fill="currentColor" stroke="none" /></S>
);
export const IconPause = (p) => (
  <S {...p}><circle cx="12" cy="12" r="10" /><path d="M9 9h2v6H9zM13 9h2v6h-2z" fill="currentColor" stroke="none" /></S>
);
export const IconUpload = (p) => (
  <S {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5M12 3v12" /></S>
);
export const IconTrash = (p) => (
  <S {...p}><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M10 11v6M14 11v6" /></S>
);
export const IconEdit = (p) => (
  <S {...p}><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" /></S>
);
export const IconPlus = (p) => (
  <S {...p}><path d="M12 5v14M5 12h14" /></S>
);
export const IconLogout = (p) => (
  <S {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></S>
);
export const IconLayout = (p) => (
  <S {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></S>
);
export const IconInbox = (p) => (
  <S {...p}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1Z" /></S>
);
export const IconSettings = (p) => (
  <S {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.01a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.01a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z" /></S>
);
export const IconImage = (p) => (
  <S {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" /></S>
);
export const IconGrid = (p) => (
  <S {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></S>
);
export const IconGrip = (p) => (
  <S {...p}><circle cx="9" cy="9" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="9" r="1" fill="currentColor" stroke="none" /><circle cx="9" cy="15" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="15" r="1" fill="currentColor" stroke="none" /></S>
);
export const IconExternal = (p) => (
  <S {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6M10 14 21 3" /></S>
);
export const IconAlert = (p) => (
  <S {...p}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></S>
);
export const IconUser = (p) => (
  <S {...p}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></S>
);
export const IconSend = (p) => (
  <S {...p}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></S>
);
export const IconMap = (p) => (
  <S {...p}><path d="M9 20 3 17V4l6 3 6-3 6 3v13l-6-3-6 3Z" /><path d="M9 7v13M15 4v13" /></S>
);

export const IconBell = (p) => (
  <S {...p}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></S>
);

