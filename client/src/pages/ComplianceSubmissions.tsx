import { useState, useEffect } from 'react';
import {
  getSubmissions,
  createSubmission,
  updateSubmission,
  deleteSubmission,
} from '../services/api';

interface Submission {
  id?: string;
  complianceType: string;
  state: string;
  stateAgency: string;
  entityName: string;
  registrationNumber: string;
  filingDate: string;
  expirationDate: string;
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
  entityName: '',
  registrationNumber: '',
  filingDate: '',
  expirationDate: '',
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

  useEffect(() => {
    fetchSubmissions();
  }, []);

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
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
                <div className="form-group">
                  <label>Compliance Type</label>
                  <input
                    type="text"
                    name="complianceType"
                    value={formData.complianceType}
                    onChange={handleChange}
                    required
                    placeholder="e.g., SOS Registration"
                  />
                </div>

                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    placeholder="e.g., CA"
                    maxLength={2}
                  />
                </div>

                <div className="form-group">
                  <label>State Agency</label>
                  <input
                    type="text"
                    name="stateAgency"
                    value={formData.stateAgency}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Secretary of State"
                  />
                </div>

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

                <div className="form-group">
                  <label>Registration Number</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    placeholder="Registration/filing number"
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="ACTIVE">Active</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Filing Date</label>
                  <input
                    type="date"
                    name="filingDate"
                    value={formData.filingDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Expiration Date</label>
                  <input
                    type="date"
                    name="expirationDate"
                    value={formData.expirationDate}
                    onChange={handleChange}
                  />
                </div>

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

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Additional notes..."
                  />
                </div>
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
