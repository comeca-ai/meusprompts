import { Routes, Route } from 'react-router'
import Home from '@/pages/Home'
import Dados from '@/pages/Dados'
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"
import Dashboard from '@/pages/app/Dashboard'
import PromptEditor from '@/pages/app/PromptEditor'
import Artifacts from '@/pages/app/Artifacts'
import { LibraryStub } from '@/pages/app/Stubs'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dados" element={<Dados />} />
      <Route path="/login" element={<Login />} />
      {/* Área logada — o AppShell exige autenticação (useAuth) */}
      <Route path="/app" element={<Dashboard />} />
      <Route path="/app/prompts/novo" element={<PromptEditor />} />
      <Route path="/app/prompts/:id" element={<PromptEditor />} />
      <Route path="/app/artefatos" element={<Artifacts />} />
      <Route path="/app/biblioteca" element={<LibraryStub />} />
      <Route path="/app/biblioteca/:setor" element={<LibraryStub />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
