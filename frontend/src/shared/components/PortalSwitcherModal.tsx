import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck, CalendarRange, Globe, ArrowRight } from 'lucide-react';
import { Modal } from './Modal';

export interface PortalSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PortalSwitcherModal: React.FC<PortalSwitcherModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const portals = [
    {
      name: 'Public Website',
      role: 'Visitor / Explorer',
      description: 'Landing page, event exploration, and ticket discovery.',
      path: '/',
      icon: Globe,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
    },
    {
      name: 'Student User Portal',
      role: 'Attending Student',
      description: 'Academic verification, CGPA discounts, digital pass vault, bookings.',
      path: '/user/dashboard',
      icon: User,
      color: 'text-brand-400 bg-brand-500/10 border-brand-500/20'
    },
    {
      name: 'Organizer Portal',
      role: 'Event Host / Club Lead',
      description: 'Event creation wizard, ticket sales metrics, live attendance & gate scanner.',
      path: '/organizer/dashboard',
      icon: CalendarRange,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      name: 'Admin Portal',
      role: 'Platform Administrator',
      description: 'Platform oversight, event approvals, user management, and security audit log.',
      path: '/admin/dashboard',
      icon: ShieldCheck,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    }
  ];

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Switch VirtuPass Portal"
      description="Quickly switch between VirtuPass interfaces in development/demo mode"
      maxWidth="xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
        {portals.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.path}
              onClick={() => handleSelect(p.path)}
              className="flex flex-col text-left p-4 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-850 hover:border-slate-700 transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-lg border ${p.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="font-bold text-white text-sm group-hover:text-brand-400 transition-colors">
                {p.name}
              </h4>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{p.role}</p>
              <p className="text-xs text-slate-400 mt-2 line-clamp-2">{p.description}</p>
            </button>
          );
        })}
      </div>
    </Modal>
  );
};
