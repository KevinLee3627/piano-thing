import { useEffect, useRef, useState } from 'react';

export const useResizeObserver = <T extends HTMLElement>() => {
  const [dimensions, setDimensions] = useState<{
    width: number;
    left: number;
  }>({
    width: 0,
    left: 0,
  });
  const ref = useRef<T>(null);
  useEffect(() => {
    if (ref.current != null) {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setDimensions({
            width: entry.borderBoxSize[0].inlineSize,
            // height: entry.borderBoxSize[0].blockSize,
            left: entry.target.getBoundingClientRect().left,
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
