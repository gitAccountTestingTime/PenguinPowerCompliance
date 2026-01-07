import { useState, useEffect } from 'react';
import { getTodos, updateTodo, deleteTodo, getExpiringSubmissions } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface Todo {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate: string | null;
}

interface Submission {
  id: string;
  complianceType: string;
  state: string;
  expirationDate: string;
}

function Home() {
  const navigate = useNavigate();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [expiringSubmissions, setExpiringSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

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
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteTodo(todo.id)}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
