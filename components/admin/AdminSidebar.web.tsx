import React, { useState } from 'react';
import {
  CBadge,
  CNavItem,
  CNavTitle,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarNav,
  CSidebarToggler
} from '@coreui/react';
import '@coreui/coreui/dist/css/coreui.min.css';

export type AdminSidebarItem = {
  key: string;
  label: string;
  icon?: string;
  badge?: string;
};

type Props = {
  brand: string;
  subtitle: string;
  items: AdminSidebarItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  onLogout: () => void;
};

export default function AdminSidebar({ brand, subtitle, items, activeKey, onSelect, onLogout }: Props) {
  const [narrow, setNarrow] = useState(false);

  return (
    <CSidebar
      colorScheme="dark"
      className="border-end"
      style={{
        width: narrow ? 88 : 292,
        borderColor: '#1A4F7A',
        backgroundColor: '#0B2742',
        borderRadius: 16,
        overflow: 'hidden',
        marginRight: 14
      }}
      narrow={narrow}
    >
      <CSidebarHeader
        className="border-bottom"
        style={{ borderColor: '#1A4F7A', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '18px 16px 12px' }}
      >
        <CSidebarBrand style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 22 }}>{brand}</CSidebarBrand>
        {!narrow && <small style={{ color: '#C7DDF9', marginTop: 2 }}>{subtitle}</small>}
      </CSidebarHeader>

      <CSidebarNav style={{ padding: 10 }}>
        {!narrow && (
          <CNavTitle style={{ color: '#D9EAFF', fontSize: 11, fontWeight: 700 }}>
            Navigation
          </CNavTitle>
        )}
        {items.map((item) => {
          const active = item.key === activeKey;
          const iconGlyph = item.icon ? item.icon.slice(0, 1).toUpperCase() : '*';
          return (
            <CNavItem
              key={item.key}
              href="#"
              active={active}
              onClick={(event) => {
                event.preventDefault();
                onSelect(item.key);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                borderRadius: 10,
                marginBottom: 6,
                padding: narrow ? '10px 8px' : '10px 12px',
                color: active ? '#FFFFFF' : '#102A43',
                background: active ? '#1D65A3' : '#E5F1FF',
                border: `1px solid ${active ? '#1D65A3' : '#9CC5EE'}`,
                fontWeight: 700,
                gap: 8,
                textDecoration: 'none'
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  width: 20,
                  height: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 800,
                  color: active ? '#FFFFFF' : '#1D65A3',
                  backgroundColor: active ? '#0B2742' : '#D9E9FA',
                  flexShrink: 0
                }}
              >
                {iconGlyph}
              </span>
              {!narrow && <span style={{ flex: 1 }}>{item.label}</span>}
              {!narrow && item.badge && (
                <CBadge style={{ backgroundColor: active ? '#0B2742' : '#D9E9FA', color: active ? '#DCEBFF' : '#1D65A3' }}>
                  {item.badge}
                </CBadge>
              )}
            </CNavItem>
          );
        })}
      </CSidebarNav>

      <CSidebarFooter
        className="border-top"
        style={{
          borderColor: '#1A4F7A',
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}
      >
        <CNavItem
          href="#"
          onClick={(event) => {
            event.preventDefault();
            onLogout();
          }}
          style={{
            borderRadius: 10,
            padding: '10px 12px',
            color: '#DCEBFF',
            border: '1px solid #2D5C87',
            textDecoration: 'none',
            fontWeight: 700
          }}
        >
          Logout
        </CNavItem>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <CSidebarToggler onClick={() => setNarrow((current) => !current)} />
        </div>
      </CSidebarFooter>
    </CSidebar>
  );
}
