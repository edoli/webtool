import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Home } from './pages/Home';
import { MotionPhoto } from './pages/convert/MotionPhoto';
import { HeicToJpg } from './pages/convert/HeicToJpg';
import { MovToMp4 } from './pages/convert/MovToMp4';
import { ComingSoon } from './pages/ComingSoon';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/convert/motion-photo" element={<MotionPhoto />} />
        <Route path="/convert/heic-to-jpg" element={<HeicToJpg />} />
        <Route path="/convert/mov-to-mp4" element={<MovToMp4 />} />
        <Route path="/convert/image-batch" element={<ComingSoon title="Image Batch Process" />} />
        <Route path="/apps/camera" element={<ComingSoon title="Camera" />} />
        <Route path="/apps/calculator" element={<ComingSoon title="Formula Calculator" />} />
        <Route path="/apps/special-calculator" element={<ComingSoon title="Special Calculator" />} />
        <Route path="/apps/csv-viewer" element={<ComingSoon title="CSV Viewer" />} />
        <Route path="/apps/python-editor" element={<ComingSoon title="Python Editor" />} />
        <Route path="/labs/equation" element={<ComingSoon title="Scribble to LaTeX" />} />
        <Route path="/labs/pdf" element={<ComingSoon title="PDF Tool" />} />
        <Route path="/labs/mega" element={<ComingSoon title="Mega Parser" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  );
}
