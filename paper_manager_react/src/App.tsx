import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PDFManager from './pages/PDFManager';
import { DataViewer } from './viewer/DataViewer';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PDFManager />} />
        <Route path="/data_viewer" element={<DataViewer />} />
      </Routes>
    </Router>
  );
};

export default App;
