'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { analysisAPI } from '../../services/api';
import { AnalysisResponse } from '../../types';
import Image from 'next/image';

export default function AnalysisResultPage() {
  const params = useParams();
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!params?.id) {
        setError('Invalid analysis ID');
        setLoading(false);
        return;
      }

      try {
        const data = await analysisAPI.getAnalysis(Number(params.id));
        setAnalysis(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load analysis results');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [params?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Analysis Results
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                {analysis.file_type.toUpperCase()} Analysis completed on{' '}
                {new Date(analysis.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mt-5 md:mt-0 md:col-span-2">
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                {/* Status */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Status</h4>
                  <div className="mt-2">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      analysis.status === 'completed' ? 'bg-green-100 text-green-800' :
                      analysis.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      analysis.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {analysis.status}
                    </span>
                  </div>
                </div>

                {/* Results */}
                {analysis.status === 'completed' && (
                  <>
                    {/* Confidence Score */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Confidence Score</h4>
                      <div className="mt-2">
                        <div className="relative pt-1">
                          <div className="overflow-hidden h-2 text-xs flex rounded bg-indigo-200">
                            <div
                              style={{ width: `${analysis.results.confidence * 100}%` }}
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                            ></div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {(analysis.results.confidence * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Findings */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Findings</h4>
                      <div className="mt-2">
                        <ul className="list-disc pl-5 space-y-1">
                          {analysis.results.findings.map((finding, index) => (
                            <li key={index} className="text-sm text-gray-600">
                              {finding}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Recommendations</h4>
                      <div className="mt-2">
                        <ul className="list-disc pl-5 space-y-1">
                          {analysis.results.recommendations.map((recommendation, index) => (
                            <li key={index} className="text-sm text-gray-600">
                              {recommendation}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Print Report
                  </button>
                  <button
                    type="button"
                    onClick={() => window.location.href = '/dashboard'}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 