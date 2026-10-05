import { Award, BookOpen, Flame, Heart, Leaf, Medal, Star, Trophy, type LucideIcon } from "lucide-react";

export const BADGE_ICONS: Record<string, LucideIcon> = {
  award: Award, heart: Heart, leaf: Leaf, star: Star, trophy: Trophy, flame: Flame, "book-open": BookOpen, medal: Medal,
};
export const BADGE_ICON_LABEL: Record<string, string> = {
  award: "Huy chương", heart: "Trái tim", leaf: "Lá cây", star: "Ngôi sao", trophy: "Cúp", flame: "Ngọn lửa", "book-open": "Sách", medal: "Huân chương",
};

export function BadgeIcon({ name, className }: { name: string; className?: string }) {
  const Icon = BADGE_ICONS[name] ?? Award;
  return <Icon className={className} />;
}
