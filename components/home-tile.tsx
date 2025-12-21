import { Link } from "@/i18n/routing";
import Image from "next/image";

interface HomeTileProps {
  icon: string;
  label: string;
  href: string;
  glowColor: string;
  bgColor: string;
}

export function HomeTile({ icon, label, href, glowColor, bgColor }: HomeTileProps) {
  return (
    <Link href={href} className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
      <div
        className="home-tile flex flex-col items-center justify-center gap-3 p-5 md:p-6 rounded-[32px] cursor-pointer bg-card text-card-foreground border border-border shadow-soft hover:shadow-strong transition"
        style={{ 
          minHeight: "130px",
          backgroundImage: `linear-gradient(135deg, ${bgColor}, rgba(255,255,255,0.9))`,
          boxShadow: `0 10px 30px ${glowColor}`,
        }}
      >
        {/* Icon - 20% larger */}
        <div className="relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center">
          <Image
            src={icon}
            alt={label}
            fill
            className="object-contain drop-shadow-lg"
            style={{
              filter: "saturate(1.1) drop-shadow(0 4px 8px rgba(0,0,0,0.2))"
            }}
            sizes="(max-width: 768px) 56px, 64px"
            priority
            fetchPriority="high"
          />
        </div>
        
        <span 
          className="text-base md:text-lg font-semibold text-slate-900 text-center"
        >
          {label}
        </span>
      </div>
    </Link>
  );
}
