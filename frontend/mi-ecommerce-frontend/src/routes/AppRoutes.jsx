// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home"; // ← usamos "./" ya que está dentro del mismo src

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Otras rutas aquí */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;