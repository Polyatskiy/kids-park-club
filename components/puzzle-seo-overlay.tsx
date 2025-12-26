"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";

interface PuzzleSeoOverlayProps {
  title: string;
  description: string;
  breadcrumbItems: Array<{ name: string; url: string }>;
}

export function PuzzleSeoOverlay({ title, description, breadcrumbItems }: PuzzleSeoOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
      {/* Оверлей размещен в центре-верху, чтобы не перекрывать кнопки слева (back ~60px) и справа (menu ~60px) */}
      <div className="max-w-4xl mx-auto px-4 pt-3 pb-2" style={{ paddingLeft: 'max(70px, 1rem)', paddingRight: 'max(70px, 1rem)' }}>
        {/* Breadcrumbs - compact, always visible */}
        <nav aria-label="Breadcrumb" className="text-[10px] md:text-xs text-slate-500/90 mb-1.5 pointer-events-auto">
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
                  <span className="text-slate-700 font-medium">{crumb.name}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* H1 and Description - compact overlay */}
        <div className="pointer-events-auto">
          {/* H1 - маленький, но это именно <h1> для SEO */}
          <h1 className="text-xs md:text-sm font-semibold text-slate-800 mb-1 inline-block bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md border border-slate-200/50 shadow-sm">
            {title}
          </h1>

          {/* Description - компактный или развернутый */}
          <div className="mt-1">
            {!isExpanded ? (
              <div className="flex items-start gap-1.5 flex-wrap">
                <p className="text-[10px] md:text-xs text-slate-600/90 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md border border-slate-200/50 shadow-sm flex-1 min-w-0">
                  {description.length > 80 ? `${description.substring(0, 80)}...` : description}
                </p>
                {description.length > 80 && (
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="text-[10px] md:text-xs text-blue-600 hover:text-blue-700 font-medium bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md border border-slate-200/50 shadow-sm hover:bg-blue-50 transition-colors whitespace-nowrap"
                    aria-label="Show full description"
                  >
                    Ще
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white/95 backdrop-blur-sm px-2 py-1.5 rounded-md border border-slate-200/50 shadow-sm max-w-2xl">
                <p className="text-[10px] md:text-xs text-slate-700 mb-1.5">{description}</p>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-[10px] md:text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  aria-label="Hide description"
                >
                  Згорнути
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

