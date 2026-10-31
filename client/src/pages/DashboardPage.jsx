import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyRegistrations, cancelRegistration, fetchRegistrationQr, fetchCertificate } from '../api/registrations.js';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { formatDate } from '../components/EventCard.jsx';
import { Spinner } from '../components/Spinner.jsx';
import { Pagination } from '../components/Pagination.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { QrModal } from '../components/QrModal.jsx';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  MapPin,
  QrCode,
  Award,
  MessageSquare,
  XCircle,
  FileText,
  AlertCircle,
  CheckCircle2,
  Download,
  FolderDown
} from 'lucide-react';

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState('confirmed');
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Cancellation state
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // QR Modal state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);

  // Feedback Modal state
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackEventId, setFeedbackEventId] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Resources state
  const [resourcesModalOpen, setResourcesModalOpen] = useState(false);
  const [currentEventResources, setCurrentEventResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);

  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMyRegistrations({
        status: activeTab,
        page,
        limit: 10
      });

      if (res.success && res.data) {
        setRegistrations(res.data.items || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleOpenQr = async (reg) => {
    setSelectedReg(reg);
    setQrDataUrl(null);
    setQrModalOpen(true);
    try {
      const res = await fetchRegistrationQr(reg._id);
      if (res.success && res.data?.qrDataUrl) {
        setQrDataUrl(res.data.qrDataUrl);
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to generate QR code');
    }
  };

  const handleDownloadCertificate = async (reg) => {
    const toastId = toast.loading('Generating your certificate...');
    try {
      const response = await fetchCertificate(reg._id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${reg._id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Certificate downloaded!', { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Certificate not yet eligible or available', {
        id: toastId
      });
    }
  };

  const handleOpenFeedback = (reg) => {
    setFeedbackEventId(reg.event._id);
    setRating(5);
    setComment('');
    setFeedbackModalOpen(true);
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackEventId) return;

    setSubmittingFeedback(true);
    try {
      const { submitFeedback } = await import('../api/feedback.js');
      const res = await submitFeedback(feedbackEventId, { rating, comment });
      if (res.success) {
        toast.success('Thank you for your feedback!');
        setFeedbackModalOpen(false);
        loadRegistrations();
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleOpenResources = async (reg) => {
    setResourcesModalOpen(true);
    setLoadingResources(true);
    setCurrentEventResources([]);
    try {
      const { fetchEventResources } = await import('../api/resources.js');
      const res = await fetchEventResources(reg.event._id);
      if (res.success) {
        setCurrentEventResources(res.data || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to load event resources');
    } finally {
      setLoadingResources(false);
    }
  };

  const handleDownloadResource = async (resourceId, originalName) => {
    try {
      const { downloadResource } = await import('../api/resources.js');
      const res = await downloadResource(resourceId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Download failed');
    }
  };

  const handleCancelRegistration = async () => {
    if (!cancelTargetId) return;
    setCancelling(true);
    try {
      const res = await cancelRegistration(cancelTargetId);
      if (res.success) {
        toast.success('Registration cancelled');
        setCancelTargetId(null);
        loadRegistrations();
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to cancel registration');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          My Registrations
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage your passes, check waitlist positions, download verified certificates, and access workshop resources
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6 space-x-6 text-sm font-semibold">
        {['confirmed', 'waitlisted', 'cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`pb-3 capitalize transition-all relative ${
              activeTab === tab
                ? 'text-indigo-400 border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Registrations List */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-12">
          <Spinner size="lg" className="text-indigo-500 mb-3" />
          <p className="text-sm font-medium text-slate-400">Loading registrations...</p>
        </div>
      ) : registrations.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white">No {activeTab} registrations</h3>
          <p className="mt-1.5 text-sm text-slate-400">
            {activeTab === 'confirmed'
              ? 'You have not confirmed registration for any upcoming events yet.'
              : `No registrations found under ${activeTab}.`}
          </p>
          {activeTab === 'confirmed' && (
            <Link
              to="/"
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all"
            >
              <span>Explore Workshops</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map((reg) => {
            const event = reg.event;
            if (!event) return null;

            const isCompleted = event.phase === 'completed';
            const isStarted = new Date(event.startTime) <= new Date();
            const canGetCertificate = reg.attended && isCompleted;
            const canGiveFeedback = reg.attended && isCompleted;

            return (
              <div
                key={reg._id}
                className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 sm:p-6 transition-all hover:border-slate-700 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6"
              >
                {/* Event info */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={reg.status} type="registration" />
                    {reg.status === 'waitlisted' && reg.waitlistPosition && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Position #{reg.waitlistPosition} in queue
                      </span>
                    )}
                    {reg.attended && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Attended</span>
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/events/${event._id}`}
                    className="text-lg font-bold text-white hover:text-indigo-300 transition-colors block leading-snug"
                  >
                    {event.title}
                  </Link>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{formatDate(event.startTime)}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="capitalize">{event.mode}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                  {/* Show QR button (confirmed only) */}
                  {reg.status === 'confirmed' && (
                    <button
                      onClick={() => handleOpenQr(reg)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Show QR Pass</span>
                    </button>
                  )}

                  {/* Resources button (confirmed only) */}
                  {reg.status === 'confirmed' && (
                    <button
                      onClick={() => handleOpenResources(reg)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                      <FolderDown className="w-4 h-4" />
                      <span>Materials</span>
                    </button>
                  )}

                  {/* Certificate button (attended + completed) */}
                  {canGetCertificate && (
                    <button
                      onClick={() => handleDownloadCertificate(reg)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                    >
                      <Award className="w-4 h-4" />
                      <span>Certificate</span>
                    </button>
                  )}

                  {/* Feedback button (attended + completed) */}
                  {canGiveFeedback && (
                    <button
                      onClick={() => handleOpenFeedback(reg)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Review</span>
                    </button>
                  )}

                  {/* Cancel registration button (before start & not attended) */}
                  {reg.status !== 'cancelled' && !isStarted && !reg.attended && (
                    <button
                      onClick={() => setCancelTargetId(event._id)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{reg.status === 'waitlisted' ? 'Leave Waitlist' : 'Cancel'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
        </div>
      )}

      {/* QR Code Modal */}
      <QrModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        qrDataUrl={qrDataUrl}
        registration={selectedReg}
      />

      {/* Confirm Cancellation Modal */}
      <ConfirmModal
        isOpen={Boolean(cancelTargetId)}
        title="Cancel Registration"
        message="Are you sure you want to cancel this registration? A waitlisted attendee will be automatically promoted to take your place."
        confirmText="Yes, Cancel Registration"
        loading={cancelling}
        onConfirm={handleCancelRegistration}
        onCancel={() => setCancelTargetId(null)}
      />

      {/* Feedback Modal */}
      {feedbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-2">Give Workshop Feedback</h3>
            <p className="text-xs text-slate-400 mb-6">
              Rate your experience to help the organizer improve future sessions.
            </p>

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Rating (1 to 5 Stars)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-2xl p-2 rounded-xl transition-transform hover:scale-110 ${
                        rating >= star ? 'text-amber-400' : 'text-slate-600'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Comments (Optional, max 1000 chars)
                </label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={1000}
                  placeholder="What did you like the most? Any areas to improve?"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFeedbackModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {submittingFeedback ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resources Modal */}
      {resourcesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-1">Workshop Resources</h3>
            <p className="text-xs text-slate-400 mb-6">
              Download presentation slides, reference materials, and workbooks
            </p>

            {loadingResources ? (
              <div className="py-8 flex justify-center">
                <Spinner size="md" className="text-indigo-400" />
              </div>
            ) : currentEventResources.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">
                No materials have been uploaded by the organizer for this event yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {currentEventResources.map((res) => (
                  <div
                    key={res._id}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-indigo-400" />
                      <div>
                        <div className="text-sm font-semibold text-white">{res.title}</div>
                        <div className="text-[11px] text-slate-500">
                          {res.originalName} • {(res.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadResource(res._id, res.originalName)}
                      className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setResourcesModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
