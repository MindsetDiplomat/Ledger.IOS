import darkAsset from "@/assets/mma-logo-dark.png.asset.json";
import lightAsset from "@/assets/mma-logo-light.png.asset.json";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function Logo({ className, mark = false }: { className?: string; mark?: boolean }) {
  const { theme } = useTheme();
  const src = theme === "dark" ? darkAsset.url : lightAsset.url;
  return (
    <img
      src={src}
      alt="Mind Management Academy"
      className={cn(mark ? "h-9 w-9 object-cover object-top" : "h-10 w-auto object-contain", className)}
    />
  );
}