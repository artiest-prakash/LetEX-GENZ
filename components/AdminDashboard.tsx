
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Icons } from './Icons';
import { UserProfile } from '../types';

export const AdminDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Statistics
  const stats = {
    totalUsers: users.length,
    proUsers: users.filter(u => u.is_pro).length,
    bannedUsers: users.filter(u => u.is_banned).length,
    totalCredits: users.reduce((acc, curr) => acc + (curr.credits || 0), 0)
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      alert("Failed to fetch users");
    } else {
      setUsers(data as UserProfile[]);
    }
    setLoading(false);
  };

  const handleUpdateUser = async (userId: string, updates: Partial<UserProfile>) => {
    setActionLoading(userId);
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      alert("Update failed: " + error.message);
    } else {
      // Optimistic update
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    }
    setActionLoading(null);
  };

  const handleTogglePro = async (user: UserProfile) => {
    const isBecomingPro = !user.is_pro;
    const currentCredits = user.credits || 0;
    
    // Logic: If becoming Pro, add 1000 credits. If removing Pro, leave credits as is (or remove, but usually we keep them).
    // As per user request: "Promember :- 1000 credits + 15free credits / month"
    // We will add 1000 credits as a "Welcome Pro" bonus.
    
    const updates: Partial<UserProfile> = {
        is_pro: isBecomingPro
    };

    if (isBecomingPro) {
        updates.credits = currentCredits + 1000;
        alert(`Upgrading ${user.full_name} to Pro and adding 1000 credits.`);
    }

    await handleUpdateUser(user.id, updates);
  };

  const handleGiftCredits = async (userId: string, currentCredits: number) => {
    const amountStr = prompt("Enter amount of credits to gift:", "100");
    if (!amountStr) return;
    const amount = parseInt(amountStr);
    if (isNaN(amount)) return;

    handleUpdateUser(userId, { credits: currentCredits + amount });
  };

  const filteredUsers = users.filter(user => 
    (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.id.includes(searchTerm))
  );

  return (
    <div className="w-full min-h-screen bg-slate-50 pb-20">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white px-6 py-8 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <Icons.ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Icons.Cpu className="w-6 h-6 text-blue-400" />
                Admin Command Center
              </h1>
              <p className="text-slate-400 text-sm">LetEX System Management</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm font-mono">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.totalUsers}</div>
              <div className="text-slate-500 uppercase text-[10px]">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.proUsers}</div>
              <div className="text-slate-500 uppercase text-[10px]">Pro Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{stats.totalCredits}</div>
              <div className="text-slate-500 uppercase text-[10px]">Circulating Credits</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Search Bar */}
        <div className="mb-6 relative">
          <Icons.ZoomIn className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search users by email, name or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* User Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Credits</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading users...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No users found.</td></tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${user.is_pro ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}`}>
                             {user.avatar_url ? (
                               <img src={user.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
                             ) : (
                               <div className="w-full h-full rounded-full bg-slate-400 flex items-center justify-center">
                                 {user.email?.charAt(0).toUpperCase()}
                               </div>
                             )}
                             {user.is_pro && (
                               <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 border-2 border-white">
                                 <Icons.Check className="w-2 h-2" />
                               </div>
                             )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 flex items-center gap-2">
                              {user.full_name || 'Unknown'}
                              {user.is_banned && <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-[10px] uppercase font-bold">BANNED</span>}
                            </div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                            <div className="text-[10px] text-slate-300 font-mono">{user.id}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleTogglePro(user)}
                          className={`
                            px-3 py-1 rounded-full text-xs font-bold border transition-all
                            ${user.is_pro 
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100' 
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}
                          `}
                        >
                          {user.is_pro ? 'PRO MEMBER' : 'FREE TIER'}
                        </button>
                      </td>

                      <td className="px-6 py-4 font-mono text-sm">
                        <div className="flex items-center gap-2">
                          <span className={user.credits < 5 ? 'text-red-500 font-bold' : 'text-slate-700'}>
                            {user.credits}
                          </span>
                          <button 
                            onClick={() => handleGiftCredits(user.id, user.credits)}
                            className="p-1 hover:bg-green-50 text-green-600 rounded"
                            title="Gift Credits"
                          >
                            <Icons.Refresh className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                           <button 
                             onClick={() => handleUpdateUser(user.id, { is_banned: !user.is_banned })}
                             className={`p-2 rounded-lg border transition-colors ${user.is_banned ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200'}`}
                             title={user.is_banned ? "Unban User" : "Ban User"}
                           >
                              <Icons.Close className="w-4 h-4" />
                           </button>
                           {/* Add 1000 Credits Quick Action */}
                           <button 
                             onClick={() => handleUpdateUser(user.id, { credits: (user.credits || 0) + 1000 })}
                             className="p-2 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-green-600 hover:border-green-200 hover:bg-green-50 transition-colors"
                             title="Quick Add 1000 Credits"
                           >
                              <Icons.Users className="w-4 h-4" />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
