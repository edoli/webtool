import type { InputHTMLAttributes } from 'react';
import { clsx } from '../utils/clsx';

type ToggleProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
};

export function Toggle({ className, label, ...props }: ToggleProps) {
  return (
    <label className={clsx('toggle', className)}>
      <input type="checkbox" {...props} />
      <span className="toggle-pill" />
      <span className="toggle-label">{label}</span>
    </label>
  );
}
