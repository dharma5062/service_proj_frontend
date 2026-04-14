import './App.css'
import { AuthProvider } from './AuthContext'
import RouterComponent from './routes/Routes'
import { Toaster as SonnerToaster } from "sonner"

function App() {


  return (
    <AuthProvider>
      <RouterComponent />
      <SonnerToaster position="top-right" richColors />
    </AuthProvider>

  )
}

export default App
