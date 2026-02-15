import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Home } from './pages/Home';
import { MotionPhoto } from './pages/convert/MotionPhoto';
import { HeicToJpg } from './pages/convert/HeicToJpg';
import { MovToMp4 } from './pages/convert/MovToMp4';
import { ImageBatch } from './pages/convert/ImageBatch';
import { ImageToBase64 } from './pages/convert/ImageToBase64';
import { Camera } from './pages/apps/Camera';
import { FormulaCalculator } from './pages/apps/FormulaCalculator';
import { SpecialCalculator } from './pages/apps/SpecialCalculator';
import { CsvViewer } from './pages/apps/CsvViewer';
import { PythonEditor } from './pages/apps/PythonEditor';
import { WebCollection } from './pages/apps/WebCollection';
import { Equation } from './pages/labs/Equation';
import { PdfTool } from './pages/labs/PdfTool';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/convert/motion-photo" element={<MotionPhoto />} />
        <Route path="/convert/heic-to-jpg" element={<HeicToJpg />} />
        <Route path="/convert/mov-to-mp4" element={<MovToMp4 />} />
        <Route path="/convert/image-batch" element={<ImageBatch />} />
        <Route path="/convert/image-to-base64" element={<ImageToBase64 />} />
        <Route path="/apps/camera" element={<Camera />} />
        <Route path="/apps/calculator" element={<FormulaCalculator />} />
        <Route path="/apps/special-calculator" element={<SpecialCalculator />} />
        <Route path="/apps/csv-viewer" element={<CsvViewer />} />
        <Route path="/apps/web-collection" element={<WebCollection />} />
        <Route path="/apps/python-editor" element={<PythonEditor />} />
        <Route path="/labs/equation" element={<Equation />} />
        <Route path="/labs/pdf" element={<PdfTool />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  );
}
