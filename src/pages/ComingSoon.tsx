import { Link } from 'react-router-dom';
import { Card } from '../components/Card';

type ComingSoonProps = {
  title: string;
};

export function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div className="page">
      <Card className="placeholder">
        <h2>{title}</h2>
        <p className="muted">
          이 툴은 React + TS 구조로 옮기는 중입니다. 우선순위를 정하면 바로 이어서
          마이그레이션하겠습니다.
        </p>
        <Link to="/" className="button button-outline">
          홈으로 돌아가기
        </Link>
      </Card>
    </div>
  );
}
