
import { Routes, Route } from 'react-router-dom'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { AdminDashboard } from './pages/AdminDashboard'
import { AvengerDashboard } from './pages/AvengerDashboard'
import { VideoBackground } from './components/VideoBackground'
import { ThemeToggle } from './components/ThemeToggle'

function App() {
  return (
    <div className="app-container">
      <VideoBackground />
      <ThemeToggle />
      
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/avenger-dashboard" element={<AvengerDashboard />} />
      </Routes>
    </div>
  )
}

export default App
