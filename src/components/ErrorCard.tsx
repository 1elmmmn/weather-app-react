interface Props {
  title?: string;
  message: string;
  onRetry: () => void;
}

export function ErrorCard({ title = 'Не удалось загрузить прогноз', message, onRetry }: Props) {
  return (
    <section className="card state-card" role="alert">
      <h2 className="state-card__title">{title}</h2>
      <p>{message}</p>
      <button type="button" className="btn" onClick={onRetry}>Повторить</button>
    </section>
  );
}
