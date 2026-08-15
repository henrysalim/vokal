import { useLansia } from "@/src/context/LansiaContext";
import { Text as RNText, TextProps } from "react-native";

export interface AppTextProps extends TextProps {
  className?: string;
  size?: "xs" | "sm" | "base" | "md" | "lg" | "xl" | "2xl" | "3xl";
  disableLansiaScale?: boolean;
}

const fontScaleMap: Record<string, { normal: string; lansia: string }> = {
  xs: { normal: "text-xs", lansia: "text-base font-bold tracking-wide" },         // 12px -> 16px (+33%)
  sm: { normal: "text-sm", lansia: "text-lg font-bold tracking-wide" },           // 14px -> 18px (+28%)
  base: { normal: "text-base", lansia: "text-xl font-extrabold tracking-wide" },   // 16px -> 20px (+25%)
  md: { normal: "text-base", lansia: "text-xl font-extrabold tracking-wide" },     // 16px -> 20px (+25%)
  lg: { normal: "text-lg", lansia: "text-2xl font-extrabold tracking-wide" },     // 18px -> 24px (+33%)
  xl: { normal: "text-xl", lansia: "text-3xl font-extrabold tracking-wide" },     // 20px -> 30px (+50%)
  "2xl": { normal: "text-2xl", lansia: "text-4xl font-extrabold tracking-wide" }, // 24px -> 36px (+50%)
  "3xl": { normal: "text-3xl", lansia: "text-5xl font-extrabold tracking-wide" }, // 30px -> 48px (+60%)
};

export const AppText: React.FC<AppTextProps> = ({
  size = "base",
  className = "",
  children,
  disableLansiaScale = false,
  ...props
}) => {
  const { isLansiaMode } = useLansia();
  const scale = fontScaleMap[size] || fontScaleMap.base;
  const fontClass = (isLansiaMode && !disableLansiaScale) ? scale.lansia : scale.normal;

  const cleanClassName = className
    .replace(/\btext-(xs|sm|base|md|lg|xl|2xl|3xl|4xl|5xl)\b/g, "")
    .trim();

  return (
    <RNText className={`${fontClass} ${cleanClassName}`} {...props}>
      {children}
    </RNText>
  );
};

