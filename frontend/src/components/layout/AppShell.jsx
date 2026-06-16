import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-[186px]">
        <Topbar />
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  )
}
