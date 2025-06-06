import React, { useState } from 'react';
import { FaQuestionCircle, FaBook, FaVideo, FaHeadset, FaSearch } from 'react-icons/fa';

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('guides');

  const faqs = [
    {
      question: 'How do I upload medical images?',
      answer:
        'To upload medical images, navigate to the Upload page and either drag and drop your files or click the browse button to select files from your computer. Supported formats include DICOM, JPEG, and PNG.',
    },
    {
      question: 'What file formats are supported?',
      answer:
        'We support various medical image formats including DICOM, JPEG, PNG, and TIFF. For reports, we support PDF, DOC, and DOCX formats.',
    },
    {
      question: 'How long does analysis take?',
      answer:
        'Analysis time varies depending on the type and size of the files. Typically, X-ray images take 1-2 minutes, while MRI and CT scans may take 5-10 minutes. Reports are usually processed within 2-3 minutes.',
    },
    {
      question: 'Can I access my results offline?',
      answer:
        'Yes, you can download your analysis results for offline access. Go to the Results page and click the download button next to any analysis.',
    },
    {
      question: 'How secure is my data?',
      answer:
        'We take data security very seriously. All data is encrypted in transit and at rest. We comply with HIPAA regulations and maintain strict access controls.',
    },
  ];

  const guides = [
    {
      title: 'Getting Started',
      description: 'Learn the basics of using our medical AI system',
      icon: <FaBook className="text-blue-500 text-2xl" />,
      content: [
        'Create an account and log in',
        'Navigate the dashboard',
        'Upload your first medical image',
        'View and interpret results',
      ],
    },
    {
      title: 'Advanced Features',
      description: 'Master advanced features and workflows',
      icon: <FaBook className="text-green-500 text-2xl" />,
      content: [
        'Batch processing multiple files',
        'Customizing analysis parameters',
        'Exporting and sharing results',
        'Integrating with other systems',
      ],
    },
    {
      title: 'Best Practices',
      description: 'Tips for optimal results',
      icon: <FaBook className="text-purple-500 text-2xl" />,
      content: [
        'Image quality requirements',
        'File naming conventions',
        'Data organization',
        'Regular backups',
      ],
    },
  ];

  const tutorials = [
    {
      title: 'Uploading Medical Images',
      duration: '5 min',
      thumbnail: 'https://via.placeholder.com/300x200',
    },
    {
      title: 'Understanding Analysis Results',
      duration: '8 min',
      thumbnail: 'https://via.placeholder.com/300x200',
    },
    {
      title: 'Managing Your Account',
      duration: '4 min',
      thumbnail: 'https://via.placeholder.com/300x200',
    },
    {
      title: 'Advanced Features Walkthrough',
      duration: '12 min',
      thumbnail: 'https://via.placeholder.com/300x200',
    },
  ];

  const filteredFaqs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-800 mb-2">Help Center</h1>
        <p className="text-gray-600">
          Find answers to your questions and learn how to use our system
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('guides')}
              className={`${
                activeTab === 'guides'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <FaBook className="inline-block mr-2" />
              Guides
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              className={`${
                activeTab === 'faq'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <FaQuestionCircle className="inline-block mr-2" />
              FAQ
            </button>
            <button
              onClick={() => setActiveTab('tutorials')}
              className={`${
                activeTab === 'tutorials'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <FaVideo className="inline-block mr-2" />
              Video Tutorials
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`${
                activeTab === 'support'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <FaHeadset className="inline-block mr-2" />
              Support
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {/* Guides */}
        {activeTab === 'guides' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides.map((guide, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center space-x-4 mb-4">
                  {guide.icon}
                  <div>
                    <h3 className="text-lg font-semibold">{guide.title}</h3>
                    <p className="text-gray-600 text-sm">{guide.description}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {guide.content.map((item, i) => (
                    <li key={i} className="flex items-center text-gray-600">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* FAQ */}
        {activeTab === 'faq' && (
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        )}

        {/* Video Tutorials */}
        {activeTab === 'tutorials' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutorials.map((tutorial, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
              >
                <img
                  src={tutorial.thumbnail}
                  alt={tutorial.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{tutorial.title}</h3>
                  <p className="text-gray-600 text-sm">
                    Duration: {tutorial.duration}
                  </p>
                  <button className="mt-4 text-blue-500 hover:text-blue-600">
                    Watch Tutorial
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Support */}
        {activeTab === 'support' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Contact Support</h2>
            <div className="space-y-4">
              <p className="text-gray-600">
                Need help? Our support team is available 24/7 to assist you.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Email Support</h3>
                  <p className="text-gray-600">support@aimedsystem.com</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Response within 24 hours
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Live Chat</h3>
                  <p className="text-gray-600">Available 24/7</p>
                  <button className="mt-2 text-blue-500 hover:text-blue-600">
                    Start Chat
                  </button>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="font-medium mb-2">Emergency Support</h3>
                <p className="text-gray-600">
                  For urgent technical issues, call our emergency support line:
                </p>
                <p className="text-lg font-semibold text-blue-600 mt-2">
                  +1 (555) 123-4567
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Help; 