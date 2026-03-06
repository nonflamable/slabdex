import { Package } from "lucide-react";

export default function CardThumbnail({ imageUrl, cardName, size = "md" }) {
  const sizes = {
    sm: "w-10 h-14",
    md: "w-16 h-22",
    lg: "w-24 h-32",
    xl: "w-40 h-56",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  if (imageUrl) {
    return (
      <div className={`${sizes[size]} rounded-lg overflow-hidden bg-muted flex-shrink-0`}>
        <img src={imageUrl} alt={cardName} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`${sizes[size]} rounded-lg bg-muted flex items-center justify-center flex-shrink-0`}>
      <Package className={`${iconSizes[size]} text-muted-foreground`} />
    </div>
  );
}