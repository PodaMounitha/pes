import React, { useEffect, useState, type JSX } from 'react';
import {
  FiMenu,
  FiLogOut,
  FiHome,
  FiShield,
  FiDownload,
  FiEdit,
  FiSend,
  FiSun, // For light mode icon
  FiMoon, // For dark mode icon
} from 'react-icons/fi';
import { motion, AnimatePresence } from "framer-motion"; // For advanced animations

interface FlaggedEvaluation {
  _id: string;
  evaluation: {
    _id: string;
    evaluatee: {
      name: string;
      email: string;
    };
    evaluator: {
      name: string;
      email: string;
    };
    marks: number[];
    feedback?: string;
    exam: {
      title: string;
      startTime?: string;
      endTime?: string;
      numQuestions?: number;
      course?: {
        name: string;
        code: string;
        startDate?: string;
        endDate?: string;
      }
    }
  };
  flaggedBy: {
    name: string;
    email: string;
  };
  reason?: string;
  resolutionStatus: 'pending' | 'resolved' | 'escalated';
}

const PORT = import.meta.env.VITE_BACKEND_PORT || 5000;

// Custom "Pinkish, Lilac, Purple & Yellow" Palette - Revised Mix (Light Mode)
const lightPalette = {
    'bg-primary': '#FFFBF6',         // Very Light Creamy Yellow (dominant background)
    'bg-secondary': '#FFFAF2',       // Slightly darker creamy yellow (for card/section backgrounds)
    'accent-bright-yellow': '#FFD700', // Bright Gold/Yellow (main energetic accent)
    'accent-light-yellow': '#FFECB3', // Lighter Yellow (for subtle use)
    'accent-pink': '#FF8DA1',        // Primary Pink Accent
    'accent-lilac': '#C8A2C8',       // Soft Lilac (modern cool accent)
    'accent-purple': '#800080',      // Deep Purple (primary purple accent)
    'accent-light-purple': '#DDA0DD', // Medium Lilac/Purple (for subtle use)
    'sidebar-bg': '#E6E6FA',         // Lavender Blush (sidebar background)
    'text-dark': '#4B0082',          // Indigo (Very Dark Purple for primary text on light backgrounds)
    'text-muted': '#A9A9A9',         // Dark Gray (Medium Gray for secondary text/borders)
    'text-sidebar-dark': '#4B0082', // Dark text for sidebar for contrast on light lavender
    'border-soft': '#F0E6EF',        // Very Light Pinkish-Purple for subtle borders
    'shadow-light': 'rgba(128, 0, 128, 0.04)',  // Very light, subtle purple shadows
    'shadow-medium': 'rgba(128, 0, 128, 0.08)', // Medium subtle purple shadows
    'shadow-strong': 'rgba(128, 0, 128, 0.15)', // Stronger subtle purple shadows
    'white': '#FFFFFF',               // Add white for button text
};

const darkPalette = {
    'bg-primary': '#1A1A2E',
    'bg-secondary': '#16213E',
    'accent-bright-yellow': '#FFEB3B',
    'accent-light-yellow': '#FFEE58',
    'accent-pink': '#EC407A',
    'accent-lilac': '#9C27B0',
    'accent-purple': '#6A1B9A',
    'accent-light-purple': '#8E24AA',
    'sidebar-bg': '#0F3460',
    'text-dark': '#E0E0E0',
    'text-muted': '#B0BEC5',
    'text-sidebar-dark': '#E0E0E0',
    'border-soft': '#3F51B5',
    'shadow-light': 'rgba(0, 0, 0, 0.2)',
    'shadow-medium': 'rgba(0, 0, 0, 0.4)',
    'shadow-strong': 'rgba(0, 0, 0, 0.6)',
    'white': '#FFFFFF',               // Add white for button text
};

type Palette = typeof lightPalette;

const getColors = (isDarkMode: boolean): Palette => isDarkMode ? darkPalette : lightPalette;

const TADashboard = ({ onLogout }: { onLogout?: () => void }) => {
  const [activePage, setActivePage] = useState("home");
  const [showSidebar, setShowSidebar] = useState(true);
  const [logoutDialog, setLogoutDialog] = useState(false);
  const [darkMode, setDarkMode] = useState(false); // Initial state for dark mode
  const [commentDialog, setCommentDialog] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });
  const [comment, setComment] = useState('');
  const [updateMarksDialog, setUpdateMarksDialog] = useState<{
    show: boolean;
    id: string | null;
    evaluation?: any;
  }>({ show: false, id: null });
  const [newMarks, setNewMarks] = useState<number[]>([]);
  const [flaggedEvaluations, setFlaggedEvaluations] = useState<FlaggedEvaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const token = localStorage.getItem('token');
  const currentPalette = getColors(darkMode); // Get current palette based on dark mode state

  // Effect to apply/remove dark mode class from the document html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  // Fetch flagged evaluations from backend
  const fetchFlaggedEvaluations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:${PORT}/api/ta/flagged-evaluations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch flagged evaluations');
      }

      const data = await response.json();
      setFlaggedEvaluations(data.flaggedEvaluations || []);
    } catch (err) {
      console.error('Error fetching flagged evaluations:', err);
      setError('Failed to load flagged evaluations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlaggedEvaluations();
  }, [activePage]);

  const handleDownloadTranscript = async (evaluationId: string) => {
    try {
      const response = await fetch(`http://localhost:${PORT}/api/ta/submission/${evaluationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download submission');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `submission_${evaluationId}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading transcript:', err);
      setError('Failed to download submission. Please try again.');
    }
  };

  const handleUpdateMarks = async (flagId: string) => {
    try {
      const flag = flaggedEvaluations.find(ev => ev._id === flagId);
      if (!flag) return;

      setNewMarks([...flag.evaluation.marks]);
      setUpdateMarksDialog({
        show: true,
        id: flagId,
        evaluation: flag.evaluation
      });
    } catch (err) {
      console.error('Error preparing marks update:', err);
      setError('Failed to prepare marks update. Please try again.');
    }
  };

  const handleMarkChange = (index: number, value: string) => {
    const updatedMarks = [...newMarks];
    updatedMarks[index] = Number(value);
    setNewMarks(updatedMarks);
  };

  const confirmUpdateMarks = async () => {
    if (!updateMarksDialog.id) return;

    try {
      setLoading(true);

      const invalidMarks = newMarks.some(mark =>
        isNaN(mark) || mark < 0 || mark > 20
      );

      if (invalidMarks) {
        alert("Please enter valid marks between 0 and 20 for all questions");
        return;
      }

      const response = await fetch(`http://localhost:${PORT}/api/ta/resolve-flag/${updateMarksDialog.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resolution: 'Marks updated by TA',
          newMarks: newMarks,
          feedback: `Marks updated by TA on ${new Date().toLocaleDateString()}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update marks');
      }

      setSuccessMessage('Marks updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);

      fetchFlaggedEvaluations();
    } catch (err) {
      console.error('Error updating marks:', err);
      setError('Failed to update marks. Please try again.');
    } finally {
      setLoading(false);
      setUpdateMarksDialog({ show: false, id: null });
      setNewMarks([]);
    }
  };

  const handleSendToTeacher = (flagId: string) => {
    setCommentDialog({ show: true, id: flagId });
  };

  const confirmSendToTeacher = async () => {
    if (!commentDialog.id) return;

    try {
      setLoading(true);

      const response = await fetch(`http://localhost:${PORT}/api/ta/escalate/${commentDialog.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: comment })
      });

      if (!response.ok) {
        throw new Error('Failed to escalate to teacher');
      }

      setSuccessMessage('Flag escalated to teacher successfully');
      setTimeout(() => setSuccessMessage(null), 3000);

      fetchFlaggedEvaluations();
    } catch (err) {
      console.error('Error escalating to teacher:', err);
      setError('Failed to escalate to teacher. Please try again.');
    } finally {
      setLoading(false);
      setCommentDialog({ show: false, id: null });
      setComment('');
    }
  };

  // Common Tailwind classes for cards and buttons based on the new palette
  const commonCardClasses = `
    rounded-xl p-6 space-y-4 border transition-all duration-300
    hover:shadow-xl transform hover:translate-y-[-4px]
  `;
  const getCardStyles = () => ({
    backgroundColor: currentPalette['bg-secondary'],
    borderColor: currentPalette['border-soft'],
    boxShadow: `0 8px 20px ${currentPalette['shadow-medium']}`,
  });

  const commonButtonClasses = `
    px-6 py-2 rounded-lg hover:opacity-90 transition-all duration-200 shadow-md active:scale-95 transform
    focus:outline-none focus:ring-2 focus:ring-offset-2
  `;
  const getButtonStyles = (colorKey: keyof Palette, textColorKey: keyof Palette = 'text-dark') => ({
    backgroundColor: currentPalette[colorKey],
    color: currentPalette[textColorKey],
    boxShadow: `0 4px 15px ${currentPalette[colorKey]}40`,
    // @ts-ignore
    '--tw-ring-color': currentPalette[colorKey] + '50', // For focus ring
  });


  const DialogBox = ({ show, message, children }: { show: boolean, message: string, children?: React.ReactNode }) => {
    if (!show) return null;
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="rounded-lg p-6 w-80 text-center shadow-2xl"
          style={{ backgroundColor: currentPalette['bg-primary'], boxShadow: `0 8px 25px ${currentPalette['shadow-strong']}` }}
        >
          <div className="mb-2">
            {/* The SVG color is static, so it will not change with dark mode */}
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <circle cx="28" cy="28" r="28" fill="#6ddf99" />
              <path d="M18 30l7 7 13-13" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-lg font-semibold text-center mb-1" style={{ color: currentPalette['text-dark'] }}>{message}</div>
          {children}
        </motion.div>
      </motion.div>
    );
  };

  const renderContent = () => {
    const pages: Record<string, JSX.Element> = {
      home: (
        <div className="flex flex-col items-center justify-start w-full h-full pt-10 pb-4">
          <h1 className="text-4xl font-bold text-center mb-6" style={{ color: currentPalette['text-dark'] }}>
            Welcome to TA Dashboard
          </h1>

          {error && (
            <div className="border text-red-700 px-4 py-3 rounded-lg mb-4 w-full max-w-2xl"
                 style={{ backgroundColor: currentPalette['accent-pink'] + '10', borderColor: currentPalette['accent-pink'] + '40', color: currentPalette['accent-pink'] + '90' }}>
              {error}
            </div>
          )}

          {successMessage && (
            <div className="border text-green-700 px-4 py-3 rounded-lg mb-4 w-full max-w-2xl"
                 style={{ backgroundColor: currentPalette['accent-light-purple'] + '10', borderColor: currentPalette['accent-light-purple'] + '40', color: currentPalette['accent-purple'] + '90' }}>
              {successMessage}
            </div>
          )}

          <div className="mt-10 flex flex-col items-center w-full max-w-2xl">
            <div className={`border rounded-3xl p-8 w-full shadow flex flex-col items-center`}
                 style={getCardStyles()}>
              <h2 className="text-2xl font-bold mb-2" style={{ color: currentPalette['accent-purple'] }}>Flagged Evaluations</h2>
              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: currentPalette['accent-purple'] }}></div>
                </div>
              ) : flaggedEvaluations.length === 0 ? (
                <p className="text-center mb-2" style={{ color: currentPalette['text-muted'] }}>
                  No flagged evaluations at the moment.
                </p>
              ) : (
                <ul className="w-full">
                  {flaggedEvaluations.slice(0, 3).map(flag => (
                    <li key={flag._id} className="mb-2 rounded-xl p-3 shadow text-left"
                        style={{ backgroundColor: currentPalette['bg-primary'], color: currentPalette['text-dark'], boxShadow: `0 2px 8px ${currentPalette['shadow-light']}` }}>
                      <div className="flex justify-between">
                        <span className="font-semibold">{flag.evaluation.evaluatee.name}</span>
                        <span className="text-sm" style={{ color: currentPalette['accent-pink'] }}>{flag.evaluation.exam.title}</span>
                      </div>
                      <p className="text-sm mt-1" style={{ color: currentPalette['text-muted'] }}>{flag.reason || "No reason provided"}</p>
                      <div className="mt-2 flex justify-end space-x-2">
                        <button
                          onClick={() => handleUpdateMarks(flag._id)}
                          className="text-sm hover:underline flex items-center gap-1"
                          style={{ color: currentPalette['accent-lilac'] }}
                        >
                          <FiEdit size={14} /> Update
                        </button>
                        <button
                          onClick={() => handleSendToTeacher(flag._id)}
                          className="text-sm hover:underline flex items-center gap-1"
                          style={{ color: currentPalette['accent-purple'] }}
                        >
                          <FiSend size={14} /> Escalate
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {flaggedEvaluations.length > 3 && (
                <button
                  onClick={() => setActivePage("flagged")}
                  className="mt-4 hover:underline"
                  style={{ color: currentPalette['accent-purple'] }}
                >
                  View all ({flaggedEvaluations.length})
                </button>
              )}
            </div>
          </div>
        </div>
      ),
      flagged: (
        <div className="flex flex-col items-center justify-start w-full h-full pt-10 pb-4">
          <h2 className="text-3xl font-bold text-center mb-8" style={{ color: currentPalette['accent-purple'] }}>Flagged Evaluations</h2>

          {error && (
            <div className="border px-4 py-3 rounded-lg mb-4 w-full max-w-4xl"
                 style={{ backgroundColor: currentPalette['accent-pink'] + '10', borderColor: currentPalette['accent-pink'] + '40', color: currentPalette['accent-pink'] + '90' }}>
              {error}
            </div>
          )}

          {successMessage && (
            <div className="border px-4 py-3 rounded-lg mb-4 w-full max-w-4xl"
                 style={{ backgroundColor: currentPalette['accent-light-purple'] + '10', borderColor: currentPalette['accent-light-purple'] + '40', color: currentPalette['accent-purple'] + '90' }}>
              {successMessage}
            </div>
          )}

          <div className="w-full max-w-4xl">
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: currentPalette['accent-purple'] }}></div>
              </div>
            ) : flaggedEvaluations.length === 0 ? (
              <p className="text-center" style={{ color: currentPalette['text-muted'] }}>No flagged evaluations at the moment.</p>
            ) : (
              <ul className="space-y-4">
                {flaggedEvaluations.map(flag => (
                  <li key={flag._id} className={`${commonCardClasses}`} style={getCardStyles()}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p style={{ color: currentPalette['text-muted'] }}>Student:</p>
                        <p className="font-semibold" style={{ color: currentPalette['text-dark'] }}>{flag.evaluation.evaluatee.name}</p>
                        <p className="text-sm" style={{ color: currentPalette['text-muted'] }}>{flag.evaluation.evaluatee.email}</p>
                      </div>
                      <div>
                        <p style={{ color: currentPalette['text-muted'] }}>Evaluator:</p>
                        <p className="font-semibold" style={{ color: currentPalette['text-dark'] }}>{flag.evaluation.evaluator.name}</p>
                        <p className="text-sm" style={{ color: currentPalette['text-muted'] }}>{flag.evaluation.evaluator.email}</p>
                      </div>
                      <div>
                        <p style={{ color: currentPalette['text-muted'] }}>Course:</p>
                        <p className="font-semibold" style={{ color: currentPalette['text-dark'] }}>{flag.evaluation.exam.course?.name || 'N/A'}</p>
                        <p className="text-sm" style={{ color: currentPalette['text-muted'] }}>
                          Code: {flag.evaluation.exam.course?.code || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: currentPalette['text-muted'] }}>Exam:</p>
                        <p className="font-semibold" style={{ color: currentPalette['text-dark'] }}>{flag.evaluation.exam.title}</p>
                        <p className="text-sm" style={{ color: currentPalette['text-muted'] }}>
                          Questions: {flag.evaluation.exam.numQuestions || 'N/A'}
                        </p>
                        {flag.evaluation.exam.startTime && (
                          <p className="text-sm" style={{ color: currentPalette['text-muted'] }}>
                            Start: {new Date(flag.evaluation.exam.startTime).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div>
                        <p style={{ color: currentPalette['text-muted'] }}>Current Marks:</p>
                        <div className="mt-1 grid grid-cols-5 gap-1">
                          {flag.evaluation.marks.map((mark: number, idx: number) => (
                            <div key={idx} className="rounded-lg p-2 text-center" style={{ backgroundColor: currentPalette['bg-primary'], color: currentPalette['text-dark'] }}>
                              <div className="text-xs" style={{ color: currentPalette['text-muted'] }}>Q{idx+1}</div>
                              <div className="font-semibold">{mark}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-right font-semibold" style={{ color: currentPalette['text-dark'] }}>
                          Total: {Math.round(flag.evaluation.marks.reduce((sum: number, mark: number) => sum + mark, 0))}
                          /{flag.evaluation.marks.length * 20}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p style={{ color: currentPalette['text-muted'] }}>Flag Reason:</p>
                      <p className="italic p-3 rounded-lg mt-1" style={{ backgroundColor: currentPalette['accent-pink'] + '10', color: currentPalette['text-dark'] }}>{flag.reason || "No reason provided"}</p>
                    </div>

                    {flag.evaluation.feedback && (
                      <div className="mt-4">
                        <p style={{ color: currentPalette['text-muted'] }}>Feedback:</p>
                        <p className="italic p-3 rounded-lg mt-1" style={{ backgroundColor: currentPalette['accent-light-purple'] + '10', color: currentPalette['text-dark'] }}>{flag.evaluation.feedback}</p>
                      </div>
                    )}

                    <div className="mt-6 flex justify-end space-x-4">
                      <button
                        onClick={() => handleDownloadTranscript(flag.evaluation._id)}
                        className="flex items-center gap-2 hover:underline"
                        style={{ color: currentPalette['accent-lilac'] }}
                      >
                        <FiDownload /> Download Submission
                      </button>
                      <button
                        onClick={() => handleUpdateMarks(flag._id)}
                        className="flex items-center gap-2 hover:underline"
                        style={{ color: currentPalette['accent-purple'] }}
                      >
                        <FiEdit /> Update Marks
                      </button>
                      <button
                        onClick={() => handleSendToTeacher(flag._id)}
                        className="flex items-center gap-2 hover:underline"
                        style={{ color: currentPalette['accent-pink'] }}
                      >
                        <FiSend /> Send to Teacher
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )
    };
    return (
      <AnimatePresence mode="wait">
        <motion.div
            key={activePage} // Key is crucial for AnimatePresence to detect changes
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full" // Ensure it takes full width within the container
        >
          {pages[activePage]}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: currentPalette['bg-primary'] }}>
      {/* Subtle background pattern for visual interest, blending with white */}
      <div className="absolute inset-0 z-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='${encodeURIComponent(currentPalette['text-muted'])}' fill-opacity='0.1' fill-rule='evenodd'%3E%3Cpath d='M3 0L0 3l3 3 3-3z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px',
          background: `linear-gradient(135deg, ${currentPalette['bg-primary']} 0%, ${currentPalette['bg-primary']} 50%, ${currentPalette['bg-primary']} 100%)`
      }}></div>

      {/* Sidebar */}
      <motion.div
          className={`flex flex-col justify-between py-6 px-4 rounded-r-3xl transition-all duration-300 shadow-xl z-20 overflow-hidden ${showSidebar ? 'w-64' : 'w-20'}`}
          style={{
              backgroundColor: currentPalette['sidebar-bg'],
              backgroundImage: `linear-gradient(180deg, ${currentPalette['sidebar-bg']}, ${currentPalette['sidebar-bg']}E0)`,
              boxShadow: `8px 0 30px ${currentPalette['shadow-medium']}`
          }}
      >
          <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="self-start mb-6 p-2 border-2 border-transparent rounded-full active:scale-95 transition-transform duration-200 focus:outline-none focus:ring-2"
              style={{ borderColor: currentPalette['accent-lilac'], '--tw-ring-color': currentPalette['accent-lilac'] + '70' } as React.CSSProperties & Record<string, any>}
          >
              <FiMenu className="text-2xl" style={{ color: currentPalette['text-sidebar-dark'] }} />
          </button>
          <div className="flex-1 flex flex-col items-center">
              <h2 className={`font-bold mb-10 mt-4 transition-all duration-300 ${showSidebar ? 'text-2xl' : 'text-lg'}`} style={{ color: currentPalette['text-sidebar-dark'] }}>
                  {showSidebar ? 'TA Panel' : 'TA'}
              </h2>
              <ul className="space-y-3 w-full">
                  {[
                      { key: 'home', icon: FiHome, label: 'Dashboard' },
                      { key: 'flagged', icon: FiShield, label: 'Flagged Evaluations' }
                  ].map(({ key, icon: Icon, label }) => (
                      <motion.li
                          key={key}
                          onClick={() => setActivePage(key)}
                          className={`cursor-pointer flex items-center px-4 py-2 rounded-lg transition-all duration-200 transform
                               ${activePage === key ? 'scale-100 relative' : 'hover:scale-[1.02]'}
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                          `}
                          style={{
                              color: currentPalette['text-sidebar-dark'],
                          }}
                          whileHover={{ scale: 1.03, x: 5, boxShadow: `0 0 10px ${currentPalette['shadow-light']}` }}
                          whileTap={{ scale: 0.98 }}
                      >
                          {activePage === key && (
                              <motion.div
                                  layoutId="activePill"
                                  className="absolute inset-0 rounded-lg -z-10"
                                  style={{
                                      backgroundColor: currentPalette['accent-light-purple'] + '20',
                                      boxShadow: `0 0 15px ${currentPalette['accent-light-purple']}40`
                                  }}
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              />
                          )}
                          <Icon className={`transition-all duration-300 ${showSidebar ? 'mr-3 text-xl' : 'text-3xl'}`} />
                          {showSidebar && <span className="font-medium whitespace-nowrap">`{label}`</span>}
                      </motion.li>
                  ))}
              </ul>
          </div>
          <motion.button
              onClick={() => setLogoutDialog(true)}
              className="flex items-center justify-center gap-2 hover:opacity-80 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 mt-auto" // Added mt-auto to push to bottom
              style={{ color: currentPalette['text-sidebar-dark'] }}
              whileHover={{ scale: 1.03, x: 5 }}
              whileTap={{ scale: 0.98 }}
          >
              <FiLogOut className={`${showSidebar ? 'mr-3 text-xl' : 'text-3xl'}`} />
              {showSidebar && <span className="font-medium whitespace-nowrap">Logout</span>}
          </motion.button>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-y-auto p-4 flex flex-col z-10">
          <div
              className="rounded-xl shadow-xl w-full h-auto mt-8 mb-8 p-6 flex items-start justify-center overflow-auto max-w-5xl mx-auto transform transition-all duration-300"
              style={{
                  minHeight: "calc(100vh - 64px)", // Adjusted minHeight based on p-4
                  backgroundColor: currentPalette['bg-secondary'], // Changed to bg-secondary for card
                  boxShadow: `0 10px 40px ${currentPalette['shadow-medium']}`
              }}
          >
              {renderContent()}
          </div>
      </div>

      {/* Logout Dialog */}
      <AnimatePresence>
          {logoutDialog && (
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              >
                  <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="rounded-lg p-6 w-80 text-center shadow-2xl"
                      style={{ backgroundColor: currentPalette['bg-primary'], boxShadow: `0 8px 25px ${currentPalette['shadow-strong']}` }}
                  >
                      <p className="text-lg font-semibold" style={{ color: currentPalette['text-dark'] }}>Are you sure you want to logout?</p>
                      <div className="flex justify-around mt-6 space-x-4">
                          <button
                              onClick={() => setLogoutDialog(false)}
                              className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors duration-200 active:scale-95 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                              style={{
                                  backgroundColor: currentPalette['bg-secondary'],
                                  color: currentPalette['text-dark'],
                                  boxShadow: `0 2px 10px ${currentPalette['shadow-light']}`
                              }}
                          >
                              Cancel
                          </button>
                          <button
                              onClick={() => { setLogoutDialog(false); onLogout ? onLogout() : window.location.href = "/login"; }}
                              className={`${commonButtonClasses} focus:ring-offset-2`}
                              style={getButtonStyles('accent-purple', 'white')}
                          >
                              Logout
                          </button>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* Comment Dialog */}
      <AnimatePresence>
          {commentDialog.show && (
              <DialogBox show={commentDialog.show} message="Add a comment before sending">
                  <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Write your note here..."
                      className="w-full border rounded-lg p-2 mb-4"
                      style={{
                          backgroundColor: currentPalette['bg-secondary'],
                          borderColor: currentPalette['border-soft'],
                          color: currentPalette['text-dark']
                      }} rows={3} />
                  <div className="flex gap-4">
                      <button onClick={() => setCommentDialog({ show: false, id: null })}
                          className="px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
                          style={{
                              backgroundColor: currentPalette['bg-secondary'],
                              color: currentPalette['text-dark'],
                              boxShadow: `0 2px 10px ${currentPalette['shadow-light']}`
                          }}
                      >Cancel</button>
                      <button onClick={confirmSendToTeacher}
                          className={`${commonButtonClasses}`}
                          style={getButtonStyles('accent-purple', 'white')}
                      >Send</button>
                  </div>
              </DialogBox>
          )}
      </AnimatePresence>

      {/* Update Marks Dialog */}
      <AnimatePresence>
          {updateMarksDialog.show && (
              <DialogBox show={updateMarksDialog.show} message="Update evaluation marks">
                  <div className="w-full mb-4">
                      <div className="text-sm mb-3" style={{ color: currentPalette['text-muted'] }}>Enter marks for each question (0-20):</div>

                      {newMarks.map((mark, index) => (
                          <div key={index} className="mb-3">
                              <label className="block text-sm font-medium mb-1" style={{ color: currentPalette['text-dark'] }}>
                                  Question {index + 1}:
                              </label>
                              <input
                                  type="number"
                                  min="0"
                                  max="20"
                                  value={mark}
                                  onChange={(e) => handleMarkChange(index, e.target.value)}
                                  className="w-full border rounded-lg p-2"
                                  style={{
                                      backgroundColor: currentPalette['bg-secondary'],
                                      borderColor: currentPalette['border-soft'],
                                      color: currentPalette['text-dark']
                                  }}
                              />
                          </div>
                      ))}

                      <div className="mt-3 text-right">
                          <strong style={{ color: currentPalette['text-dark'] }}>
                              Total: {newMarks.reduce((sum, mark) => sum + mark, 0)} / {(updateMarksDialog.evaluation?.exam?.numQuestions || newMarks.length) * 20}
                          </strong>
                      </div>
                  </div>

                  <div className="flex gap-4">
                      <button
                          onClick={() => setUpdateMarksDialog({ show: false, id: null })}
                          className="px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
                          style={{
                              backgroundColor: currentPalette['bg-secondary'],
                              color: currentPalette['text-dark'],
                              boxShadow: `0 2px 10px ${currentPalette['shadow-light']}`
                          }}
                      >
                          Cancel
                      </button>
                      <button
                          onClick={confirmUpdateMarks}
                          className={`${commonButtonClasses}`}
                          style={getButtonStyles('accent-purple', 'white')}
                      >
                          Save Changes
                      </button>
                  </div>
              </DialogBox>
          )}
      </AnimatePresence>

      {/* Floating Dark Mode Toggle */}
      <div className="fixed bottom-6 right-6 z-20">
          <button
              onClick={toggleDarkMode}
              className="h-12 w-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                  backgroundColor: darkMode ? currentPalette['accent-purple'] : currentPalette['accent-lilac'],
                  color: 'white', // Ensure text color is white for both modes
                  boxShadow: darkMode ? `0 4px 15px ${currentPalette['accent-purple']}60` : `0 4px 15px ${currentPalette['accent-lilac']}60`,
                  // @ts-ignore
                  ['--tw-ring-color' as any]: darkMode ? currentPalette['accent-purple'] + '70' : currentPalette['accent-lilac'] + '70'
              } as React.CSSProperties & Record<string, any>}
          >
              {darkMode ? (
                  <FiMoon className="w-6 h-6" />
              ) : (
                  <FiSun className="w-6 h-6" />
              )}
          </button>
      </div>
    </div>
  );
};

export default TADashboard;