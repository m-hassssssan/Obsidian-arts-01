import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import { TRPCProvider } from "@/providers/trpc"
import { AuthProvider } from "@/hooks/use-auth"
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename="/">
    <TRPCProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </TRPCProvider>
  </BrowserRouter>,
)
