interface ProgressBarProps {
  value: number;
  max: number;
}

export function ProgressBar({ value, max }: ProgressBarProps) {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div>
      <div className="progress" aria-hidden="true">
        <div className="progress__bar" style={{ width: `${percentage}%` }} />
      </div>
      <div className="progress__label">
        {value} / {max}
      </div>
    </div>
  );
}
