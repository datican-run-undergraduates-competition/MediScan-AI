import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaDownload, FaShare, FaFilter, FaSearch, FaChartBar } from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import { toast } from 'react-toastify';

const Results = () => {
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    dateRange: 'all',
  });
  const [selectedResult, setSelectedResult] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load results data
    loadResults();
  }, []);

  useEffect(() => {
    // Apply filters and search
    applyFilters();
  }, [results, filters, searchQuery]);

  const loadResults = async () => {
    try {
      // In a real app, this would be an API call
      // For now, we'll use mock data
      const mockResults = [
        {
          id: 1,
          type: 'xray',
          name: 'chest_xray_001.jpg',
          status: 'completed',
          timestamp: '2024-02-20T10:30:00Z',
          findings: [
            {
              type: 'abnormality',
              description: 'Pulmonary nodule detected in right upper lobe',
              confidence: 0.92,
              location: { x: 0.65, y: 0.45 },
            },
            {
              type: 'normal',
              description: 'No significant cardiomegaly',
              confidence: 0.95,
            },
          ],
          recommendations: [
            'Follow-up CT scan recommended',
            'Consider biopsy for further evaluation',
          ],
        },
        {
          id: 2,
          type: 'mri',
          name: 'brain_mri_002.dicom',
          status: 'completed',
          timestamp: '2024-02-20T09:15:00Z',
          findings: [
            {
              type: 'abnormality',
              description: 'Small enhancing lesion in left temporal lobe',
              confidence: 0.88,
              location: { x: 0.35, y: 0.55 },
            },
          ],
          recommendations: [
            'Follow-up MRI in 3 months recommended',
            'Consider contrast-enhanced imaging',
          ],
        },
        {
          id: 3,
          type: 'ct',
          name: 'abdomen_ct_003.dicom',
          status: 'processing',
          timestamp: '2024-02-20T08:45:00Z',
        },
        {
          id: 4,
          type: 'report',
          name: 'patient_report_004.pdf',
          status: 'failed',
          timestamp: '2024-02-20T08:30:00Z',
          error: 'Failed to process document',
        },
      ];

      setResults(mockResults);
      setFilteredResults(mockResults);
      setLoading(false);
    } catch (error) {
      console.error('Error loading results:', error);
      toast.error('Failed to load results');
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...results];

    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter((result) => result.type === filters.type);
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter((result) => result.status === filters.status);
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const ranges = {
        today: 1,
        week: 7,
        month: 30,
      };
      const days = ranges[filters.dateRange];
      const cutoff = new Date(now.setDate(now.getDate() - days));

      filtered = filtered.filter(
        (result) => new Date(result.timestamp) >= cutoff
      );
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (result) =>
          result.name.toLowerCase().includes(query) ||
          (result.findings &&
            result.findings.some((finding) =>
              finding.description.toLowerCase().includes(query)
            ))
      );
    }

    setFilteredResults(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleDownload = async (result) => {
    try {
      // In a real app, this would be an API call to download the result
      toast.success(`Downloading ${result.name}...`);
    } catch (error) {
      console.error('Error downloading result:', error);
      toast.error('Failed to download result');
    }
  };

  const handleShare = async (result) => {
    try {
      // In a real app, this would open a share dialog
      toast.success(`Sharing ${result.name}...`);
    } catch (error) {
      console.error('Error sharing result:', error);
      toast.error('Failed to share result');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'processing':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'xray':
      case 'mri':
      case 'ct':
        return <FaChartBar className="text-blue-500" />;
      case 'report':
        return <FaFileAlt className="text-green-500" />;
      default:
        return <FaFileAlt className="text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-800 mb-2">Analysis Results</h1>
        <p className="text-gray-600">
          View and manage your medical image and report analysis results
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search results..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg flex items-center space-x-2 hover:bg-gray-50"
        >
          <FaFilter />
          <span>Filters</span>
        </button>
      </div>

      {/* Filter Panel */}
      {isFilterOpen && (
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="xray">X-Ray</option>
                <option value="mri">MRI</option>
                <option value="ct">CT</option>
                <option value="report">Report</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Results List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Results</h2>
            </div>
            <div className="divide-y">
              {loading ? (
                <div className="p-4 text-center">Loading...</div>
              ) : filteredResults.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No results found
                </div>
              ) : (
                filteredResults.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => setSelectedResult(result)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedResult?.id === result.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(result.type)}
                        <div>
                          <p className="font-medium">{result.name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(result.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-medium ${getStatusColor(
                          result.status
                        )}`}
                      >
                        {result.status.charAt(0).toUpperCase() +
                          result.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Result Details */}
        <div className="lg:col-span-2">
          {selectedResult ? (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedResult.name}</h2>
                    <p className="text-gray-500">
                      {new Date(selectedResult.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDownload(selectedResult)}
                      className="p-2 text-gray-500 hover:text-blue-500"
                    >
                      <FaDownload />
                    </button>
                    <button
                      onClick={() => handleShare(selectedResult)}
                      className="p-2 text-gray-500 hover:text-blue-500"
                    >
                      <FaShare />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {selectedResult.status === 'completed' ? (
                  <>
                    {/* Findings */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Findings</h3>
                      <div className="space-y-4">
                        {selectedResult.findings.map((finding, index) => (
                          <div
                            key={index}
                            className="p-4 border rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`px-2 py-1 rounded text-sm font-medium ${
                                  finding.type === 'abnormality'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {finding.type.charAt(0).toUpperCase() +
                                  finding.type.slice(1)}
                              </span>
                              <span className="text-sm text-gray-500">
                                Confidence: {(finding.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                            <p className="text-gray-700">{finding.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">
                        Recommendations
                      </h3>
                      <ul className="list-disc list-inside space-y-2">
                        {selectedResult.recommendations.map(
                          (recommendation, index) => (
                            <li
                              key={index}
                              className="text-gray-700"
                            >
                              {recommendation}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </>
                ) : selectedResult.status === 'processing' ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Processing analysis...</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-red-500 mb-2">Analysis Failed</p>
                    <p className="text-gray-600">{selectedResult.error}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500">
                Select a result to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Results; 