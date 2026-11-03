/** Заглушка на время загрузки: повторяет раскладку страницы, чтобы она не «прыгала». */
export function Skeleton() {
  return (
    <div className="skeleton" aria-hidden="true">
      <div className="skeleton__block skeleton__hero" />
      <div className="skeleton__block skeleton__row" />
      <div className="skeleton__grid">
        <div className="skeleton__block skeleton__col" />
        <div className="skeleton__block skeleton__col" />
      </div>
    </div>
  );
}
