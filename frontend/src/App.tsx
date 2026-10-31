import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import Login from './pages/Login'
import Landing from './pages/Landing'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import Contributions from './pages/Contributions'
import Loans from './pages/Loans'
import AI from './pages/AI'
import Reports from './pages/Reports'
import Accounting from './pages/Accounting'
import Settings from './pages/Settings'

function Protected({children}:{children:React.ReactNode}){return localStorage.getItem('njangi_token')?<>{children}</>:<Navigate to="/login" replace/>}
export default function App(){return <Routes><Route path="/" element={<Landing/>}/><Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/><Route path="*" element={<Protected><Layout><Routes><Route path="/dashboard" element={<Dashboard/>}/><Route path="/members" element={<Members/>}/><Route path="/contributions" element={<Contributions/>}/><Route path="/loans" element={<Loans/>}/><Route path="/ai" element={<AI/>}/><Route path="/reports" element={<Reports/>}/><Route path="/accounting" element={<Accounting/>}/><Route path="/settings" element={<Settings/>}/><Route path="*" element={<Navigate to="/dashboard" replace/>}/></Routes></Layout></Protected>}/></Routes>}
