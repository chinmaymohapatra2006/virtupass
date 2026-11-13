import React from 'react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { VerificationBadge } from '../components/VerificationBadge';
import { User, Mail, School, ShieldCheck, Phone, MapPin } from 'lucide-react';

export const UserProfile: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="Student Profile & Identity"
        description="Your academic credential records and student pass identity."
        badge={<VerificationBadge status="verified" tier="Tier 1" />}
      />

      {/* Profile Overview Card */}
      <Card variant="glass" padding="lg">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-800">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-600 flex items-center justify-center text-3xl font-extrabold text-white shadow-xl shadow-brand-600/30">
            A
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl font-extrabold text-white">Aarav Sharma</h3>
            <p className="text-xs text-slate-400 mt-1">
              aarav.sharma@nitt.edu • B.Tech CSE (Batch of 2027)
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                National Institute of Technology, Trichy
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                9.30 CGPA Verified
              </span>
            </div>
          </div>
        </div>

        {/* Form fields */}
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" value="Aarav Sharma" readOnly leftIcon={<User className="w-4 h-4" />} />
            <Input label="Institutional Email" value="aarav.sharma@nitt.edu" readOnly leftIcon={<Mail className="w-4 h-4" />} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="University / College" value="NIT Trichy" readOnly leftIcon={<School className="w-4 h-4" />} />
            <Input label="Roll Number" value="106123042" readOnly leftIcon={<ShieldCheck className="w-4 h-4" />} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Contact Mobile" defaultValue="+91 98765 43210" leftIcon={<Phone className="w-4 h-4" />} />
            <Input label="Campus Hostel / Location" defaultValue="Garnet Hostel, NIT Trichy" leftIcon={<MapPin className="w-4 h-4" />} />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">Institutional records are immutable without admin re-verification</span>
          <Button variant="primary" size="sm" onClick={() => alert('Profile preferences updated (demo)')}>
            Save Preferences
          </Button>
        </div>
      </Card>
    </div>
  );
};
