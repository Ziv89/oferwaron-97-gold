// Add this component above your Home function
const StatCardGlitter = () => {
  const glitters = Array.from({ length: 14 }, (_, i) => {
    const size = 2 + Math.random() * 3.5;
    return {
      key: i,
      style: {
        width: `${size}px`, height: `${size}px`,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animationDuration: `${1.5 + Math.random() * 2}s`,
        animationDelay: `${Math.random() * 3}s`,
      },
    };
  });

  return (
    <>
      <span className="stat-glitter-layer" aria-hidden="true">
        {glitters.map(g => <span key={g.key} className="stat-glitter" style={g.style} />)}
      </span>
      <span className="stat-shimmer-layer" aria-hidden="true">
        <span className="stat-shimmer-sweep" />
      </span>
    </>
  );
};