import React from "react"
import { Providers } from "@/app/providers"
import { AppRoutes } from "@/app/routes"
import { ErrorBoundary } from "@/shared/components/ErrorBoundary"

const App: React.FC = () => {
  return (
    // Lưới an toàn cuối cùng: bắt cả lỗi ngoài AppShell (login, home, chính AppShell).
    <ErrorBoundary scope="root">
      <Providers>
        <AppRoutes />
      </Providers>
    </ErrorBoundary>
  )
}

export default App
