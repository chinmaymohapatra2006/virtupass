import React from 'react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Card } from '../../../shared/components/Card';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Building, Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react';

export const OrganizerProfile: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="Organizer Organization Profile"
        description="Official collegiate club details, institutional verification status, and gate scanner credentials."
        badge={<Badge variant="success">Verified Campus Partner</Badge>}
      />

      <Card variant="glass" padding="lg">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-800">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-3xl font-extrabold text-white shadow-xl shadow-teal-600/30">
            S
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl font-extrabold text-white">Spider Tech Club & Dept of CSE</h3>
            <p className="text-xs text-slate-400 mt-1">
              National Institute of Technology, Trichy • Est. 2003
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                Official Student Tech Body
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Authorized Event Host
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Club Lead / Representative" defaultValue="Vikramaditya Rao" />
            <Input label="Faculty Advisor Email" defaultValue="spider.lead@nitt.edu" readOnly />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Host College / Institute" defaultValue="National Institute of Technology, Trichy" readOnly />
            <Input label="Campus Department" defaultValue="Computer Science & Engineering" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Emergency Contact Mobile" defaultValue="+91 94444 12345" />
            <Input label="Campus Headquarters" defaultValue="CSE Block 2, NIT Trichy" />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">Club credentials signed by NIT Trichy Student Council</span>
          <Button variant="primary" size="sm" onClick={() => alert('Saved organizer preferences (demo)')}>
            Save Changes
          </Button>
        </div>
      </Card>
    </div>
  );
};
