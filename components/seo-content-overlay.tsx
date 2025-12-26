"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SeoContentOverlayProps {
  title: string;
  description: string | null;
  breadcrumbItems: BreadcrumbItem[];
  position?: "top-left" | "top-center" | "top-right";
  maxWidth?: string; // Для ограничения ширины (например, для пазлов)
  topOffset?: string; // Кастомный отступ сверху (для раскрасок - напротив кнопки закрыть)
}

export function SeoContentOverlay({
  title,
  description,
  breadcrumbItems,
  position = "top-left",
  maxWidth,
  topOffset: customTopOffset,
}: SeoContentOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const t = useTranslations("common.seoOverlay");
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const hasDescription = Boolean(description && description.trim());
  const shortDescription = description 
    ? (description.length > 40 ? description.substring(0, 40) : description)
    : null;

  // Безопасная зона: учитываем высоту кнопок игры (back button слева, burger справа)
  // Back button: top 16-20px, высота ~40px
  const topOffset = customTopOffset || '20px';
  const leftOffsetForButtons = '80px'; // Отступ слева, чтобы не перекрывать back button
  const rightOffsetForButtons = '56px'; // Отступ справа, чтобы не перекрывать burger button

  // Позиционирование: на мобильных всегда по центру, на десктопе используем position
  const getPositionStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = { top: topOffset };
    
    // На мобильных всегда по центру между кнопками
    if (isMobile) {
      return { ...baseStyle, left: '50%', transform: 'translateX(-50%)' };
    }
    
    // На десктопе используем переданный position
    switch (position) {
      case 'top-left':
        return { ...baseStyle, left: leftOffsetForButtons, right: 'auto', transform: 'none' };
      case 'top-center':
        return { ...baseStyle, left: '50%', right: 'auto', transform: 'translateX(-50%)' };
      case 'top-right':
        return { ...baseStyle, right: rightOffsetForButtons, left: 'auto', transform: 'none' };
      default:
        return { ...baseStyle, left: leftOffsetForButtons, right: 'auto', transform: 'none' };
    }
  };

  // Максимальная ширина: по умолчанию адаптивная, но можно ограничить (для пазлов)
  const overlayMaxWidth = maxWidth || 'max-w-[calc(100vw-3rem)] md:max-w-md';

  return (
    <div 
      className={`absolute z-50 pointer-events-none ${overlayMaxWidth}`}
      style={getPositionStyle()}
    >
      <div className="bg-white/95 backdrop-blur-md rounded-lg border border-slate-200/80 shadow-lg p-1.5 md:p-2 pointer-events-auto">
        {/* Breadcrumbs - очень компактно, скрыты на мобильных */}
        <nav aria-label="Breadcrumb" className="text-[8px] md:text-[9px] text-slate-500 mb-0.5 hidden md:block">
          <ol className="flex flex-wrap items-center gap-0.5">
            {breadcrumbItems.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && <span className="mx-0.5">/</span>}
                {index < breadcrumbItems.length - 1 ? (
                  <Link
                    href={crumb.url.replace(/^https:\/\/www\.kids-park\.club/, "")}
                    className="hover:text-slate-700 transition-colors"
                  >
                    {crumb.name}
                  </Link>
                ) : (
                  <span className="text-slate-600 font-medium">{crumb.name}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* H1 - маленький чип/лейбл, но остается H1 для SEO */}
        <h1 className="text-[10px] md:text-[11px] font-bold text-slate-900 mb-1 line-clamp-1">
          {title}
        </h1>

        {/* Описание - компактное или развернутое */}
        {hasDescription && (
          <div className="text-[9px] md:text-[10px] text-slate-600">
            {isExpanded ? (
              <>
                <p className="mb-1 leading-relaxed whitespace-pre-wrap break-words">
                  {description}
                </p>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-slate-500 hover:text-slate-700 transition-colors p-0.5 -ml-1"
                  aria-label={t("collapseDescription")}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </>
            ) : (
              <div className="relative flex items-center">
                <p className="line-clamp-1 flex-1 pr-7 relative">
                  {shortDescription}
                </p>
                {/* Fade gradient в конце строки (белый фон overlay) */}
                <div 
                  className="absolute right-5 top-0 bottom-0 w-6 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.95) 100%)'
                  }}
                />
                {/* Кнопка-иконка "..." (горизонтальные точки) поверх fade */}
                <button
                  onClick={() => setIsExpanded(true)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors p-0 pointer-events-auto flex-shrink-0 z-10"
                  aria-label={t("expandDescription")}
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  }}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {/* Горизонтальные три точки */}
                    <circle cx="6" cy="12" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="18" cy="12" r="1.5" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
