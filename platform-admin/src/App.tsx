import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/context/AuthContext'
import { ClientsProvider } from '@/context/clients-provider'
import { NotificationsProvider } from '@/context/notifications-provider'
import { RequireSiteAdmin } from '@/components/RequireSiteAdmin'
import { AdminAppLayout } from '@/layouts/admin-app-layout'
import { DashboardPage } from '@/pages/DashboardPage'
import { ClientsPage } from '@/pages/ClientsPage'
import { NewClientPage } from '@/pages/NewClientPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { SignInPage } from '@/pages/SignInPage'
import { AuthCallbackPage } from '@/pages/AuthCallbackPage'

function ProtectedAdmin() {
  return (
    <RequireSiteAdmin>
      <ClientsProvider>
        <NotificationsProvider>
          <Outlet />
        </NotificationsProvider>
      </ClientsProvider>
    </RequireSiteAdmin>
  )
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route element={<ProtectedAdmin />}>
            <Route element={<AdminAppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="clients/new" element={<NewClientPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster richColors position="top-center" />
      </BrowserRouter>
    </AuthProvider>
  )
}
