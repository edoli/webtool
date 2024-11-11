import './App.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import FormulaCalculator from './pages/FormulaCalculator'


const router = createBrowserRouter([
  { path: "/FormulaCalculator", element: <FormulaCalculator /> }
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App
