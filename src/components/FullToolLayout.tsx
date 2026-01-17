import type { ToolLayoutProps } from './ToolLayout';
import { ToolLayout } from './ToolLayout';

type FullToolLayoutProps = Omit<ToolLayoutProps, 'layout' | 'extend'>;

export function FullToolLayout(props: FullToolLayoutProps) {
  return <ToolLayout {...props} layout="full" />;
}
