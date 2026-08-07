import { Star } from "lucide-react";

export default function StarRating({ value = 0, total = 5 }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <Star
          key={i}
          size={24}
          className="text-green-500"
          fill={i < Math.round(value) ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}
