import { Link } from "@/i18n/routing";
import { Card } from "@/ui/card";

type Props = {
  href: string;
  title: string;
  description: string;
  badge?: string;
};

export function SectionCard({ href, title, description, badge }: Props) {
  return (
    <Link href={href}>
      <Card className="h-full flex flex-col justify-between hover:shadow-strong transition-shadow cursor-pointer">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {badge && (
          <div className="mt-4 inline-flex px-3 py-1 rounded-full bg-surface-muted text-xs text-muted-foreground border border-border">
            {badge}
          </div>
        )}
      </Card>
    </Link>
  );
}
