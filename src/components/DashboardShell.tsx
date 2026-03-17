'use client'

import { useState, useCallback } from 'react'
import Sidebar from './Sidebar'
import DashboardHeader from './DashboardHeader'
import ChatAssistant from './ChatAssistant'

interface DashboardShellProps {
  userEmail?: string
  children: React.ReactNode
}

export default function DashboardShell({ userEmail, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const handleOpenSidebar = useCallback(() => setSidebarOpen(true), [])
  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), [])
  const handleToggleCollapse = useCallback(() => setCollapsed(prev => !prev), [])

  return (
    <div className="h-dvh flex overflow-hidden bg-theme-page">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden print:hidden"
          onClick={handleCloseSidebar}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        collapsed={collapsed}
        onClose={handleCloseSidebar}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main area */}
      <div className="flex-1 min-w-0 flex flex-col h-full">
        <div className="print:hidden">
          <DashboardHeader userEmail={userEmail} onMenuToggle={handleOpenSidebar} />
        </div>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>

      <div className="print:hidden">
        <ChatAssistant />
      </div>
    </div>
  )
}
