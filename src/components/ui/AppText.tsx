import { useLansia } from "@/src/context/LansiaContext";
import { Text as RNText, TextProps } from "react-native";

export interface AppTextProps extends TextProps {
  className?: string;
  size?: "xs" | "sm" | "base" | "md" | "lg" | "xl" | "2xl" | "3xl";
  disableLansiaScale?: boolean;
}

const fontScaleMap: Record<string, { normal: string; lansia: string }> = {
  xs: { normal: "text-xs", lansia: "text-base font-bold tracking-wide" }, 
  sm: { normal: "text-sm", lansia: "text-lg font-bold tracking-wide" },
  base: { normal: "text-base", lansia: "text-xl font-extrabold tracking-wide" },
  md: { normal: "text-base", lansia: "text-xl font-extrabold tracking-wide" },
  lg: { normal: "text-lg", lansia: "text-2xl font-extrabold tracking-wide" },
  xl: { normal: "text-xl", lansia: "text-3xl font-extrabold tracking-wide" },
  "2xl": { normal: "text-2xl", lansia: "text-4xl font-extrabold tracking-wide" },
  "3xl": { normal: "text-3xl", lansia: "text-5xl font-extrabold tracking-wide" },
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

