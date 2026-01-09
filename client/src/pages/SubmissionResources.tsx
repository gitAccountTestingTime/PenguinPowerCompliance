import { useState, useEffect } from 'react';
import { getResources, createResource, getAccountTypes } from '../services/api';

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

interface Resource {
  id?: string;
  state: string;
  complianceType: string;
  title: string;
  description: string;
  requiredDocuments: string;
  filingFrequency: string;
  fees: string;
  portalLink: string;
  additionalNotes: string;
}

const emptyResource: Resource = {
  state: '',
  complianceType: '',
  title: '',
  description: '',
  requiredDocuments: '',
  filingFrequency: '',
  fees: '',
  portalLink: '',
  additionalNotes: '',
};

function SubmissionResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Resource>(emptyResource);
  const [accountTypes, setAccountTypes] = useState<ComplianceAccountType[]>([]);
  const [filteredAccountTypes, setFilteredAccountTypes] = useState<ComplianceAccountType[]>([]);

  useEffect(() => {
    fetchResources();
    fetchAccountTypes();
  }, []);

  useEffect(() => {
    // Filter account types when state changes in the form
    if (formData.state) {
      const filtered = accountTypes.filter(
        (type) => type.state.toUpperCase() === formData.state.toUpperCase()
      );
      setFilteredAccountTypes(filtered);
    } else {
      setFilteredAccountTypes([]);
    }
  }, [formData.state, accountTypes]);

  const fetchResources = async () => {
    try {
      const response = await getResources();
      setResources(response.data);
    } catch (error) {
      console.error('Error fetching resources:', error);
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

  const filterResources = () => {
    let filtered = [...resources];

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (stateFilter) {
      filtered = filtered.filter((r) => r.state === stateFilter);
    }

    if (typeFilter) {
      filtered = filtered.filter((r) => r.complianceType === typeFilter);
    }

    setFilteredResources(filtered);
  };

  const handleViewResource = (resource: Resource) => {
    setSelectedResource(resource);
    setShowModal(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createResource(formData);
      setShowAddModal(false);
      setFormData(emptyResource);
      fetchResources();
      alert('Resource added successfully!');
    } catch (error) {
      console.error('Error creating resource:', error);
      alert('Failed to create resource');
    }
  };

  // Get unique states and types for filters
  const states = [...new Set(resources.map((r) => r.state))].sort();
  const types = [...new Set(resources.map((r) => r.complianceType))].sort();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Submission Resources</h2>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Resource
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="grid grid-3">
          <div className="form-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Filter by State</label>
            <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
              <option value="">All States</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Filter by Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
            No resources found. Try adjusting your filters or add a new resource.
          </p>
        </div>
      ) : (
        <div className="grid grid-2">
          {filteredResources.map((resource) => (
            <div key={resource.id} className="card">
              <h3 className="card-title">{resource.title}</h3>
              <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                <span className="badge badge-info">{resource.state}</span>
                <span className="badge badge-info" style={{ marginLeft: '0.5rem' }}>
                  {resource.complianceType}
                </span>
              </div>
              <p style={{ color: '#7f8c8d', marginBottom: '1rem' }}>
                {resource.description.substring(0, 150)}
                {resource.description.length > 150 ? '...' : ''}
              </p>
              <button
                className="btn btn-primary"
                onClick={() => handleViewResource(resource)}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* View Resource Modal */}
      {showModal && selectedResource && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedResource.title}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <div>
              <div style={{ marginBottom: '1rem' }}>
                <span className="badge badge-info">{selectedResource.state}</span>
                <span className="badge badge-info" style={{ marginLeft: '0.5rem' }}>
                  {selectedResource.complianceType}
                </span>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <strong>Description:</strong>
                <p style={{ marginTop: '0.5rem' }}>{selectedResource.description}</p>
              </div>

              {selectedResource.requiredDocuments && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Required Documents:</strong>
                  <p style={{ marginTop: '0.5rem' }}>{selectedResource.requiredDocuments}</p>
                </div>
              )}

              {selectedResource.filingFrequency && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Filing Frequency:</strong>
                  <p style={{ marginTop: '0.5rem' }}>{selectedResource.filingFrequency}</p>
                </div>
              )}

              {selectedResource.fees && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Fees:</strong>
                  <p style={{ marginTop: '0.5rem' }}>{selectedResource.fees}</p>
                </div>
              )}

              {selectedResource.portalLink && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Portal Link:</strong>
                  <p style={{ marginTop: '0.5rem' }}>
                    <a
                      href={selectedResource.portalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#3498db' }}
                    >
                      {selectedResource.portalLink}
                    </a>
                  </p>
                </div>
              )}

              {selectedResource.additionalNotes && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Additional Notes:</strong>
                  <p style={{ marginTop: '0.5rem' }}>{selectedResource.additionalNotes}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
      </div>
    </div>
  )}

  {/* Add Resource Modal */}
  {showAddModal && (
    <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add New Resource</h2>
          <button className="modal-close" onClick={() => setShowAddModal(false)}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-2">
            <div className="form-group">
              <label>State *</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                maxLength={2}
                placeholder="e.g., CA"
                style={{ textTransform: 'uppercase' }}
              />
              {!formData.state && (
                    <small style={{ color: '#7f8c8d', marginTop: '0.25rem', display: 'block' }}>
                      Enter state code first to see available compliance types
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>Compliance Type *</label>
                  {formData.state && filteredAccountTypes.length > 0 ? (
                    <>
                      <select
                        name="complianceType"
                        value={formData.complianceType}
                        onChange={handleChange}
                        required
                      >
                        <option value="">-- Select a Compliance Type --</option>
                        {filteredAccountTypes.map((type) => (
                          <option key={type.id} value={type.name}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                      <small style={{ color: '#27ae60', marginTop: '0.25rem', display: 'block' }}>
                        ✓ {filteredAccountTypes.length} compliance type{filteredAccountTypes.length !== 1 ? 's' : ''} available for {formData.state}
                      </small>
                    </>
                  ) : formData.state ? (
                    <>
                      <input
                        type="text"
                        name="complianceType"
                        value={formData.complianceType}
                        onChange={handleChange}
                        required
                        placeholder="No existing types - enter custom type"
                      />
                      <small style={{ color: '#e67e22', marginTop: '0.25rem', display: 'block' }}>
                        ⚠️ No compliance types found for {formData.state}. You can enter a custom type.
                      </small>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        name="complianceType"
                        value={formData.complianceType}
                        onChange={handleChange}
                        required
                        placeholder="Select state first"
                        disabled
                      />
                      <small style={{ color: '#7f8c8d', marginTop: '0.25rem', display: 'block' }}>
                        Please select a state first
                    </small>
                  </>
                )}
              </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="Resource title"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    placeholder="Detailed guide or process description"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Required Documents</label>
                  <textarea
                    name="requiredDocuments"
                    value={formData.requiredDocuments}
                    onChange={handleChange}
                    placeholder="List of required documents"
                  />
                </div>

                <div className="form-group">
                  <label>Filing Frequency</label>
                  <input
                    type="text"
                    name="filingFrequency"
                    value={formData.filingFrequency}
                    onChange={handleChange}
                    placeholder="e.g., Annual"
                  />
                </div>

                <div className="form-group">
                  <label>Fees</label>
                  <input
                    type="text"
                    name="fees"
                    value={formData.fees}
                    onChange={handleChange}
                    placeholder="e.g., $100"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Portal Link</label>
                  <input
                    type="url"
                    name="portalLink"
                    value={formData.portalLink}
                    onChange={handleChange}
                    placeholder="Link to state portal"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Additional Notes</label>
                  <textarea
                    name="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={handleChange}
                    placeholder="Any additional information"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubmissionResources;
