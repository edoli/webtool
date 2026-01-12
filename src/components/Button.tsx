import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react';
import { clsx } from '../utils/clsx';

type ButtonVariant = 'primary' | 'outline' | 'soft' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: ButtonVariant;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: 'button',
  outline: 'button button-outline',
  soft: 'button button-soft',
  ghost: 'button button-ghost',
};

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return <button className={clsx(variantClass[variant], className)} {...props} />;
}

export function ButtonLink({ className, variant = 'primary', ...props }: LinkButtonProps) {
  return <a className={clsx(variantClass[variant], className)} {...props} />;
}
