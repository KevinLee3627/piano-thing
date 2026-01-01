import { useEffect, useRef, useState } from 'react';

export const useResizeObserver = () => {
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current != null) {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setDimensions({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      });
      observer.observe(ref.current);
      return () => {
        observer.disconnect();
      };
    }
  }, [ref.current]);

  return { ref, dimensions };
};
