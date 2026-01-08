import { useState, useEffect } from 'react';
import {
  getSubmissions,
  createSubmission,
  updateSubmission,
  deleteSubmission,
  getAccountTypes,
} from '../services/api';

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

interface Submission {
  id?: string;
  complianceType: string;
  state: string;
  stateAgency: string;
  complianceAccountTypeId?: string;
  complianceAccountType?: ComplianceAccountType;
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

const emptySubmission: Submission = {
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

function ComplianceSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);
  const [formData, setFormData] = useState<Submission>(emptySubmission);
  const [accountTypes, setAccountTypes] = useState<ComplianceAccountType[]>([]);
  const [filteredAccountTypes, setFilteredAccountTypes] = useState<ComplianceAccountType[]>([]);

  useEffect(() => {
    fetchSubmissions();
    fetchAccountTypes();
  }, []);

  useEffect(() => {
    // Filter account types when state changes
    if (formData.state) {
      const filtered = accountTypes.filter(
        (type) => type.state.toUpperCase() === formData.state.toUpperCase()
      );
      setFilteredAccountTypes(filtered);
      
      // Auto-populate agency if account type is selected
      if (formData.complianceAccountTypeId) {
        const selectedType = accountTypes.find(t => t.id === formData.complianceAccountTypeId);
        if (selectedType && selectedType.state.toUpperCase() === formData.state.toUpperCase()) {
          setFormData(prev => ({ ...prev, stateAgency: selectedType.stateAgency }));
        } else {
          // Clear account type if it doesn't match the state
          setFormData(prev => ({ ...prev, complianceAccountTypeId: '', stateAgency: '' }));
        }
      }
    } else {
      setFilteredAccountTypes([]);
    }
  }, [formData.state, accountTypes]);

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

  const handleOpenModal = (submission?: Submission) => {
    if (submission) {
      setEditingSubmission(submission);
      setFormData(submission);
    } else {
      setEditingSubmission(null);
      setFormData(emptySubmission);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSubmission(null);
    setFormData(emptySubmission);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'complianceAccountTypeId' && value) {
      // Auto-populate fields based on selected account type
      const selectedType = accountTypes.find(t => t.id === value);
      if (selectedType) {
        setFormData({ 
          ...formData, 
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
    
    const selectedType = accountTypes.find(t => t.id === formData.complianceAccountTypeId);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubmission) {
        await updateSubmission(editingSubmission.id!, formData);
      } else {
        await createSubmission(formData);
      }
      handleCloseModal();
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
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Account Type</th>
                <th>State</th>
                <th>Agency</th>
                <th>Entity</th>
                <th>Registration #</th>
                <th>Expiration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
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
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingSubmission ? 'Edit Submission' : 'New Submission'}
              </h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-2">
                {/* Step 1: Select State */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '1.1em', fontWeight: '600' }}>
                    Step 1: Select State <span style={{ color: '#e74c3c' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    placeholder="Enter 2-letter state code (e.g., CA, NY, TX)"
                    maxLength={2}
                    style={{ textTransform: 'uppercase', fontSize: '1.1em' }}
                  />
                  {!formData.state && (
                    <small style={{ color: '#7f8c8d', marginTop: '0.25rem', display: 'block' }}>
                      Enter state code to see available compliance account types
                    </small>
                  )}
                </div>

                {/* Step 2: Select Compliance Account Type */}
                {formData.state && (
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '1.1em', fontWeight: '600' }}>
                      Step 2: Select Compliance Account Type <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <select
                      name="complianceAccountTypeId"
                      value={formData.complianceAccountTypeId || ''}
                      onChange={handleChange}
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
                    {filteredAccountTypes.length === 0 ? (
                      <small style={{ color: '#e67e22', marginTop: '0.25rem', display: 'block' }}>
                        ⚠️ No compliance account types found for {formData.state}. Please select a different state or contact admin to add types.
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

                {/* Show remaining fields only after account type is selected */}
                {formData.complianceAccountTypeId && (
                  <>
                    <div className="form-group">
                      <label>Compliance Type (Auto-filled)</label>
                      <input
                        type="text"
                        name="complianceType"
                        value={formData.complianceType}
                        onChange={handleChange}
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
                        value={formData.stateAgency}
                        onChange={handleChange}
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
                      <label>Duration / Frequency</label>
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

                    {shouldShowField('filingStorageLink') && (
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
                    )}

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
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
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
    </div>
  );
}

export default ComplianceSubmissions;
