import Layout from '@/layout'
import { createRootRoute, Outlet } from '@tanstack/react-router'

import { Toaster } from "@/components/ui/sonner"

export const Route = createRootRoute({
  component: () => (

    <Layout>

      <Outlet />
      <Toaster />

    </Layout>

  ),
})
