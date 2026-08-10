import { Routes, Route } from 'react-router'
import Home from '@/pages/Home'
import Dados from '@/pages/Dados'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dados" element={<Dados />} />
      <Route path="*" element={<Home />} />
    </Routes>
  )
}
