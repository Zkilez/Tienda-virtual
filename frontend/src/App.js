import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home"; // Asegúrate que el archivo exista en src/pages/Home.jsx

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Aquí puedes agregar más rutas después */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;