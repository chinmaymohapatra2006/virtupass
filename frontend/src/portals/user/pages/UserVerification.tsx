import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  RefreshCw,
  ArrowRight,
  AlertCircle,
  KeyRound,
  Lock,
  Building2,
  Clock,
  Award
} from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Card } from '../../../shared/components/Card';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { useAuth } from '../../../shared/hooks/useAuth';
import { apiClient } from '../../../shared/services/apiClient';
import { VerificationRecord } from '../../../shared/types';

export const UserVerification: React.FC = () => {
  const { user, refetchUser } = useAuth();

  // Workflow state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [verificationState, setVerificationState] = useState<string>('NOT_STARTED');
  const [studentIdInput, setStudentIdInput] = useState<string>(user?.studentId || 'VIT20260001');

  // CAPTCHA State
  const [captchaChallenge, setCaptchaChallenge] = useState<{ challengeId: string; question: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState<string>('');

  // OTP State
  const [otpChallengeId, setOtpChallengeId] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] = useState<string>('123456');
  const [devOtpNotice, setDevOtpNotice] = useState<string | null>(null);

  // Result State
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load existing status on mount
  useEffect(() => {
    async function loadStatus() {
      try {
        const status = await apiClient.getVerificationStatus();
        if ('state' in status && status.state === 'VERIFIED') {
          const verifiedRecord = status as VerificationRecord;
          setVerificationState('VERIFIED');
          setVerificationResult({
            verifiedCgpa: verifiedRecord.verifiedCgpa || user?.cgpa || 9.72,
            verifiedTier: verifiedRecord.verifiedTier || user?.academicTier || 'Tier 1',
            discountPercentage: verifiedRecord.discountPercentage || 35,
            academicSummary: verifiedRecord.academicRecord || {
              studentId: verifiedRecord.studentId || user?.studentId || 'VIT20260001',
              studentName: user?.fullName || 'Aarav Sharma',
              institution: user?.collegeName || 'Vellore Institute of Technology',
              department: user?.department || 'Computer Science & Engineering'
            }
          });
          setCurrentStep(5);
        }
      } catch {}
    }
    loadStatus();
  }, [user]);

  // Step 1: Start Verification
  const handleStartVerification = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await apiClient.startVerification(studentIdInput);
      setVerificationState(res.state);
      setCaptchaChallenge(res.captcha);
      setCurrentStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to start verification');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Submit CAPTCHA
  const handleVerifyCaptcha = async () => {
    if (!captchaChallenge) return;
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await apiClient.verifyCaptcha(captchaChallenge.challengeId, captchaAnswer);
      setVerificationState(res.verificationState);
      setOtpChallengeId(res.otpChallengeId);
      setDevOtpNotice(res.devOtpMessage || 'Demo OTP: 123456');
      setCurrentStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || 'CAPTCHA validation failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Submit OTP
  const handleVerifyOtp = async () => {
    if (!otpChallengeId) return;
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await apiClient.verifyOtp(otpChallengeId, enteredOtp);
      setVerificationState(res.verificationState);
      setCurrentStep(4);
      // Auto-trigger completion
      await handleCompleteVerification();
    } catch (err: any) {
      setErrorMsg(err.message || 'OTP validation failed');
      setIsLoading(false);
    }
  };

  // Step 4: Complete Verification & Academic Lookup
  const handleCompleteVerification = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.completeVerification();
      setVerificationState(res.verificationState);
      setVerificationResult(res);
      await refetchUser();
      setCurrentStep(5);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to retrieve academic records');
      setVerificationState('FAILED');
    } finally {
      setIsLoading(false);
    }
  };

  const sampleStudentIds = [
    { id: 'VIT20260001', cgpa: '9.72 (35% Off)' },
    { id: 'VIT20260002', cgpa: '9.50 (30% Off)' },
    { id: 'VIT20260003', cgpa: '9.00 (25% Off)' },
    { id: 'VIT20260004', cgpa: '8.50 (20% Off)' },
    { id: 'VIT20260005', cgpa: '8.20 (15% Off)' }
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <PageHeader
        title="Simulated Academic Verification"
        description="Verify student enrollment and CGPA through the simulated university system to unlock automated merit discounts."
        badge={
          verificationState === 'VERIFIED' ? (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified Academic Identity
            </Badge>
          ) : (
            <Badge variant="warning" className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Verification {verificationState.replace('_', ' ')}
            </Badge>
          )
        }
      />

      {/* Hackathon Simulation Notice */}
      <div className="p-4 rounded-2xl bg-amber-950/25 border border-amber-500/25 flex items-start gap-3">
        <Building2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200 leading-relaxed">
          <strong>Hackathon Simulation Notice:</strong> This is a deterministic demo verification pipeline connected to the mock university service. It does not access live university portals or store institutional passwords.
        </div>
      </div>

      {/* Progress Steps Header */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { num: 1, label: 'Student ID' },
          { num: 2, label: 'CAPTCHA' },
          { num: 3, label: 'OTP Code' },
          { num: 4, label: 'Verified Status' }
        ].map((s) => {
          const isDone = currentStep > s.num || (s.num === 4 && verificationState === 'VERIFIED');
          const isCurrent = currentStep === s.num && verificationState !== 'VERIFIED';

          return (
            <div
              key={s.num}
              className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                  : isCurrent
                  ? 'bg-brand-600/15 border-brand-500 text-brand-300'
                  : 'bg-slate-900/40 border-slate-800 text-slate-500'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isDone
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isCurrent
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </div>
              <span className="text-xs font-bold truncate hidden sm:inline">{s.label}</span>
            </div>
          );
        })}
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: Student ID & University Selection */}
      {currentStep === 1 && (
        <Card variant="glass" padding="lg" className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white">Step 1: Institutional Credential Lookup</h3>
            <p className="text-xs text-slate-400 mt-1">
              Select or enter your collegiate student ID to query the simulated academic directory.
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
              Sample Test Student Records (Click to fill):
            </span>
            <div className="flex flex-wrap gap-2">
              {sampleStudentIds.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStudentIdInput(item.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition-all cursor-pointer ${
                    studentIdInput === item.id
                      ? 'bg-brand-600 text-white border-brand-400'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {item.id} ({item.cgpa})
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Student Identification Number"
              placeholder="e.g. VIT20260001"
              value={studentIdInput}
              onChange={(e) => setStudentIdInput(e.target.value.toUpperCase())}
              className="font-mono"
              required
            />
            <Input
              label="Institution / University"
              defaultValue="Vellore Institute of Technology"
              readOnly
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <Button
              variant="primary"
              size="md"
              onClick={handleStartVerification}
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Initiate Verification
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: CAPTCHA Challenge */}
      {currentStep === 2 && captchaChallenge && (
        <Card variant="glass" padding="lg" className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Step 2: Security Bot Challenge</h3>
              <p className="text-xs text-slate-400 mt-1">
                Answer the simulated mathematical challenge to confirm genuine student request.
              </p>
            </div>
            <button
              onClick={handleStartVerification}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {/* CAPTCHA Display Card */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center font-mono">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Simulated Challenge</p>
            <div className="text-xl sm:text-2xl font-black text-brand-300 tracking-wider">
              {captchaChallenge.question}
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Enter Security Solution"
              placeholder="Enter numerical answer"
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              className="text-center font-mono text-lg"
              autoFocus
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep(1)}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleVerifyCaptcha}
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Verify Challenge
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: OTP Verification */}
      {currentStep === 3 && (
        <Card variant="glass" padding="lg" className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white">Step 3: One-Time Passcode (OTP)</h3>
            <p className="text-xs text-slate-400 mt-1">
              Enter the 6-digit confirmation code dispatched to your student email.
            </p>
          </div>

          {devOtpNotice && (
            <div className="p-3.5 rounded-xl bg-brand-950/40 border border-brand-500/30 text-brand-300 text-xs font-semibold flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-brand-400" />
              <span>{devOtpNotice}</span>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Enter 6-Digit OTP"
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value)}
              placeholder="e.g. 123456"
              className="text-center font-mono text-xl tracking-widest"
              maxLength={6}
              autoFocus
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep(2)}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleVerifyOtp}
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Confirm OTP & Query Academic Database
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4: Processing Animation */}
      {currentStep === 4 && (
        <Card variant="glass" padding="lg" className="text-center py-12 space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-brand-500 animate-spin mx-auto" />
          <h3 className="text-base font-bold text-white">Querying Mock University Directory...</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Cryptographically validating institutional enrollment and determining merit CGPA tier.
          </p>
        </Card>
      )}

      {/* STEP 5: Verification Success Card */}
      {currentStep === 5 && verificationResult && (
        <Card variant="glass" padding="lg" className="border-emerald-500/30 bg-emerald-950/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">Academic Record Verified</h3>
                  <Badge variant="success">Institutional Pass Active</Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Authenticated through Simulated University Directory Service
                </p>
              </div>
            </div>

            <span className="text-xs font-mono text-slate-400">
              Verified: {new Date().toLocaleTimeString()}
            </span>
          </div>

          {/* Academic Details Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block mb-1">Student ID</span>
              <span className="font-mono font-bold text-white text-sm">
                {verificationResult.academicSummary?.studentId}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block mb-1">Verified CGPA</span>
              <span className="font-extrabold text-emerald-400 text-lg">
                {verificationResult.verifiedCgpa}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block mb-1">Merit Tier</span>
              <span className="font-bold text-brand-300 text-sm">
                {verificationResult.verifiedTier}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block mb-1">Auto-Discount</span>
              <span className="font-extrabold text-amber-400 text-lg">
                {verificationResult.discountPercentage}% Off
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-brand-950/20 border border-brand-500/20 text-xs text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span>
                Your <strong>{verificationResult.discountPercentage}% CGPA discount</strong> is now live on all campus hackathons and festivals.
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentStep(1);
                setVerificationState('NOT_STARTED');
              }}
            >
              Test Another ID
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
