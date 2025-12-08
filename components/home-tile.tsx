import Link from "next/link";
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
    <Link href={href} className="block group">
      <div
        className="home-tile flex flex-col items-center justify-center gap-3 p-5 md:p-6 rounded-[32px] cursor-pointer backdrop-blur-[16px] border border-white/20"
        style={{ 
          minHeight: "130px",
          backgroundColor: bgColor,
          boxShadow: `0 8px 32px ${glowColor}, 0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.3)`,
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
          />
        </div>
        
        {/* Label - larger, semi-bold, with shadow */}
        <span 
          className="text-base md:text-lg font-semibold text-white text-center"
          style={{
            textShadow: "0 2px 8px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)"
          }}
        >
          {label}
        </span>
      </div>
    </Link>
  );
}
