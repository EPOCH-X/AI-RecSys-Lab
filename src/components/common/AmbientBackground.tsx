/**
 * 전역 고정 배경: 어두운 베이스 위에 블러 오브가 천천히 움직이며 색이 은은히 변합니다.
 */
export function AmbientBackground() {
  return (
    <div className="ambient-background" aria-hidden>
      <div className="ambient-blob ambient-blob-1" />
      <div className="ambient-blob ambient-blob-2" />
      <div className="ambient-blob ambient-blob-3" />
      <div className="ambient-blob ambient-blob-4" />
      <div className="ambient-wave-sheen" />
    </div>
  );
}
