import { Routes, Route } from 'react-router'
import Home from '@/pages/Home'
import Dados from '@/pages/Dados'
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dados" element={<Dados />} />
      <Route path="*" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
