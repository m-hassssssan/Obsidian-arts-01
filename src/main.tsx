import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import { TRPCProvider } from "@/providers/trpc"
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename={import.meta.env.DEV ? "/" : "/Obsidian-Arts"}>
    <TRPCProvider>
      <App />
    </TRPCProvider>
  </BrowserRouter>,
)
