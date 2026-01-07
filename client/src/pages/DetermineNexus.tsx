import { useState } from 'react';
import { analyzeNexus, createTodo } from '../services/api';

interface Recommendation {
  state: string;
  action: string;
  priority: string;
  description: string;
}

function DetermineNexus() {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState('payroll');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);

      const response = await analyzeNexus(formData);
      setResults(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to analyze file');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToTodoList = async (recommendation: Recommendation) => {
    try {
      await createTodo({
        title: `${recommendation.action} - ${recommendation.state}`,
        description: recommendation.description,
        priority: recommendation.priority,
      });
      alert('Added to your to-do list!');
    } catch (error) {
      console.error('Error adding to todo list:', error);
      alert('Failed to add to todo list');
    }
  };

  const handleAddAllToTodoList = async () => {
    if (!results?.recommendations) return;

    try {
      for (const rec of results.recommendations) {
        await createTodo({
          title: `${rec.action} - ${rec.state}`,
          description: rec.description,
          priority: rec.priority,
        });
      }
      alert('All recommendations added to your to-do list!');
    } catch (error) {
      console.error('Error adding to todo list:', error);
      alert('Failed to add some items to todo list');
    }
  };

  return (
    <div className="container">
      <h2 style={{ marginBottom: '2rem' }}>Determine Nexus</h2>

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '1rem' }}>
          Upload Census or Payroll Data
        </h3>
        <p style={{ marginBottom: '1.5rem', color: '#7f8c8d' }}>
          Upload a CSV or Excel file containing employee location data to analyze your state
          compliance obligations.
        </p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleAnalyze}>
          <div className="form-group">
            <label htmlFor="fileType">Data Type</label>
            <select
              id="fileType"
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
            >
              <option value="payroll">Payroll Data</option>
              <option value="census">Census Data</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="file">File</label>
            <input
              type="file"
              id="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !file}
          >
            {loading ? 'Analyzing...' : 'Analyze Nexus'}
          </button>
        </form>
      </div>

      {results && (
        <>
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>
              Analysis Results
            </h3>
            <div className="grid grid-2">
              <div>
                <strong>File Type:</strong> {results.analysisResults.fileType}
              </div>
              <div>
                <strong>Records Analyzed:</strong> {results.analysisResults.totalRecords}
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>States Identified:</strong>{' '}
                {results.analysisResults.statesIdentified.join(', ') || 'None'}
              </div>
            </div>
          </div>

          {results.recommendations && results.recommendations.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Recommendations</h3>
                <button
                  className="btn btn-success"
                  onClick={handleAddAllToTodoList}
                >
                  Add All to To-Do List
                </button>
              </div>
              <div>
                {results.recommendations.map((rec: Recommendation, index: number) => (
                  <div
                    key={index}
                    style={{
                      padding: '1rem',
                      borderBottom: '1px solid #eee',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div>
                        <strong>{rec.state}</strong> -{' '}
                        <span className={`badge badge-${rec.priority.toLowerCase()}`}>
                          {rec.priority}
                        </span>
                      </div>
                      <div style={{ marginTop: '0.5rem' }}>
                        <strong>{rec.action}</strong>
                      </div>
                      <div style={{ marginTop: '0.25rem', color: '#7f8c8d' }}>
                        {rec.description}
                      </div>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleAddToTodoList(rec)}
                      style={{ marginLeft: '1rem' }}
                    >
                      Add to To-Do
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DetermineNexus;
