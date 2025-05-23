import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Home = () => {
  const { user } = useAuth()

  return (
    <div>
      {/* Hero Section */}
      <section className="py-12 md:py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="text-primary-500">MediScan AI</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Early Disease Detection Through Multi-modal Medical Imaging Analysis
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            {user ? (
              <Link to="/dashboard" className="btn-primary text-center">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-primary text-center">
                  Get Started
                </Link>
                <Link to="/register" className="btn-secondary text-center">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card">
              <div className="text-primary-500 text-4xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Multi-modal Analysis</h3>
              <p className="text-gray-600">
                Integration of X-ray, MRI, and CT scan processing for comprehensive diagnostics.
              </p>
            </div>
            <div className="card">
              <div className="text-primary-500 text-4xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Report Text Analysis</h3>
              <p className="text-gray-600">
                Extraction of key clinical indicators from medical reports using advanced NLP.
              </p>
            </div>
            <div className="card">
              <div className="text-primary-500 text-4xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Early Detection Pipeline</h3>
              <p className="text-gray-600">
                Specialized models for stroke, tuberculosis, and cancer detection at early stages.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-6">About MediScan AI</h2>
              <p className="text-gray-600 mb-4">
                MediScan AI is an advanced medical diagnostic system that leverages artificial intelligence to analyze multiple imaging modalities (X-rays, MRIs, CT scans) alongside clinical reports for early disease detection.
              </p>
              <p className="text-gray-600 mb-4">
                The system focuses on conditions prevalent in Nigeria, addressing the critical shortage of radiologists through AI-powered diagnostic assistance.
              </p>
              <Link to="/register" className="btn-primary inline-block">
                Join Us Today
              </Link>
            </div>
            <div className="md:w-1/2">
              <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
                <p className="text-gray-500 italic">Medical Imaging Placeholder</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home 
