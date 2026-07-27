import { useLayoutEffect, useRef } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { gsap } from "gsap";
import Demo4 from "./pages/Demo4";

function App() {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: 0.6,
          ease: "power3.out",
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [location.key]);

  return (
    <div ref={containerRef} style={{ willChange: "transform, opacity" }}>
      <Routes>
        <Route path="/" element={<Demo4 />} />
        <Route path="/demo4" element={<Demo4 />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
