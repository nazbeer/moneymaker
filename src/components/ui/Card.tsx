import { ReactNode } from "react";

type PaddingVariant = "none" | "sm" | "md" | "lg";

interface CardProps {
  children: ReactNode;
  header?: ReactNode;
  hover?: boolean;
  padding?: PaddingVariant;
  className?: string;
}

const paddingStyles: Record<PaddingVariant, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function Card({
  children,
  header,
  hover = false,
  padding = "md",
  className = "",
}: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${
        hover
          ? "transition-all duration-200 hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5"
          : ""
      } ${className}`}
    >
      {header && (
        <div className="px-6 py-4 border-b border-gray-100">{header}</div>
      )}
      <div className={paddingStyles[padding]}>{children}</div>
    </div>
  );
}
