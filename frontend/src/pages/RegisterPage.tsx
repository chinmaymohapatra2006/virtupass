import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, User, Building, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '../shared/components/Card';
import { Button } from '../shared/components/Button';
import { Input } from '../shared/components/Input';
import { useAuth } from '../shared/hooks/useAuth';

export const RegisterPage: React.FC = () => {
  const [tab, setTab] = useState<'student' | 'organizer'>('student');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organizerRegisteredNotice, setOrganizerRegisteredNotice] = useState(false);

  const { registerStudent, registerOrganizer } = useAuth();
  const navigate = useNavigate();

  // Student Form State
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    email: '',
    studentId: '',
    collegeName: 'Vellore Institute of Technology',
    department: 'Computer Science & Engineering',
    yearOfStudy: 3,
    password: '',
    confirmPassword: ''
  });

  // Organizer Form State
  const [orgForm, setOrgForm] = useState({
    fullName: '',
    organizationName: '',
    email: '',
    contactNumber: '',
    collegeName: '',
    password: '',
    confirmPassword: ''
  });

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (studentForm.password !== studentForm.confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    if (studentForm.password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerStudent(studentForm);
      navigate('/user/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (orgForm.password !== orgForm.confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    if (orgForm.password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerOrganizer(orgForm);
      setOrganizerRegisteredNotice(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Organizer registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 mx-auto flex items-center justify-center text-white shadow-xl shadow-brand-600/30">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white">Join VirtuPass</h2>
          <p className="text-xs text-slate-400">One Identity. One Verified Pass. One Seamless Entry.</p>
        </div>

        {/* Role Tab Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => { setTab('student'); setErrorMsg(null); }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              tab === 'student'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Student Registration</span>
          </button>

          <button
            type="button"
            onClick={() => { setTab('organizer'); setErrorMsg(null); }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              tab === 'organizer'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Organizer Application</span>
          </button>
        </div>

        {/* Organizer Pending Approval Notice */}
        {organizerRegisteredNotice && (
          <Card variant="default" padding="md" className="border-teal-500/30 bg-teal-950/20">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-white text-sm">Organizer Account Created!</h4>
                <p className="text-slate-300">
                  Your organizer profile has been submitted and is currently <strong>PENDING_APPROVAL</strong>. Once platform administration verifies your college affiliation, your event creation privileges will be activated.
                </p>
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="accent"
                    onClick={() => navigate('/organizer/dashboard')}
                  >
                    Go to Organizer Portal
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Form Card */}
        {!organizerRegisteredNotice && (
          <Card variant="glass" padding="lg">
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {tab === 'student' ? (
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    placeholder="e.g. Kavya Menon"
                    value={studentForm.fullName}
                    onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                    required
                  />
                  <Input
                    label="Student ID / Roll No"
                    placeholder="e.g. VIT20260002"
                    value={studentForm.studentId}
                    onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                    required
                  />
                </div>

                <Input
                  label="Institutional Email"
                  type="email"
                  placeholder="e.g. kavya.m@college.edu"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="College / University"
                    value={studentForm.collegeName}
                    onChange={(e) => setStudentForm({ ...studentForm, collegeName: e.target.value })}
                    required
                  />
                  <Input
                    label="Department"
                    value={studentForm.department}
                    onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Year of Study
                  </label>
                  <select
                    value={studentForm.yearOfStudy}
                    onChange={(e) => setStudentForm({ ...studentForm, yearOfStudy: Number(e.target.value) })}
                    className="w-full bg-slate-900/90 text-slate-100 rounded-xl border border-slate-700/80 px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-500"
                  >
                    <option value={1}>1st Year (Freshman)</option>
                    <option value={2}>2nd Year (Sophomore)</option>
                    <option value={3}>3rd Year (Junior)</option>
                    <option value={4}>4th Year (Senior)</option>
                    <option value={5}>5th Year (Dual Degree)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Min 8 chars, 1 uppercase, 1 digit"
                    value={studentForm.password}
                    onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                    required
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="Confirm password"
                    value={studentForm.confirmPassword}
                    onChange={(e) => setStudentForm({ ...studentForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full mt-4"
                  isLoading={isSubmitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Create Student Account
                </Button>
              </form>
            ) : (
              <form onSubmit={handleOrgSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Organizer Name"
                    placeholder="e.g. Tanmay Saxena"
                    value={orgForm.fullName}
                    onChange={(e) => setOrgForm({ ...orgForm, fullName: e.target.value })}
                    required
                  />
                  <Input
                    label="Organization / Club"
                    placeholder="e.g. Pilani Cultural Association"
                    value={orgForm.organizationName}
                    onChange={(e) => setOrgForm({ ...orgForm, organizationName: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Official Email"
                    type="email"
                    placeholder="e.g. pca.lead@college.edu"
                    value={orgForm.email}
                    onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
                    required
                  />
                  <Input
                    label="Contact Number"
                    placeholder="e.g. +91 98765 43210"
                    value={orgForm.contactNumber}
                    onChange={(e) => setOrgForm({ ...orgForm, contactNumber: e.target.value })}
                    required
                  />
                </div>

                <Input
                  label="Host College / Affiliation"
                  placeholder="e.g. BITS Pilani"
                  value={orgForm.collegeName}
                  onChange={(e) => setOrgForm({ ...orgForm, collegeName: e.target.value })}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Min 8 chars, 1 uppercase, 1 digit"
                    value={orgForm.password}
                    onChange={(e) => setOrgForm({ ...orgForm, password: e.target.value })}
                    required
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="Confirm password"
                    value={orgForm.confirmPassword}
                    onChange={(e) => setOrgForm({ ...orgForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>

                <div className="p-3 rounded-xl bg-teal-950/30 border border-teal-500/20 text-[11px] text-teal-300">
                  New organizer accounts receive <strong>PENDING_APPROVAL</strong> status until validated by platform admins.
                </div>

                <Button
                  type="submit"
                  variant="accent"
                  size="md"
                  className="w-full mt-4"
                  isLoading={isSubmitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Submit Organizer Application
                </Button>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-400 hover:underline font-semibold">
                Sign In
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
