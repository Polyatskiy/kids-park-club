"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Link } from "@/i18n/routing";
import { useRouter } from "next/navigation";
import { useNavigation } from "@/lib/useNavigation";
import { useTranslations } from "next-intl";

/* ============================================================
    COLORING TOOLBAR COMPONENT
============================================================ */
function ColoringToolbar({
  tool,
  setTool,
  color,
  setColor,
  opacity,
  setOpacity,
  brushSize,
  setBrushSize,
  zoom,
  setZoom,
  onZoomIn,
  onZoomOut,
  undo,
  onClear,
  onDownload,
  isMobile,
}: {
  tool: "brush" | "eraser" | "fill";
  setTool: (t: "brush" | "eraser" | "fill") => void;
  color: string;
  setColor: (c: string) => void;
  opacity: number;
  setOpacity: (o: number) => void;
  brushSize: number;
  setBrushSize: (s: number) => void;
  zoom: number;
  setZoom: (z: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  undo: () => void;
  onClear: () => void;
  onDownload: () => void;
  isMobile: boolean;
}) {
  const tToolbar = useTranslations("common.toolbar");
  // Handle color selection: switch from eraser to brush if needed
  const handleColorSelect = (selectedColor: string) => {
    // If eraser is active, switch to brush
    if (tool === "eraser") {
      setTool("brush");
    }
    // Always apply the chosen color
    setColor(selectedColor);
  };

  // Desktop: vertical sidebar layout
  if (!isMobile) {
    return (
      <aside
        className="flex-shrink-0"
        style={{
          width: '240px',
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          position: 'sticky',
          top: '20px',
          maxHeight: 'calc(100vh - 40px)',
          overflowY: 'auto',
        }}
      >
        <div className="flex flex-col gap-3">
          {/* Tools */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ToolButton icon="brush" active={tool === "brush"} onClick={() => setTool("brush")} />
              <ToolButton icon="eraser" active={tool === "eraser"} onClick={() => setTool("eraser")} />
              <ToolButton icon="fill" active={tool === "fill"} onClick={() => setTool("fill")} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ActionButton type="undo" onClick={undo} />
              <ActionButton type="trash" onClick={onClear} />
              <ActionButton type="download" onClick={onDownload} />
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="flex flex-col gap-2">
            <ZoomControls zoom={zoom} onZoomIn={onZoomIn} onZoomOut={onZoomOut} />
          </div>

          {/* Brush Settings */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-700 whitespace-nowrap">Brush Size</label>
              <input
                type="range"
                min={5}
                max={120}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-700 whitespace-nowrap">Opacity</label>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Full Color Palette (Desktop) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Palette</label>
            <FullColorPalette
              color={color}
              setColor={handleColorSelect}
            />
          </div>
        </div>
      </aside>
    );
  }

  // Mobile: State for open panel
  const [openPanel, setOpenPanel] = useState<PanelType>(null);
  
  // Refs for positioning popovers
  const zoomButtonRef = useRef<HTMLButtonElement>(null);
  const brushButtonRef = useRef<HTMLButtonElement>(null);
  const opacityButtonRef = useRef<HTMLButtonElement>(null);

  // Toggle panel (close if same, open if different)
  const togglePanel = (panel: PanelType) => {
    setOpenPanel(prev => prev === panel ? null : panel);
  };

  // Close all panels
  const closeAllPanels = () => setOpenPanel(null);

  // Mobile: compact 2-row bottom toolbar with popovers
  return (
    <div 
      className="bg-white border-t border-gray-200 flex-shrink-0 shadow-lg mobile-toolbar-safe"
      style={{
        position: 'relative',
        zIndex: 10,
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 20px)',
        marginBottom: 0
      }}
    >
      {/* Popovers (rendered above toolbar) */}
      <ZoomPopover
        isOpen={openPanel === "zoom"}
        onClose={closeAllPanels}
        zoom={zoom}
        setZoom={setZoom}
        buttonRef={zoomButtonRef}
      />
      <BrushPopover
        isOpen={openPanel === "brush"}
        onClose={closeAllPanels}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        buttonRef={brushButtonRef}
      />
      <OpacityPopover
        isOpen={openPanel === "opacity"}
        onClose={closeAllPanels}
        opacity={opacity}
        setOpacity={setOpacity}
        buttonRef={opacityButtonRef}
      />

      {/* Row 1: Tools, Actions, Settings Icons */}
      <div className="flex items-center justify-between px-2 py-1.5 gap-1 border-b border-gray-100">
        {/* Drawing Tools */}
        <div className="flex items-center gap-1">
          <ToolButton icon="brush" active={tool === "brush"} onClick={() => { setTool("brush"); closeAllPanels(); }} compact />
          <ToolButton icon="eraser" active={tool === "eraser"} onClick={() => { setTool("eraser"); closeAllPanels(); }} compact />
          <ToolButton icon="fill" active={tool === "fill"} onClick={() => { setTool("fill"); closeAllPanels(); }} compact />
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <ActionButton type="undo" onClick={() => { undo(); closeAllPanels(); }} compact />
          <ActionButton type="trash" onClick={() => { onClear(); closeAllPanels(); }} compact />
          <ActionButton type="download" onClick={() => { onDownload(); closeAllPanels(); }} compact />
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200" />

        {/* Settings Buttons (Zoom, Brush, Opacity) */}
        <div className="flex items-center gap-1">
          <SettingsButton
            icon="🔍"
            label={tToolbar("zoom")}
            isActive={openPanel === "zoom"}
            onClick={() => togglePanel("zoom")}
            buttonRef={zoomButtonRef}
          />
          <SettingsButton
            icon="📏"
            label={tToolbar("brushSize")}
            isActive={openPanel === "brush"}
            onClick={() => togglePanel("brush")}
            buttonRef={brushButtonRef}
          />
          <SettingsButton
            icon="💧"
            label={tToolbar("opacity")}
            isActive={openPanel === "opacity"}
            onClick={() => togglePanel("opacity")}
            buttonRef={opacityButtonRef}
          />
        </div>
      </div>

      {/* Row 2: Color Palette only */}
      <div className="flex items-center justify-center px-2 py-1.5">
        <CompactColorPalette
          color={color}
          setColor={(c) => { handleColorSelect(c); closeAllPanels(); }}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
}

/* ============================================================
    CONFIRM MODAL
============================================================ */
function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-slate-700 mb-6">{message}</p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 rounded-lg"
          >
            {cancelText}
          </button>

          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2 bg-red-500 rounded-lg text-white"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
    MOBILE MENU DRAWER - Navigation for mobile coloring pages
    
    Uses the same navigation items as the desktop Navbar:
    - Home, Coloring, Games (always visible)
    - Admin (only for admin user)
    - Login/Logout (based on session state)
============================================================ */
function MobileMenu({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  // Use shared navigation hook - same logic as desktop Navbar
  const { user, loading, links, handleLogout } = useNavigation();
  const t = useTranslations("common");
  const tAuth = useTranslations("common.auth");

  // Handle logout and close menu
  const onLogoutClick = async () => {
    onClose();
    await handleLogout();
  };

  // Simple icon component for menu items
  const MenuIcon = ({ href }: { href: string }) => {
    if (href === "/") return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      </svg>
    );
    if (href === "/coloring") return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      </svg>
    );
    if (href === "/games") return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M6 12h4M8 10v4M15 11h.01M18 13h.01" />
      </svg>
    );
    if (href === "/admin") return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    );
    return null;
  };

  return (
    <>
      {/* Overlay - dark backdrop */}
      <div
        className={`mobile-menu-overlay ${isOpen ? "open" : ""}`}
        onClick={onClose}
      />
      
      {/* Drawer - slides in from right */}
      <div className={`mobile-menu-drawer ${isOpen ? "open" : ""}`}>
        {/* Header with logo and close button */}
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#1f2937' }}>Kids Park Club</span>
          <button
            onClick={onClose}
            style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Navigation Links - EXPLICIT RENDERING */}
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Always render base links explicitly + dynamic links from hook */}
          {links && links.length > 0 ? (
            links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  borderRadius: '12px',
                  color: '#374151',
                  fontWeight: '500',
                  fontSize: '16px',
                  textDecoration: 'none',
                  background: 'transparent'
                }}
              >
                <span style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                  <MenuIcon href={link.href} />
                </span>
                {link.label}
              </Link>
            ))
          ) : (
            /* Fallback: render hardcoded links if hook returns empty */
            <>
              <Link href="/" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px', color: '#374151', fontWeight: '500', fontSize: '16px', textDecoration: 'none' }}>
                <span style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                  <MenuIcon href="/" />
                </span>
                {t("home")}
              </Link>
              <Link href="/coloring" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px', color: '#374151', fontWeight: '500', fontSize: '16px', textDecoration: 'none' }}>
                <span style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                  <MenuIcon href="/coloring" />
                </span>
                {t("coloring")}
              </Link>
              <Link href="/games" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px', color: '#374151', fontWeight: '500', fontSize: '16px', textDecoration: 'none' }}>
                <span style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                  <MenuIcon href="/games" />
                </span>
                {t("games")}
              </Link>
            </>
          )}
        </div>

        {/* Auth section - Login/Logout at bottom */}
        <div style={{ marginTop: 'auto', padding: '12px', borderTop: '1px solid #e5e7eb' }}>
          {loading ? (
            <div style={{ padding: '16px', color: '#9ca3af', textAlign: 'center' }}>Loading...</div>
          ) : user ? (
            <button
              onClick={onLogoutClick}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                borderRadius: '12px',
                color: '#dc2626',
                fontWeight: '500',
                fontSize: '16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <span style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16,17 21,12 16,7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </span>
              Logout
            </button>
          ) : (
            <Link
              href="/auth/login"
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                borderRadius: '12px',
                color: '#2563eb',
                fontWeight: '500',
                fontSize: '16px',
                textDecoration: 'none'
              }}
            >
              <span style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                  <polyline points="10,17 15,12 10,7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
              </span>
              {tAuth("login")}
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

/* ============================================================
    ANIMATED TOOL BUTTONS
    - Uses OUTLINE style for selection (same as color palette)
    - No filled background when active
============================================================ */
function ToolButton({ icon, active, onClick, compact = false }: {
  icon: "brush" | "eraser" | "fill";
  active: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        ${compact ? "w-8 h-8" : "w-10 h-10 md:w-12 md:h-12"} rounded-full bg-white flex items-center justify-center shadow-sm
        transition-all duration-150 hover:scale-105 active:scale-95
        ${active 
          ? "border-[3px] border-blue-500 shadow-md ring-2 ring-blue-200" 
          : "border-2 border-gray-300 hover:border-gray-400"
        }
      `}
    >
      <img src={`/icons/${icon}.svg`} className={compact ? "w-4 h-4" : "w-6 h-6 md:w-7 md:h-7"} alt={icon} />
    </button>
  );
}

function ActionButton({ type, onClick, compact = false }: {
  type: "undo" | "trash" | "download";
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`${compact ? "w-7 h-7" : "w-10 h-10 md:w-11 md:h-11"} rounded-full bg-white border border-gray-300 flex items-center justify-center shadow-sm transition-all duration-150 hover:scale-105 active:scale-95 hover:border-gray-400`}
    >
      <img src={`/icons/${type}.svg`} className={compact ? "w-3.5 h-3.5" : "w-5 h-5 md:w-6 md:h-6"} alt={type} />
    </button>
  );
}

/* ============================================================
    ZOOM CONTROLS - Desktop uses +/- buttons, Mobile uses slider
============================================================ */
function ZoomControls({ zoom, onZoomIn, onZoomOut }: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onZoomOut}
        className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95"
      >
        -
      </button>

      <div className="text-sm md:text-lg font-semibold min-w-[3rem] text-center">{Math.round(zoom * 100)}%</div>

      <button
        onClick={onZoomIn}
        className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95"
      >
        +
      </button>
    </div>
  );
}

/* ============================================================
    MOBILE SLIDER POPOVER COMPONENTS
    - Each tool has its own popover with a slider
    - Auto-positions to stay within viewport
    - Closes when tapping outside
============================================================ */

type PanelType = "zoom" | "brush" | "opacity" | null;

// Generic Popover Container with auto-positioning
function SliderPopover({ 
  isOpen, 
  onClose, 
  title, 
  buttonRef,
  children 
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  children: React.ReactNode;
}) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Calculate position when popover opens
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const popoverWidth = 140; // Approximate width
    const padding = 8;
    const viewportWidth = window.innerWidth;

    // Center above the button
    let x = rect.left + rect.width / 2 - popoverWidth / 2;
    const y = rect.top - 10; // 10px above button

    // Boundary checks
    if (x < padding) {
      x = padding;
    } else if (x + popoverWidth > viewportWidth - padding) {
      x = viewportWidth - popoverWidth - padding;
    }

    setPosition({ x, y });
  }, [isOpen, buttonRef]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop to close popover */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        onTouchStart={onClose}
      />
      {/* Popover */}
      <div
        ref={popoverRef}
        className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-3 animate-fade-in"
        style={{
          left: `${position.x}px`,
          bottom: `calc(100vh - ${position.y}px)`,
          minWidth: '140px',
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 text-center">
          {title}
        </div>
        {children}
      </div>
    </>
  );
}

// Zoom Popover
function ZoomPopover({ 
  isOpen, 
  onClose, 
  zoom, 
  setZoom,
  buttonRef 
}: {
  isOpen: boolean;
  onClose: () => void;
  zoom: number;
  setZoom: (z: number) => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <SliderPopover isOpen={isOpen} onClose={onClose} title="Zoom" buttonRef={buttonRef}>
      <div className="flex flex-col items-center gap-2">
        <input
          type="range"
          min={0.25}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => {
            e.stopPropagation();
            setZoom(Number(e.target.value));
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="w-full h-2 accent-blue-500 cursor-pointer"
          style={{
            WebkitAppearance: 'none',
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((zoom - 0.25) / 2.75) * 100}%, #e5e7eb ${((zoom - 0.25) / 2.75) * 100}%, #e5e7eb 100%)`,
            borderRadius: '4px',
          }}
        />
        <span className="text-sm font-medium text-gray-700">{Math.round(zoom * 100)}%</span>
      </div>
    </SliderPopover>
  );
}

// Brush Size Popover
function BrushPopover({ 
  isOpen, 
  onClose, 
  brushSize, 
  setBrushSize,
  buttonRef 
}: {
  isOpen: boolean;
  onClose: () => void;
  brushSize: number;
  setBrushSize: (s: number) => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <SliderPopover isOpen={isOpen} onClose={onClose} title="Brush Size" buttonRef={buttonRef}>
      <div className="flex flex-col items-center gap-2">
        <input
          type="range"
          min={5}
          max={120}
          value={brushSize}
          onChange={(e) => {
            e.stopPropagation();
            setBrushSize(Number(e.target.value));
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="w-full h-2 accent-blue-500 cursor-pointer"
          style={{
            WebkitAppearance: 'none',
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((brushSize - 5) / 115) * 100}%, #e5e7eb ${((brushSize - 5) / 115) * 100}%, #e5e7eb 100%)`,
            borderRadius: '4px',
          }}
        />
        <span className="text-sm font-medium text-gray-700">{brushSize}px</span>
      </div>
    </SliderPopover>
  );
}

// Opacity Popover
function OpacityPopover({ 
  isOpen, 
  onClose, 
  opacity, 
  setOpacity,
  buttonRef 
}: {
  isOpen: boolean;
  onClose: () => void;
  opacity: number;
  setOpacity: (o: number) => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <SliderPopover isOpen={isOpen} onClose={onClose} title="Opacity" buttonRef={buttonRef}>
      <div className="flex flex-col items-center gap-2">
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.05}
          value={opacity}
          onChange={(e) => {
            e.stopPropagation();
            setOpacity(Number(e.target.value));
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="w-full h-2 accent-blue-500 cursor-pointer"
          style={{
            WebkitAppearance: 'none',
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((opacity - 0.1) / 0.9) * 100}%, #e5e7eb ${((opacity - 0.1) / 0.9) * 100}%, #e5e7eb 100%)`,
            borderRadius: '4px',
          }}
        />
        <span className="text-sm font-medium text-gray-700">{Math.round(opacity * 100)}%</span>
      </div>
    </SliderPopover>
  );
}

// Settings Button (Zoom, Brush, Opacity triggers)
function SettingsButton({ 
  icon, 
  label,
  isActive, 
  onClick,
  buttonRef
}: {
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
}) {
  return (
    <button
      ref={buttonRef as React.RefObject<HTMLButtonElement>}
      onClick={onClick}
      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95 ${
        isActive 
          ? "bg-blue-500 text-white shadow-md" 
          : "bg-gray-100 text-slate-700 hover:bg-gray-200"
      }`}
      aria-label={label}
    >
      <span className="text-xs">{icon}</span>
    </button>
  );
}

/* ============================================================
    COLOR SHADE POPUP
    - Auto-positions to stay within viewport boundaries
    - Shifts left/right if would overflow screen edges
============================================================ */
function ColorShadePopup({ 
  baseColor, 
  shades, 
  onSelect, 
  onClose, 
  position,
  currentColor 
}: {
  baseColor: string;
  shades: string[];
  onSelect: (color: string) => void;
  onClose: () => void;
  position: { x: number; y: number };
  currentColor: string;
}) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState<{ x: number; y: number } | null>(null);

  // Calculate popup position with boundary detection
  useEffect(() => {
    if (!popupRef.current) return;

    const popup = popupRef.current;
    const rect = popup.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const padding = 8; // Minimum distance from screen edges

    // Start with centered position
    let newX = position.x;

    // Calculate popup width (it's centered, so check both sides)
    const popupHalfWidth = rect.width / 2;

    // Check left overflow
    if (position.x - popupHalfWidth < padding) {
      // Shift right: position popup so left edge is at padding
      newX = popupHalfWidth + padding;
    }
    // Check right overflow
    else if (position.x + popupHalfWidth > viewportWidth - padding) {
      // Shift left: position popup so right edge is at viewport - padding
      newX = viewportWidth - popupHalfWidth - padding;
    }

    // Calculate top position (above the button with small gap)
    const newY = position.y - 50;

    setAdjustedPosition({ x: newX, y: newY });
  }, [position]);

  // Check if a shade is the currently selected color
  const isSelected = (shade: string) => {
    return currentColor.toLowerCase() === shade.toLowerCase();
  };

  // Check if shade is white or very light (needs darker border to be visible)
  const isLightColor = (shade: string) => {
    const hex = shade.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    // Calculate luminance - if > 200, consider it light
    return (r + g + b) / 3 > 200;
  };

  // Use adjusted position if calculated, otherwise use initial centered position
  const finalX = adjustedPosition?.x ?? position.x;
  const finalY = adjustedPosition?.y ?? (position.y - 50);

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div
        ref={popupRef}
        className="fixed z-50 bg-white rounded-lg shadow-xl p-2 flex gap-1.5 border border-gray-200"
        style={{
          left: `${finalX}px`,
          top: `${finalY}px`,
          transform: 'translateX(-50%)',
          // Smooth transition when position adjusts
          transition: adjustedPosition ? 'none' : 'left 0.15s ease-out, top 0.15s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {shades.map((shade, idx) => (
          <button
            key={idx}
            onClick={() => {
              onSelect(shade);
              onClose();
            }}
            className={`w-7 h-7 rounded-full transition-all duration-150 hover:scale-110 active:scale-95 ${
              isSelected(shade)
                ? "border-[3px] border-blue-500 shadow-md ring-2 ring-blue-200 scale-110"
                : isLightColor(shade)
                  ? "border-2 border-gray-400"
                  : "border-2 border-gray-300"
            }`}
            style={{ background: shade }}
          />
        ))}
      </div>
    </>
  );
}

/* ============================================================
    FULL COLOR PALETTE (DESKTOP - ALL COLORS)
    - Grayscale colors first (black to white)
    - Selection indicated by blue outline (same as tool selection)
============================================================ */
function FullColorPalette({ 
  color, 
  setColor
}: {
  color: string;
  setColor: (v: string) => void;
}) {
  // Grayscale colors - displayed FIRST
  const GRAYSCALE_COLORS = [
    "#000000", // Black
    "#4a4a4a", // Dark gray
    "#7a7a7a", // Medium gray
    "#bfbfbf", // Light gray
    "#ffffff", // White
  ];

  const BASE_COLORS = [
    { name: "red", base: "#FF1744" },
    { name: "orange", base: "#FF6F00" },
    { name: "yellow", base: "#FFD600" },
    { name: "green", base: "#4CAF50" },
    { name: "blue", base: "#2196F3" },
    { name: "purple", base: "#9C27B0" },
    { name: "brown", base: "#8B4513" },
  ];

  const getShades = (baseHex: string): string[] => {
    const r = parseInt(baseHex.slice(1, 3), 16);
    const g = parseInt(baseHex.slice(3, 5), 16);
    const b = parseInt(baseHex.slice(5, 7), 16);

    const mix = (c: number, factor: number) =>
      Math.max(0, Math.min(255, Math.round(c * factor)));

    return [
      `#${mix(r, 0.5).toString(16).padStart(2, "0")}${mix(g, 0.5).toString(16).padStart(2, "0")}${mix(b, 0.5).toString(16).padStart(2, "0")}`,
      `#${mix(r, 0.75).toString(16).padStart(2, "0")}${mix(g, 0.75).toString(16).padStart(2, "0")}${mix(b, 0.75).toString(16).padStart(2, "0")}`,
      baseHex,
      `#${mix(r, 1.25).toString(16).padStart(2, "0")}${mix(g, 1.25).toString(16).padStart(2, "0")}${mix(b, 1.25).toString(16).padStart(2, "0")}`,
      `#${mix(r, 1.5).toString(16).padStart(2, "0")}${mix(g, 1.5).toString(16).padStart(2, "0")}${mix(b, 1.5).toString(16).padStart(2, "0")}`,
    ];
  };

  // Build all colors: grayscale first, then color shades
  const allColors: string[] = [...GRAYSCALE_COLORS];
  BASE_COLORS.forEach(({ base }) => {
    allColors.push(...getShades(base));
  });

  return (
    <div className="flex flex-wrap gap-2">
      {allColors.map((shade, idx) => (
        <button
          key={idx}
          onClick={() => setColor(shade)}
          className={`w-8 h-8 rounded-full transition-all duration-150 hover:scale-110 active:scale-95 ${
            color.toLowerCase() === shade.toLowerCase()
              ? "border-[3px] border-blue-500 shadow-md ring-2 ring-blue-200 scale-110"
              : "border-2 border-gray-300"
          }`}
          style={{ background: shade }}
          aria-label={`Color ${idx + 1}`}
        />
      ))}
    </div>
  );
}

/* ============================================================
    COMPACT COLOR PALETTE (MOBILE - ALL COLORS WITH POPUP)
    - Black is a parent color with grayscale shades (black to white)
    - All color families have shades popup
    - Selection indicated by blue outline (same as tool selection)
============================================================ */
function CompactColorPalette({ 
  color, 
  setColor,
  isMobile 
}: {
  color: string;
  setColor: (v: string) => void;
  isMobile: boolean;
}) {
  const [expandedColor, setExpandedColor] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const colorRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // All color families - BLACK is first with grayscale shades
  const ALL_COLORS = [
    { name: "black", base: "#000000" }, // Parent for grayscale shades
    { name: "red", base: "#FF1744" },
    { name: "orange", base: "#FF6F00" },
    { name: "yellow", base: "#FFD600" },
    { name: "green", base: "#4CAF50" },
    { name: "blue", base: "#2196F3" },
    { name: "purple", base: "#9C27B0" },
    { name: "brown", base: "#8B4513" },
  ];

  // Grayscale shades for black parent color
  const GRAYSCALE_SHADES = [
    "#000000", // Black
    "#4A4A4A", // Dark gray
    "#7A7A7A", // Medium gray
    "#BFBFBF", // Light gray
    "#FFFFFF", // White
  ];

  // Get shades for a color - special case for black (grayscale)
  const getShades = (baseHex: string): string[] => {
    // Black uses predefined grayscale shades
    if (baseHex.toLowerCase() === "#000000") {
      return GRAYSCALE_SHADES;
    }
    
    // Other colors use computed shades
    const r = parseInt(baseHex.slice(1, 3), 16);
    const g = parseInt(baseHex.slice(3, 5), 16);
    const b = parseInt(baseHex.slice(5, 7), 16);

    const mix = (c: number, factor: number) =>
      Math.max(0, Math.min(255, Math.round(c * factor)));

    return [
      `#${mix(r, 0.5).toString(16).padStart(2, "0")}${mix(g, 0.5).toString(16).padStart(2, "0")}${mix(b, 0.5).toString(16).padStart(2, "0")}`,
      `#${mix(r, 0.75).toString(16).padStart(2, "0")}${mix(g, 0.75).toString(16).padStart(2, "0")}${mix(b, 0.75).toString(16).padStart(2, "0")}`,
      baseHex,
      `#${mix(r, 1.25).toString(16).padStart(2, "0")}${mix(g, 1.25).toString(16).padStart(2, "0")}${mix(b, 1.25).toString(16).padStart(2, "0")}`,
      `#${mix(r, 1.5).toString(16).padStart(2, "0")}${mix(g, 1.5).toString(16).padStart(2, "0")}${mix(b, 1.5).toString(16).padStart(2, "0")}`,
    ];
  };

  const handleColorClick = (baseColor: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const button = colorRefs.current[baseColor];
    if (button) {
      const rect = button.getBoundingClientRect();
      setPopupPosition({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
      setExpandedColor(baseColor);
    }
  };

  // Check if current color is selected (case-insensitive)
  const isColorSelected = (checkColor: string) => {
    return color.toLowerCase() === checkColor.toLowerCase();
  };

  // Check if color is in any shade family
  const isInColorFamily = (baseColor: string) => {
    return isColorSelected(baseColor) || getShades(baseColor).some(shade => isColorSelected(shade));
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* All color families with popup - Black first */}
        {ALL_COLORS.map(({ name, base }) => (
          <button
            key={name}
            ref={(el) => {
              colorRefs.current[base] = el;
            }}
            onClick={(e) => handleColorClick(base, e)}
            className={`w-7 h-7 md:w-8 md:h-8 rounded-full transition-all duration-150 hover:scale-110 active:scale-95 ${
              isInColorFamily(base)
                ? "border-[3px] border-blue-500 shadow-md ring-2 ring-blue-200 scale-110"
                : "border-2 border-gray-300"
            }`}
            style={{ background: base }}
            aria-label={name}
          />
        ))}
      </div>

      {expandedColor && (
        <ColorShadePopup
          baseColor={expandedColor}
          shades={getShades(expandedColor)}
          onSelect={setColor}
          onClose={() => setExpandedColor(null)}
          position={popupPosition}
          currentColor={color}
        />
      )}
    </>
  );
}

/* ============================================================
    MAIN COMPONENT
============================================================ */

interface ColoringCanvasProps {
  src: string;
  closeHref?: string;
}

export default function ColoringCanvas({ src, closeHref }: ColoringCanvasProps) {
  const router = useRouter();
  const tCanvas = useTranslations("common.canvas");
  const [color, setColor] = useState("#FF1744");
  const [opacity, setOpacity] = useState(1);
  const [brushSize, setBrushSize] = useState(40);
  const [zoom, setZoom] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<"brush" | "eraser" | "fill">("fill");
  const [showClearModal, setShowClearModal] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false); /* Mobile navigation menu */

  /* Close handler - uses replace to avoid history loop */
  const handleClose = useCallback(() => {
    if (closeHref) {
      router.replace(closeHref);
    } else {
      router.back();
    }
  }, [closeHref, router]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const undoStack = useRef<ImageData[]>([]);
  const MAX_UNDO = 40;

  /* Drawing state */
  const pointsRef = useRef<{ x: number; y: number }[]>([]);
  const isDrawingRef = useRef(false);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const touchPanRef = useRef<{ x: number; y: number } | null>(null);
  const lastTouchDist = useRef<number | null>(null);
  
  /* Touch gesture state - for detecting taps vs drags/pinches */
  const touchStartTime = useRef<number>(0);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isTouchGesture = useRef(false); /* True if user is doing multitouch or dragging */
  const hasMovedSignificantly = useRef(false); /* True if finger moved more than threshold */

  /* ============================================================
      UTILITY FUNCTIONS
  ============================================================= */

  const hexToRgb = (hex: string) => {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    };
  };

  /* Get canvas coordinates from screen coordinates */
  const getCanvasCoords = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return null;

    const rect = wrapper.getBoundingClientRect();
    // Account for wrapper scroll position and page scroll
    const x = (clientX - rect.left + wrapper.scrollLeft - translate.x) / zoom;
    const y = (clientY - rect.top + wrapper.scrollTop - translate.y) / zoom;

    return { x, y };
  };

  /* ============================================================
      UNDO SYSTEM
  ============================================================= */

  const saveUndo = () => {
    const draw = drawCanvasRef.current;
    if (!draw) return;
    const ctx = draw.getContext("2d");
    if (!ctx) return;
    const img = ctx.getImageData(0, 0, draw.width, draw.height);

    undoStack.current.push(img);
    if (undoStack.current.length > MAX_UNDO) undoStack.current.shift();
  };

  const undo = () => {
    const draw = drawCanvasRef.current;
    if (!draw) return;
    if (undoStack.current.length <= 1) return;

    undoStack.current.pop();
    const prev = undoStack.current[undoStack.current.length - 1];
    const ctx = draw.getContext("2d");
    if (ctx) ctx.putImageData(prev, 0, 0);
  };

  const clearCanvas = () => {
    const draw = drawCanvasRef.current;
    const temp = tempCanvasRef.current;
    if (!draw) return;
    const ctx = draw.getContext("2d");
    if (!ctx) return;
    
    ctx.clearRect(0, 0, draw.width, draw.height);
    
    if (temp) {
      const tempCtx = temp.getContext("2d");
      if (tempCtx) tempCtx.clearRect(0, 0, temp.width, temp.height);
    }

    undoStack.current = [
      ctx.getImageData(0, 0, draw.width, draw.height),
    ];
  };

  /* ============================================================
      CATMULL-ROM SPLINE
  ============================================================= */

  const catmullRom = (
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    t: number
  ) => {
    const t2 = t * t;
    const t3 = t2 * t;

    return {
      x: 0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
      y: 0.5 *
        (2 * p1.y +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
    };
  };

  /* ============================================================
      DRAW SPLINE ON TEMP CANVAS
  ============================================================= */

  const drawSpline = () => {
    const temp = tempCanvasRef.current;
    if (!temp) return;
    const ctx = temp.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, temp.width, temp.height);

    const pts = pointsRef.current;
    if (pts.length < 4) {
      // Draw single point if less than 4 points
      if (pts.length > 0) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = brushSize;
        
        if (tool === "brush") {
      ctx.globalCompositeOperation = "source-over";
          const rgb = hexToRgb(color);
          ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
          ctx.globalAlpha = 1;
        } else if (tool === "eraser") {
          ctx.globalCompositeOperation = "destination-out";
          ctx.fillStyle = "rgba(0, 0, 0, 1)";
          ctx.globalAlpha = 1;
        }

        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brushSize;

    if (tool === "brush") {
      ctx.globalCompositeOperation = "source-over";
      const rgb = hexToRgb(color);
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
      ctx.globalAlpha = 1;
    } else if (tool === "eraser") {
      // For eraser, draw a solid stroke on tempCanvas
      // This will be used with destination-out when merging to drawCanvas
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "rgba(0, 0, 0, 1)";
      ctx.globalAlpha = 1;
    }

    ctx.beginPath();

    for (let i = 0; i < pts.length - 3; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const p2 = pts[i + 2];
      const p3 = pts[i + 3];

      for (let t = 0; t <= 1; t += 0.15) {
        const p = catmullRom(p0, p1, p2, p3, t);

        if (i === 0 && t === 0) {
          ctx.moveTo(p.x, p.y);
        } else {
          ctx.lineTo(p.x, p.y);
        }
      }
    }

    ctx.stroke();
  };

  /* ============================================================
      COMMIT STROKE (TEMP → DRAW)
  ============================================================= */

  const commitStroke = () => {
    const temp = tempCanvasRef.current;
    const draw = drawCanvasRef.current;
    if (!temp || !draw) return;

    const ctx = draw.getContext("2d");
    if (!ctx) return;

    // For eraser, we need to apply destination-out when merging
    if (tool === "eraser") {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.drawImage(temp, 0, 0);
      ctx.restore();
    } else {
      // For brush, use normal source-over
      ctx.drawImage(temp, 0, 0);
    }

    const tctx = temp.getContext("2d");
    if (tctx) tctx.clearRect(0, 0, temp.width, temp.height);

    // Save undo snapshot AFTER the stroke is committed
    // This ensures each completed stroke (brush or eraser) is one undo action
    saveUndo();
  };

  /* ============================================================
      FLOOD FILL
  ============================================================= */

  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const base = baseCanvasRef.current;
    const draw = drawCanvasRef.current;
    if (!base || !draw) return;

    const w = draw.width;
    const h = draw.height;

    // Create merged image (base + draw)
    const mergedCanvas = document.createElement("canvas");
    mergedCanvas.width = w;
    mergedCanvas.height = h;
    const mergedCtx = mergedCanvas.getContext("2d");
    if (!mergedCtx) return;

    mergedCtx.drawImage(base, 0, 0);
    mergedCtx.drawImage(draw, 0, 0);

    const mergedData = mergedCtx.getImageData(0, 0, w, h);
    const data = mergedData.data;

    // Get target color
    const ix = Math.floor(startX);
    const iy = Math.floor(startY);
    if (ix < 0 || ix >= w || iy < 0 || iy >= h) return;

    const targetIdx = (iy * w + ix) * 4;
    const tr = data[targetIdx];
    const tg = data[targetIdx + 1];
    const tb = data[targetIdx + 2];

    // Fill color
    const fillR = parseInt(fillColor.slice(1, 3), 16);
    const fillG = parseInt(fillColor.slice(3, 5), 16);
    const fillB = parseInt(fillColor.slice(5, 7), 16);

    // Queue-based flood fill
    const queue: { x: number; y: number }[] = [{ x: ix, y: iy }];
    const visited = new Uint8Array(w * h);
    const TOLERANCE = 15;

    const match = (idx: number) => {
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      return (
        Math.abs(r - tr) < TOLERANCE &&
        Math.abs(g - tg) < TOLERANCE &&
        Math.abs(b - tb) < TOLERANCE
      );
    };

    // Get base canvas data to detect outline boundaries
    const baseCtx = base.getContext("2d");
    if (!baseCtx) return;
    const baseData = baseCtx.getImageData(0, 0, w, h);
    const basePixels = baseData.data;

    // Get draw canvas data for writing absolute RGBA values
    const drawCtx = draw.getContext("2d");
    if (!drawCtx) return;
    const drawData = drawCtx.getImageData(0, 0, w, h);

    // Calculate final RGBA values with opacity applied (same as brush)
    const finalR = fillR;
    const finalG = fillG;
    const finalB = fillB;
    const finalA = Math.round(opacity * 255);

    // Early‑exit optimisation: if the starting pixel in the draw layer
    // already has the target color/alpha, the fill would be a no‑op.
    // This avoids doing a full flood fill on already‑filled regions.
    const existingIdx = (iy * w + ix) * 4;
    const dr = drawData.data[existingIdx];
    const dg = drawData.data[existingIdx + 1];
    const db = drawData.data[existingIdx + 2];
    const da = drawData.data[existingIdx + 3];
    if (dr === finalR && dg === finalG && db === finalB && da === finalA) {
      return;
    }

    // Perform flood fill
    // Use an index‑based queue instead of Array.shift() to keep this
    // loop O(n) instead of O(n²) for large fill regions.
    let qIndex = 0;
    let filledPixelCount = 0;
    while (qIndex < queue.length) {
      const { x, y } = queue[qIndex++];
      const idx = y * w + x;

      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      if (visited[idx]) continue;

      const pixelIdx = idx * 4;
      if (!match(pixelIdx)) continue;

      visited[idx] = 1;
      filledPixelCount++;

      // Write absolute RGBA values (no blending) - matches brush behavior
      // This ensures the fill color is exactly correct on first click
      drawData.data[pixelIdx] = finalR;
      drawData.data[pixelIdx + 1] = finalG;
      drawData.data[pixelIdx + 2] = finalB;
      drawData.data[pixelIdx + 3] = finalA;

      // Add neighbors
      if (x > 0) queue.push({ x: x - 1, y });
      if (x < w - 1) queue.push({ x: x + 1, y });
      if (y > 0) queue.push({ x, y: y - 1 });
      if (y < h - 1) queue.push({ x, y: y + 1 });
    }

    // If the filled area is extremely large, skip the expensive
    // edge‑expansion and smoothing passes – they scan the whole
    // canvas and are the main source of long INP on huge regions.
    const LARGE_FILL_THRESHOLD = 300_000; // ~300k pixels
    if (filledPixelCount > LARGE_FILL_THRESHOLD) {
      drawCtx.putImageData(drawData, 0, 0);
      saveUndo();
      return;
    }

    // OVERPAINT EXPANSION: Paint 1-2 pixels beyond filled region to cover anti-aliased edges
    const EXPANSION_RADIUS = 1; // 1 pixel expansion (can be increased to 2 if needed)
    const BLACK_LINE_THRESHOLD = 30; // Brightness threshold for black lines
    const BLACK_LINE_ALPHA_THRESHOLD = 200; // Alpha threshold for black lines

    // Helper function to check if a pixel is a black outline
    const isBlackLine = (idx: number): boolean => {
      const baseIdx = idx;
      const r = basePixels[baseIdx];
      const g = basePixels[baseIdx + 1];
      const b = basePixels[baseIdx + 2];
      const a = basePixels[baseIdx + 3];
      
      const brightness = (r + g + b) / 3;
      return brightness < BLACK_LINE_THRESHOLD && a > BLACK_LINE_ALPHA_THRESHOLD;
    };

    // Helper function to check if a pixel is an edge (has at least one neighbor outside fill)
    const isEdgePixel = (x: number, y: number): boolean => {
      if (x < 0 || x >= w || y < 0 || y >= h) return false;
      const idx = y * w + x;
      if (!visited[idx]) return false; // Not part of fill

      // Check 8-directional neighbors
      const neighbors = [
        { x: x - 1, y: y - 1 }, { x: x, y: y - 1 }, { x: x + 1, y: y - 1 },
        { x: x - 1, y: y },                           { x: x + 1, y: y },
        { x: x - 1, y: y + 1 }, { x: x, y: y + 1 }, { x: x + 1, y: y + 1 },
      ];

      for (const n of neighbors) {
        if (n.x < 0 || n.x >= w || n.y < 0 || n.y >= h) continue;
        const nIdx = n.y * w + n.x;
        if (!visited[nIdx]) {
          return true; // Has at least one neighbor outside fill
        }
      }
      return false;
    };

    // Collect edge pixels
    const edgePixels: { x: number; y: number }[] = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (isEdgePixel(x, y)) {
          edgePixels.push({ x, y });
        }
      }
    }

    // Expand outward from edge pixels
    for (let radius = 1; radius <= EXPANSION_RADIUS; radius++) {
      const expansionPixels: { x: number; y: number }[] = [];

      for (const edge of edgePixels) {
        // Check 8-directional neighbors
        const neighbors = [
          { x: edge.x - 1, y: edge.y - 1 }, { x: edge.x, y: edge.y - 1 }, { x: edge.x + 1, y: edge.y - 1 },
          { x: edge.x - 1, y: edge.y },                           { x: edge.x + 1, y: edge.y },
          { x: edge.x - 1, y: edge.y + 1 }, { x: edge.x, y: edge.y + 1 }, { x: edge.x + 1, y: edge.y + 1 },
        ];

        for (const n of neighbors) {
          if (n.x < 0 || n.x >= w || n.y < 0 || n.y >= h) continue;
          const nIdx = n.y * w + n.x;
          
          // Skip if already filled or already marked for expansion
          if (visited[nIdx]) continue;
          
          // Skip if it's a black outline pixel
          const pixelIdx = nIdx * 4;
          if (isBlackLine(pixelIdx)) continue;

          // Mark for expansion
          visited[nIdx] = 1;
          expansionPixels.push({ x: n.x, y: n.y });

          // Paint the expansion pixel
          drawData.data[pixelIdx] = finalR;
          drawData.data[pixelIdx + 1] = finalG;
          drawData.data[pixelIdx + 2] = finalB;
          drawData.data[pixelIdx + 3] = finalA;
        }
      }

      // Use expansion pixels as new edge for next radius iteration
      edgePixels.length = 0;
      edgePixels.push(...expansionPixels);
    }

    // EDGE SMOOTHING: Apply anti-aliasing to border pixels for smooth edges
    // Create a copy of drawData for smoothing
    const smoothedData = new ImageData(new Uint8ClampedArray(drawData.data), w, h);
    
    // Gaussian-like weights for smooth edge transition (3x3 kernel)
    const kernel = [
      [0.0625, 0.125, 0.0625],
      [0.125,  0.25,  0.125],
      [0.0625, 0.125, 0.0625]
    ];
    
    // Apply smoothing only to border pixels
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        
        // Only smooth pixels that are part of the fill
        if (!visited[idx]) continue;
        
        // Skip if it's a black outline pixel
        if (isBlackLine(idx * 4)) continue;
        
        // Check if this is a border pixel (has at least one neighbor outside fill)
        let isBorder = false;
        let neighborOutsideCount = 0;
        
        const neighbors = [
          { x: x - 1, y: y - 1 }, { x: x, y: y - 1 }, { x: x + 1, y: y - 1 },
          { x: x - 1, y: y },                           { x: x + 1, y: y },
          { x: x - 1, y: y + 1 }, { x: x, y: y + 1 }, { x: x + 1, y: y + 1 },
        ];
        
        for (const n of neighbors) {
          if (n.x < 0 || n.x >= w || n.y < 0 || n.y >= h) {
            neighborOutsideCount++;
            continue;
          }
          const nIdx = n.y * w + n.x;
          if (!visited[nIdx] && !isBlackLine(nIdx * 4)) {
            isBorder = true;
            neighborOutsideCount++;
          }
        }
        
        // Only smooth border pixels (pixels with neighbors outside fill)
        if (!isBorder || neighborOutsideCount === 0) continue;
        
        // Calculate distance from center (for feathering)
        const pixelIdx = idx * 4;
        
        // Apply blur to border pixel - keep color solid, only smooth alpha
        let sumA = 0;
        let weightSum = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const px = x + kx;
            const py = y + ky;
            
            if (px < 0 || px >= w || py < 0 || py >= h) {
              // Edge of canvas: contribute transparency
              weightSum += kernel[ky + 1][kx + 1];
              continue;
            }
            
            const pIdx = (py * w + px) * 4;
            const weight = kernel[ky + 1][kx + 1];
            const pVisited = visited[py * w + px];
            
            if (pVisited && !isBlackLine(pIdx)) {
              // Inside fill: use full alpha
              sumA += drawData.data[pIdx + 3] * weight;
            } else {
              // Outside fill or black line: contribute transparency
              sumA += 0 * weight;
            }
            weightSum += weight;
          }
        }
        
        // Apply smoothed alpha while keeping color solid
        if (weightSum > 0) {
          const smoothedAlpha = Math.round(sumA / weightSum);
          // Keep original RGB, only smooth alpha for soft edge
          smoothedData.data[pixelIdx] = finalR;
          smoothedData.data[pixelIdx + 1] = finalG;
          smoothedData.data[pixelIdx + 2] = finalB;
          smoothedData.data[pixelIdx + 3] = smoothedAlpha;
        }
      }
    }
    
    // Apply smoothed data to draw canvas
    drawCtx.putImageData(smoothedData, 0, 0);
    
    // Save undo AFTER the fill completes (same pattern as commitStroke for brush)
    // This ensures the stack contains the result state, and undo restores correctly
    saveUndo();
  };

  /* ============================================================
      EVENT HANDLERS - MOUSE
  ============================================================= */

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) {
      // Middle mouse button - pan
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (e.button === 0) {
      // Left mouse button - draw/fill
      const coords = getCanvasCoords(e.clientX, e.clientY);
      if (!coords) return;

      if (tool === "fill") {
        // saveUndo() is called at the END of floodFill() (same as commitStroke)
        // This ensures exactly ONE undo step per fill operation
        floodFill(coords.x, coords.y, color);
        return;
      }

      if (tool === "brush" || tool === "eraser") {
        // Don't save undo here - it will be saved after commitStroke()
        isDrawingRef.current = true;
        pointsRef.current = [];
        pointsRef.current.push(coords);
        drawSpline();
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;

      panStart.current = { x: e.clientX, y: e.clientY };
      setTranslate((t) => ({ x: t.x + dx, y: t.y + dy }));
      return;
    }

    if (isDrawingRef.current && (tool === "brush" || tool === "eraser")) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      if (!coords) return;

      pointsRef.current.push(coords);
      drawSpline();
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanning.current && e.button === 1) {
      isPanning.current = false;
      return;
    }

    if (isDrawingRef.current) {
      commitStroke();
      isDrawingRef.current = false;
      pointsRef.current = [];
    }
  };

  /* ============================================================
      ANIMATED ZOOM FUNCTION
  ============================================================= */

  const animateZoom = useCallback((targetScale: number) => {
    const startScale = zoom;
    const startTime = performance.now();
    const duration = 200; // milliseconds

    // Clamp target scale
    const clampedTarget = Math.max(0.5, Math.min(4.0, targetScale));

    function step(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-in-out)
      const eased = progress < 0.5
        ? 2 * progress * progress
        : -1 + (4 - 2 * progress) * progress;

      const currentScale = startScale + (clampedTarget - startScale) * eased;

      // Zoom relative to top-left: keep translate at 0,0
      // The transform wrapper will handle the scaling
      setZoom(currentScale);
      setTranslate({ x: 0, y: 0 });

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }, [zoom]);

  /* Zoom button handlers */
  const handleZoomIn = useCallback(() => {
    animateZoom(zoom * 1.1);
  }, [zoom, animateZoom]);

  const handleZoomOut = useCallback(() => {
    animateZoom(zoom / 1.1);
  }, [zoom, animateZoom]);

  /* ============================================================
      EVENT HANDLERS - TOUCH (FIXED FOR MOBILE)
      
      Key fixes:
      1. Fill tool only triggers on TAP (quick touch without movement)
      2. Multitouch (2+ fingers) = pinch-zoom, never triggers fill/draw
      3. Single finger drag = pan OR draw (depending on tool)
      4. Proper gesture detection prevents accidental fills during zoom
  ============================================================= */

  const TOUCH_TAP_THRESHOLD = 10; /* pixels - max movement to count as tap */
  const TOUCH_TAP_TIMEOUT = 300; /* ms - max duration to count as tap */

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    
    /* Two or more fingers = pinch-zoom gesture */
    if (e.touches.length >= 2) {
      isTouchGesture.current = true;
      isDrawingRef.current = false;
      pointsRef.current = [];
      
      // Calculate initial pinch distance
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate pinch center for panning
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      touchPanRef.current = { x: centerX, y: centerY };
      return;
    }

    /* Single finger touch */
    if (e.touches.length === 1) {
      const t = e.touches[0];
      
      // Record touch start for tap detection
      touchStartTime.current = Date.now();
      touchStartPos.current = { x: t.clientX, y: t.clientY };
      hasMovedSignificantly.current = false;
      isTouchGesture.current = false;
      
      const coords = getCanvasCoords(t.clientX, t.clientY);
      if (!coords) return;

      // For brush/eraser: start drawing immediately
      if (tool === "brush" || tool === "eraser") {
        isDrawingRef.current = true;
        pointsRef.current = [];
        pointsRef.current.push(coords);
        drawSpline();
      }
      
      // For fill: we'll handle it on touchEnd (tap detection)
      // For all tools: prepare for potential panning
      touchPanRef.current = { x: t.clientX, y: t.clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();

    /* Two-finger pinch-zoom and pan */
    if (e.touches.length === 2) {
      isTouchGesture.current = true;
      isDrawingRef.current = false;
      
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Pinch zoom
      if (lastTouchDist.current !== null) {
        const delta = dist - lastTouchDist.current;
        let newScale = zoom + delta * 0.005;
        newScale = Math.max(0.5, Math.min(4, newScale));
        setZoom(newScale);
      }
      lastTouchDist.current = dist;

      // Two-finger pan
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      
      if (touchPanRef.current) {
        const panDx = centerX - touchPanRef.current.x;
        const panDy = centerY - touchPanRef.current.y;
        setTranslate((tr) => ({ x: tr.x + panDx, y: tr.y + panDy }));
      }
      touchPanRef.current = { x: centerX, y: centerY };
      return;
    }

    /* Single finger movement */
    if (e.touches.length === 1) {
      const t = e.touches[0];
      
      // Check if we've moved significantly (for tap detection)
      if (touchStartPos.current) {
        const moveDist = Math.sqrt(
          Math.pow(t.clientX - touchStartPos.current.x, 2) +
          Math.pow(t.clientY - touchStartPos.current.y, 2)
        );
        if (moveDist > TOUCH_TAP_THRESHOLD) {
          hasMovedSignificantly.current = true;
        }
      }

      // Drawing with brush/eraser
      if (isDrawingRef.current && (tool === "brush" || tool === "eraser")) {
        const coords = getCanvasCoords(t.clientX, t.clientY);
        if (coords) {
          pointsRef.current.push(coords);
          drawSpline();
        }
        return;
      }

      // Panning (when using fill tool, or when zoomed in)
      if (tool === "fill" || zoom > 1) {
        if (touchPanRef.current && hasMovedSignificantly.current) {
          const dx = t.clientX - touchPanRef.current.x;
          const dy = t.clientY - touchPanRef.current.y;
          setTranslate((tr) => ({ x: tr.x + dx, y: tr.y + dy }));
        }
        touchPanRef.current = { x: t.clientX, y: t.clientY };
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    
    // Commit any in-progress drawing
    if (isDrawingRef.current) {
      commitStroke();
      isDrawingRef.current = false;
      pointsRef.current = [];
    }

    /* Handle fill tool TAP detection */
    /* Fill only triggers if: single tap, no multitouch, minimal movement, quick tap */
    if (e.touches.length === 0 && 
        tool === "fill" && 
        !isTouchGesture.current && 
        !hasMovedSignificantly.current &&
        touchStartPos.current) {
      
      const tapDuration = Date.now() - touchStartTime.current;
      
      if (tapDuration < TOUCH_TAP_TIMEOUT) {
        const coords = getCanvasCoords(touchStartPos.current.x, touchStartPos.current.y);
        if (coords) {
          floodFill(coords.x, coords.y, color);
        }
      }
    }

    /* Reset all touch state when all fingers lifted */
    if (e.touches.length === 0) {
      touchPanRef.current = null;
      lastTouchDist.current = null;
      isTouchGesture.current = false;
      hasMovedSignificantly.current = false;
      touchStartPos.current = null;
    }
  };

  /* ============================================================
      CLAMP PAN (PREVENT CANVAS FROM GOING OUT OF BOUNDS)
  ============================================================= */

  const clampPan = useCallback(() => {
    const wrapper = wrapperRef.current;
    const base = baseCanvasRef.current;
    if (!wrapper || !base) return;

    const viewW = wrapper.clientWidth;
    const viewH = wrapper.clientHeight;

    const canvasW = base.width * zoom;
    const canvasH = base.height * zoom;

    let minX = viewW - canvasW;
    let minY = viewH - canvasH;

    // If canvas is smaller than view, anchor to top-left
    if (canvasW <= viewW) minX = 0;
    if (canvasH <= viewH) minY = 0;

    setTranslate((t) => {
      let x = t.x;
      let y = t.y;

      if (x > 0) x = 0;
      if (y > 0) y = 0;
      if (x < minX) x = minX;
      if (y < minY) y = minY;

      return { x, y };
    });
  }, [zoom]);

  useEffect(() => {
    clampPan();
  }, [zoom, clampPan]);

  useEffect(() => {
    const onResize = () => clampPan();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampPan]);

  useEffect(() => {
    clampPan();
  }, [translate.x, translate.y, clampPan]);

  /* ============================================================
      CALCULATE AUTO-FIT ZOOM
      
      Calculates the optimal zoom level to fit the image within
      the available viewport while preserving aspect ratio.
  ============================================================= */
  
  const calculateAutoFitZoom = useCallback((imgWidth: number, imgHeight: number) => {
    const wrapper = wrapperRef.current;
    const container = containerRef.current;
    
    if (!wrapper && !container) {
      // Fallback: estimate based on window size
      const viewportWidth = window.innerWidth - (isMobile ? 20 : 280); // Account for toolbar
      const viewportHeight = window.innerHeight - (isMobile ? 200 : 100); // Account for toolbar/header
      
      const scaleX = viewportWidth / imgWidth;
      const scaleY = viewportHeight / imgHeight;
      
      // Use the smaller scale to ensure image fits, with some padding
      return Math.min(scaleX, scaleY) * 0.9;
    }
    
    const viewWidth = wrapper?.clientWidth || container?.clientWidth || window.innerWidth;
    const viewHeight = wrapper?.clientHeight || container?.clientHeight || window.innerHeight;
    
    // Calculate scale factors for both dimensions
    const scaleX = viewWidth / imgWidth;
    const scaleY = viewHeight / imgHeight;
    
    // Use the smaller scale to ensure image fits completely
    // Apply 0.9 factor to leave some padding around the image
    const fitScale = Math.min(scaleX, scaleY) * 0.9;
    
    // Clamp to reasonable bounds (0.1 to 1.0 for initial load)
    return Math.max(0.1, Math.min(1.0, fitScale));
  }, [isMobile]);

  /* ============================================================
      LOAD IMAGE AND INITIALIZE CANVASES
  ============================================================= */

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      const base = baseCanvasRef.current;
      const draw = drawCanvasRef.current;
      const temp = tempCanvasRef.current;
      if (!base || !draw || !temp) return;

      // Use image dimensions directly
      base.width = img.width;
      base.height = img.height;
      draw.width = img.width;
      draw.height = img.height;
      temp.width = img.width;
      temp.height = img.height;

      setCanvasSize({ width: img.width, height: img.height });

      const ctx = base.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, base.width, base.height);
        ctx.drawImage(img, 0, 0);
      }

      const drawCtx = draw.getContext("2d");
      if (drawCtx) {
        drawCtx.clearRect(0, 0, draw.width, draw.height);
        undoStack.current = [drawCtx.getImageData(0, 0, draw.width, draw.height)];
      }

      // AUTO-FIT: Calculate and set optimal zoom for the image to fit the screen
      // Use a small delay to ensure container dimensions are available
      setTimeout(() => {
        const autoZoom = calculateAutoFitZoom(img.width, img.height);
        setZoom(autoZoom);
        setTranslate({ x: 0, y: 0 });
      }, 50);

      setTool("fill");
      setImageLoaded(true);
    };

    img.onerror = () => {
      console.error("Failed to load image:", src);
    };

    img.src = src;
  }, [src, calculateAutoFitZoom]);

  /* ============================================================
      RESPONSIVE DETECTION + AUTO-FIT ON RESIZE
  ============================================================= */

  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    
    const handleResize = () => {
      // Update mobile state
      setIsMobile(window.innerWidth < 900);
      
      // Debounce auto-fit recalculation
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (canvasSize.width > 0 && canvasSize.height > 0) {
          const autoZoom = calculateAutoFitZoom(canvasSize.width, canvasSize.height);
          setZoom(autoZoom);
          setTranslate({ x: 0, y: 0 });
        }
      }, 200);
    };
    
    // Initial check
    setIsMobile(window.innerWidth < 900);
    
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [canvasSize, calculateAutoFitZoom]);

  /* ============================================================
      DOWNLOAD RESULT
  ============================================================= */

  const downloadResult = () => {
    const base = baseCanvasRef.current;
    const draw = drawCanvasRef.current;
    if (!base || !draw) return;

    const merged = document.createElement("canvas");
    merged.width = base.width;
    merged.height = base.height;

    const ctx = merged.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(base, 0, 0);
    ctx.drawImage(draw, 0, 0);

    const a = document.createElement("a");
    a.download = "coloring.png";
    a.href = merged.toDataURL();
    a.click();
  };

  /* ============================================================
      RENDER
  ============================================================= */

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#f7f7f7] select-none" style={{ 
      height: isMobile ? '100dvh' : '100vh', 
      minHeight: isMobile ? '100dvh' : '100vh',
      maxHeight: isMobile ? '100dvh' : '100vh'
    }}>
      {/* CONFIRM MODAL */}
      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={clearCanvas}
        title={tCanvas("clearDrawingTitle")}
        message={tCanvas("clearDrawingMessage")}
        confirmText={tCanvas("clear")}
        cancelText={tCanvas("cancel")}
      />

      {/* MAIN LAYOUT */}
      {!isMobile ? (
        /* DESKTOP LAYOUT (>= 900px) */
        <div 
          className="flex flex-1 overflow-hidden"
          style={{
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
            height: '100%',
            alignItems: 'stretch',
          }}
        >
          {/* CANVAS AREA - Desktop */}
          <div
            ref={containerRef}
            className="relative bg-white"
            style={{
              flex: '1 1 0%',
              minWidth: 0,
              minHeight: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              touchAction: "none"
            }}
          >
            {closeHref && (
              <button
                onClick={handleClose}
                className="absolute top-2 left-2 z-40 flex items-center justify-center 
                           w-9 h-9 rounded-full border border-gray-300 text-lg leading-none 
                           hover:bg-gray-100 bg-white shadow-sm transition-all duration-150 hover:scale-105 active:scale-95"
                aria-label="Close"
              >
                <img src="/icons/close.svg" alt="Close" className="w-9 h-9" />
              </button>
            )}

            {/* SCROLL WRAPPER - Desktop */}
            <div
              ref={wrapperRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="canvas-scroll-container"
              style={{
                overflow: "auto",
                flex: '1 1 0%',
                width: "100%",
                minHeight: 0,
                position: "relative",
                touchAction: "none"
              }}
            >
              {/* SCALE WRAPPER - Desktop */}
              <div
                className="relative"
                style={{
                  display: "inline-block",
                  transformOrigin: "top left",
                  minWidth: `${canvasSize.width * zoom}px`,
                  minHeight: `${canvasSize.height * zoom}px`,
                  width: `${canvasSize.width * zoom}px`,
                  height: `${canvasSize.height * zoom}px`,
                  position: "relative",
                }}
              >
                {/* Canvas container with scale and translate */}
                <div
                  style={{
                    transform: `translate(${translate.x}px, ${translate.y}px) scale(${zoom})`,
                    transformOrigin: "top left",
                    width: `${canvasSize.width}px`,
                    height: `${canvasSize.height}px`,
                    position: "relative",
                  }}
                >
                  <canvas ref={baseCanvasRef} className="absolute top-0 left-0" />
                  <canvas ref={drawCanvasRef} className="absolute top-0 left-0" />
                  <canvas ref={tempCanvasRef} className="absolute top-0 left-0 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* TOOLBAR - Desktop sidebar */}
          <ColoringToolbar
            tool={tool}
            setTool={setTool}
            color={color}
            setColor={setColor}
            opacity={opacity}
            setOpacity={setOpacity}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            zoom={zoom}
            setZoom={setZoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            undo={undo}
            onClear={() => setShowClearModal(true)}
            onDownload={downloadResult}
            isMobile={false}
          />
        </div>
      ) : (
        /* MOBILE LAYOUT (< 900px) */
        <div className="flex flex-1 overflow-hidden flex-col" style={{ 
          minHeight: 0,
          height: '100%',
          maxHeight: '100%',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}>
          {/* MOBILE MENU */}
          <MobileMenu isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} />

          {/* CANVAS AREA - Mobile */}
          <div
            ref={containerRef}
            className="relative bg-white"
            style={{
              flex: '1 1 0%',
              width: "100%",
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              touchAction: "none",
              overflow: "hidden"
            }}
          >
            {/* MOBILE TOP BAR - Close button (left) + Hamburger menu (right) */}
            <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between p-2">
              {/* Close button - LEFT */}
              {closeHref && (
                <button
                  onClick={handleClose}
                  className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 
                             bg-white shadow-md transition-all duration-150 hover:scale-105 active:scale-95"
                  aria-label="Close"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              {/* Hamburger menu button - RIGHT */}
              <button
                onClick={() => setShowMobileMenu(true)}
                className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 
                           bg-white shadow-md transition-all duration-150 hover:scale-105 active:scale-95"
                aria-label="Menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
              </button>
            </div>

            {/* CANVAS WRAPPER - Mobile */}
            <div
              ref={wrapperRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="canvas-scroll-container"
              style={{
                flex: '1 1 0%',
                width: "100%",
                minHeight: 0,
                overflow: "auto",
                touchAction: "none"
              }}
            >
              {/* SCALE WRAPPER - Mobile */}
              <div
                className="relative"
                style={{
                  display: "inline-block",
                  transformOrigin: "top left",
                  minWidth: `${canvasSize.width * zoom}px`,
                  minHeight: `${canvasSize.height * zoom}px`,
                  width: `${canvasSize.width * zoom}px`,
                  height: `${canvasSize.height * zoom}px`,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    transform: `translate(${translate.x}px, ${translate.y}px) scale(${zoom})`,
                    transformOrigin: "top left",
                    width: `${canvasSize.width}px`,
                    height: `${canvasSize.height}px`,
                    position: "relative",
                  }}
                >
                  <canvas ref={baseCanvasRef} className="absolute top-0 left-0" />
                  <canvas ref={drawCanvasRef} className="absolute top-0 left-0" />
                  <canvas ref={tempCanvasRef} className="absolute top-0 left-0 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* TOOLBAR - Mobile bottom */}
          <ColoringToolbar
            tool={tool}
            setTool={setTool}
            color={color}
            setColor={setColor}
            opacity={opacity}
            setOpacity={setOpacity}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            zoom={zoom}
            setZoom={setZoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            undo={undo}
            onClear={() => setShowClearModal(true)}
            onDownload={downloadResult}
            isMobile={true}
          />
        </div>
      )}
    </div>
  );
}
