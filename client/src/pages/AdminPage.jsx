import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchAdminStats,
  fetchAdminUsers,
  updateUserRole,
  updateUserActiveStatus
} from '../api/admin.js';
import { useAuth } from '../context/AuthContext.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { Spinner } from '../components/Spinner.jsx';
import { Pagination } from '../components/Pagination.jsx';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from 'recharts';
import {
  ShieldCheck,
  Users,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Search,
  Filter,
  UserCheck,
  UserX,
  RefreshCw
} from 'lucide-react';

export function AdminPage() {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Users management state
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetchAdminStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      toast.error('Failed to load platform stats');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetchAdminUsers({
        q: userSearch.trim() || undefined,
        role: roleFilter || undefined,
        page: userPage,
        limit: 10
      });
      if (res.success && res.data) {
        setUsers(res.data.items || []);
        setUserTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  }, [userSearch, roleFilter, userPage]);

  useEffect(() => {
    loadStats();
    loadUsers();
  }, [loadStats, loadUsers]);

  const handleRoleChange = async (targetUser, newRole) => {
    try {
      const res = await updateUserRole(targetUser._id, newRole);
      if (res.success) {
        toast.success(`Role updated for ${targetUser.name} to ${newRole}`);
        loadUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update user role');
    }
  };

  const handleActiveToggle = async (targetUser) => {
    try {
      const newActive = !targetUser.isActive;
      const res = await updateUserActiveStatus(targetUser._id, newActive);
      if (res.success) {
        toast.success(`User ${newActive ? 'activated' : 'deactivated'}`);
        loadUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to toggle active status');
    }
  };

  const categoryBarColors = ['#6366f1', '#ec4899', '#8b5cf6', '#06b6d4', '#f59e0b'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Platform Administration Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            System Analytics & Governance
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor real-time workshop volume, attendance ratios, and manage platform user permissions
          </p>
        </div>

        <button
          onClick={() => {
            loadStats();
            loadUsers();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* --- STAT CARDS --- */}
      {loadingStats || !stats ? (
        <div className="min-h-[160px] flex justify-center items-center">
          <Spinner size="lg" className="text-purple-500" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400">Total Users</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">{stats.totalUsers}</div>
          </div>

          <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400">Total Events</span>
              <Calendar className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">{stats.totalEvents}</div>
          </div>

          <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400">Confirmed Regs</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">
              {stats.totalConfirmedRegistrations}
            </div>
          </div>

          <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400">Overall Attendance</span>
              <TrendingUp className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">
              {stats.overallAttendanceRate}%
            </div>
          </div>
        </div>
      )}

      {/* --- CHARTS SECTION --- */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Registrations last 30 days (Line Chart, 2 cols on lg) */}
          <div className="lg:col-span-2 p-6 bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl">
            <h3 className="text-base font-bold text-white mb-1">Registrations Over Time (Last 30 Days)</h3>
            <p className="text-xs text-slate-400 mb-6">Daily attendee registration volume across all events</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.registrationsLast30Days}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={10}
                    tickFormatter={(str) => str.slice(5)}
                  />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    dot={{ fill: '#8b5cf6', r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Events by Category (Bar Chart) */}
          <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl">
            <h3 className="text-base font-bold text-white mb-1">Events by Category</h3>
            <p className="text-xs text-slate-400 mb-6">Distribution across event types</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.eventsByCategory}>
                  <XAxis dataKey="category" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {stats.eventsByCategory.map((entry, index) => (
                      <Cell key={`cat-${index}`} fill={categoryBarColors[index % categoryBarColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Events by Registrations (Horizontal/Standard Bar Chart, spans full 3 cols) */}
          <div className="lg:col-span-3 p-6 bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl">
            <h3 className="text-base font-bold text-white mb-1">Top Workshops by Attendee Registrations</h3>
            <p className="text-xs text-slate-400 mb-6">Top performing sessions by total confirmed attendees</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topEventsByRegistrations}>
                  <XAxis dataKey="title" stroke="#64748b" fontSize={10} tickFormatter={(t) => (t.length > 20 ? t.slice(0, 18) + '...' : t)} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  />
                  <Bar dataKey="confirmed" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* --- USERS TABLE SECTION --- */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white">Platform User Governance</h3>
            <p className="text-xs text-slate-400">Search users, promote organizers, and manage account statuses</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute inset-y-0 left-3 my-auto text-slate-500" />
              <input
                type="text"
                placeholder="Search user name or email..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Role filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setUserPage(1);
              }}
              className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="">All Roles</option>
              <option value="attendee">Attendees</option>
              <option value="organizer">Organizers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {loadingUsers ? (
          <div className="py-12 flex justify-center">
            <Spinner size="md" className="text-purple-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center text-slate-400 text-sm">
            No users found matching your filters.
          </div>
        ) : (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/70 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Current Role</th>
                    <th className="px-6 py-4">Role Assignment</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Account Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {users.map((u) => {
                    const isSelf = currentUser?._id === u._id;
                    const isAdmin = u.role === 'admin';

                    return (
                      <tr key={u._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white flex items-center gap-2">
                            <span>{u.name}</span>
                            {isSelf && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">{u.email}</div>
                        </td>

                        <td className="px-6 py-4">
                          <StatusBadge status={u.role} type="role" />
                        </td>

                        <td className="px-6 py-4">
                          {isAdmin || isSelf ? (
                            <span className="text-xs text-slate-500 italic">Protected</span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u, e.target.value)}
                              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            >
                              <option value="attendee">Attendee</option>
                              <option value="organizer">Organizer</option>
                            </select>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                              u.isActive ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            <span>{u.isActive ? 'Active' : 'Deactivated'}</span>
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          {isSelf ? (
                            <span className="text-xs text-slate-600 italic">Cannot self-modify</span>
                          ) : (
                            <button
                              onClick={() => handleActiveToggle(u)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                u.isActive
                                  ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20'
                              }`}
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-800">
              <Pagination page={userPage} totalPages={userTotalPages} onPageChange={(p) => setUserPage(p)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
