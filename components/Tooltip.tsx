/**
 * @file A generic, reusable tooltip component for displaying rich content.
 */

import React, { useRef, useLayoutEffect, useState } from 'react';

/**
 * Props for the Tooltip component.
 */
interface TooltipProps {
  x: number;
  y: number;
  children: React.ReactNode;
}

/**
 * A generic tooltip component that displays content at specific coordinates
 * and automatically adjusts its position to stay within the viewport.
 * @param {TooltipProps} props The properties for the component.
 * @returns {React.ReactElement} The rendered tooltip.
 */
export const Tooltip: React.FC<TooltipProps> = ({ x, y, children }) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: y + 20, left: x + 20 });

  // useLayoutEffect ensures that the position is calculated after render but before the browser paints,
  // preventing visual flickering.
  useLayoutEffect(() => {
    if (tooltipRef.current) {
      const { innerWidth, innerHeight } = window;
      const { offsetWidth, offsetHeight } = tooltipRef.current;
      
      let newLeft = x + 20;
      // If the tooltip would go off the right edge, flip it to the left of the cursor.
      if (newLeft + offsetWidth > innerWidth) {
        newLeft = x - offsetWidth - 20;
      }
      
      let newTop = y + 20;
      // If the tooltip would go off the bottom edge, flip it to above the cursor.
      if (newTop + offsetHeight > innerHeight) {
        newTop = y - offsetHeight - 20;
      }
      
      setPosition({ top: newTop, left: newLeft });
    }
  }, [x, y, children]); // Rerun when content changes, as its size might change.

  return (
    <div
      ref={tooltipRef}
      className="fixed bg-gray-900 border border-gray-700 rounded-md shadow-lg z-[110] p-3 text-white text-base pointer-events-none max-w-xs transition-opacity duration-100 text-left"
      style={{ top: position.top, left: position.left, opacity: 1 }}
    >
      {children}
    </div>
  );
};