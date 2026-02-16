import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchUsers();
    }, [page, search]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getUsers({
                page,
                limit: 10,
                search
            });
            setUsers(response.data.data.users);
            setTotalPages(response.data.data.pagination.pages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (userId, newStatus) => {
        if (!window.confirm(`Foydalanuvchi statusini ${newStatus} ga o'zgartirmoqchimisiz?`)) return;

        try {
            await adminAPI.updateUserStatus(userId, newStatus);
            fetchUsers();
            alert('Status o\'zgartirildi');
        } catch (err) {
            alert('Xatolik yuz berdi');
        }
    };

    const { user: currentUser } = useAuth();

    const handleRoleChange = async (userId, newRole) => {
        if (!window.confirm(`Foydalanuvchi rolini ${newRole} ga o'zgartirmoqchimisiz?`)) return;

        try {
            await adminAPI.updateUserRole(userId, newRole);
            fetchUsers();
            alert('Rol o\'zgartirildi');
        } catch (err) {
            alert('Xatolik yuz berdi');
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1); // Reset to first page
        fetchUsers();
    };

    return (
        <div className="admin-users">
            <h1 className="admin-title">Foydalanuvchilar</h1>

            <div className="admin-controls">
                <form onSubmit={handleSearch} className="search-form-pro">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Foydalanuvchi qidirish..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="search-input-pro"
                        />
                        <button type="submit" className="search-btn-pro">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </button>
                    </div>
                </form>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Ism</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Status</th>
                            <th>Ro'yxatdan o'tgan</th>
                            <th>Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.full_name}</td>
                                <td>{user.email}</td>
                                <td>
                                    {currentUser?.role === 'super_admin' && user.role_name !== 'super_admin' ? (
                                        <select
                                            value={user.role_name}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            className="role-select"
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    ) : (
                                        <span className={`badge badge-${user.role_name === 'super_admin' ? 'primary' : 'secondary'}`}>
                                            {user.role_name}
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <span className={`badge badge-${user.status === 'active' ? 'success' : 'error'}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td>{new Date(user.created_at).toLocaleDateString('uz-UZ')}</td>
                                <td>
                                    {user.role_name !== 'super_admin' && (
                                        <div className="action-buttons">
                                            {user.status === 'active' ? (
                                                <button
                                                    onClick={() => handleStatusChange(user.id, 'suspended')}
                                                    className="btn btn-sm btn-outline-danger"
                                                    title="Bloklash"
                                                >
                                                    🚫
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleStatusChange(user.id, 'active')}
                                                    className="btn btn-sm btn-outline-success"
                                                    title="Faollashtirish"
                                                >
                                                    ✅
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="btn btn-outline"
                >
                    &lt;
                </button>
                <span>{page} / {totalPages}</span>
                <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="btn btn-outline"
                >
                    &gt;
                </button>
            </div>
        </div >
    );
}

export default AdminUsers;
