import React, { useState } from 'react';
import { composioService } from '../services/composioService';

interface ToolExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

const ToolExecutor: React.FC = () => {
  const [userId] = useState<string>('user123'); // In a real app, this would come from auth context
  const [actionName, setActionName] = useState<string>('GITHUB_STAR_A_REPOSITORY_FOR_THE_AUTHENTICATED_USER');
  const [params, setParams] = useState<string>('{"owner": "ComposioHQ", "repo": "composio"}');
  const [result, setResult] = useState<ToolExecutionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const executeTool = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Parse parameters
      const parsedParams: Record<string, unknown> = JSON.parse(params);
      
      // Execute the tool
      const toolResult = await composioService.executeTool(
        userId,
        actionName,
        parsedParams
      );
      
      setResult(toolResult);
    } catch (err) {
      console.error('Tool execution error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to execute tool');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Tool Executor</h2>
        
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action Name
            </label>
            <input
              type="text"
              value={actionName}
              onChange={(e) => setActionName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter action name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parameters (JSON)
            </label>
            <textarea
              value={params}
              onChange={(e) => setParams(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder='{"param1": "value1", "param2": "value2"}'
            />
          </div>
          
          <div>
            <button
              onClick={executeTool}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Executing...' : 'Execute Tool'}
            </button>
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          )}
          
          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="text-sm font-medium text-green-800">Result</h3>
              <pre className="mt-2 text-sm text-green-700 overflow-auto max-h-60">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolExecutor;