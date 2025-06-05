// src/screens/ManageUsers.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash, FaPlus, FaFilter, FaSpinner, FaTimes, FaSave, FaUsersCog } from 'react-icons/fa'; // Web için ikonlar

// API_BASE_URL'yi .env dosyasından veya bir config dosyasından alın
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'; // Fallback URL'i güncelleyin

const roleDisplayNames = {
  all: 'All Users',
  admin: 'Admin',
  account_manager: 'Account Manager',
  content_creator: 'Content Creator',
};
const rolesForSelection = ['admin', 'account_manager', 'content_creator'];
const rolesForFilter = Object.keys(roleDisplayNames);

const initialNewUserFormData = {
  full_name: '',
  email: '',
  password: '',
  role: rolesForSelection[0],
};

const formatRoleName = (roleKey) => {
  return roleDisplayNames[roleKey] || roleKey.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState('all');
  const [searchText, setSearchText] = useState('');
  
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentUserForEdit, setCurrentUserForEdit] = useState(null);
  const [newUserFormData, setNewUserFormData] = useState(initialNewUserFormData);
  const [editUserFormData, setEditUserFormData] = useState({});
  const [roleFilterModalVisible, setRoleFilterModalVisible] = useState(false); // Mobil koddaki gibi eklendi


  const fetchUsers = useCallback(async () => {
    if (!API_BASE_URL || API_BASE_URL === 'http://localhost:5000') {
        console.warn("API URL is using a fallback or is not set. Ensure REACT_APP_API_BASE_URL is set in your .env file.");
    }
    setLoading(true);
    try {
      // Mobil koddaki endpoint /users, web için /api/users olabilir, backend'inize göre ayarlayın.
      // Şimdilik mobil koddaki gibi /users kullanıyorum.
      const url = selectedRole === 'all' ? `${API_BASE_URL}/users` : `${API_BASE_URL}/users?role=${selectedRole}`;
      const res = await axios.get(url);
      setUsers(res.data);
    } catch (error) {
      console.error('❌ Fetch Users Error:', error);
      window.alert(error.response?.data?.message || 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  }, [selectedRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]); // fetchUsers useCallback ile sarmalandığı için bu doğru.

  const filteredUsers = users.filter(user =>
    (user.full_name || '').toLowerCase().includes(searchText.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchText.toLowerCase())
  );

  const openAddNewUserModal = () => {
    setNewUserFormData(initialNewUserFormData);
    setAddModalVisible(true);
  };

  const handleSaveNewUser = async (e) => {
    e.preventDefault(); 
    if (!newUserFormData.full_name || !newUserFormData.email || !newUserFormData.password || !newUserFormData.role) {
      window.alert('Validation Error: Please fill all fields for the new user.');
      return;
    }
    setIsSaving(true);
    try {
      await axios.post(`${API_BASE_URL}/users`, newUserFormData);
      await fetchUsers();
      window.alert('Success: New user added successfully!');
      setAddModalVisible(false);
    } catch (error) {
      console.error('❌ Add User Error:', error);
      window.alert(error.response?.data?.error || error.response?.data?.message || 'Could not add new user.');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditUserModal = (user) => {
    setCurrentUserForEdit(user);
    setEditUserFormData({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      password: '', 
    });
    setEditModalVisible(true);
  };

  const handleSaveEditedUser = async (e) => {
    e.preventDefault();
    if (!currentUserForEdit) return;
    if (!editUserFormData.full_name || !editUserFormData.email || !editUserFormData.role) {
      window.alert('Validation Error: Full name, email, and role are required.');
      return;
    }

    const payload = {
        full_name: editUserFormData.full_name,
        email: editUserFormData.email,
        role: editUserFormData.role,
    };
    if (editUserFormData.password && editUserFormData.password.trim().length > 0) {
        payload.password = editUserFormData.password;
    }

    let changed = false;
    if (payload.full_name !== currentUserForEdit.full_name) changed = true;
    if (payload.email !== currentUserForEdit.email) changed = true;
    if (payload.role !== currentUserForEdit.role) changed = true;
    if (payload.password) changed = true;

    if (!changed) {
        window.alert("Info: No changes detected.");
        setEditModalVisible(false);
        setCurrentUserForEdit(null);
        return;
    }

    setIsSaving(true);
    try {
      await axios.put(`${API_BASE_URL}/users/${currentUserForEdit.id}`, payload);
      await fetchUsers();
      window.alert('Success: User updated successfully!');
      setEditModalVisible(false);
      setCurrentUserForEdit(null);
    } catch (error) {
      console.error('❌ Edit User Error:', error);
      window.alert(error.response?.data?.error || error.response?.data?.message || 'Could not update user.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      performDelete(userId, userName);
    }
  };

  const performDelete = async (userId, userName) => {
    setIsDeleting(userId);
    try {
      await axios.delete(`${API_BASE_URL}/users/${userId}`);
      await fetchUsers();
      window.alert(`Success: User "${userName}" deleted.`);
    } catch (error) {
      console.error(`❌ Delete User Error (ID: ${userId}):`, error);
      window.alert(error.response?.data?.error || error.response?.data?.message || 'Could not delete user.');
    } finally {
      setIsDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]"> {/* Sidebar yüksekliğini hesaba katabilir */}
        <FaSpinner className="animate-spin text-4xl text-indigo-600 mb-4" />
        <p className="text-lg text-slate-700">Loading Users...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-full"> {/* Ana içerik alanı için arka plan */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <FaUsersCog size={32} className="text-indigo-600"/>
            Manage Users
        </h1>
        <button
          onClick={openAddNewUserModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center gap-2"
        >
          <FaPlus /> Add New User
        </button>
      </div>
      
      <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4 p-4 bg-white rounded-xl shadow">
        <div className="relative flex-grow md:flex-grow-0 md:w-1/3">
          <button
            onClick={() => setRoleFilterModalVisible(true)}
            className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between text-left bg-white hover:bg-slate-50"
          >
            <span className="text-slate-700">Role: {formatRoleName(selectedRole)}</span>
            <FaFilter className="text-slate-500" />
          </button>
        </div>
        <input
          type="text"
          placeholder="🔍 Search by name or email..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex-grow bg-white"
        />
      </div>
      
      {/* Rol Filtreleme Modalı */}
      {roleFilterModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={() => setRoleFilterModalVisible(false)}>
            <div className="bg-white p-5 rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center">Filter by Role</h3>
                <div className="space-y-2">
                    {rolesForFilter.map(roleKey => (
                        <button
                            key={roleKey}
                            onClick={() => { setSelectedRole(roleKey); setRoleFilterModalVisible(false); }}
                            className={`w-full text-left py-3 px-4 rounded-md transition-colors ${selectedRole === roleKey ? 'bg-indigo-500 text-white' : 'hover:bg-indigo-100 text-slate-700'}`}
                        >
                            {formatRoleName(roleKey)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}


      {/* Kullanıcı Listesi */}
      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{user.full_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-600">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' : 
                        user.role === 'account_manager' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                    }`}>
                      {formatRoleName(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => openEditUserModal(user)}
                      disabled={isDeleting === user.id}
                      title="Edit User"
                      className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-100 transition disabled:opacity-50"
                    >
                      <FaEdit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.full_name)}
                      disabled={isDeleting === user.id}
                      title="Delete User"
                      className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-100 transition disabled:opacity-50"
                    >
                      {isDeleting === user.id ? <FaSpinner className="animate-spin" size={18}/> : <FaTrash size={18} />}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-10 text-center text-slate-500 text-lg">
                  {users.length === 0 && !searchText && !loading ? 'No users for selected role.' : searchText ? 'No users found.' : 'No users to display.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Yeni Kullanıcı Ekleme Modalı */}
      {addModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={() => !isSaving && setAddModalVisible(false)}>
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-slate-800">Add New User</h2>
                <button onClick={() => !isSaving && setAddModalVisible(false)} className="text-slate-400 hover:text-slate-600 disabled:opacity-50" disabled={isSaving}>
                    <FaTimes size={20}/>
                </button>
            </div>
            <form onSubmit={handleSaveNewUser}>
              <div className="mb-4">
                <label htmlFor="new_full_name" className="block text-sm font-medium text-slate-700 mb-1">Full Name:</label>
                <input type="text" id="new_full_name" value={newUserFormData.full_name} onChange={e => setNewUserFormData(prev => ({ ...prev, full_name: e.target.value }))} className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div className="mb-4">
                <label htmlFor="new_email" className="block text-sm font-medium text-slate-700 mb-1">Email:</label>
                <input type="email" id="new_email" value={newUserFormData.email} onChange={e => setNewUserFormData(prev => ({ ...prev, email: e.target.value }))} className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div className="mb-4">
                <label htmlFor="new_password" className="block text-sm font-medium text-slate-700 mb-1">Password:</label>
                <input type="password" id="new_password" value={newUserFormData.password} onChange={e => setNewUserFormData(prev => ({ ...prev, password: e.target.value }))} className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Role:</label>
                <div className="flex flex-wrap gap-3">
                  {rolesForSelection.map(roleKey => (
                    <button
                      type="button" 
                      key={roleKey}
                      onClick={() => setNewUserFormData(prev => ({ ...prev, role: roleKey }))}
                      className={`py-2 px-4 rounded-full text-sm font-medium border-2 transition ${newUserFormData.role === roleKey ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-600 border-indigo-500 hover:bg-indigo-50'}`}
                    >
                      {formatRoleName(roleKey)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4 mt-2 border-t border-slate-200">
                <button type="button" onClick={() => !isSaving && setAddModalVisible(false)} disabled={isSaving} className="py-2 px-6 rounded-lg text-slate-700 bg-slate-200 hover:bg-slate-300 transition font-medium">Cancel</button>
                <button type="submit" disabled={isSaving} className="py-2 px-6 rounded-lg text-white bg-green-600 hover:bg-green-700 transition font-medium flex items-center justify-center gap-2 w-32">
                  {isSaving ? <FaSpinner className="animate-spin" /> : <><FaSave className="mr-1"/> Save</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kullanıcı Düzenleme Modalı */}
      {editModalVisible && currentUserForEdit && (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={() => !isSaving && (setEditModalVisible(false), setCurrentUserForEdit(null))}>
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-slate-800">Edit User: {currentUserForEdit.full_name}</h2>
                 <button onClick={() => !isSaving && (setEditModalVisible(false), setCurrentUserForEdit(null))} className="text-slate-400 hover:text-slate-600 disabled:opacity-50" disabled={isSaving}>
                    <FaTimes size={20}/>
                </button>
            </div>
            <form onSubmit={handleSaveEditedUser}>
              <div className="mb-4">
                <label htmlFor="edit_full_name" className="block text-sm font-medium text-slate-700 mb-1">Full Name:</label>
                <input type="text" id="edit_full_name" value={editUserFormData.full_name || ''} onChange={e => setEditUserFormData(prev => ({ ...prev, full_name: e.target.value }))} className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div className="mb-4">
                <label htmlFor="edit_email" className="block text-sm font-medium text-slate-700 mb-1">Email:</label>
                <input type="email" id="edit_email" value={editUserFormData.email || ''} onChange={e => setEditUserFormData(prev => ({ ...prev, email: e.target.value }))} className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div className="mb-4">
                <label htmlFor="edit_password" className="block text-sm font-medium text-slate-700 mb-1">New Password (optional):</label>
                <input type="password" id="edit_password" placeholder="Leave blank to keep current" onChange={e => setEditUserFormData(prev => ({ ...prev, password: e.target.value }))} className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Role:</label>
                 <div className="flex flex-wrap gap-3">
                  {rolesForSelection.map(roleKey => (
                    <button
                      type="button"
                      key={roleKey}
                      onClick={() => setEditUserFormData(prev => ({ ...prev, role: roleKey }))}
                      className={`py-2 px-4 rounded-full text-sm font-medium border-2 transition ${editUserFormData.role === roleKey ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-600 border-indigo-500 hover:bg-indigo-50'}`}
                    >
                      {formatRoleName(roleKey)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4 mt-2 border-t border-slate-200">
                <button type="button" onClick={() => !isSaving && (setEditModalVisible(false), setCurrentUserForEdit(null))} disabled={isSaving} className="py-2 px-6 rounded-lg text-slate-700 bg-slate-200 hover:bg-slate-300 transition font-medium">Cancel</button>
                <button type="submit" disabled={isSaving} className="py-2 px-6 rounded-lg text-white bg-green-600 hover:bg-green-700 transition font-medium flex items-center justify-center gap-2 w-40"> {/* Save Changes için genişlik ayarı */}
                  {isSaving ? <FaSpinner className="animate-spin" /> : <><FaSave className="mr-1"/> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}