import type { Metadata } from 'next'
import '../globals.css'
import Navbar from '@/components/Navbar'
import { AuthProvider } from '@/context/AuthContext'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'HealthPlan Assistance',
  description: 'Your personal health assistant',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AuthProvider>
            <Navbar />
            <main className="min-h-screen bg-gray-50">
              {children}
            </main>
            <footer className="bg-white py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-center text-gray-500">
                  © {new Date().getFullYear()} HealthPlan Assistance. All rights reserved.
                </p>
              </div>
            </footer>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
} 