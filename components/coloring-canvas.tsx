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
  brushSize,
  setBrushSize,
  zoom,
  setZoom,
  onZoomIn,
  onZoomOut,
  undo,
  redo,
  onClear,
  onDownload,
  onPrint,
  isMobile,
}: {
  tool: "brush" | "eraser" | "fill" | "pan";
  setTool: (t: "brush" | "eraser" | "fill" | "pan") => void;
  color: string;
  setColor: (c: string) => void;
  brushSize: number;
  setBrushSize: (s: number) => void;
  zoom: number;
  setZoom: (z: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  undo: () => void;
  redo: () => void;
  onClear: () => void;
  onDownload: () => void;
  onPrint: () => void;
  isMobile: boolean;
}) {
  const tToolbar = useTranslations("common.toolbar");
  // Handle color selection: switch from eraser to fill if needed
  const handleColorSelect = (selectedColor: string) => {
    // If eraser is active, switch to fill
    if (tool === "eraser") {
      setTool("fill");
    }
    // Always apply the chosen color
    setColor(selectedColor);
  };

  // Handle brush size change: switch from fill to brush if needed
  const handleBrushSizeChange = (newSize: number) => {
    // If fill tool is active, switch to brush (brush size only makes sense for brush/eraser)
    if (tool === "fill") {
      setTool("brush");
    }
    setBrushSize(newSize);
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
        <div className="flex flex-col gap-2">
          {/* Main Tools: Pan, Brush, Eraser, Fill, Clear */}
          <div className="flex items-center gap-2">
            <ToolButton icon="pan" active={tool === "pan"} onClick={() => setTool("pan")} />
            <ToolButton icon="brush" active={tool === "brush"} onClick={() => setTool("brush")} />
            <ToolButton icon="eraser" active={tool === "eraser"} onClick={() => setTool("eraser")} />
            <ToolButton icon="fill" active={tool === "fill"} onClick={() => setTool("fill")} />
            <ActionButton type="trash" onClick={onClear} />
          </div>

          {/* Actions: Undo, Redo, Download, Print */}
          <div className="flex items-center gap-2">
            <ActionButton type="undo" onClick={undo} />
            <ActionButton type="redo" onClick={redo} />
            <ActionButton type="download" onClick={onDownload} />
            <ActionButton type="print" onClick={onPrint} />
          </div>

          {/* Settings: Zoom, Brush Size, Color Wheel */}
          <div className="flex items-center gap-2">
            <CompactZoomButton zoom={zoom} setZoom={setZoom} onZoomIn={onZoomIn} onZoomOut={onZoomOut} />
            <CompactBrushSizeButton brushSize={brushSize} setBrushSize={handleBrushSizeChange} />
            <DesktopColorWheelButton color={color} setColor={handleColorSelect} />
          </div>

          {/* Full Color Palette (Desktop) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Palette</label>
            </div>
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
        setBrushSize={handleBrushSizeChange}
        buttonRef={brushButtonRef}
      />

      {/* Row 1: Main Tools, History, Export, Settings */}
      <div className="flex items-center justify-between px-2 py-1.5 gap-1 border-b border-gray-100">
        {/* Main Tools: Pan, Brush, Eraser, Fill, Clear */}
        <div className="flex items-center gap-1">
          <ToolButton icon="pan" active={tool === "pan"} onClick={() => { setTool("pan"); closeAllPanels(); }} compact />
          <ToolButton icon="brush" active={tool === "brush"} onClick={() => { setTool("brush"); closeAllPanels(); }} compact />
          <ToolButton icon="eraser" active={tool === "eraser"} onClick={() => { setTool("eraser"); closeAllPanels(); }} compact />
          <ToolButton icon="fill" active={tool === "fill"} onClick={() => { setTool("fill"); closeAllPanels(); }} compact />
          <ActionButton type="trash" onClick={() => { onClear(); closeAllPanels(); }} compact />
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200" />

        {/* Actions: Undo, Redo, Download */}
        <div className="flex items-center gap-1">
          <ActionButton type="undo" onClick={() => { undo(); closeAllPanels(); }} compact />
          <ActionButton type="redo" onClick={() => { redo(); closeAllPanels(); }} compact />
          <ActionButton type="download" onClick={() => { onDownload(); closeAllPanels(); }} compact />
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200" />

        {/* Settings: Zoom, Brush Size */}
        <div className="flex items-center gap-1">
          <SettingsButton
            icon="🔍"
            label={tToolbar("zoom")}
            isActive={openPanel === "zoom"}
            onClick={() => togglePanel("zoom")}
            buttonRef={zoomButtonRef}
          />
          <SettingsButton
            icon="/icons/brush.svg"
            iconType="svg"
            label={tToolbar("brushSize")}
            isActive={openPanel === "brush"}
            onClick={() => togglePanel("brush")}
            buttonRef={brushButtonRef}
          />
        </div>
      </div>

      {/* Row 2: Color Palette */}
      <div className="px-1.5 py-1">
        <div className="flex items-center justify-center">
          <CompactColorPalette
            color={color}
            setColor={(c) => { handleColorSelect(c); closeAllPanels(); }}
            isMobile={isMobile}
          />
        </div>
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
  icon: "brush" | "eraser" | "fill" | "pan";
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
      {icon === "pan" ? (
        <svg 
          className={compact ? "w-4 h-4" : "w-6 h-6 md:w-7 md:h-7"} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M18 11v-1a2 2 0 0 0-2-2h-5a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2z" />
          <path d="M14 10V4.5a1.5 1.5 0 0 0-3 0V10" />
          <path d="M11 10.5V4.5a1.5 1.5 0 0 0-3 0V10" />
          <path d="M8 10H4.5a1.5 1.5 0 0 1 0-3H8" />
          <path d="M8 14H4.5a1.5 1.5 0 0 0 0 3H8" />
          <path d="M14 14v5.5a1.5 1.5 0 0 1-3 0V14" />
        </svg>
      ) : (
        <img src={`/icons/${icon}.svg`} className={compact ? "w-4 h-4" : "w-6 h-6 md:w-7 md:h-7"} alt={icon} />
      )}
    </button>
  );
}

function ActionButton({ type, onClick, compact = false }: {
  type: "undo" | "redo" | "trash" | "download" | "print";
  onClick: () => void;
  compact?: boolean;
}) {
  // For print, use emoji icon if SVG doesn't exist
  const useEmoji = type === "print";
  
  // For undo and redo, use SVG arrows (both same style, just mirrored)
  const isArrow = type === "undo" || type === "redo";
  
  return (
    <button
      onClick={onClick}
      className={`${compact ? "w-7 h-7" : "w-10 h-10 md:w-11 md:h-11"} rounded-full bg-white border border-gray-300 flex items-center justify-center shadow-sm transition-all duration-150 hover:scale-105 active:scale-95 hover:border-gray-400`}
      title={type === "redo" ? "Redo" : type === "print" ? "Print" : undefined}
    >
      {useEmoji ? (
        <span className={compact ? "text-base" : "text-lg md:text-xl"}>
          🖨️
        </span>
      ) : isArrow ? (
        // Both undo and redo use the same arrow style, just mirrored
        <svg 
          className={compact ? "w-4 h-4" : "w-5 h-5 md:w-6 md:h-6"} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ transform: type === "redo" ? "scaleX(-1)" : "none" }}
        >
          <path d="M3 7v6h6" />
          <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
        </svg>
      ) : (
        <img src={`/icons/${type}.svg`} className={compact ? "w-3.5 h-3.5" : "w-5 h-5 md:w-6 md:h-6"} alt={type} />
      )}
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
    COMPACT ZOOM BUTTON - Desktop compact zoom with popup
============================================================ */
function CompactZoomButton({
  zoom,
  setZoom,
  onZoomIn,
  onZoomOut
}: {
  zoom: number;
  setZoom: (z: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  const [showZoomPopup, setShowZoomPopup] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClick = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopupPosition({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
      setShowZoomPopup(true);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleClick}
        className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-300 flex items-center gap-1.5 transition-all duration-150 hover:scale-105 active:scale-95 text-sm font-medium text-slate-700"
        title="Zoom"
      >
        <span>🔍</span>
        <span>{Math.round(zoom * 100)}%</span>
      </button>
      {showZoomPopup && (
        <ZoomPopover
          isOpen={showZoomPopup}
          onClose={() => setShowZoomPopup(false)}
          zoom={zoom}
          setZoom={setZoom}
          buttonRef={buttonRef}
        />
      )}
    </>
  );
}

/* ============================================================
    COMPACT BRUSH SIZE BUTTON - Desktop compact brush size with popup
============================================================ */
function CompactBrushSizeButton({
  brushSize,
  setBrushSize
}: {
  brushSize: number;
  setBrushSize: (s: number) => void;
}) {
  const [showBrushPopup, setShowBrushPopup] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  const handleClick = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopupPosition({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
      setShowBrushPopup(true);
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleClick}
        className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-300 flex items-center gap-1.5 transition-all duration-150 hover:scale-105 active:scale-95 text-sm font-medium text-slate-700"
        title="Brush Size"
      >
        <img src="/icons/brush.svg" className="w-4 h-4" alt="Brush" />
        <span>{brushSize}px</span>
      </button>
      {showBrushPopup && (
        <BrushPopover
          isOpen={showBrushPopup}
          onClose={() => setShowBrushPopup(false)}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          buttonRef={buttonRef}
        />
      )}
    </>
  );
}

/* ============================================================
    DESKTOP COLOR WHEEL BUTTON
    - Placed next to zoom controls in desktop toolbar
    - Opens color wheel popup for unlimited color selection
============================================================ */
function DesktopColorWheelButton({
  color,
  setColor
}: {
  color: string;
  setColor: (c: string) => void;
}) {
  const [showColorWheel, setShowColorWheel] = useState(false);
  const [wheelPosition, setWheelPosition] = useState({ x: 0, y: 0 });
  const wheelButtonRef = useRef<HTMLButtonElement>(null);

  const handleColorWheelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (wheelButtonRef.current) {
      const rect = wheelButtonRef.current.getBoundingClientRect();
      setWheelPosition({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
      setShowColorWheel(true);
    }
  };

  return (
    <>
      <button
        ref={wheelButtonRef}
        onClick={handleColorWheelClick}
        className="color-wheel-button w-9 h-9 rounded-full transition-all duration-150 hover:scale-105 active:scale-95 border-2 border-gray-300 relative overflow-hidden"
        aria-label="Color wheel"
        title="Color picker"
      />
      {showColorWheel && (
        <ColorWheel
          isOpen={showColorWheel}
          onClose={() => setShowColorWheel(false)}
          onSelect={(c) => {
            setColor(c);
            setShowColorWheel(false);
          }}
          position={wheelPosition}
          currentColor={color}
        />
      )}
    </>
  );
}

/* ============================================================
    MOBILE COLOR WHEEL BUTTON
    - Compact version for mobile toolbar
    - Opens color wheel popup for unlimited color selection
============================================================ */
function MobileColorWheelButton({
  color,
  setColor
}: {
  color: string;
  setColor: (c: string) => void;
}) {
  const [showColorWheel, setShowColorWheel] = useState(false);
  const [wheelPosition, setWheelPosition] = useState({ x: 0, y: 0 });
  const wheelButtonRef = useRef<HTMLButtonElement>(null);

  const handleColorWheelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (wheelButtonRef.current) {
      const rect = wheelButtonRef.current.getBoundingClientRect();
      setWheelPosition({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
      setShowColorWheel(true);
    }
  };

  return (
    <>
      <button
        ref={wheelButtonRef}
        onClick={handleColorWheelClick}
        className="color-wheel-button w-7 h-7 rounded-full transition-all duration-150 hover:scale-105 active:scale-95 border-2 border-gray-300 relative overflow-hidden"
        aria-label="Color wheel"
        title="Color picker"
      />
      {showColorWheel && (
        <ColorWheel
          isOpen={showColorWheel}
          onClose={() => setShowColorWheel(false)}
          onSelect={(c) => {
            setColor(c);
            setShowColorWheel(false);
          }}
          position={wheelPosition}
          currentColor={color}
        />
      )}
    </>
  );
}

/* ============================================================
    MOBILE SLIDER POPOVER COMPONENTS
    - Each tool has its own popover with a slider
    - Auto-positions to stay within viewport
    - Closes when tapping outside
============================================================ */

type PanelType = "zoom" | "brush" | null;

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
  const [position, setPosition] = useState<{ x: number; y: number; useBottom?: boolean }>({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate position when popover opens
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const popoverWidth = 180; // Approximate width (wider for brush size popover)
    const popoverHeight = 240; // Approximate height (for brush size with preview)
    const padding = 8;
    const gap = 10; // Gap between button and popover
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Center horizontally above the button
    let x = rect.left + rect.width / 2 - popoverWidth / 2;
    
    // Check horizontal boundaries
    if (x < padding) {
      x = padding;
    } else if (x + popoverWidth > viewportWidth - padding) {
      x = viewportWidth - popoverWidth - padding;
    }

    // Determine vertical position: above or below button
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;
    const popoverNeedsSpace = popoverHeight + gap;

    let y: number;
    let useBottom = false;

    if (spaceAbove >= popoverNeedsSpace) {
      // Enough space above - position above button
      y = rect.top - gap;
    } else if (spaceBelow >= popoverNeedsSpace) {
      // Not enough space above, but enough below - position below button
      y = rect.bottom + gap;
      useBottom = true;
    } else {
      // Not enough space either way - choose the side with more space
      if (spaceAbove > spaceBelow) {
        // Position above, but adjust to fit
        y = padding;
      } else {
        // Position below, but adjust to fit
        y = viewportHeight - padding;
        useBottom = true;
      }
    }

    setPosition({ x, y, useBottom: useBottom });
  }, [isOpen, buttonRef]);

  // Check if mouse is over button or popover
  const isMouseOverElements = (x: number, y: number) => {
    const button = buttonRef.current;
    const popover = popoverRef.current;
    if (!button || !popover) return false;

    const buttonRect = button.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();

    const overButton = 
      x >= buttonRect.left && 
      x <= buttonRect.right && 
      y >= buttonRect.top && 
      y <= buttonRect.bottom;

    const overPopover = 
      x >= popoverRect.left && 
      x <= popoverRect.right && 
      y >= popoverRect.top && 
      y <= popoverRect.bottom;

    return overButton || overPopover;
  };

  // Global mouse move handler to check if mouse is still over elements
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isMouseOverElements(e.clientX, e.clientY)) {
        // Mouse is over button or popover - cancel any pending close
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      } else {
        // Mouse is not over either element - start close timer if not already started
        if (!timeoutRef.current) {
          timeoutRef.current = setTimeout(() => {
            onClose();
          }, 500);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isOpen, onClose]);

  // Handle mouse enter to cancel close
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Handle mouse leave from popover - start close timer
  const handleMouseLeave = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Start close timer - will be cancelled if mouse moves back over elements
    timeoutRef.current = setTimeout(() => {
      onClose();
    }, 500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
          ...(position.useBottom 
            ? { top: `${position.y}px` }
            : { bottom: `calc(100vh - ${position.y}px)` }
          ),
          minWidth: '140px',
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
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
      <div className="flex flex-col items-center gap-3">
        {/* Visual preview of brush size */}
        <div className="flex items-center justify-center w-32 h-32 bg-gray-50 rounded-lg border border-gray-200">
          <div
            className="rounded-full bg-blue-500 border-2 border-blue-600 shadow-md"
            style={{
              width: `${Math.min(brushSize, 100)}px`,
              height: `${Math.min(brushSize, 100)}px`,
              minWidth: '2px',
              minHeight: '2px',
            }}
          />
        </div>
        
        <input
          type="range"
          min={2}
          max={120}
          value={brushSize}
          onChange={(e) => {
            e.stopPropagation();
            setBrushSize(Number(e.target.value));
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => {
            e.stopPropagation();
            // Close popup after user releases the slider
            setTimeout(() => onClose(), 100);
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
            // Close popup after user releases the slider
            setTimeout(() => onClose(), 100);
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => {
            e.stopPropagation();
            // Close popup after user releases the slider on touch devices
            setTimeout(() => onClose(), 100);
          }}
          className="w-full h-2 accent-blue-500 cursor-pointer"
          style={{
            WebkitAppearance: 'none',
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((brushSize - 2) / 118) * 100}%, #e5e7eb ${((brushSize - 2) / 118) * 100}%, #e5e7eb 100%)`,
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
  iconType,
  label,
  isActive, 
  onClick,
  buttonRef
}: {
  icon: string;
  iconType?: "emoji" | "svg";
  label: string;
  isActive: boolean;
  onClick: () => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
}) {
  // Check if icon is an SVG path or emoji
  const isSvg = iconType === "svg" || icon.startsWith("/") || icon.endsWith(".svg");
  
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
      {isSvg ? (
        <img src={icon} className="w-4 h-4" alt={label} />
      ) : (
        <span className="text-xs">{icon}</span>
      )}
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
    COLOR WHEEL COMPONENT
    - Rainbow color picker with circular gradient
    - Allows selecting any color from the spectrum
============================================================ */
function ColorWheel({
  isOpen,
  onClose,
  onSelect,
  position,
  currentColor
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (color: string) => void;
  position: { x: number; y: number };
  currentColor: string;
}) {
  const wheelRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const wheelSize = 200;
  const wheelRadius = wheelSize / 2;
  const [shouldRender, setShouldRender] = useState(false);

  // Draw color wheel on canvas
  useEffect(() => {
    if (!wheelRef.current || !shouldRender) return;
    
    // Use requestAnimationFrame to ensure canvas is ready
    requestAnimationFrame(() => {
      if (!wheelRef.current) return;
      const canvas = wheelRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = wheelSize;
      canvas.height = wheelSize;
      const centerX = wheelRadius;
      const centerY = wheelRadius;
      const imageData = ctx.createImageData(wheelSize, wheelSize);
      const data = imageData.data;

      // Draw rainbow circle pixel by pixel
      for (let y = 0; y < wheelSize; y++) {
        for (let x = 0; x < wheelSize; x++) {
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const idx = (y * wheelSize + x) * 4;

          if (distance > wheelRadius) {
            // Outside circle - transparent
            data[idx] = 0;
            data[idx + 1] = 0;
            data[idx + 2] = 0;
            data[idx + 3] = 0;
          } else {
            // Calculate angle and distance
            const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 180;
            const normalizedDistance = distance / wheelRadius;
            
            // Hue based on angle (0-360)
            const hue = angle;
            // Saturation: full at edges, less towards center
            const saturation = Math.min(normalizedDistance * 1.2, 1) * 100;
            // Lightness: brighter towards center
            const lightness = 50 + (1 - normalizedDistance) * 30;
            
            // Convert HSL to RGB
            const h = hue / 360;
            const s = saturation / 100;
            const l = lightness / 100;
            
            const c = (1 - Math.abs(2 * l - 1)) * s;
            const x_val = c * (1 - Math.abs(((h * 6) % 2) - 1));
            const m = l - c / 2;
            
            let r = 0, g = 0, b = 0;
            if (h < 1/6) { r = c; g = x_val; b = 0; }
            else if (h < 2/6) { r = x_val; g = c; b = 0; }
            else if (h < 3/6) { r = 0; g = c; b = x_val; }
            else if (h < 4/6) { r = 0; g = x_val; b = c; }
            else if (h < 5/6) { r = x_val; g = 0; b = c; }
            else { r = c; g = 0; b = x_val; }
            
            data[idx] = Math.round((r + m) * 255);
            data[idx + 1] = Math.round((g + m) * 255);
            data[idx + 2] = Math.round((b + m) * 255);
            data[idx + 3] = 255;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Draw white center circle overlay (for brightness control)
      const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, wheelRadius * 0.35);
      centerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      centerGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)');
      centerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = centerGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, wheelRadius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [shouldRender, wheelSize, wheelRadius]);

  const getColorAtPoint = (clientX: number, clientY: number): string => {
    if (!wheelRef.current) return currentColor;
    const canvas = wheelRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Convert client coordinates to canvas coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const dx = canvasX - centerX;
    const dy = canvasY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > wheelRadius) return currentColor;
    
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 180;
    const normalizedDistance = Math.min(distance / wheelRadius, 1);
    
    // Calculate HSL
    const hue = angle;
    const saturation = Math.min(normalizedDistance * 1.2, 1) * 100;
    const lightness = 50 + (1 - normalizedDistance) * 30; // Brighter towards center
    
    // Convert HSL to RGB
    const h = hue / 360;
    const s = saturation / 100;
    const l = lightness / 100;
    
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x_val = c * (1 - Math.abs(((h * 6) % 2) - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    if (h < 1/6) { r = c; g = x_val; b = 0; }
    else if (h < 2/6) { r = x_val; g = c; b = 0; }
    else if (h < 3/6) { r = 0; g = c; b = x_val; }
    else if (h < 4/6) { r = 0; g = x_val; b = c; }
    else if (h < 5/6) { r = x_val; g = 0; b = c; }
    else { r = c; g = 0; b = x_val; }
    
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const color = getColorAtPoint(e.clientX, e.clientY);
    setSelectedColor(color);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const color = getColorAtPoint(e.clientX, e.clientY);
      setSelectedColor(color);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onSelect(selectedColor);
      onClose();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      setIsDragging(true);
      const touch = e.touches[0];
      const color = getColorAtPoint(touch.clientX, touch.clientY);
      setSelectedColor(color);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (isDragging && e.touches.length > 0) {
      const touch = e.touches[0];
      const color = getColorAtPoint(touch.clientX, touch.clientY);
      setSelectedColor(color);
    }
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      onSelect(selectedColor);
      onClose();
    }
  };

  const popupRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState<{ x: number; y: number; openAbove: boolean } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Reset animation state when opening
      setIsAnimating(false);
    } else {
      // Start closing animation
      setIsAnimating(false);
      // Hide after animation completes
      const timer = setTimeout(() => {
        setShouldRender(false);
        setAdjustedPosition(null);
      }, 200); // Match transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Calculate position when popup should be rendered
  useEffect(() => {
    if (!isOpen || !shouldRender) {
      return;
    }
    
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      if (!popupRef.current) return;
      
      const popup = popupRef.current;
      const rect = popup.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 16; // Minimum distance from screen edges
      
      // Calculate popup dimensions
      // wheelSize (200) + padding (16*2) + selected color block (~80) = ~312px
      const estimatedPopupWidth = wheelSize + 32; // wheelSize + padding
      const estimatedPopupHeight = wheelSize + 100; // wheelSize + selected color block + padding
      const popupWidth = rect.width > 0 ? rect.width : estimatedPopupWidth;
      const popupHeight = rect.height > 0 ? rect.height : estimatedPopupHeight;
      const popupHalfWidth = popupWidth / 2;
      
      // Adjust X position (horizontal centering with boundary checks)
      let newX = position.x;
      if (position.x - popupHalfWidth < padding) {
        newX = popupHalfWidth + padding;
      } else if (position.x + popupHalfWidth > viewportWidth - padding) {
        newX = viewportWidth - popupHalfWidth - padding;
      }
      
      // Calculate Y position - check if there's enough space above
      const spaceAbove = position.y;
      const spaceBelow = viewportHeight - position.y;
      const gap = 10; // Gap between button and popup
      
      let newY: number;
      let openAbove: boolean;
      
      // If there's enough space above, open above the button
      if (spaceAbove >= popupHeight + gap) {
        newY = position.y - popupHeight - gap;
        openAbove = true;
      } 
      // If not enough space above but enough below, open below
      else if (spaceBelow >= popupHeight + gap) {
        newY = position.y + gap;
        openAbove = false;
      }
      // If neither side has enough space, choose the side with more space
      else if (spaceAbove > spaceBelow) {
        // Open above, but clamp to viewport top
        newY = Math.max(padding, position.y - popupHeight - gap);
        openAbove = true;
      } else {
        // Open below, but clamp to viewport bottom
        newY = Math.min(viewportHeight - popupHeight - padding, position.y + gap);
        openAbove = false;
      }
      
      setAdjustedPosition({ x: newX, y: newY, openAbove });
    });
  }, [isOpen, shouldRender, position, wheelSize]);

  // Trigger animation after position is calculated
  useEffect(() => {
    if (adjustedPosition && isOpen && shouldRender) {
      // Small delay to ensure position is applied before animation
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [adjustedPosition, isOpen, shouldRender]);

  if (!shouldRender) return null;

  const finalX = adjustedPosition?.x ?? position.x;
  const finalY = adjustedPosition?.y ?? (position.y - wheelSize - 10);
  
  // Calculate transform for animation
  const transformValue = isAnimating 
    ? 'translateX(-50%) translateY(0) scale(1)' 
    : `translateX(-50%) translateY(${adjustedPosition?.openAbove ? '-10px' : '10px'}) scale(0.95)`;

  return (
    <>
      <div 
        className="fixed inset-0 z-40 transition-opacity duration-200"
        style={{
          opacity: isAnimating ? 1 : 0,
          pointerEvents: isAnimating ? 'auto' : 'none',
        }}
        onClick={onClose} 
      />
      <div
        ref={popupRef}
        className="fixed z-50 bg-white rounded-xl shadow-2xl p-4 border border-gray-200 transition-all duration-200 ease-out"
        style={{
          left: `${finalX}px`,
          top: `${finalY}px`,
          transform: transformValue,
          opacity: isAnimating ? 1 : 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <canvas
          ref={wheelRef}
          className="cursor-crosshair rounded-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ width: `${wheelSize}px`, height: `${wheelSize}px`, display: 'block' }}
        />
        <div className="mt-2 text-center">
          <div className="text-xs text-gray-600 mb-1">Selected:</div>
          <div
            className="w-12 h-12 mx-auto rounded-full border-2 border-gray-300 shadow-md"
            style={{ backgroundColor: selectedColor }}
          />
        </div>
      </div>
    </>
  );
}

/* ============================================================
    FULL COLOR PALETTE (DESKTOP - ALL COLORS)
    - Top row: 5 neutral grayscale colors (black to white)
    - Bright, child-friendly colors below
    - Selection indicated by blue outline
============================================================ */
function FullColorPalette({ 
  color, 
  setColor
}: {
  color: string;
  setColor: (v: string) => void;
}) {
  // Top row: 5 neutral grayscale colors from dark to light
  const GRAYSCALE_COLORS = [
    "#000000", // Black
    "#4a4a4a", // Dark gray
    "#7a7a7a", // Gray (slightly lighter)
    "#bfbfbf", // Light gray (even lighter)
    "#ffffff", // White
  ];

  // Bright, child-friendly base colors
  const BASE_COLORS = [
    { name: "red", base: "#FF1744" },
    { name: "pink", base: "#FF69B4" }, // Added: bright pink
    { name: "orange", base: "#FF6F00" },
    { name: "yellow", base: "#FFD700" }, // Changed: brighter yellow (#FFD700 instead of #FFD600)
    { name: "lime", base: "#CDDC39" }, // Added: lime green
    { name: "green", base: "#4CAF50" },
    { name: "cyan", base: "#00BCD4" }, // Added: cyan
    { name: "blue", base: "#2196F3" },
    { name: "purple", base: "#9C27B0" },
    { name: "brown", base: "#8B4513" }, // Brown (dark brown)
  ];

  // Generate bright shades (no darkening, only lightening)
  // For brown: generate from dark to light (dark brown -> light brown)
  const getShades = (baseHex: string, isBrown: boolean = false): string[] => {
    const r = parseInt(baseHex.slice(1, 3), 16);
    const g = parseInt(baseHex.slice(3, 5), 16);
    const b = parseInt(baseHex.slice(5, 7), 16);

    // Mix with white to create lighter variants
    const mixWithWhite = (c: number, factor: number) => {
      // factor: 0 = original color, 1 = white
      return Math.round(c * (1 - factor) + 255 * factor);
    };

    if (isBrown) {
      // For brown: generate from dark to light (dark brown -> light brown/tan)
      // Start with darker brown, then progressively lighter
      return [
        baseHex, // Dark brown (base)
        `#${mixWithWhite(r, 0.15).toString(16).padStart(2, "0")}${mixWithWhite(g, 0.15).toString(16).padStart(2, "0")}${mixWithWhite(b, 0.15).toString(16).padStart(2, "0")}`, // Medium-dark brown
        `#${mixWithWhite(r, 0.3).toString(16).padStart(2, "0")}${mixWithWhite(g, 0.3).toString(16).padStart(2, "0")}${mixWithWhite(b, 0.3).toString(16).padStart(2, "0")}`, // Medium brown
        `#${mixWithWhite(r, 0.5).toString(16).padStart(2, "0")}${mixWithWhite(g, 0.5).toString(16).padStart(2, "0")}${mixWithWhite(b, 0.5).toString(16).padStart(2, "0")}`, // Light brown
        `#${mixWithWhite(r, 0.7).toString(16).padStart(2, "0")}${mixWithWhite(g, 0.7).toString(16).padStart(2, "0")}${mixWithWhite(b, 0.7).toString(16).padStart(2, "0")}`, // Very light brown/tan
      ];
    }

    // For bright colors, generate lighter shades only (no darkening)
    return [
      baseHex, // Base color (brightest)
      `#${mixWithWhite(r, 0.2).toString(16).padStart(2, "0")}${mixWithWhite(g, 0.2).toString(16).padStart(2, "0")}${mixWithWhite(b, 0.2).toString(16).padStart(2, "0")}`, // Slightly lighter
      `#${mixWithWhite(r, 0.4).toString(16).padStart(2, "0")}${mixWithWhite(g, 0.4).toString(16).padStart(2, "0")}${mixWithWhite(b, 0.4).toString(16).padStart(2, "0")}`, // Lighter
      `#${mixWithWhite(r, 0.6).toString(16).padStart(2, "0")}${mixWithWhite(g, 0.6).toString(16).padStart(2, "0")}${mixWithWhite(b, 0.6).toString(16).padStart(2, "0")}`, // Very light
      `#${mixWithWhite(r, 0.8).toString(16).padStart(2, "0")}${mixWithWhite(g, 0.8).toString(16).padStart(2, "0")}${mixWithWhite(b, 0.8).toString(16).padStart(2, "0")}`, // Almost white
    ];
  };

  // Build color shades (excluding grayscale - they're in separate row)
  const allColors: string[] = [];
  BASE_COLORS.forEach(({ name, base }) => {
    allColors.push(...getShades(base, name === "brown"));
  });

  return (
    <div className="flex flex-col gap-2">
      {/* Top row: Grayscale colors */}
      <div className="flex flex-wrap gap-2">
        {GRAYSCALE_COLORS.map((shade, idx) => (
          <button
            key={`gray-${idx}`}
            onClick={() => setColor(shade)}
            className={`w-8 h-8 rounded-full transition-all duration-150 hover:scale-110 active:scale-95 ${
              color.toLowerCase() === shade.toLowerCase()
                ? "border-[3px] border-blue-500 shadow-md ring-2 ring-blue-200 scale-110"
                : "border-2 border-gray-300"
            }`}
            style={{ background: shade }}
            aria-label={`Grayscale ${idx + 1}`}
          />
        ))}
      </div>
      
      {/* Color shades */}
      <div className="flex flex-wrap gap-2">
        {allColors.map((shade, idx) => (
          <button
            key={`color-${idx}`}
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
    </div>
  );
}

/* ============================================================
    COMPACT COLOR PALETTE (MOBILE - ALL COLORS WITH POPUP)
    - Black is a parent color with minimal grayscale (black to white only)
    - All color families have bright shade popups
    - Color wheel for unlimited color selection
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
  const [showColorWheel, setShowColorWheel] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [wheelPosition, setWheelPosition] = useState({ x: 0, y: 0 });
  const colorRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const wheelButtonRef = useRef<HTMLButtonElement>(null);

  // All color families - BLACK is first with minimal grayscale, then bright colors
  const ALL_COLORS = [
    { name: "black", base: "#000000" }, // Parent for grayscale shades
    { name: "red", base: "#FF1744" },
    { name: "pink", base: "#FF69B4" }, // Added: bright pink
    { name: "orange", base: "#FF6F00" },
    { name: "yellow", base: "#FFD700" }, // Changed: brighter yellow (#FFD700)
    { name: "lime", base: "#CDDC39" }, // Added: lime green
    { name: "green", base: "#4CAF50" },
    { name: "cyan", base: "#00BCD4" }, // Added: cyan
    { name: "blue", base: "#2196F3" },
    { name: "purple", base: "#9C27B0" },
    { name: "brown", base: "#8B4513" }, // Brown (dark brown)
  ];

  // Minimal grayscale shades for black parent color (removed dark grays)
  const GRAYSCALE_SHADES = [
    "#000000", // Black
    "#FFFFFF", // White
  ];

  // Get shades for a color - special case for black (grayscale) and brown
  const getShades = (baseHex: string, isBrown: boolean = false): string[] => {
    // Black uses minimal grayscale shades
    if (baseHex.toLowerCase() === "#000000") {
      return GRAYSCALE_SHADES;
    }
    
    // Other colors use bright shades (lightening only, no darkening)
    const r = parseInt(baseHex.slice(1, 3), 16);
    const g = parseInt(baseHex.slice(3, 5), 16);
    const b = parseInt(baseHex.slice(5, 7), 16);

    // Mix with white to create lighter variants (no darkening)
    const mixWithWhite = (c: number, factor: number) => {
      // factor: 0 = original color, 1 = white
      return Math.round(c * (1 - factor) + 255 * factor);
    };

    if (isBrown) {
      // For brown: generate from dark to light (dark brown -> light brown/tan)
      return [
        baseHex, // Dark brown (base)
        `#${mixWithWhite(r, 0.15).toString(16).padStart(2, "0")}${mixWithWhite(g, 0.15).toString(16).padStart(2, "0")}${mixWithWhite(b, 0.15).toString(16).padStart(2, "0")}`, // Medium-dark brown
        `#${mixWithWhite(r, 0.3).toString(16).padStart(2, "0")}${mixWithWhite(g, 0.3).toString(16).padStart(2, "0")}${mixWithWhite(b, 0.3).toString(16).padStart(2, "0")}`, // Medium brown
        `#${mixWithWhite(r, 0.5).toString(16).padStart(2, "0")}${mixWithWhite(g, 0.5).toString(16).padStart(2, "0")}${mixWithWhite(b, 0.5).toString(16).padStart(2, "0")}`, // Light brown
        `#${mixWithWhite(r, 0.7).toString(16).padStart(2, "0")}${mixWithWhite(g, 0.7).toString(16).padStart(2, "0")}${mixWithWhite(b, 0.7).toString(16).padStart(2, "0")}`, // Very light brown/tan
      ];
    }

    return [
      baseHex, // Base color (brightest)
      `#${mixWithWhite(r, 0.2).toString(16).padStart(2, "0")}${mixWithWhite(g, 0.2).toString(16).padStart(2, "0")}${mixWithWhite(b, 0.2).toString(16).padStart(2, "0")}`, // Slightly lighter
      `#${mixWithWhite(r, 0.4).toString(16).padStart(2, "0")}${mixWithWhite(g, 0.4).toString(16).padStart(2, "0")}${mixWithWhite(b, 0.4).toString(16).padStart(2, "0")}`, // Lighter
      `#${mixWithWhite(r, 0.6).toString(16).padStart(2, "0")}${mixWithWhite(g, 0.6).toString(16).padStart(2, "0")}${mixWithWhite(b, 0.6).toString(16).padStart(2, "0")}`, // Very light
      `#${mixWithWhite(r, 0.8).toString(16).padStart(2, "0")}${mixWithWhite(g, 0.8).toString(16).padStart(2, "0")}${mixWithWhite(b, 0.8).toString(16).padStart(2, "0")}`, // Almost white
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

  const handleColorWheelClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (wheelButtonRef.current) {
      const rect = wheelButtonRef.current.getBoundingClientRect();
      setWheelPosition({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
      setShowColorWheel(true);
      setExpandedColor(null); // Close shade popup if open
    }
  };

  return (
    <>
      <div className="flex items-center gap-1">
        {/* All color families with popup - Black first */}
        {ALL_COLORS.map(({ name, base }) => (
          <button
            key={name}
            ref={(el) => {
              colorRefs.current[base] = el;
            }}
            onClick={(e) => handleColorClick(base, e)}
            className={`w-6 h-6 md:w-8 md:h-8 rounded-full transition-all duration-150 hover:scale-110 active:scale-95 ${
              isInColorFamily(base)
                ? "border-[3px] border-blue-500 shadow-md ring-2 ring-blue-200 scale-110"
                : "border-2 border-gray-300"
            }`}
            style={{ background: base }}
            aria-label={name}
          />
        ))}
        {/* Color Wheel Button */}
        <button
          ref={wheelButtonRef}
          onClick={handleColorWheelClick}
          className="color-wheel-button w-6 h-6 md:w-8 md:h-8 rounded-full transition-all duration-150 hover:scale-110 active:scale-95 border-2 border-gray-300 relative overflow-hidden"
          aria-label="Color wheel"
        />
      </div>

      {expandedColor && !showColorWheel && (
        <ColorShadePopup
          baseColor={expandedColor}
          shades={getShades(expandedColor, expandedColor.toLowerCase() === "#8b4513")}
          onSelect={setColor}
          onClose={() => setExpandedColor(null)}
          position={popupPosition}
          currentColor={color}
        />
      )}

      {showColorWheel && (
        <ColorWheel
          isOpen={showColorWheel}
          onClose={() => setShowColorWheel(false)}
          onSelect={(c) => {
            setColor(c);
            setShowColorWheel(false);
          }}
          position={wheelPosition}
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
  const [tool, setTool] = useState<"brush" | "eraser" | "fill" | "pan">("pan");
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
  const redoStack = useRef<ImageData[]>([]);
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
  const isTouchGesture = useRef(false);
  const isPanningGesture = useRef(false); // Separate flag for panning vs drawing
  const hasMovedSignificantly = useRef(false); // Track if touch moved significantly (for tap/pan detection)

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
    const ctx = draw.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const img = ctx.getImageData(0, 0, draw.width, draw.height);

    undoStack.current.push(img);
    if (undoStack.current.length > MAX_UNDO) undoStack.current.shift();
    // Clear redo stack when new action is performed
    redoStack.current = [];
  };

  const undo = () => {
    const draw = drawCanvasRef.current;
    if (!draw) return;
    if (undoStack.current.length <= 1) return;

    const ctx = draw.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Save current state to redo stack
    const current = ctx.getImageData(0, 0, draw.width, draw.height);
    redoStack.current.push(current);

    // Restore previous state
    undoStack.current.pop();
    const prev = undoStack.current[undoStack.current.length - 1];
    ctx.putImageData(prev, 0, 0);
  };

  const redo = () => {
    const draw = drawCanvasRef.current;
    if (!draw) return;
    if (redoStack.current.length === 0) return;

    const ctx = draw.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Save current state to undo stack
    const current = ctx.getImageData(0, 0, draw.width, draw.height);
    undoStack.current.push(current);

    // Restore from redo stack
    const next = redoStack.current.pop()!;
    ctx.putImageData(next, 0, 0);
  };

  const clearCanvas = () => {
    const draw = drawCanvasRef.current;
    const temp = tempCanvasRef.current;
    if (!draw) return;
    const ctx = draw.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    
    ctx.clearRect(0, 0, draw.width, draw.height);
    
    if (temp) {
      const tempCtx = temp.getContext("2d", { willReadFrequently: true });
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
    const base = baseCanvasRef.current;
    if (!temp) return;
    const ctx = temp.getContext("2d", { willReadFrequently: true });
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
          // First draw the brush color
          ctx.globalCompositeOperation = "source-over";
          const rgb = hexToRgb(color);
          ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(pts[0].x, pts[0].y, brushSize / 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Then blend with black outlines from base canvas
          if (base && temp.width === base.width && temp.height === base.height) {
            const baseCtx = base.getContext("2d", { willReadFrequently: true });
            if (baseCtx) {
              const tempData = ctx.getImageData(0, 0, temp.width, temp.height);
              const baseData = baseCtx.getImageData(0, 0, base.width, base.height);
              
              // Blend black outlines with brush color
              for (let i = 0; i < tempData.data.length; i += 4) {
                if (tempData.data[i + 3] > 0) { // If brush pixel exists
                  const baseR = baseData.data[i];
                  const baseG = baseData.data[i + 1];
                  const baseB = baseData.data[i + 2];
                  const baseA = baseData.data[i + 3];
                  
                  // Check if this is a black outline pixel
                  const isBlackOutline = baseA > 200 && baseR < 80 && baseG < 80 && baseB < 80;
                  
                  if (isBlackOutline) {
                    // Mix black outline with brush color
                    const outlineStrength = 0.4;
                    tempData.data[i] = Math.min(255, Math.round(tempData.data[i] * (1 - outlineStrength) + baseR * outlineStrength));
                    tempData.data[i + 1] = Math.min(255, Math.round(tempData.data[i + 1] * (1 - outlineStrength) + baseG * outlineStrength));
                    tempData.data[i + 2] = Math.min(255, Math.round(tempData.data[i + 2] * (1 - outlineStrength) + baseB * outlineStrength));
                    tempData.data[i + 3] = Math.max(tempData.data[i + 3], Math.min(255, baseA * 0.3));
                  }
                }
              }
              
              ctx.putImageData(tempData, 0, 0);
            }
          }
        } else if (tool === "eraser") {
          ctx.globalCompositeOperation = "destination-out";
          ctx.fillStyle = "rgba(0, 0, 0, 1)";
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(pts[0].x, pts[0].y, brushSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      return;
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brushSize;

    if (tool === "brush") {
      // First draw the brush stroke
      ctx.globalCompositeOperation = "source-over";
      const rgb = hexToRgb(color);
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
      ctx.globalAlpha = 1;

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
      
      // Process brush stroke: blend with black outlines
      if (base && temp.width === base.width && temp.height === base.height) {
        const baseCtx = base.getContext("2d", { willReadFrequently: true });
        if (baseCtx) {
          const tempData = ctx.getImageData(0, 0, temp.width, temp.height);
          const baseDataForBlend = baseCtx.getImageData(0, 0, base.width, base.height);
          
          // Blend black outlines with brush color
          for (let i = 0; i < tempData.data.length; i += 4) {
            if (tempData.data[i + 3] > 0) { // If brush pixel exists
              const baseR = baseDataForBlend.data[i];
              const baseG = baseDataForBlend.data[i + 1];
              const baseB = baseDataForBlend.data[i + 2];
              const baseA = baseDataForBlend.data[i + 3];
              
              // Check if this is a black outline pixel
              const isBlackOutline = baseA > 200 && baseR < 80 && baseG < 80 && baseB < 80;
              
              if (isBlackOutline) {
                // Mix black outline with brush color
                const outlineStrength = 0.4;
                tempData.data[i] = Math.min(255, Math.round(tempData.data[i] * (1 - outlineStrength) + baseR * outlineStrength));
                tempData.data[i + 1] = Math.min(255, Math.round(tempData.data[i + 1] * (1 - outlineStrength) + baseG * outlineStrength));
                tempData.data[i + 2] = Math.min(255, Math.round(tempData.data[i + 2] * (1 - outlineStrength) + baseB * outlineStrength));
                tempData.data[i + 3] = Math.max(tempData.data[i + 3], Math.min(255, baseA * 0.3));
              }
            }
          }
          
          ctx.putImageData(tempData, 0, 0);
        }
      }
    } else if (tool === "eraser") {
      // For eraser, draw a solid stroke on tempCanvas
      // This will be used with destination-out when merging to drawCanvas
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "rgba(0, 0, 0, 1)";
      ctx.globalAlpha = 1;

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
    }
  };

  /* ============================================================
      COMMIT STROKE (TEMP → DRAW)
  ============================================================= */

  const commitStroke = () => {
    const temp = tempCanvasRef.current;
    const draw = drawCanvasRef.current;
    const base = baseCanvasRef.current;
    if (!temp || !draw) return;

    const ctx = draw.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // For eraser, we need to apply destination-out when merging
    if (tool === "eraser") {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.drawImage(temp, 0, 0);
      ctx.restore();
    } else if (tool === "brush" && base) {
      // For brush, preserve black outlines from base canvas
      // Read pixels from base, temp, and draw canvases
      const baseCtx = base.getContext("2d", { willReadFrequently: true });
      const tempCtx = temp.getContext("2d", { willReadFrequently: true });
      
      if (baseCtx && tempCtx && draw.width === base.width && draw.height === base.height) {
        const baseData = baseCtx.getImageData(0, 0, base.width, base.height);
        const tempData = tempCtx.getImageData(0, 0, temp.width, temp.height);
        const drawData = ctx.getImageData(0, 0, draw.width, draw.height);
        const w = draw.width;
        const h = draw.height;
        
        // First, expand the brush stroke area by 1 pixel to cover anti-aliasing gaps
        const expandedArea = new Uint8Array(w * h);
        
        // Mark all pixels that are part of the brush stroke (tempA > 0)
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            if (tempData.data[idx + 3] > 0) {
              expandedArea[y * w + x] = 1;
              // Also mark neighbors to expand the area
              if (x > 0) expandedArea[y * w + (x - 1)] = 1;
              if (x < w - 1) expandedArea[y * w + (x + 1)] = 1;
              if (y > 0) expandedArea[(y - 1) * w + x] = 1;
              if (y < h - 1) expandedArea[(y + 1) * w + x] = 1;
            }
          }
        }
        
        // Merge temp (new brush stroke) with draw, preserving black outlines from base
        // Use expanded area to ensure complete coverage
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            
            // Check if this pixel is in the expanded brush area
            if (expandedArea[y * w + x] > 0) {
              const baseR = baseData.data[idx];
              const baseG = baseData.data[idx + 1];
              const baseB = baseData.data[idx + 2];
              const baseA = baseData.data[idx + 3];
              
              // Check if this is a black outline pixel (dark pixel from base canvas)
              const isBlackOutline = baseA > 200 && baseR < 80 && baseG < 80 && baseB < 80;
              
              const tempR = tempData.data[idx];
              const tempG = tempData.data[idx + 1];
              const tempB = tempData.data[idx + 2];
              const tempA = tempData.data[idx + 3];
              
              // If there's a brush pixel, use it; otherwise use the color from nearby brush pixels
              if (tempA > 0) {
                // New brush stroke pixel
                if (isBlackOutline) {
                  // Preserve black outline by mixing it with brush color
                  const outlineStrength = 0.4; // How much black outline to show (0-1)
                  drawData.data[idx] = Math.min(255, Math.round(tempR * (1 - outlineStrength) + baseR * outlineStrength));
                  drawData.data[idx + 1] = Math.min(255, Math.round(tempG * (1 - outlineStrength) + baseG * outlineStrength));
                  drawData.data[idx + 2] = Math.min(255, Math.round(tempB * (1 - outlineStrength) + baseB * outlineStrength));
                  drawData.data[idx + 3] = 255; // Always use full opacity to prevent white gaps
                } else {
                  // Normal area - use brush color with full opacity
                  drawData.data[idx] = tempR;
                  drawData.data[idx + 1] = tempG;
                  drawData.data[idx + 2] = tempB;
                  drawData.data[idx + 3] = 255; // Always use full opacity to prevent white gaps
                }
              } else {
                // This is an expanded pixel (neighbor of brush stroke)
                // Use the brush color from the original stroke, but with full opacity
                // Find nearest brush pixel color
                let nearestR = tempR;
                let nearestG = tempG;
                let nearestB = tempB;
                let found = false;
                
                // Check 8 neighbors for brush color
                for (let dy = -1; dy <= 1 && !found; dy++) {
                  for (let dx = -1; dx <= 1 && !found; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                      const nIdx = (ny * w + nx) * 4;
                      if (tempData.data[nIdx + 3] > 0) {
                        nearestR = tempData.data[nIdx];
                        nearestG = tempData.data[nIdx + 1];
                        nearestB = tempData.data[nIdx + 2];
                        found = true;
                      }
                    }
                  }
                }
                
                if (found) {
                  if (isBlackOutline) {
                    const outlineStrength = 0.4;
                    drawData.data[idx] = Math.min(255, Math.round(nearestR * (1 - outlineStrength) + baseR * outlineStrength));
                    drawData.data[idx + 1] = Math.min(255, Math.round(nearestG * (1 - outlineStrength) + baseG * outlineStrength));
                    drawData.data[idx + 2] = Math.min(255, Math.round(nearestB * (1 - outlineStrength) + baseB * outlineStrength));
                    drawData.data[idx + 3] = 255;
                  } else {
                    drawData.data[idx] = nearestR;
                    drawData.data[idx + 1] = nearestG;
                    drawData.data[idx + 2] = nearestB;
                    drawData.data[idx + 3] = 255; // Always use full opacity to prevent white gaps
                  }
                }
              }
            }
          }
        }
        
        ctx.putImageData(drawData, 0, 0);
      } else {
        // Fallback: normal source-over if dimensions don't match
        ctx.drawImage(temp, 0, 0);
      }
    } else {
      // For other tools or if base canvas not available, use normal source-over
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
    const mergedCtx = mergedCanvas.getContext("2d", { willReadFrequently: true });
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
      const a = data[idx + 3];
      
      // Skip fully transparent pixels
      if (a === 0) return false;
      
      // Check color match with tolerance
      return (
        Math.abs(r - tr) < TOLERANCE &&
        Math.abs(g - tg) < TOLERANCE &&
        Math.abs(b - tb) < TOLERANCE
      );
    };

    // Get base canvas data to detect outline boundaries
    const baseCtx = base.getContext("2d", { willReadFrequently: true });
    if (!baseCtx) return;
    const baseData = baseCtx.getImageData(0, 0, w, h);
    const basePixels = baseData.data;

    // Get draw canvas data for writing absolute RGBA values
    const drawCtx = draw.getContext("2d", { willReadFrequently: true });
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

    // Main flood‑fill loop. Uses an index pointer instead of Array.shift()
    // to avoid O(n²) behavior on large regions.
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
      // Use full opacity to prevent white gaps
      drawData.data[pixelIdx] = finalR;
      drawData.data[pixelIdx + 1] = finalG;
      drawData.data[pixelIdx + 2] = finalB;
      drawData.data[pixelIdx + 3] = 255; // Always use full opacity for fill to prevent white gaps

      // Add neighbors
      if (x > 0) queue.push({ x: x - 1, y });
      if (x < w - 1) queue.push({ x: x + 1, y });
      if (y > 0) queue.push({ x, y: y - 1 });
      if (y < h - 1) queue.push({ x, y: y + 1 });
    }

    // If the filled area is large, skip all post‑processing. The extra
    // edge‑smoothing passes are visually subtle but computationally heavy,
    // and on big regions they can add hundreds of ms of blocking time.
    const LARGE_FILL_THRESHOLD = 150_000; // ~150k pixels ≈ 400x375
    if (filledPixelCount > LARGE_FILL_THRESHOLD) {
      drawCtx.putImageData(drawData, 0, 0);
      saveUndo();
      return;
    }

    // OVERPAINT EXPANSION: Paint a 1‑pixel halo around the filled region
    // to hide anti‑aliased gaps along the original line art.
    const EXPANSION_RADIUS = 1;
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

          // Paint the expansion pixel with full opacity to prevent white gaps
          drawData.data[pixelIdx] = finalR;
          drawData.data[pixelIdx + 1] = finalG;
          drawData.data[pixelIdx + 2] = finalB;
          drawData.data[pixelIdx + 3] = 255; // Always use full opacity for expansion to prevent white gaps
        }
      }

      // Use expansion pixels as new edge for next radius iteration
      edgePixels.length = 0;
      edgePixels.push(...expansionPixels);
    }

    // Apply the final filled image to the draw canvas.
    // We intentionally skip the previous Gaussian smoothing pass to keep
    // fill latency low; the 1‑px expansion above already hides most jaggies.
    drawCtx.putImageData(drawData, 0, 0);

    // Save undo AFTER the fill completes (same pattern as commitStroke for brush)
    // so each fill is a single, reversible action.
    saveUndo();
  };

  /* ============================================================
      EVENT HANDLERS - MOUSE
  ============================================================= */

  // Check if click is on scrollbar area
  const isClickOnScrollbar = (e: React.MouseEvent): boolean => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return false;

    const rect = wrapper.getBoundingClientRect();
    const scrollbarWidth = 17; // Typical scrollbar width in most browsers
    
    // Check if click is on vertical scrollbar (right edge)
    const isOnVerticalScrollbar = 
      wrapper.scrollHeight > wrapper.clientHeight &&
      e.clientX >= rect.right - scrollbarWidth &&
      e.clientX <= rect.right;

    // Check if click is on horizontal scrollbar (bottom edge)
    const isOnHorizontalScrollbar = 
      wrapper.scrollWidth > wrapper.clientWidth &&
      e.clientY >= rect.bottom - scrollbarWidth &&
      e.clientY <= rect.bottom;

    return isOnVerticalScrollbar || isOnHorizontalScrollbar;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Ignore clicks on scrollbar - don't draw
    if (isClickOnScrollbar(e)) {
      return;
    }

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
    // Stop drawing if mouse moves over scrollbar
    if (isClickOnScrollbar(e)) {
      if (isDrawingRef.current) {
        commitStroke();
        isDrawingRef.current = false;
        pointsRef.current = [];
      }
      return;
    }

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
  const TOUCH_PAN_THRESHOLD = 15; /* pixels - movement threshold to trigger panning instead of drawing */

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    
    /* Two or more fingers = pinch-zoom gesture */
    if (e.touches.length >= 2) {
      isTouchGesture.current = true;
      isPanningGesture.current = true;
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
      
      // Record touch start for tap and pan detection
      touchStartTime.current = Date.now();
      touchStartPos.current = { x: t.clientX, y: t.clientY };
      hasMovedSignificantly.current = false;
      isTouchGesture.current = false;
      
      // If pan tool is active, always enable panning mode
      if (tool === "pan") {
        isPanningGesture.current = true;
        isDrawingRef.current = false;
        pointsRef.current = [];
      } else {
        // For other tools, wait to see if it's a pan or draw gesture
        isPanningGesture.current = false;
      }
      
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
      
      // If pan tool is active, always pan (no drawing)
      if (tool === "pan" && touchPanRef.current) {
        const dx = t.clientX - touchPanRef.current.x;
        const dy = t.clientY - touchPanRef.current.y;
        setTranslate((tr) => ({ x: tr.x + dx, y: tr.y + dy }));
        touchPanRef.current = { x: t.clientX, y: t.clientY };
        return;
      }
      
      // For brush/eraser tools, always draw (no panning with single finger)
      if (tool === "brush" || tool === "eraser") {
        // Check if we've moved significantly
        if (touchStartPos.current) {
          const moveDist = Math.sqrt(
            Math.pow(t.clientX - touchStartPos.current.x, 2) +
            Math.pow(t.clientY - touchStartPos.current.y, 2)
          );
          if (moveDist > TOUCH_TAP_THRESHOLD) {
            hasMovedSignificantly.current = true;
          }
        }
        
        // Start drawing on first significant movement
        if (!isDrawingRef.current && hasMovedSignificantly.current) {
          const coords = getCanvasCoords(t.clientX, t.clientY);
          if (coords) {
            isDrawingRef.current = true;
            pointsRef.current = [];
            pointsRef.current.push(coords);
            drawSpline();
          }
        } else if (isDrawingRef.current) {
          const coords = getCanvasCoords(t.clientX, t.clientY);
          if (coords) {
            pointsRef.current.push(coords);
            drawSpline();
          }
        }
        return;
      }
      
      // For fill tool, check if it's a tap or pan gesture
      if (tool === "fill") {
        // Check if we've moved significantly (for tap/pan detection)
        if (touchStartPos.current) {
          const moveDist = Math.sqrt(
            Math.pow(t.clientX - touchStartPos.current.x, 2) +
            Math.pow(t.clientY - touchStartPos.current.y, 2)
          );
          if (moveDist > TOUCH_TAP_THRESHOLD) {
            hasMovedSignificantly.current = true;
          }
          
          // If movement exceeds pan threshold, switch to panning mode
          if (moveDist > TOUCH_PAN_THRESHOLD && !isDrawingRef.current) {
            isPanningGesture.current = true;
            isDrawingRef.current = false;
            pointsRef.current = [];
          }
        }

        // If panning gesture is active, pan the canvas
        if (isPanningGesture.current && touchPanRef.current) {
          const dx = t.clientX - touchPanRef.current.x;
          const dy = t.clientY - touchPanRef.current.y;
          setTranslate((tr) => ({ x: tr.x + dx, y: tr.y + dy }));
          touchPanRef.current = { x: t.clientX, y: t.clientY };
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    
    // Commit any in-progress drawing (only if not panning)
    if (isDrawingRef.current && !isPanningGesture.current) {
      commitStroke();
      isDrawingRef.current = false;
      pointsRef.current = [];
    }

    /* Handle fill tool TAP detection */
    /* Fill only triggers if: single tap, no multitouch, no panning, minimal movement, quick tap */
    if (e.touches.length === 0 && 
        tool === "fill" && 
        !isTouchGesture.current && 
        !isPanningGesture.current &&
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
      isPanningGesture.current = false;
      hasMovedSignificantly.current = false;
      touchStartPos.current = null;
      isDrawingRef.current = false;
      pointsRef.current = [];
    }
  };

  /* ============================================================
      CLAMP PAN AND CENTER CANVAS
      
      Centers the canvas when it's smaller than the viewport,
      and prevents it from going out of bounds when it's larger.
  ============================================================= */

  const clampPan = useCallback(() => {
    const wrapper = wrapperRef.current;
    const base = baseCanvasRef.current;
    if (!wrapper || !base) return;

    const viewW = wrapper.clientWidth;
    const viewH = wrapper.clientHeight;

    const canvasW = base.width * zoom;
    const canvasH = base.height * zoom;

    setTranslate((t) => {
      let x = t.x;
      let y = t.y;

      // If canvas is smaller than viewport, center it
      if (canvasW <= viewW) {
        x = (viewW - canvasW) / 2;
      } else {
        // Canvas is larger - clamp to prevent going out of bounds
        const minX = viewW - canvasW;
        const maxX = 0;
        x = Math.max(minX, Math.min(maxX, x));
      }

      // If canvas is smaller than viewport, center it
      if (canvasH <= viewH) {
        y = (viewH - canvasH) / 2;
      } else {
        // Canvas is larger - clamp to prevent going out of bounds
        const minY = viewH - canvasH;
        const maxY = 0;
        y = Math.max(minY, Math.min(maxY, y));
      }

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
      
      // Use the smaller scale to ensure image fits completely
      return Math.min(scaleX, scaleY);
    }
    
    const viewWidth = wrapper?.clientWidth || container?.clientWidth || window.innerWidth;
    const viewHeight = wrapper?.clientHeight || container?.clientHeight || window.innerHeight;
    
    // Ensure we have valid dimensions
    if (viewWidth <= 0 || viewHeight <= 0) {
      return 1.0;
    }
    
    // Calculate scale factors for both dimensions
    const scaleX = viewWidth / imgWidth;
    const scaleY = viewHeight / imgHeight;
    
    // Use the smaller scale to ensure image fits completely
    // This maximizes the image size while maintaining aspect ratio
    const fitScale = Math.min(scaleX, scaleY);
    
    // Clamp to reasonable bounds
    return Math.max(0.1, Math.min(4.0, fitScale));
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

      const ctx = base.getContext("2d", { willReadFrequently: false });
      if (ctx) {
        ctx.clearRect(0, 0, base.width, base.height);
        ctx.drawImage(img, 0, 0);
      }

      const drawCtx = draw.getContext("2d", { willReadFrequently: true });
      if (drawCtx) {
        drawCtx.clearRect(0, 0, draw.width, draw.height);
        undoStack.current = [drawCtx.getImageData(0, 0, draw.width, draw.height)];
      }

      // AUTO-FIT: Calculate and set optimal zoom for the image to fit the screen
      // Use a small delay to ensure container dimensions are available
      setTimeout(() => {
        const autoZoom = calculateAutoFitZoom(img.width, img.height);
        setZoom(autoZoom);
        // Translate will be centered by clampPan after zoom is set
        setTranslate({ x: 0, y: 0 });
        // Ensure canvas is centered after initial load
        setTimeout(() => clampPan(), 100);
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

  // Detect if device is actually mobile (not just narrow window)
  const detectMobileDevice = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    
    // Check User-Agent for mobile devices
    const ua = navigator.userAgent.toLowerCase();
    const isMobileUA = 
      ua.includes('iphone') ||
      ua.includes('ipod') ||
      ua.includes('android') ||
      ua.includes('mobile') ||
      ua.includes('blackberry') ||
      ua.includes('windows phone') ||
      (ua.includes('ipad') && 'ontouchend' in document); // iPad with touch support
    
    // Also check for touch support (primary input method)
    const hasTouchScreen = 
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    
    // Device is mobile if it has mobile UA OR has touch as primary input
    // But NOT if it's a desktop browser with touch support (like Surface)
    // For desktop browsers, check window width as secondary factor
    if (isMobileUA) {
      return true;
    }
    
    // If it's a touch device but window is very wide, it's probably a tablet/desktop with touch
    // Use 900px as breakpoint - narrower windows on touch devices should use mobile layout
    if (hasTouchScreen && window.innerWidth < 900) {
      return true;
    }
    
    return false;
  }, []);

  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    
    const handleResize = () => {
      // Update mobile state based on actual device, not just window width
      setIsMobile(detectMobileDevice());
      
      // Debounce auto-fit recalculation
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (canvasSize.width > 0 && canvasSize.height > 0) {
          const autoZoom = calculateAutoFitZoom(canvasSize.width, canvasSize.height);
          setZoom(autoZoom);
          // Translate will be centered by clampPan after zoom is set
          setTranslate({ x: 0, y: 0 });
          // Ensure canvas is centered after resize
          setTimeout(() => clampPan(), 100);
        }
      }, 200);
    };
    
    // Initial check
    setIsMobile(detectMobileDevice());
    
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [canvasSize, calculateAutoFitZoom, detectMobileDevice]);

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

    const ctx = merged.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(base, 0, 0);
    ctx.drawImage(draw, 0, 0);

    const a = document.createElement("a");
    a.download = "coloring.png";
    a.href = merged.toDataURL();
    a.click();
  };

  const printResult = () => {
    const base = baseCanvasRef.current;
    const draw = drawCanvasRef.current;
    if (!base || !draw) return;

    const merged = document.createElement("canvas");
    merged.width = base.width;
    merged.height = base.height;

    const ctx = merged.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(base, 0, 0);
    ctx.drawImage(draw, 0, 0);

    const dataUrl = merged.toDataURL("image/png");
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Coloring</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" alt="Coloring" />
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
                  display: "block",
                  transformOrigin: "top left",
                  width: `${canvasSize.width * zoom}px`,
                  height: `${canvasSize.height * zoom}px`,
                  minWidth: `${canvasSize.width * zoom}px`,
                  minHeight: `${canvasSize.height * zoom}px`,
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
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            zoom={zoom}
            setZoom={setZoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            undo={undo}
            redo={redo}
            onClear={() => setShowClearModal(true)}
            onDownload={downloadResult}
            onPrint={printResult}
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
                minWidth: 0,
                minHeight: 0,
                overflow: "auto",
                overflowX: "auto",
                overflowY: "auto",
                // Allow pan-y and pan-x for touch scrolling, but prevent pinch-zoom default behavior
                // We handle pinch-zoom manually in touch handlers
                touchAction: "pan-x pan-y"
              }}
            >
              {/* SCALE WRAPPER - Mobile */}
              <div
                className="relative"
                style={{
                  display: "block",
                  transformOrigin: "top left",
                  width: `${canvasSize.width * zoom}px`,
                  height: `${canvasSize.height * zoom}px`,
                  minWidth: `${canvasSize.width * zoom}px`,
                  minHeight: `${canvasSize.height * zoom}px`,
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
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            zoom={zoom}
            setZoom={setZoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            undo={undo}
            redo={redo}
            onClear={() => setShowClearModal(true)}
            onDownload={downloadResult}
            onPrint={printResult}
            isMobile={true}
          />
        </div>
      )}
    </div>
  );
}
