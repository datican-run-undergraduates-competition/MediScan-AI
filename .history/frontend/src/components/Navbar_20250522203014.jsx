import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary-500">MediScan AI</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-primary-500">Home</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-primary-500">Dashboard</Link>
                <div className="relative group">
                  <button className="text-gray-700 hover:text-primary-500 flex items-center">
                    Upload
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                    <Link to="/xray" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">X-Ray Upload</Link>
                    <Link to="/mri" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">MRI Upload</Link>
                    <Link to="/ct" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">CT Scan Upload</Link>
                    <Link to="/report" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Report Upload</Link>
                  </div>
                </div>
                <button onClick={logout} className="text-gray-700 hover:text-primary-500">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary-500">Login</Link>
                <Link to="/register" className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md">Register</Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={toggleMenu} className="text-gray-700 focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4">
            <Link to="/" className="block py-2 text-gray-700 hover:text-primary-500">Home</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="block py-2 text-gray-700 hover:text-primary-500">Dashboard</Link>
                <Link to="/xray" className="block py-2 text-gray-700 hover:text-primary-500">X-Ray Upload</Link>
                <Link to="/mri" className="block py-2 text-gray-700 hover:text-primary-500">MRI Upload</Link>
                <Link to="/ct" className="block py-2 text-gray-700 hover:text-primary-500">CT Scan Upload</Link>
                <Link to="/report" className="block py-2 text-gray-700 hover:text-primary-500">Report Upload</Link>
                <button onClick={logout} className="block w-full text-left py-2 text-gray-700 hover:text-primary-500">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2 text-gray-700 hover:text-primary-500">Login</Link>
                <Link to="/register" className="block py-2 text-gray-700 hover:text-primary-500">Register</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar 
