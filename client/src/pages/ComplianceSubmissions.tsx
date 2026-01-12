import { useState, useEffect } from 'react';
import {
  getSubmissions,
  createSubmission,
  updateSubmission,
  deleteSubmission,
  getAccountTypes,
  getResources,
  getScopes,
} from '../services/api';

interface ComplianceScope {
  id: string;
  code: string;
  name: string;
  scopeType: string;
  isActive: boolean;
}

interface ComplianceAccountType {
  id: string;
  name: string;
  scopeId: string;
  scope: ComplianceScope;
  agency: string;
  description?: string;
  requiredFields?: string;
  defaultDuration?: string;
  isActive: boolean;
}

interface Submission {
  id?: string;
  complianceType: string;
  state: string;
  stateAgency: string;
  complianceAccountTypeId?: string;
  complianceAccountType?: ComplianceAccountType;
  entityName: string;
  registrationNumber: string;
  submittedOn: string;
  filingDate: string;
  expirationDate: string;
  duration: string;
  status: string;
  filingStorageLink: string;
  compliancePageLink: string;
  passwordManagerLink: string;
  notes: string;
}

const emptySubmission: Submission = {
  complianceType: '',
  state: '',
  stateAgency: '',
  complianceAccountTypeId: '',
  entityName: '',
  registrationNumber: '',
  submittedOn: new Date().toISOString().split('T')[0],
  filingDate: new Date().toISOString().split('T')[0],
  expirationDate: '',
  duration: '',
  status: 'ACTIVE',
  filingStorageLink: '',
  compliancePageLink: '',
  passwordManagerLink: '',
  notes: '',
};

function ComplianceSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);
  const [formData, setFormData] = useState<Submission>(emptySubmission);
  const [accountTypes, setAccountTypes] = useState<ComplianceAccountType[]>([]);
  const [filteredAccountTypes, setFilteredAccountTypes] = useState<ComplianceAccountType[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<string>('');
  const [availableAgencies, setAvailableAgencies] = useState<string[]>([]);
  const [relatedResource, setRelatedResource] = useState<any>(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [scopes, setScopes] = useState<ComplianceScope[]>([]);
  const [showScopeGuide, setShowScopeGuide] = useState(false);
  
  // Sorting and filtering state
  const [sortField, setSortField] = useState<string>('expirationDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterState, setFilterState] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('hideObsolete'); // Default to hiding obsolete
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    fetchSubmissions();
    fetchAccountTypes();
    fetchScopes();
  }, []);

  useEffect(() => {
    // Filter account types when state or agency changes
    if (formData.state) {
      let filtered = accountTypes.filter(
        (type) => type.scope.code.toUpperCase() === formData.state.toUpperCase()
      );
      
      // Further filter by agency if one is selected
      if (selectedAgency) {
        filtered = filtered.filter((type) => type.agency === selectedAgency);
      }
      
      setFilteredAccountTypes(filtered);
      
      // Extract unique agencies for this state
      const agencies = Array.from(
        new Set(
          accountTypes
            .filter((type) => type.scope.code.toUpperCase() === formData.state.toUpperCase())
            .map((type) => type.agency)
        )
      ).sort();
      setAvailableAgencies(agencies);
      
      // Auto-populate agency if account type is selected
      if (formData.complianceAccountTypeId) {
        const selectedType = accountTypes.find(t => t.id === formData.complianceAccountTypeId);
        if (selectedType && selectedType.scope.code.toUpperCase() === formData.state.toUpperCase()) {
          setFormData(prev => ({ ...prev, stateAgency: selectedType.agency }));
          setSelectedAgency(selectedType.agency);
        } else {
          // Clear account type if it doesn't match the state
          setFormData(prev => ({ ...prev, complianceAccountTypeId: '', stateAgency: '' }));
          setSelectedAgency('');
        }
      }
    } else {
      setFilteredAccountTypes([]);
      setAvailableAgencies([]);
      setSelectedAgency('');
    }
  }, [formData.state, selectedAgency, accountTypes]);

  useEffect(() => {
    // Fetch related resource when state and compliance type are selected
    const fetchRelatedResource = async () => {
      if (formData.state && formData.complianceType) {
        try {
          console.log('Fetching resource for:', { state: formData.state, complianceType: formData.complianceType });
          const resourcesRes = await getResources({
            state: formData.state.toUpperCase(),
            complianceType: formData.complianceType,
          });
          console.log('Resources found:', resourcesRes.data);
          if (resourcesRes.data && resourcesRes.data.length > 0) {
            setRelatedResource(resourcesRes.data[0]);
          } else {
            setRelatedResource(null);
          }
        } catch (error) {
          console.error('Error fetching related resource:', error);
          setRelatedResource(null);
        }
      } else {
        setRelatedResource(null);
      }
    };

    fetchRelatedResource();
  }, [formData.state, formData.complianceType]);

  const fetchSubmissions = async () => {
    try {
      const response = await getSubmissions();
      setSubmissions(response.data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
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

  const fetchScopes = async () => {
    try {
      const response = await getScopes();
      setScopes(response.data);
    } catch (error) {
      console.error('Error fetching scopes:', error);
    }
  };

  const handleOpenModal = (submission?: Submission) => {
    if (submission) {
      setEditingSubmission(submission);
      // Format dates for HTML date inputs (YYYY-MM-DD)
      const formattedSubmission = {
        ...submission,
        // If no complianceAccountTypeId, treat as 'OTHER'
        complianceAccountTypeId: submission.complianceAccountTypeId || 'OTHER',
        submittedOn: submission.submittedOn ? new Date(submission.submittedOn).toISOString().split('T')[0] : '',
        filingDate: submission.filingDate ? new Date(submission.filingDate).toISOString().split('T')[0] : '',
        expirationDate: submission.expirationDate ? new Date(submission.expirationDate).toISOString().split('T')[0] : '',
      };
      setFormData(formattedSubmission);
      setSelectedAgency(submission.stateAgency || '');
    } else {
      setEditingSubmission(null);
      setFormData(emptySubmission);
      setSelectedAgency('');
    }
    setShowModal(true);
  };

  const handleCloseModal = (skipConfirmation = false) => {
    if (!skipConfirmation) {
      const confirmed = window.confirm('Are you sure you want to close this form? Any unsaved changes will be lost.');
      if (!confirmed) {
        return;
      }
    }
    setShowModal(false);
    setEditingSubmission(null);
    setFormData(emptySubmission);
    setRelatedResource(null);
    setSelectedAgency('');
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'complianceAccountTypeId' && value) {
      // Handle "Other" selection
      if (value === 'OTHER') {
        setFormData({ 
          ...formData, 
          [name]: value,
          complianceType: '',
          stateAgency: '',
          duration: '',
        });
        return;
      }
      
      // Auto-populate fields based on selected account type
      const selectedType = accountTypes.find(t => t.id === value);
      if (selectedType) {
        setFormData({ 
          ...formData, 
          [name]: value,
          complianceType: selectedType.name,
          stateAgency: selectedType.agency,
          state: selectedType.scope.code,
          duration: selectedType.defaultDuration || '',
        });
        setSelectedAgency(selectedType.agency);
        return;
      }
    }
    
    if (name === 'complianceAccountTypeId' && !value) {
      // Clear related fields when account type is deselected
      setFormData({
        ...formData,
        complianceAccountTypeId: '',
        complianceType: '',
        stateAgency: '',
        duration: '',
      });
      return;
    }
    
    setFormData({ ...formData, [name]: value });
  };

  // Helper function to check if a field should be shown based on account type
  const shouldShowField = (fieldName: string): boolean => {
    if (!formData.complianceAccountTypeId) {
      // If no account type selected, show all fields
      return true;
    }
    
    // If "Other" is selected, show all fields
    if (formData.complianceAccountTypeId === 'OTHER') {
      return true;
    }
    
    const selectedType = accountTypes.find(t => t.id === formData.complianceAccountTypeId);
    if (!selectedType || !selectedType.requiredFields) {
      return true;
    }
    
    try {
      const requiredFields = JSON.parse(selectedType.requiredFields);
      // Always show certain fields
      const alwaysShow = ['state', 'complianceAccountTypeId', 'complianceType', 'stateAgency', 'status', 'filingStorageLink', 'filingDate'];
      if (alwaysShow.includes(fieldName)) {
        return true;
      }
      // Show field if it's in required fields
      return requiredFields.includes(fieldName);
    } catch (e) {
      return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Calculate expiration date if not provided
      const submissionData = { ...formData };
      
      if (!submissionData.expirationDate && submissionData.filingDate && submissionData.duration) {
        const filingDateObj = new Date(submissionData.filingDate);
        const durationMonths = parseInt(submissionData.duration);
        
        if (!isNaN(durationMonths)) {
          const expirationDate = new Date(filingDateObj);
          expirationDate.setMonth(expirationDate.getMonth() + durationMonths);
          submissionData.expirationDate = expirationDate.toISOString().split('T')[0];
        }
      }
      
      // Remove nested relation objects that shouldn't be sent to the API
      const cleanData = {
        complianceType: submissionData.complianceType,
        state: submissionData.state,
        stateAgency: submissionData.stateAgency,
        complianceAccountTypeId: submissionData.complianceAccountTypeId === 'OTHER' ? null : submissionData.complianceAccountTypeId || null,
        entityName: submissionData.entityName,
        registrationNumber: submissionData.registrationNumber,
        submittedOn: submissionData.submittedOn,
        filingDate: submissionData.filingDate,
        expirationDate: submissionData.expirationDate,
        duration: submissionData.duration,
        status: submissionData.status,
        filingStorageLink: submissionData.filingStorageLink,
        compliancePageLink: submissionData.compliancePageLink,
        passwordManagerLink: submissionData.passwordManagerLink,
        notes: submissionData.notes,
      };
      
      if (editingSubmission) {
        await updateSubmission(editingSubmission.id!, cleanData);
      } else {
        await createSubmission(cleanData);
      }
      handleCloseModal(true);
      fetchSubmissions();
    } catch (error) {
      console.error('Error saving submission:', error);
      alert('Failed to save submission');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      try {
        await deleteSubmission(id);
        fetchSubmissions();
      } catch (error) {
        console.error('Error deleting submission:', error);
        alert('Failed to delete submission');
      }
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getFilteredAndSortedSubmissions = () => {
    let filtered = [...submissions];

    // Apply status filter
    if (filterStatus === 'hideObsolete') {
      filtered = filtered.filter(s => s.status !== 'OBSOLETE');
    } else if (filterStatus && filterStatus !== 'all') {
      filtered = filtered.filter(s => s.status === filterStatus);
    }

    // Apply state filter
    if (filterState) {
      filtered = filtered.filter(s => 
        s.state.toUpperCase().includes(filterState.toUpperCase())
      );
    }

    // Apply type filter
    if (filterType) {
      filtered = filtered.filter(s => 
        s.complianceType.toLowerCase().includes(filterType.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof Submission];
      let bValue: any = b[sortField as keyof Submission];

      // Handle nested account type
      if (sortField === 'accountType') {
        aValue = a.complianceAccountType?.name || '';
        bValue = b.complianceAccountType?.name || '';
      }

      // Handle dates
      if (sortField === 'expirationDate' || sortField === 'filingDate') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      // Handle null/undefined
      if (!aValue) aValue = '';
      if (!bValue) bValue = '';

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return ' ↕️';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Compliance Submissions</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Add Submission
        </button>
      </div>

      {submissions.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
            No compliance submissions yet. Click "Add Submission" to get started.
          </p>
        </div>
      ) : (
        <div className="card">
          {/* Filter Controls */}
          <div style={{ padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: '500' }}>State</label>
              <input
                type="text"
                placeholder="Filter by state..."
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: '500' }}>Type</label>
              <input
                type="text"
                placeholder="Filter by type..."
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: '500' }}>Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="hideObsolete">Active (Hide Obsolete)</option>
                <option value="all">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="EXPIRED">Expired Only</option>
                <option value="PENDING">Pending Only</option>
                <option value="OBSOLETE">Obsolete Only</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={() => {
                  setFilterState('');
                  setFilterType('');
                  setFilterStatus('hideObsolete');
                }}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem' }}
              >
                Clear Filters
              </button>
            </div>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th onClick={() => handleSort('complianceType')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Type{getSortIcon('complianceType')}
                </th>
                <th onClick={() => handleSort('accountType')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Account Type{getSortIcon('accountType')}
                </th>
                <th onClick={() => handleSort('state')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  State{getSortIcon('state')}
                </th>
                <th onClick={() => handleSort('stateAgency')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Agency{getSortIcon('stateAgency')}
                </th>
                <th onClick={() => handleSort('entityName')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Entity{getSortIcon('entityName')}
                </th>
                <th>Registration #</th>
                <th onClick={() => handleSort('expirationDate')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Expiration{getSortIcon('expirationDate')}
                </th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Status{getSortIcon('status')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredAndSortedSubmissions().map((submission) => (
                <tr key={submission.id}>
                  <td>{submission.complianceType}</td>
                  <td>
                    {submission.complianceAccountType ? (
                      <span style={{ fontSize: '0.9em', color: '#3498db' }}>
                        {submission.complianceAccountType.name}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.9em', color: '#95a5a6' }}>N/A</span>
                    )}
                  </td>
                  <td>{submission.state}</td>
                  <td>{submission.stateAgency}</td>
                  <td>{submission.entityName}</td>
                  <td>{submission.registrationNumber}</td>
                  <td>
                    {submission.expirationDate
                      ? new Date(submission.expirationDate).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td>
                    <span className={`badge badge-${submission.status.toLowerCase()}`}>
                      {submission.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1rem' }}
                        onClick={() => handleOpenModal(submission)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.5rem 1rem' }}
                        onClick={() => handleDelete(submission.id!)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => handleCloseModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingSubmission ? 'Edit Submission' : 'New Submission'}
              </h2>
              <button className="modal-close" onClick={() => handleCloseModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-2">
                {/* Step 1: Select Jurisdiction */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '1.1em', fontWeight: '600' }}>
                    Step 1: Select Jurisdiction <span style={{ color: '#e74c3c' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    placeholder="Enter code (e.g., CA, NY, TX, US for Federal)"
                    maxLength={10}
                    style={{ textTransform: 'uppercase', fontSize: '1.1em' }}
                  />
                  {!formData.state ? (
                    <small style={{ color: '#7f8c8d', marginTop: '0.25rem', display: 'block' }}>
                      Enter jurisdiction code to see available compliance types.{' '}
                      <button
                        type="button"
                        onClick={() => setShowScopeGuide(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#3498db',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: 'inherit'
                        }}
                      >
                        View all valid codes
                      </button>
                    </small>
                  ) : (
                    <small style={{ color: '#7f8c8d', marginTop: '0.25rem', display: 'block' }}>
                      <button
                        type="button"
                        onClick={() => setShowScopeGuide(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#3498db',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: 'inherit'
                        }}
                      >
                        View all valid codes
                      </button>
                    </small>
                  )}
                </div>

                {/* Step 2: Select Agency (Optional) */}
                {formData.state && availableAgencies.length > 0 && (
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '1.1em', fontWeight: '600' }}>
                      Step 2: Select Agency (Optional)
                    </label>
                    <select
                      value={selectedAgency}
                      onChange={(e) => setSelectedAgency(e.target.value)}
                      style={{ fontSize: '1.1em' }}
                    >
                      <option value="">-- All Agencies --</option>
                      {availableAgencies.map((agency) => (
                        <option key={agency} value={agency}>
                          {agency}
                        </option>
                      ))}
                    </select>
                    <small style={{ color: '#7f8c8d', marginTop: '0.25rem', display: 'block' }}>
                      {selectedAgency 
                        ? `Showing only ${selectedAgency} compliance types` 
                        : `${availableAgencies.length} ${availableAgencies.length === 1 ? 'agency' : 'agencies'} available for ${formData.state}`}
                    </small>
                  </div>
                )}

                {/* Step 3: Select Compliance Account Type */}
                {formData.state && (
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '1.1em', fontWeight: '600' }}>
                      Step {availableAgencies.length > 0 ? '3' : '2'}: Select Compliance Account Type <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <select
                      name="complianceAccountTypeId"
                      value={formData.complianceAccountTypeId || ''}
                      onChange={handleChange}
                      required
                      style={{ fontSize: '1.1em' }}
                    >
                      <option value="">-- Select a Compliance Account Type --</option>
                      {filteredAccountTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name} ({type.agency})
                        </option>
                      ))}
                      <option value="OTHER">Other (Custom)</option>
                    </select>
                    {filteredAccountTypes.length === 0 && formData.complianceAccountTypeId !== 'OTHER' ? (
                      <small style={{ color: '#e67e22', marginTop: '0.25rem', display: 'block' }}>
                        ⚠️ No compliance account types found for {formData.state}. You can select "Other" to enter a custom type.
                      </small>
                    ) : formData.complianceAccountTypeId === 'OTHER' ? (
                      <small style={{ color: '#3498db', marginTop: '0.25rem', display: 'block' }}>
                        ℹ️ You selected "Other". Please fill in the compliance type and agency below.
                      </small>
                    ) : formData.complianceAccountTypeId ? (
                      <small style={{ color: '#27ae60', marginTop: '0.25rem', display: 'block' }}>
                        ✓ Form fields below are customized for this account type
                      </small>
                    ) : (
                      <small style={{ color: '#7f8c8d', marginTop: '0.25rem', display: 'block' }}>
                        {filteredAccountTypes.length} account type{filteredAccountTypes.length !== 1 ? 's' : ''} available for {formData.state}
                      </small>
                    )}
                  </div>
                )}

                {/* Display Related Resource Link */}
                {relatedResource && formData.complianceAccountTypeId && (
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: '#e8f4f8', borderRadius: '4px', border: '1px solid #3498db' }}>
                      <span style={{ fontSize: '0.9rem', color: '#2c3e50' }}>
                        📚 Need help with this registration?
                      </span>
                      {' '}
                      <button
                        type="button"
                        onClick={() => setShowResourceModal(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#3498db',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          padding: 0
                        }}
                      >
                        View Resource Guide
                      </button>
                    </div>
                  </div>
                )}

                {/* Show remaining fields only after account type is selected */}
                {formData.complianceAccountTypeId && (
                  <>
                    <div className="form-group">
                      <label>
                        Compliance Type
                        {formData.complianceAccountTypeId === 'OTHER' ? 
                          ' (Custom)' : ' (Auto-filled)'}
                        {formData.complianceAccountTypeId === 'OTHER' && 
                          <span style={{ color: '#e74c3c' }}> *</span>}
                      </label>
                      <input
                        type="text"
                        name="complianceType"
                        value={formData.complianceType}
                        onChange={handleChange}
                        required
                        readOnly={formData.complianceAccountTypeId !== 'OTHER'}
                        placeholder={formData.complianceAccountTypeId === 'OTHER' ? 'Enter custom compliance type' : ''}
                        style={{ backgroundColor: formData.complianceAccountTypeId !== 'OTHER' ? '#ecf0f1' : 'white' }}
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        State Agency
                        {formData.complianceAccountTypeId === 'OTHER' ? 
                          ' (Custom)' : ' (Auto-filled)'}
                        {formData.complianceAccountTypeId === 'OTHER' && 
                          <span style={{ color: '#e74c3c' }}> *</span>}
                      </label>
                      <input
                        type="text"
                        name="stateAgency"
                        value={formData.stateAgency}
                        onChange={handleChange}
                        required
                        readOnly={formData.complianceAccountTypeId !== 'OTHER'}
                        placeholder={formData.complianceAccountTypeId === 'OTHER' ? 'Enter custom agency name' : ''}
                        style={{ backgroundColor: formData.complianceAccountTypeId !== 'OTHER' ? '#ecf0f1' : 'white' }}
                      />
                    </div>

                    {shouldShowField('entityName') && (
                      <div className="form-group">
                        <label>Entity Name</label>
                        <input
                          type="text"
                          name="entityName"
                          value={formData.entityName}
                          onChange={handleChange}
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
                          value={formData.registrationNumber}
                          onChange={handleChange}
                          placeholder="Account or registration number"
                        />
                      </div>
                    )}

                    <div className="form-group">
                      <label>Status</label>
                      <select name="status" value={formData.status} onChange={handleChange}>
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
                        value={formData.duration}
                        onChange={handleChange}
                        placeholder="e.g., 12, 3, 1"
                      />
                      {formData.complianceAccountTypeId && formData.complianceAccountType?.defaultDuration && (
                        <small style={{ color: '#7f8c8d', marginTop: '0.25rem', display: 'block' }}>
                          Default: {formData.complianceAccountType.defaultDuration}
                        </small>
                      )}
                    </div>

                    {shouldShowField('submittedOn') && (
                      <div className="form-group">
                        <label>Submitted On</label>
                        <input
                          type="date"
                          name="submittedOn"
                          value={formData.submittedOn}
                          onChange={handleChange}
                        />
                      </div>
                    )}

                    {shouldShowField('filingDate') && (
                      <div className="form-group">
                        <label>Filing Date</label>
                        <input
                          type="date"
                          name="filingDate"
                          value={formData.filingDate}
                          onChange={handleChange}
                        />
                      </div>
                    )}

                    {shouldShowField('expirationDate') && (
                      <div className="form-group">
                        <label>Expiration Date</label>
                        <input
                          type="date"
                          name="expirationDate"
                          value={formData.expirationDate}
                          onChange={handleChange}
                        />
                      </div>
                    )}

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Filing Storage Link</label>
                      <input
                        type="url"
                        name="filingStorageLink"
                        value={formData.filingStorageLink}
                        onChange={handleChange}
                        placeholder="Link to Sharepoint, Google Drive, etc."
                      />
                    </div>

                    {shouldShowField('compliancePageLink') && (
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label>Compliance Portal Link</label>
                        <input
                          type="url"
                          name="compliancePageLink"
                          value={formData.compliancePageLink}
                          onChange={handleChange}
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
                          value={formData.passwordManagerLink}
                          onChange={handleChange}
                          placeholder="Link to password manager entry"
                        />
                      </div>
                    )}

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Notes</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Additional notes..."
                        rows={3}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => handleCloseModal(true)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSubmission ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resource Modal */}
      {showResourceModal && relatedResource && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowResourceModal(false)}
          style={{ zIndex: 1001 }}
        >
          <div 
            className="modal" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '700px' }}
          >
            <div className="modal-header">
              <h2 className="modal-title">
                📚 {relatedResource.title}
              </h2>
              <button className="modal-close" onClick={() => setShowResourceModal(false)}>
                ×
              </button>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#2c3e50' }}>Description</h3>
                <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#34495e' }}>
                  {relatedResource.description}
                </p>
              </div>

              {relatedResource.filingFrequency && (
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#2c3e50' }}>Filing Frequency</h3>
                  <p style={{ fontSize: '0.9rem', color: '#34495e' }}>{relatedResource.filingFrequency}</p>
                </div>
              )}

              {relatedResource.fees && (
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#2c3e50' }}>Fees</h3>
                  <p style={{ fontSize: '0.9rem', color: '#34495e' }}>{relatedResource.fees}</p>
                </div>
              )}

              {relatedResource.requiredDocuments && (
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#2c3e50' }}>Required Documents</h3>
                  <p style={{ fontSize: '0.9rem', color: '#34495e' }}>{relatedResource.requiredDocuments}</p>
                </div>
              )}

              {relatedResource.additionalNotes && (
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#2c3e50' }}>Additional Notes</h3>
                  <p style={{ fontSize: '0.9rem', color: '#34495e' }}>{relatedResource.additionalNotes}</p>
                </div>
              )}

              {relatedResource.portalLink && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                  <a 
                    href={relatedResource.portalLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ display: 'inline-block', textDecoration: 'none' }}
                  >
                    Open Compliance Portal →
                  </a>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowResourceModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scope Guide Modal */}
      {showScopeGuide && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowScopeGuide(false)}
          style={{ zIndex: 1002 }}
        >
          <div 
            className="modal" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }}
          >
            <div className="modal-header">
              <h2 className="modal-title">
                📋 Valid Jurisdiction Codes
              </h2>
              <button className="modal-close" onClick={() => setShowScopeGuide(false)}>
                ×
              </button>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <p style={{ marginBottom: '1rem', color: '#7f8c8d' }}>
                Use these codes when selecting a jurisdiction. Codes are case-insensitive.
              </p>

              {/* Group by scope type */}
              {['FEDERAL', 'STATE', 'CITY', 'COUNTY'].map(scopeType => {
                const scopesOfType = scopes.filter((s: ComplianceScope) => s.scopeType === scopeType);
                if (scopesOfType.length === 0) return null;

                return (
                  <div key={scopeType} style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ 
                      fontSize: '1rem', 
                      fontWeight: '600', 
                      marginBottom: '0.75rem', 
                      color: '#2c3e50',
                      borderBottom: '2px solid #3498db',
                      paddingBottom: '0.25rem'
                    }}>
                      {scopeType.charAt(0) + scopeType.slice(1).toLowerCase()}
                    </h3>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                      gap: '0.5rem' 
                    }}>
                      {scopesOfType.map((scope: ComplianceScope) => (
                        <div 
                          key={scope.id}
                          style={{ 
                            padding: '0.5rem', 
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            fontSize: '0.875rem'
                          }}
                        >
                          <strong style={{ color: '#3498db' }}>{scope.code}</strong>
                          {' - '}
                          <span style={{ color: '#34495e' }}>{scope.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowScopeGuide(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComplianceSubmissions;
