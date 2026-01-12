import { Link } from 'react-router-dom';
import { Card } from '../components/Card';

export function NotFound() {
  return (
    <div className="page">
      <Card className="placeholder">
        <h2>페이지를 찾을 수 없습니다</h2>
        <p className="muted">요청한 주소가 존재하지 않아요.</p>
        <Link to="/" className="button button-outline">
          홈으로 이동
        </Link>
      </Card>
    </div>
  );
}
