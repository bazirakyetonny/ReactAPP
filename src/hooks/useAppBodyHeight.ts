import { useEffect, useState } from "react";

function measureHeight(selector: string): number {
  const el = document.querySelector(selector);
  return el ? el.getBoundingClientRect().height : 0;
}

export function useAppBodyHeight(): number {
  const [height, setHeight] = useState<number>(() => {
    const navbar = measureHeight(".navbar");
    const fixedTop = measureHeight(".navbar-fixed-top");
    return window.innerHeight - navbar - fixedTop;
  });

  useEffect(() => {
    function recalculate() {
      const navbar = measureHeight(".navbar");
      const fixedTop = measureHeight(".navbar-fixed-top");
      setHeight(window.innerHeight - navbar - fixedTop);
    }

    recalculate();
    window.addEventListener("resize", recalculate);
    return () => window.removeEventListener("resize", recalculate);
  }, []);

  return height;
}
