import { useState, useEffect } from 'react';
import { getTodos, updateTodo, deleteTodo, getExpiringSubmissions, createSubmission, getResources, getAccountTypes } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface ComplianceAccountType {
  id: string;
  name: string;
  state: string;
  stateAgency: string;
  description?: string;
  requiredFields?: string;
  defaultDuration?: string;
  isActive: boolean;
}

interface Todo {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate: string | null;
  relatedSubmission?: {
    id: string;
    complianceType: string;
    state: string;
    stateAgency: string;
    complianceAccountTypeId?: string;
    complianceAccountType?: ComplianceAccountType;
  };
}

interface Submission {
  id: string;
  complianceType: string;
  state: string;
  expirationDate: string;
}

interface ComplianceFormData {
  complianceType: string;
  state: string;
  stateAgency: string;
  complianceAccountTypeId?: string;
  entityName: string;
  registrationNumber: string;
  filingDate: string;
  expirationDate: string;
  duration: string;
  status: string;
  filingStorageLink: string;
  compliancePageLink: string;
  passwordManagerLink: string;
  notes: string;
}

const emptyCompliance: ComplianceFormData = {
  complianceType: '',
  state: '',
  stateAgency: '',
  complianceAccountTypeId: '',
  entityName: '',
  registrationNumber: '',
  filingDate: '',
  expirationDate: '',
  duration: '',
  status: 'ACTIVE',
  filingStorageLink: '',
  compliancePageLink: '',
  passwordManagerLink: '',
  notes: '',
};

function Home() {
  const navigate = useNavigate();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [expiringSubmissions, setExpiringSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [complianceForm, setComplianceForm] = useState<ComplianceFormData>(emptyCompliance);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [relatedResource, setRelatedResource] = useState<any>(null);
  const [accountTypes, setAccountTypes] = useState<ComplianceAccountType[]>([]);
  const [filteredAccountTypes, setFilteredAccountTypes] = useState<ComplianceAccountType[]>([]);

  useEffect(() => {
    fetchData();
    fetchAccountTypes();
  }, []);

  useEffect(() => {
    // Filter account types when state changes in the form
    if (complianceForm.state) {
      const filtered = accountTypes.filter(
        (type) => type.state.toUpperCase() === complianceForm.state.toUpperCase()
      );
      setFilteredAccountTypes(filtered);
    } else {
      setFilteredAccountTypes([]);
    }
  }, [complianceForm.state, accountTypes]);

  const fetchData = async () => {
    try {
      const [todosRes, expiringRes] = await Promise.all([
        getTodos(),
        getExpiringSubmissions(),
      ]);
      setTodos(todosRes.data);
      setExpiringSubmissions(expiringRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountTypes = async () => {
    try {
      const response = await getAccountTypes();
      setAccountTypes(response.data);
    } catch (error) {
      console.error('Error fetching account types:', error);
    }
  };

  const handleToggleTodo = async (todo: Todo) => {
    try {
      const newStatus = todo.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      await updateTodo(todo.id, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      try {
        await deleteTodo(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting todo:', error);
      }
    }
  };

  const handleOpenComplianceModal = async (todo: Todo) => {
    setSelectedTodo(todo);
    
    // Pre-populate form from related submission if available
    const formData = { ...emptyCompliance };
    
    if (todo.relatedSubmission) {
      formData.complianceType = todo.relatedSubmission.complianceType;
      formData.state = todo.relatedSubmission.state;
      formData.stateAgency = todo.relatedSubmission.stateAgency;
      formData.complianceAccountTypeId = todo.relatedSubmission.complianceAccountTypeId || '';
      
      // Try to fetch related resource for additional guidance
      try {
        const resourcesRes = await getResources({
          state: todo.relatedSubmission.state,
          complianceType: todo.relatedSubmission.complianceType,
        });
        if (resourcesRes.data && resourcesRes.data.length > 0) {
          setRelatedResource(resourcesRes.data[0]);
        }
      } catch (error) {
        console.error('Error fetching related resource:', error);
      }
    } else {
      // Try to extract state from title if no related submission
      // Pattern: "Action - STATE" or "Action STATE" or just STATE codes
      const statePattern = /\b([A-Z]{2})\b(?!\w)/g;
      const stateMatches = todo.title.match(statePattern);
      
      if (stateMatches && stateMatches.length > 0) {
        // Use the last 2-letter match as the state (most likely to be the state code)
        const extractedState = stateMatches[stateMatches.length - 1];
        formData.state = extractedState;
        
        // Try to fetch resource for this state
        try {
          const resourcesRes = await getResources({ state: extractedState });
          if (resourcesRes.data && resourcesRes.data.length > 0) {
            setRelatedResource(resourcesRes.data[0]);
          }
        } catch (error) {
          console.error('Error fetching related resource:', error);
        }
      }
    }
    
    setComplianceForm(formData);
    setShowComplianceModal(true);
  };

  const handleCloseComplianceModal = () => {
    setShowComplianceModal(false);
    setComplianceForm(emptyCompliance);
    setSelectedTodo(null);
    setRelatedResource(null);
  };

  const handleComplianceChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'complianceAccountTypeId' && value) {
      // Auto-populate fields based on selected account type
      const selectedType = accountTypes.find(t => t.id === value);
      if (selectedType) {
        setComplianceForm({ 
          ...complianceForm, 
          [name]: value,
          complianceType: selectedType.name,
          stateAgency: selectedType.stateAgency,
          state: selectedType.state,
          duration: selectedType.defaultDuration || '',
        });
        return;
      }
    }
    
    if (name === 'complianceAccountTypeId' && !value) {
      // Clear related fields when account type is deselected
      setComplianceForm({
        ...complianceForm,
        complianceAccountTypeId: '',
        complianceType: '',
        stateAgency: '',
        duration: '',
      });
      return;
    }
    
    setComplianceForm({ ...complianceForm, [name]: value });
  };

  // Helper function to check if a field should be shown based on account type
  const shouldShowField = (fieldName: string): boolean => {
    if (!complianceForm.complianceAccountTypeId) {
      // If no account type selected, show all fields
      return true;
    }
    
    const selectedType = accountTypes.find(t => t.id === complianceForm.complianceAccountTypeId);
    if (!selectedType || !selectedType.requiredFields) {
      return true;
    }
    
    try {
      const requiredFields = JSON.parse(selectedType.requiredFields);
      // Always show certain fields
      const alwaysShow = ['state', 'complianceAccountTypeId', 'complianceType', 'stateAgency', 'status'];
      if (alwaysShow.includes(fieldName)) {
        return true;
      }
      // Show field if it's in required fields
      return requiredFields.includes(fieldName);
    } catch (e) {
      return true;
    }
  };

  const handleCreateCompliance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSubmission(complianceForm);
      handleCloseComplianceModal();
      fetchData();
      alert('Compliance submission created successfully!');
    } catch (error) {
      console.error('Error creating compliance:', error);
      alert('Failed to create compliance submission');
    }
  };

  const getPriorityBadge = (priority: string) => {
    const classes: { [key: string]: string } = {
      HIGH: 'badge-high',
      URGENT: 'badge-high',
      MEDIUM: 'badge-medium',
      LOW: 'badge-low',
    };
    return `badge ${classes[priority] || 'badge-medium'}`;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <h2 style={{ marginBottom: '2rem' }}>Dashboard</h2>

      {/* Alerts Section */}
      {expiringSubmissions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">⚠️ Attention Required</h3>
          </div>
          <div>
            {expiringSubmissions.map((submission) => (
              <div key={submission.id} className="alert alert-warning">
                <strong>{submission.complianceType}</strong> - {submission.state}
                <br />
                Expires: {new Date(submission.expirationDate).toLocaleDateString()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '1rem' }}>
          Quick Actions
        </h3>
        <div className="grid grid-3">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/nexus')}
          >
            📊 Determine Nexus
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/compliance')}
          >
            📋 Manage Submissions
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/resources')}
          >
            📚 View Resources
          </button>
        </div>
      </div>

      {/* Todo List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📝 Your To-Do List</h3>
        </div>
        {todos.length === 0 ? (
          <p style={{ color: '#7f8c8d' }}>No pending tasks. Great job!</p>
        ) : (
          <div>
            {todos.map((todo) => (
              <div
                key={todo.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1rem',
                  borderBottom: '1px solid #eee',
                  textDecoration: todo.status === 'COMPLETED' ? 'line-through' : 'none',
                  opacity: todo.status === 'COMPLETED' ? 0.6 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={todo.status === 'COMPLETED'}
                  onChange={() => handleToggleTodo(todo)}
                  style={{ marginRight: '1rem', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div>
                    <strong>{todo.title}</strong>
                    <span className={getPriorityBadge(todo.priority)} style={{ marginLeft: '0.5rem' }}>
                      {todo.priority}
                    </span>
                  </div>
                  {todo.description && (
                    <div style={{ fontSize: '0.875rem', color: '#7f8c8d', marginTop: '0.25rem' }}>
                      {todo.description}
                    </div>
                  )}
                  {todo.dueDate && (
                    <div style={{ fontSize: '0.875rem', color: '#7f8c8d', marginTop: '0.25rem' }}>
                      Due: {new Date(todo.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-success"
                    onClick={() => handleOpenComplianceModal(todo)}
                    style={{ padding: '0.5rem 1rem' }}
                    title="Create compliance submission for this task"
                  >
                    📋 Create
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeleteTodo(todo.id)}
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Compliance Modal */}
      {showComplianceModal && (
        <div className="modal-overlay" onClick={handleCloseComplianceModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                Create Compliance Submission
                {selectedTodo && <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: '#7f8c8d' }}> for: {selectedTodo.title}</span>}
              </h2>
              <button className="modal-close" onClick={handleCloseComplianceModal}>
                ×
              </button>
            </div>

            {relatedResource && (
              <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                <strong>📚 Related Resource:</strong> {relatedResource.title}
                <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  {relatedResource.description.substring(0, 200)}...
                  {relatedResource.portalLink && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <a href={relatedResource.portalLink} target="_blank" rel="noopener noreferrer" style={{ color: '#3498db' }}>
                        View Portal →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleCreateCompliance}>
              <div className="grid grid-2">
                {/* Step 1: Select State */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '1.1em', fontWeight: '600' }}>
                    Step 1: Select State <span style={{ color: '#e74c3c' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={complianceForm.state}
                    onChange={handleComplianceChange}
                    required
                    placeholder="Enter 2-letter state code (e.g., CA, NY, TX)"
                    maxLength={2}
                    style={{ textTransform: 'uppercase', fontSize: '1.1em' }}
                  />
                  {complianceForm.state && selectedTodo && !selectedTodo.relatedSubmission && (
                    <small style={{ color: '#27ae60', marginTop: '0.25rem', display: 'block' }}>
                      ✓ Detected from to-do: "{selectedTodo.title}"
                    </small>
                  )}
                  {selectedTodo?.relatedSubmission?.state && (
                    <small style={{ color: '#27ae60', marginTop: '0.25rem', display: 'block' }}>
                      ✓ Auto-filled from to-do item's related submission
                    </small>
                  )}
                  {!complianceForm.state && !selectedTodo?.relatedSubmission && (
                    <small style={{ color: '#7f8c8d', marginTop: '0.25rem', display: 'block' }}>
                      Enter state code to see available compliance account types
                    </small>
                  )}
                </div>

                {/* Step 2: Select Compliance Account Type */}
                {complianceForm.state && (
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '1.1em', fontWeight: '600' }}>
                      Step 2: Select Compliance Account Type <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <select
                      name="complianceAccountTypeId"
                      value={complianceForm.complianceAccountTypeId || ''}
                      onChange={handleComplianceChange}
                      required={filteredAccountTypes.length > 0}
                      style={{ fontSize: '1.1em' }}
                    >
                      <option value="">-- Select a Compliance Account Type --</option>
                      {filteredAccountTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name} ({type.stateAgency})
                        </option>
                      ))}
                    </select>
                    {selectedTodo?.relatedSubmission?.complianceAccountTypeId && (
                      <small style={{ color: '#27ae60', marginTop: '0.25rem', display: 'block' }}>
                        ✓ Auto-filled from to-do item's related submission
                      </small>
                    )}
                    {filteredAccountTypes.length === 0 ? (
                      <small style={{ color: '#e67e22', marginTop: '0.25rem', display: 'block' }}>
                        ⚠️ No compliance account types found for {complianceForm.state}. Please select a different state or contact admin to add types.
                      </small>
                    ) : complianceForm.complianceAccountTypeId ? (
                      <small style={{ color: '#27ae60', marginTop: '0.25rem', display: 'block' }}>
                        ✓ Form fields below are customized for this account type
                      </small>
                    ) : (
                      <small style={{ color: '#7f8c8d', marginTop: '0.25rem', display: 'block' }}>
                        {filteredAccountTypes.length} account type{filteredAccountTypes.length !== 1 ? 's' : ''} available for {complianceForm.state}
                      </small>
                    )}
                  </div>
                )}

                {/* Show remaining fields only after account type is selected */}
                {complianceForm.complianceAccountTypeId && (
                  <>
                    <div className="form-group">
                      <label>Compliance Type (Auto-filled)</label>
                      <input
                        type="text"
                        name="complianceType"
                        value={complianceForm.complianceType}
                        onChange={handleComplianceChange}
                        required
                        readOnly
                        style={{ backgroundColor: '#ecf0f1' }}
                      />
                    </div>

                    <div className="form-group">
                      <label>State Agency (Auto-filled)</label>
                      <input
                        type="text"
                        name="stateAgency"
                        value={complianceForm.stateAgency}
                        onChange={handleComplianceChange}
                        required
                        readOnly
                        style={{ backgroundColor: '#ecf0f1' }}
                      />
                    </div>

                    {shouldShowField('entityName') && (
                      <div className="form-group">
                        <label>Entity Name</label>
                        <input
                          type="text"
                          name="entityName"
                          value={complianceForm.entityName}
                          onChange={handleComplianceChange}
                          placeholder="Company name"
                        />
                      </div>
                    )}

                    {shouldShowField('registrationNumber') && (
                      <div className="form-group">
                        <label>Registration Number</label>
                        <input
                          type="text"
                          name="registrationNumber"
                          value={complianceForm.registrationNumber}
                          onChange={handleComplianceChange}
                          placeholder="Account or registration number"
                        />
                      </div>
                    )}

                    <div className="form-group">
                      <label>Status</label>
                      <select name="status" value={complianceForm.status} onChange={handleComplianceChange}>
                        <option value="ACTIVE">Active</option>
                        <option value="EXPIRED">Expired</option>
                        <option value="PENDING">Pending</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Duration / Frequency (Months)</label>
                      <input
                        type="text"
                        name="duration"
                        value={complianceForm.duration}
                        onChange={handleComplianceChange}
                        placeholder="e.g., 12, 3, 1"
                      />
                      {complianceForm.complianceAccountTypeId && (
                        <small style={{ color: '#7f8c8d', marginTop: '0.25rem', display: 'block' }}>
                          Auto-populated from account type
                        </small>
                      )}
                    </div>

                    {shouldShowField('filingDate') && (
                      <div className="form-group">
                        <label>Filing Date</label>
                        <input
                          type="date"
                          name="filingDate"
                          value={complianceForm.filingDate}
                          onChange={handleComplianceChange}
                        />
                      </div>
                    )}

                    {shouldShowField('expirationDate') && (
                      <div className="form-group">
                        <label>Expiration Date</label>
                        <input
                          type="date"
                          name="expirationDate"
                          value={complianceForm.expirationDate}
                          onChange={handleComplianceChange}
                        />
                      </div>
                    )}

                    {shouldShowField('filingStorageLink') && (
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label>Filing Storage Link</label>
                        <input
                          type="url"
                          name="filingStorageLink"
                          value={complianceForm.filingStorageLink}
                          onChange={handleComplianceChange}
                          placeholder="Link to Sharepoint, Google Drive, etc."
                        />
                      </div>
                    )}

                    {shouldShowField('compliancePageLink') && (
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label>Compliance Portal Link</label>
                        <input
                          type="url"
                          name="compliancePageLink"
                          value={complianceForm.compliancePageLink}
                          onChange={handleComplianceChange}
                          placeholder="Link to state compliance portal"
                        />
                      </div>
                    )}

                    {shouldShowField('passwordManagerLink') && (
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label>Password Manager Link</label>
                        <input
                          type="url"
                          name="passwordManagerLink"
                          value={complianceForm.passwordManagerLink}
                          onChange={handleComplianceChange}
                          placeholder="Link to password manager entry"
                        />
                      </div>
                    )}

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Notes</label>
                      <textarea
                        name="notes"
                        value={complianceForm.notes}
                        onChange={handleComplianceChange}
                        placeholder="Additional notes..."
                        rows={3}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseComplianceModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Compliance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
