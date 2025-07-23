
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
      
      <Routes>
        <Route path="/" element={
          <>
            <VideoBackground />
            <ThemeToggle />
            <Login />
          </>
        } />
        <Route path="/register" element={
          <>
            <VideoBackground />
            <ThemeToggle />
            <Register />
          </>
        } />
        <Route path="/admin-dashboard" element={
          <>
            <ThemeToggle />
            <AdminDashboard />
          </>
        } />
        <Route path="/avenger-dashboard" element={
          <>
            <ThemeToggle />
            <AvengerDashboard />
          </>
        } />
      </Routes>
    </div>
  )
}

export default App
