import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home | AI Medical System',
  description: 'Welcome to the AI Medical System',
}

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        Welcome to AI Medical System
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Add your dashboard components here */}
      </div>
    </div>
  )
} 