import { clsx } from '../utils/clsx';

type LoadingStatusProps = {
  title: string;
  detail?: string;
  overlay?: boolean;
};

export function LoadingStatus({ title, detail, overlay = false }: LoadingStatusProps) {
  return (
    <div className={clsx('loading-status', overlay && 'loading-status--overlay')} role="status" aria-live="polite">
      <div className="loading-status__spinner" aria-hidden="true" />
      <div className="loading-status__content">
        <div className="loading-status__title">{title}</div>
        {detail ? <div className="loading-status__detail">{detail}</div> : null}
        <div className="loading-status__bar" aria-hidden="true" />
      </div>
    </div>
  );
}
