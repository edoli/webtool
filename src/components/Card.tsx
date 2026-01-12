import type { HTMLAttributes } from 'react';
import { clsx } from '../utils/clsx';

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return <div className={clsx('card', className)} {...props} />;
}
