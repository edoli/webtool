import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react';
import { clsx } from '../utils/clsx';

type ButtonVariant = 'primary' | 'outline' | 'soft' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: 'button',
  outline: 'button button-outline',
  soft: 'button button-soft',
  ghost: 'button button-ghost',
};

const sizeClass: Partial<Record<ButtonSize, string>> = {
  sm: 'button-sm',
  lg: 'button-lg',
};

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return <button className={clsx(variantClass[variant], sizeClass[size], className)} {...props} />;
}

export function ButtonLink({ className, variant = 'primary', size = 'md', ...props }: LinkButtonProps) {
  return <a className={clsx(variantClass[variant], sizeClass[size], className)} {...props} />;
}
