import React from "react";
import { cn } from "../../lib/utils";

export const CardStack = ({
  items,
  offset,
  scaleFactor,
  className,
}: {
  items: {
    id: number;
    name: string;
    designation: string;
    content: React.ReactNode;
  }[];
  offset?: number;
  scaleFactor?: number;
  className?: string;
}) => {
  const CARD_OFFSET = offset || 10;
  const SCALE_FACTOR = scaleFactor || 0.06;
  const CARD_SCALE = 1 - (items.length - 1) * SCALE_FACTOR;

  return (
    <div
      className={cn(
        "relative h-60 w-60 md:h-60 md:w-80",
        className
      )}
    >
      {items.map((card, index) => {
        return (
          <div
            key={card.id}
            className="absolute bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700"
            style={{
              transformOrigin: "top center",
              left: 0,
              top: index * -CARD_OFFSET,
              scale: CARD_SCALE + index * SCALE_FACTOR,
              zIndex: items.length - index,
            }}
          >
            <div className="p-6">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {card.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {card.designation}
              </div>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                {card.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
