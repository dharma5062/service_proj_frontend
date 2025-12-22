import './App.css'
import { AuthProvider } from './AuthContext'
import RouterComponent from './routes/Routes'
import { Toaster } from "@/components/ui/toaster"
import { ServiceRequestProvider } from './contexts/ServiceRequestContext'

function App() {


  return (
    <AuthProvider>
      <ServiceRequestProvider>
        <RouterComponent />
        <Toaster />
      </ServiceRequestProvider>
    </AuthProvider>

  )
}

export default App
