import React from "react"
import { Providers } from "@/app/providers"
import { AppRoutes } from "@/app/routes"

const App: React.FC = () => {
  return (
    <Providers>
      <AppRoutes />
    </Providers>
  )
}

export default App
