import Image from "next/image";
import { MPA_LOGO_ASSET_PATH } from "../../lib/branding";

export function MpaLogo({
  className = "h-16 w-auto",
  alt = "M.P.A. My Property Assistant",
  priority = false
}: {
  className?: string;
  alt?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={MPA_LOGO_ASSET_PATH}
      alt={alt}
      width={2048}
      height={2048}
      priority={priority}
      sizes="(max-width: 768px) 40vw, 220px"
      className={`h-auto object-contain dark:brightness-110 ${className}`}
    />
  );
}
