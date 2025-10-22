import { ReactNode } from 'react'
import Navbar from './Navbar.tsx'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Navbar />
      <main>
        {children}
      </main>
    </div>
  )
}

export default Layout
