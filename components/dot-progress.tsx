'use client';

interface DotProgressProps {
  ahead: number;
  maxDots?: number;
}

export function DotProgress({ ahead, maxDots = 10 }: DotProgressProps) {
  const filledDots = Math.max(0, Math.min(ahead, maxDots - 1));
  const totalDots = maxDots;

  // Determine color based on position
  let dotColor = 'bg-blue-500'; // > 3 ahead
  if (ahead <= 3 && ahead > 0) {
    dotColor = 'bg-amber-500'; // 1-3 ahead
  } else if (ahead === 0) {
    dotColor = 'bg-red-500 animate-pulse'; // Your turn
  }

  return (
    <div className="flex gap-1.5 justify-center items-center mt-3">
      {Array.from({ length: totalDots }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            i < filledDots ? dotColor : 'bg-gray-300'
          }`}
        />
      ))}
      {ahead > 10 && (
        <span className="text-xs text-gray-500 ml-2">
          {ahead > 10 && `${ahead}+`}
        </span>
      )}
    </div>
  );
}
