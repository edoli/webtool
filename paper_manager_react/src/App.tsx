import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PDFManager from './pages/PDFManager';

const App = () => {
  return (
    <Router basename="/webtool/paper_manager">
      <Routes>
        <Route path="/" element={<PDFManager />} />
      </Routes>
    </Router>
  );
};

export default App;
