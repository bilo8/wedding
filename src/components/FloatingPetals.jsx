import { useMemo } from "react";

function FloatingPetals() {
  const petals = useMemo(
    () =>
      [...Array(20)].map(() => ({
        left: `${Math.random() * 100}%`,
        duration: `${15 + Math.random() * 10}s`,
        delay: `${Math.random() * 5}s`,
        size: `${18 + Math.random() * 12}px`,
      })),
    []
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      {petals.map((petal, index) => (
        <span
          key={index}
          className="petal"
          style={{
            left: petal.left,
            animationDuration: petal.duration,
            animationDelay: petal.delay,
            fontSize: petal.size,
          }}
        >
          🌸
        </span>
      ))}
    </div>
  );
}

export default FloatingPetals;