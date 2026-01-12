import { useState, useEffect, useRef } from 'react';
import { getTodos, createTodo, updateTodo, deleteTodo, getSubmissions, updateSubmission, getExpiringSubmissions, createSubmission, getResources, getAccountTypes, getScopes } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface ComplianceScope {
  id: string;
  code: string;
  name: string;
  scopeType: string;
}

interface ComplianceAccountType {
  id: string;
  name: string;
  scope: ComplianceScope;
  agency: string;
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
  itemType: string; // 'TASK' or 'FLAGGED_ITEM'
  dueDate: string | null;
  dismissedAt?: string | null;
  deferredUntil?: string | null;
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
  stateAgency: string;
  entityName?: string;
  registrationNumber?: string;
  submittedOn?: string;
  filingDate?: string;
  expirationDate: string;
  duration?: string;
  status: string;
  deferDuration?: number;
  complianceAccountTypeId?: string;
  complianceAccountType?: ComplianceAccountType;
}

interface ComplianceFormData {
  complianceType: string;
  state: string;
  stateAgency: string;
  complianceAccountTypeId?: string;
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

const emptyCompliance: ComplianceFormData = {
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
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [scopes, setScopes] = useState<ComplianceScope[]>([]);
  const [showScopeGuide, setShowScopeGuide] = useState(false);
  const hasCheckedRenewals = useRef(false);
  const [showDeferModal, setShowDeferModal] = useState(false);
  const [deferringTodo, setDeferringTodo] = useState<Todo | null>(null);
  const [deferDays, setDeferDays] = useState<string>('7');

  useEffect(() => {
    // Prevent double execution in StrictMode
    if (hasCheckedRenewals.current) {
      return;
    }
    
    hasCheckedRenewals.current = true;
    
    const initializePage = async () => {
      await fetchScopes();
      await fetchAccountTypes();
      await checkAndCreateRenewalTodos();
      // fetchData is called within checkAndCreateRenewalTodos, so no need to call it again
    };
    
    initializePage();
  }, []);

  useEffect(() => {
    // Filter account types when state changes in the form
    if (complianceForm.state) {
      const filtered = accountTypes.filter(
        (type) => type.scope.code.toUpperCase() === complianceForm.state.toUpperCase()
      );
      setFilteredAccountTypes(filtered);
    } else {
      setFilteredAccountTypes([]);
    }
  }, [complianceForm.state, accountTypes]);

  useEffect(() => {
    // Fetch related resource when state and compliance type are selected
    const fetchRelatedResource = async () => {
      if (complianceForm.state && complianceForm.complianceType) {
        try {
          console.log('Fetching resource for:', { state: complianceForm.state, complianceType: complianceForm.complianceType });
          const resourcesRes = await getResources({
            state: complianceForm.state.toUpperCase(),
            complianceType: complianceForm.complianceType,
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
  }, [complianceForm.state, complianceForm.complianceType]);

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

  const fetchScopes = async () => {
    try {
      const response = await getScopes();
      setScopes(response.data);
    } catch (error) {
      console.error('Error fetching scopes:', error);
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

  const checkAndCreateRenewalTodos = async () => {
    try {
      // Fetch all submissions and todos in parallel
      const [submissionsRes, todosRes] = await Promise.all([
        getSubmissions(),
        getTodos(),
      ]);
      
      const allSubmissions: Submission[] = submissionsRes.data;
      const existingTodos: Todo[] = todosRes.data;
      
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      
      // First, check for deferred submissions whose defer period has ended
      for (const submission of allSubmissions) {
        if (submission.status === 'USER_DEFERRED' && submission.deferDuration) {
          // Find the related todo to check its deferredUntil date
          const relatedTodo = existingTodos.find(
            (todo) => todo.relatedSubmission?.id === submission.id && todo.deferredUntil
          );
          
          if (relatedTodo && relatedTodo.deferredUntil) {
            const deferredUntilDate = new Date(relatedTodo.deferredUntil);
            // If defer period has ended, restore submission to ACTIVE
            if (deferredUntilDate <= today) {
              await updateSubmission(submission.id, { 
                status: 'ACTIVE',
                deferDuration: null
              });
            }
          }
        }
      }
      
      // Process each active submission
      for (const submission of allSubmissions) {
        // Skip if not active or if user has deferred/dismissed
        if (submission.status !== 'ACTIVE') continue;
        
        // Calculate when renewal is needed
        let renewalDate: Date | null = null;
        
        // Use expirationDate if available
        if (submission.expirationDate) {
          renewalDate = new Date(submission.expirationDate);
        } 
        // Otherwise calculate from filingDate + duration
        else if (submission.filingDate && submission.duration) {
          const filingDateObj = new Date(submission.filingDate);
          const durationMonths = parseInt(submission.duration);
          
          if (!isNaN(durationMonths)) {
            renewalDate = new Date(filingDateObj);
            renewalDate.setMonth(renewalDate.getMonth() + durationMonths);
          }
        }
        
        // If we have a renewal date and it's within 30 days
        if (renewalDate && renewalDate >= today && renewalDate <= thirtyDaysFromNow) {
          // Check if a todo already exists for this submission (non-completed)
          const existingTodo = existingTodos.find(
            (todo) => todo.relatedSubmission?.id === submission.id && todo.status !== 'COMPLETED'
          );
          
          // Only create if todo doesn't exist
          if (!existingTodo) {
            const daysUntilRenewal = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            await createTodo({
              title: `Renew ${submission.complianceType} - ${submission.state}`,
              description: `${submission.complianceType} for ${submission.entityName || 'your entity'} in ${submission.state} needs to be renewed. Filing with ${submission.stateAgency}.`,
              priority: daysUntilRenewal <= 7 ? 'URGENT' : daysUntilRenewal <= 14 ? 'HIGH' : 'MEDIUM',
              dueDate: renewalDate.toISOString(),
              relatedSubmissionId: submission.id,
              itemType: 'FLAGGED_ITEM', // System-generated suggestions
            });
          }
        }
      }
      
      // Refresh the todo list after creating new ones
      fetchData();
    } catch (error) {
      console.error('Error checking renewal todos:', error);
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

  const handleDismissFlaggedItem = async (id: string) => {
    try {
      const todo = todos.find(t => t.id === id);
      
      // If the todo has a related submission, update its status
      if (todo?.relatedSubmission?.id) {
        await updateSubmission(todo.relatedSubmission.id, { 
          status: 'USER_DISMISSED' 
        });
      }
      
      // Mark the todo as dismissed
      await updateTodo(id, { dismissedAt: new Date().toISOString() });
      fetchData();
    } catch (error) {
      console.error('Error dismissing flagged item:', error);
    }
  };

  const handleDeferFlaggedItem = async (id: string, days: number) => {
    try {
      const todo = todos.find(t => t.id === id);
      
      // If the todo has a related submission, update its status
      if (todo?.relatedSubmission?.id) {
        await updateSubmission(todo.relatedSubmission.id, { 
          status: 'USER_DEFERRED',
          deferDuration: days
        });
      }
      
      // Defer the todo
      const deferDate = new Date();
      deferDate.setDate(deferDate.getDate() + days);
      await updateTodo(id, { deferredUntil: deferDate.toISOString() });
      fetchData();
    } catch (error) {
      console.error('Error deferring flagged item:', error);
    }
  };

  const handleOpenDeferModal = (todo: Todo) => {
    setDeferringTodo(todo);
    setDeferDays('7'); // Default to 7 days
    setShowDeferModal(true);
  };

  const handleSubmitDefer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deferringTodo) return;
    
    const days = parseInt(deferDays);
    if (isNaN(days) || days < 1) {
      alert('Please enter a valid number of days (minimum 1)');
      return;
    }
    
    await handleDeferFlaggedItem(deferringTodo.id, days);
    setShowDeferModal(false);
    setDeferringTodo(null);
    setDeferDays('7');
  };

  const handleDeleteAllTodos = async () => {
    if (todos.length === 0) return;
    
    const confirmMessage = `Are you sure you want to delete all ${todos.length} to-do item${todos.length !== 1 ? 's' : ''}? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        // Delete all todos in parallel
        await Promise.all(todos.map(todo => deleteTodo(todo.id)));
        fetchData();
      } catch (error) {
        console.error('Error deleting all todos:', error);
        alert('Failed to delete all todos');
      }
    }
  };

  const handleDeleteCompleted = async () => {
    const completedTodos = todos.filter(todo => todo.status === 'COMPLETED');
    
    if (completedTodos.length === 0) {
      alert('No completed tasks to delete.');
      return;
    }
    
    const confirmMessage = `Are you sure you want to delete ${completedTodos.length} completed task${completedTodos.length !== 1 ? 's' : ''}? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        // Delete all completed todos in parallel
        await Promise.all(completedTodos.map(todo => deleteTodo(todo.id)));
        fetchData();
      } catch (error) {
        console.error('Error deleting completed todos:', error);
        alert('Failed to delete completed todos');
      }
    }
  };

  const handleOpenComplianceModal = async (todo: Todo) => {
    setSelectedTodo(todo);
    
    // Pre-populate form from related submission if available
    const formData = { ...emptyCompliance };
    
    if (todo.relatedSubmission) {
      // Fetch the full submission data to get all fields
      try {
        const submissionsRes = await getSubmissions();
        const fullSubmission = submissionsRes.data.find(
          (sub: Submission) => sub.id === todo.relatedSubmission?.id
        );
        
        if (fullSubmission) {
          // Auto-populate all fields from the previous submission
          formData.complianceType = fullSubmission.complianceType;
          formData.state = fullSubmission.state;
          formData.stateAgency = fullSubmission.stateAgency;
          formData.complianceAccountTypeId = fullSubmission.complianceAccountTypeId || '';
          formData.entityName = fullSubmission.entityName || '';
          formData.registrationNumber = fullSubmission.registrationNumber || '';
          formData.duration = fullSubmission.duration || '';
          formData.status = 'ACTIVE'; // Always set to ACTIVE for renewals
          // Keep the new dates (submittedOn and filingDate default to today)
          // Don't copy the old expirationDate - it will be recalculated
        }
      } catch (error) {
        console.error('Error fetching full submission data:', error);
      }
      
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

  const handleCloseComplianceModal = (skipConfirmation = false) => {
    if (!skipConfirmation) {
      const confirmed = window.confirm('Are you sure you want to close this form? Any unsaved changes will be lost.');
      if (!confirmed) {
        return;
      }
    }
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
          stateAgency: selectedType.agency,
          state: selectedType.scope.code,
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

  const handleCreateCompliance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Calculate expiration date if not provided
      const submissionData = { ...complianceForm };
      
      if (!submissionData.expirationDate && submissionData.filingDate && submissionData.duration) {
        const filingDateObj = new Date(submissionData.filingDate);
        const durationMonths = parseInt(submissionData.duration);
        
        if (!isNaN(durationMonths)) {
          const expirationDate = new Date(filingDateObj);
          expirationDate.setMonth(expirationDate.getMonth() + durationMonths);
          submissionData.expirationDate = expirationDate.toISOString().split('T')[0];
        }
      }
      
      // Check if this is a renewal (matching State, Compliance Type, and Entity Name)
      let matchingSubmission = null;
      if (submissionData.state && submissionData.complianceType && submissionData.entityName) {
        try {
          const submissionsRes = await getSubmissions();
          const allSubmissions: Submission[] = submissionsRes.data;
          
          // Find existing submission with matching criteria (excluding OBSOLETE status)
          matchingSubmission = allSubmissions.find((sub: Submission) => 
            sub.state.toUpperCase() === submissionData.state.toUpperCase() &&
            sub.complianceType === submissionData.complianceType &&
            sub.entityName === submissionData.entityName &&
            sub.status !== 'OBSOLETE'
          );
        } catch (error) {
          console.error('Error checking for existing submissions:', error);
        }
      }
      
      // Create the new submission
      await createSubmission(submissionData);
      
      // Mark the todo as completed if this submission was created from a todo
      if (selectedTodo) {
        try {
          await updateTodo(selectedTodo.id, { status: 'COMPLETED' });
        } catch (error) {
          console.error('Error marking todo as completed:', error);
          // Don't fail the whole operation if this fails
        }
      }
      
      // If a match was found, mark the old one as obsolete
      if (matchingSubmission) {
        try {
          await updateSubmission(matchingSubmission.id, { status: 'OBSOLETE' });
          
          // Show confirmation dialog
          alert(
            `Compliance submission created successfully!\n\n` +
            `The previous submission for ${submissionData.complianceType} - ${submissionData.state} ` +
            `(${submissionData.entityName}) has been marked as OBSOLETE.`
          );
        } catch (error) {
          console.error('Error updating old submission to obsolete:', error);
          alert('New submission created successfully, but failed to update the previous submission to obsolete.');
        }
      } else {
        alert('Compliance submission created successfully!');
      }
      
      handleCloseComplianceModal(true);
      fetchData();
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

      {/* Flagged Items Section */}
      {todos.filter(t => t.itemType === 'FLAGGED_ITEM').length > 0 && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">🚩 Flagged Items (Suggested Actions)</h3>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#7f8c8d', padding: '0 1rem', marginBottom: '0.5rem' }}>
            These are system-suggested actions based on upcoming deadlines and compliance requirements.
          </div>
          <div>
            {todos.filter(t => t.itemType === 'FLAGGED_ITEM').map((todo) => (
              <div
                key={todo.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1rem',
                  borderBottom: '1px solid #eee',
                  textDecoration: todo.status === 'COMPLETED' ? 'line-through' : 'none',
                  opacity: todo.status === 'COMPLETED' ? 0.6 : 1,
                  backgroundColor: '#fffbf0',
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
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-success"
                    onClick={() => handleOpenComplianceModal(todo)}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    title={todo.relatedSubmission ? "Renew compliance submission" : "Create compliance submission for this task"}
                  >
                    {todo.relatedSubmission ? '🔄 Renew' : '📋 Create'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleOpenDeferModal(todo)}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    title="Defer this item"
                  >
                    ⏰ Defer
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleDismissFlaggedItem(todo.id)}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    title="Dismiss this suggestion"
                  >
                    ✕ Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks Section */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">📝 Your Tasks</h3>
          {todos.filter(t => t.itemType === 'TASK').length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-danger"
                onClick={handleDeleteCompleted}
                style={{ padding: '0.5rem 1rem' }}
                title="Delete completed tasks"
              >
                Delete Completed
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteAllTodos}
                style={{ padding: '0.5rem 1rem' }}
                title="Delete all tasks"
              >
                Delete All
              </button>
            </div>
          )}
        </div>
        {todos.filter(t => t.itemType === 'TASK').length === 0 ? (
          <p style={{ color: '#7f8c8d' }}>No pending tasks. Great job!</p>
        ) : (
          <div>
            {todos.filter(t => t.itemType === 'TASK').map((todo) => (
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
                    title={todo.relatedSubmission ? "Renew compliance submission" : "Create compliance submission for this task"}
                  >
                    {todo.relatedSubmission ? '🔄 Renew' : '📋 Create'}
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
        <div className="modal-overlay" onClick={() => handleCloseComplianceModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {selectedTodo?.relatedSubmission ? 'Renew Compliance Submission' : 'Create Compliance Submission'}
                {selectedTodo && <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: '#7f8c8d' }}> for: {selectedTodo.title}</span>}
              </h2>
              <button className="modal-close" onClick={() => handleCloseComplianceModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleCreateCompliance}>
              <div className="grid grid-2">
                {/* Step 1: Select Jurisdiction */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '1.1em', fontWeight: '600' }}>
                    Step 1: Select Jurisdiction <span style={{ color: '#e74c3c' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={complianceForm.state}
                    onChange={handleComplianceChange}
                    required
                    placeholder="Enter code (e.g., CA, NY, TX, US for Federal)"
                    maxLength={10}
                    style={{ textTransform: 'uppercase', fontSize: '1.1em' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowScopeGuide(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#3498db',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      padding: '0',
                      marginTop: '0.25rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    View all valid codes
                  </button>
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
                      Enter jurisdiction code to see available compliance account types
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
                          {type.name} ({type.agency})
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

                {/* Display Related Resource Link */}
                {relatedResource && complianceForm.complianceAccountTypeId && (
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
                      <label>Agency (Auto-filled)</label>
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

                    {shouldShowField('submittedOn') && (
                      <div className="form-group">
                        <label>Submitted On</label>
                        <input
                          type="date"
                          name="submittedOn"
                          value={complianceForm.submittedOn}
                          onChange={handleComplianceChange}
                        />
                      </div>
                    )}

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
                <button type="button" className="btn btn-secondary" onClick={() => handleCloseComplianceModal(true)}>
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
                const scopesOfType = scopes.filter(s => s.scopeType === scopeType);
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
                      {scopesOfType.map(scope => (
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

      {/* Defer Modal */}
      {showDeferModal && deferringTodo && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowDeferModal(false)}
          style={{ zIndex: 1003 }}
        >
          <div 
            className="modal" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px' }}
          >
            <div className="modal-header">
              <h2 className="modal-title">
                ⏰ Defer Flagged Item
              </h2>
              <button className="modal-close" onClick={() => setShowDeferModal(false)}>
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmitDefer}>
              <div style={{ padding: '1.5rem' }}>
                <p style={{ marginBottom: '1rem', color: '#34495e' }}>
                  <strong>{deferringTodo.title}</strong>
                </p>
                <p style={{ marginBottom: '1rem', color: '#7f8c8d', fontSize: '0.9rem' }}>
                  How many days would you like to defer this item?
                </p>
                
                <div className="form-group">
                  <label htmlFor="deferDays">Number of Days</label>
                  <input
                    type="number"
                    id="deferDays"
                    min="1"
                    max="365"
                    value={deferDays}
                    onChange={(e) => setDeferDays(e.target.value)}
                    required
                    autoFocus
                    style={{ width: '100%' }}
                  />
                  <small style={{ display: 'block', marginTop: '0.25rem', color: '#7f8c8d' }}>
                    The item will reappear after the specified number of days.
                  </small>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDeferModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Defer
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
