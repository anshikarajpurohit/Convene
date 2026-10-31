import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  fetchEventRegistrations,
  updateAttendance,
  scanQrAttendance
} from '../api/registrations.js';
import { fetchEventById, fetchEventStats } from '../api/events.js';
import { uploadResource, fetchEventResources, deleteResource } from '../api/resources.js';
import { fetchEventFeedback } from '../api/feedback.js';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { formatDate } from '../components/EventCard.jsx';
import { Spinner } from '../components/Spinner.jsx';
import { Pagination } from '../components/Pagination.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  ArrowLeft,
  Users,
  QrCode,
  FileText,
  MessageSquare,
  BarChart3,
  Search,
  CheckCircle2,
  XCircle,
  Upload,
  Trash2,
  Download,
  Star,
  Camera,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export function OrganizerManagePage() {
  const { id: eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('registrations');
  const [loading, setLoading] = useState(true);

  // --- Registrations Tab State ---
  const [registrations, setRegistrations] = useState([]);
  const [regStatus, setRegStatus] = useState('');
  const [regSearch, setRegSearch] = useState('');
  const [regPage, setRegPage] = useState(1);
  const [regTotalPages, setRegTotalPages] = useState(1);
  const [regLoading, setRegLoading] = useState(false);

  // --- Check-in Tab State ---
  const [manualToken, setManualToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const scannerRef = useRef(null);

  // --- Resources Tab State ---
  const [resources, setResources] = useState([]);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceFile, setResourceFile] = useState(null);
  const [uploadingResource, setUploadingResource] = useState(false);
  const [deleteResourceId, setDeleteResourceId] = useState(null);

  // --- Feedback Tab State ---
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // --- Stats Tab State ---
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Load Event info
  const loadEvent = useCallback(async () => {
    try {
      const res = await fetchEventById(eventId);
      if (res.success) setEvent(res.data);
    } catch (err) {
      toast.error('Failed to load event details');
    }
  }, [eventId]);

  // Load Registrations
  const loadRegistrations = useCallback(async () => {
    setRegLoading(true);
    try {
      const res = await fetchEventRegistrations(eventId, {
        status: regStatus || undefined,
        q: regSearch.trim() || undefined,
        page: regPage,
        limit: 10
      });
      if (res.success) {
        setRegistrations(res.data.items || []);
        setRegTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      toast.error('Failed to load registrations');
    } finally {
      setRegLoading(false);
    }
  }, [eventId, regStatus, regSearch, regPage]);

  // Load Resources
  const loadResources = useCallback(async () => {
    try {
      const res = await fetchEventResources(eventId);
      if (res.success) setResources(res.data || []);
    } catch {
      // ignore
    }
  }, [eventId]);

  // Load Feedback
  const loadFeedback = useCallback(async () => {
    setFeedbackLoading(true);
    try {
      const res = await fetchEventFeedback(eventId);
      if (res.success) setFeedbacks(res.data?.items || []);
    } catch {
      // ignore
    } finally {
      setFeedbackLoading(false);
    }
  }, [eventId]);

  // Load Stats
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetchEventStats(eventId);
      if (res.success) setStats(res.data);
    } catch {
      // ignore
    } finally {
      setStatsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    Promise.all([loadEvent(), loadRegistrations()]).finally(() => setLoading(false));
  }, [loadEvent, loadRegistrations]);

  useEffect(() => {
    if (activeTab === 'registrations') loadRegistrations();
    if (activeTab === 'resources') loadResources();
    if (activeTab === 'feedback') loadFeedback();
    if (activeTab === 'stats') loadStats();
  }, [activeTab, loadRegistrations, loadResources, loadFeedback, loadStats]);

  // Initialize html5-qrcode scanner when Check-in tab is active
  useEffect(() => {
    if (activeTab === 'checkin') {
      let scanner = null;
      try {
        scanner = new Html5QrcodeScanner(
          'qr-reader',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true
          },
          false
        );

        scanner.render(
          async (decodedText) => {
            // Process scan
            scanner.pause(true);
            await handleScanSubmit(decodedText);
            setTimeout(() => {
              try {
                scanner.resume();
              } catch {
                // ignore
              }
            }, 2500);
          },
          () => {}
        );
        scannerRef.current = scanner;
      } catch (err) {
        console.warn('QR scanner failed to mount camera:', err);
      }

      return () => {
        if (scannerRef.current) {
          try {
            scannerRef.current.clear();
          } catch {
            // ignore
          }
        }
      };
    }
  }, [activeTab]);

  const handleManualToggleAttendance = async (reg) => {
    try {
      const newStatus = !reg.attended;
      const res = await updateAttendance(eventId, reg._id, newStatus);
      if (res.success) {
        toast.success(`Attendance updated for ${reg.user?.name}`);
        loadRegistrations();
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update attendance');
    }
  };

  const handleScanSubmit = async (tokenToScan) => {
    const token = tokenToScan || manualToken.trim();
    if (!token) {
      toast.error('Please enter or scan a QR token');
      return;
    }

    setScanning(true);
    setScanResult(null);
    try {
      const res = await scanQrAttendance(eventId, token);
      if (res.success) {
        setScanResult({
          success: true,
          message: `Checked in: ${res.data?.user?.name} (${res.data?.user?.email})`,
          attendee: res.data?.user,
          time: new Date(res.data?.attendedAt || Date.now()).toLocaleTimeString()
        });
        toast.success(`Check-in successful! Welcome ${res.data?.user?.name}`);
        setManualToken('');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || 'Check-in failed';
      setScanResult({
        success: false,
        message: errMsg
      });
      toast.error(errMsg);
    } finally {
      setScanning(false);
    }
  };

  const handleUploadResourceSubmit = async (e) => {
    e.preventDefault();
    if (!resourceTitle.trim() || !resourceFile) {
      toast.error('Please provide a resource title and file');
      return;
    }

    setUploadingResource(true);
    const formData = new FormData();
    formData.append('title', resourceTitle.trim());
    formData.append('file', resourceFile);

    try {
      await uploadResource(eventId, formData);
      toast.success('Resource uploaded successfully');
      setResourceTitle('');
      setResourceFile(null);
      loadResources();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Upload failed');
    } finally {
      setUploadingResource(false);
    }
  };

  const handleDeleteResourceConfirm = async () => {
    if (!deleteResourceId) return;
    try {
      await deleteResource(deleteResourceId);
      toast.success('Resource deleted');
      setDeleteResourceId(null);
      loadResources();
    } catch (err) {
      toast.error('Failed to delete resource');
    }
  };

  if (loading || !event) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-12">
        <Spinner size="lg" className="text-indigo-500 mb-3" />
        <p className="text-sm font-medium text-slate-400">Loading management console...</p>
      </div>
    );
  }

  // Chart data preparation for Stats tab
  const statusChartData = stats
    ? [
        { name: 'Confirmed', count: stats.confirmed, fill: '#6366f1' },
        { name: 'Waitlisted', count: stats.waitlisted, fill: '#f59e0b' },
        { name: 'Attended', count: stats.attended, fill: '#14b8a6' },
        { name: 'Cancelled', count: stats.cancelled, fill: '#f43f5e' }
      ]
    : [];

  const ratingChartData = stats
    ? [
        { star: '5 ★', count: stats.ratingDistribution['5'] || 0 },
        { star: '4 ★', count: stats.ratingDistribution['4'] || 0 },
        { star: '3 ★', count: stats.ratingDistribution['3'] || 0 },
        { star: '2 ★', count: stats.ratingDistribution['2'] || 0 },
        { star: '1 ★', count: stats.ratingDistribution['1'] || 0 }
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Link
            to="/organizer"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-2 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Organizer Studio</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {event.title}
            </h1>
            <StatusBadge status={event.phase} type="phase" />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {formatDate(event.startTime)} • {event.mode.toUpperCase()} • Speaker: {event.speakerName}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 mb-8 overflow-x-auto no-scrollbar space-x-6 text-sm font-semibold">
        {[
          { key: 'registrations', label: 'Registrations', icon: Users },
          { key: 'checkin', label: 'QR Check-in', icon: QrCode },
          { key: 'resources', label: 'Materials & Resources', icon: FileText },
          { key: 'feedback', label: 'Feedback Reviews', icon: MessageSquare },
          { key: 'stats', label: 'Performance Stats', icon: BarChart3 }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 pb-3 whitespace-nowrap transition-all relative ${
                activeTab === tab.key
                  ? 'text-indigo-400 border-b-2 border-indigo-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- TAB 1: REGISTRATIONS --- */}
      {activeTab === 'registrations' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute inset-y-0 left-3 my-auto text-slate-500" />
              <input
                type="text"
                placeholder="Search attendee by name or email..."
                value={regSearch}
                onChange={(e) => {
                  setRegSearch(e.target.value);
                  setRegPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={regStatus}
                onChange={(e) => {
                  setRegStatus(e.target.value);
                  setRegPage(1);
                }}
                className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="waitlisted">Waitlisted</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <button
                onClick={loadRegistrations}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Registrations Table */}
          {regLoading ? (
            <div className="py-12 flex justify-center">
              <Spinner size="md" className="text-indigo-400" />
            </div>
          ) : registrations.length === 0 ? (
            <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-10 text-center text-slate-400 text-sm">
              No registrations found matching the current filters.
            </div>
          ) : (
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/70 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Attendee</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Registered Date</th>
                      <th className="px-6 py-4">Check-in Status</th>
                      <th className="px-6 py-4 text-right">Manual Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {registrations.map((reg) => (
                      <tr key={reg._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{reg.user?.name}</div>
                          <div className="text-xs text-slate-400">{reg.user?.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={reg.status} type="registration" />
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {new Date(reg.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4">
                          {reg.attended ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-teal-400 font-medium">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Attended ({new Date(reg.attendedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                              <XCircle className="w-4 h-4" />
                              <span>Not Checked In</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {reg.status === 'confirmed' ? (
                            <button
                              onClick={() => handleManualToggleAttendance(reg)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                reg.attended
                                  ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20'
                              }`}
                            >
                              {reg.attended ? 'Mark Unattended' : 'Mark Attended'}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-600 italic">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-slate-800">
                <Pagination page={regPage} totalPages={regTotalPages} onPageChange={(p) => setRegPage(p)} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: QR CHECK-IN --- */}
      {activeTab === 'checkin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner View */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">Camera QR Scanner</h3>
            </div>
            <p className="text-xs text-slate-400">
              Point your camera at the attendee's mobile QR code to automatically scan and verify attendance.
            </p>

            <div className="w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 p-2 min-h-[300px]">
              <div id="qr-reader" className="w-full"></div>
            </div>

            {/* Manual Token Input Fallback */}
            <div className="pt-4 border-t border-slate-800">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Manual Token Fallback
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste 64-character hex QR token..."
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
                <button
                  onClick={() => handleScanSubmit()}
                  disabled={scanning}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {scanning ? 'Verifying...' : 'Submit Token'}
                </button>
              </div>
            </div>
          </div>

          {/* Scanner Result Card */}
          <div className="space-y-6">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-3">Live Verification Feed</h3>

              {scanResult ? (
                <div
                  className={`p-5 rounded-2xl border ${
                    scanResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {scanResult.success ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-rose-400 flex-shrink-0" />
                    )}
                    <h4 className="font-bold text-base">
                      {scanResult.success ? 'Valid Ticket - Verified' : 'Scan Rejected'}
                    </h4>
                  </div>
                  <p className="text-sm">{scanResult.message}</p>
                  {scanResult.success && (
                    <div className="mt-3 pt-3 border-t border-emerald-500/20 text-xs text-slate-300">
                      Check-in time recorded: <strong>{scanResult.time}</strong>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500 text-sm">
                  Ready to scan. Scanner results will appear here in real-time.
                </div>
              )}
            </div>

            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 text-xs text-slate-400 space-y-2">
              <h4 className="font-bold text-slate-200">Attendance Window Policy:</h4>
              <p>
                Scanning is valid only from <strong>60 minutes prior to event start</strong> until{' '}
                <strong>120 minutes post event conclusion</strong>. Scans outside this window will be rejected with{' '}
                <code className="text-rose-400 font-mono">OUTSIDE_ATTENDANCE_WINDOW</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: MATERIALS & RESOURCES --- */}
      {activeTab === 'resources' && (
        <div className="space-y-8">
          {/* Upload Card */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-2">Upload Workshop Material</h3>
            <p className="text-xs text-slate-400 mb-6">
              Upload lecture slides, code files, and PDFs for confirmed attendees to download (max 10MB).
            </p>

            <form onSubmit={handleUploadResourceSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Document Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Session Slides & Architecture Diagrams"
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  File (PDF, PPT, DOC, PNG, JPG) *
                </label>
                <input
                  type="file"
                  onChange={(e) => setResourceFile(e.target.files[0])}
                  className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 file:cursor-pointer"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={uploadingResource}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploadingResource ? 'Uploading...' : 'Upload Resource'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Resources List */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4">Uploaded Files ({resources.length})</h3>

            {resources.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 text-center">
                No materials uploaded yet for this event.
              </p>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {resources.map((res) => (
                  <div key={res._id} className="py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-indigo-400" />
                      <div>
                        <div className="text-sm font-semibold text-white">{res.title}</div>
                        <div className="text-xs text-slate-500">
                          {res.originalName} • {(res.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteResourceId(res._id)}
                      className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete Material"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 4: FEEDBACK --- */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Attendee Reviews & Feedback</h3>
              <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                <Star className="w-5 h-5 fill-current" />
                <span>{event.avgRating ? `${event.avgRating} / 5` : 'No rating yet'}</span>
                {event.ratingCount > 0 && (
                  <span className="text-xs text-slate-400 font-normal">({event.ratingCount} reviews)</span>
                )}
              </div>
            </div>

            {feedbackLoading ? (
              <div className="py-8 flex justify-center">
                <Spinner size="md" className="text-indigo-400" />
              </div>
            ) : feedbacks.length === 0 ? (
              <p className="text-slate-500 text-sm py-6 text-center">
                No reviews submitted by attendees yet. Reviews become available once the workshop concludes.
              </p>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((fb) => (
                  <div
                    key={fb._id}
                    className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{fb.user?.name || 'Attendee'}</span>
                      <div className="flex items-center text-amber-400 text-xs">
                        {'★'.repeat(fb.rating)}
                        {'☆'.repeat(5 - fb.rating)}
                      </div>
                    </div>
                    {fb.comment && <p className="text-xs text-slate-300">{fb.comment}</p>}
                    <div className="text-[10px] text-slate-500">
                      Submitted on {new Date(fb.createdAt).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 5: STATS --- */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {statsLoading || !stats ? (
            <div className="py-12 flex justify-center">
              <Spinner size="lg" className="text-indigo-400" />
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl">
                  <div className="text-xs font-semibold uppercase text-slate-400">Confirmed</div>
                  <div className="text-2xl font-black text-indigo-400 mt-1">{stats.confirmed}</div>
                </div>

                <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl">
                  <div className="text-xs font-semibold uppercase text-slate-400">Waitlisted</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">{stats.waitlisted}</div>
                </div>

                <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl">
                  <div className="text-xs font-semibold uppercase text-slate-400">Attended</div>
                  <div className="text-2xl font-black text-teal-400 mt-1">{stats.attended}</div>
                </div>

                <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl">
                  <div className="text-xs font-semibold uppercase text-slate-400">Attendance Rate</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">{stats.attendanceRate}%</div>
                </div>
              </div>

              {/* Recharts Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl">
                  <h4 className="text-sm font-bold text-white mb-4">Registration Funnel</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusChartData}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl">
                  <h4 className="text-sm font-bold text-white mb-4">Rating Distribution</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ratingChartData}>
                        <XAxis dataKey="star" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                        />
                        <Bar dataKey="count" fill="#fbbf24" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Delete Resource Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteResourceId)}
        title="Delete Resource Material"
        message="Are you sure you want to delete this resource? Attendees will no longer be able to download it."
        confirmText="Yes, Delete File"
        onConfirm={handleDeleteResourceConfirm}
        onCancel={() => setDeleteResourceId(null)}
      />
    </div>
  );
}
