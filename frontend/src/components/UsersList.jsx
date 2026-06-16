import { useEffect, useState } from 'react';
import { fetchUsers } from '../utils/api';

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card">
        <p className="card-subtitle">Loading enrolled users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="card-title">Enrolled Users</h2>
      <p className="card-subtitle">{users.length} face profile(s) registered in the system.</p>

      {users.length === 0 ? (
        <div className="empty-state">No users enrolled yet. Use the Enroll tab to add faces.</div>
      ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Employee ID</th>
              <th>Email</th>
              <th>Enrolled</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.fullName}</td>
                <td>{user.employeeId}</td>
                <td>{user.email}</td>
                <td>{new Date(user.enrolledAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
