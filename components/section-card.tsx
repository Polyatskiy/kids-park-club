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
      <Card className="h-full flex flex-col justify-between hover:shadow-md transition cursor-pointer">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        {badge && (
          <div className="mt-4 inline-flex px-3 py-1 rounded-full bg-bgSoft text-xs text-gray-700">
            {badge}
          </div>
        )}
      </Card>
    </Link>
  );
}
