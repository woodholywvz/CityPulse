import Image from "next/image";

type ResponsiveImageProps = Readonly<{
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}>;

export function ResponsiveImage({
  src,
  alt,
  className,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
}: ResponsiveImageProps) {
  return (
    <div className={className}>
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized={src.startsWith("blob:")}
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}
