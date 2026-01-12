import type { HTMLAttributes } from 'react';
import { clsx } from '../utils/clsx';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'accent' | 'muted';
};

export function Badge({ tone = 'muted', className, ...props }: BadgeProps) {
  return <span className={clsx('badge', `badge-${tone}`, className)} {...props} />;
}
