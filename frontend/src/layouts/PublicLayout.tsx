import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../shared/components/Navbar';
import { ShieldCheck, Heart, Github, Twitter, Mail } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-brand-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-white">VirtuPass</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Smart College Fest Ticketing Platform. One Identity. One Verified Pass. One Seamless Entry.
            </p>
            <div className="flex items-center gap-3 pt-2 text-slate-400">
              <a href="#" className="hover:text-white transition-colors"><Github className="w-4 h-4" /></a>
              <a href="#" className="hover:text-white transition-colors"><Twitter className="w-4 h-4" /></a>
              <a href="#" className="hover:text-white transition-colors"><Mail className="w-4 h-4" /></a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Portals</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="/user/dashboard" className="hover:text-brand-400 transition-colors">Student Portal</a></li>
              <li><a href="/organizer/dashboard" className="hover:text-brand-400 transition-colors">Organizer Portal</a></li>
              <li><a href="/admin/dashboard" className="hover:text-brand-400 transition-colors">Admin Portal</a></li>
              <li><a href="/events" className="hover:text-brand-400 transition-colors">Explore Campus Fests</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Platform Specs</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><span className="text-slate-500">Frontend:</span> React + Vite + Tailwind (Vercel)</li>
              <li><span className="text-slate-500">Backend:</span> Fastify + TypeScript (Render)</li>
              <li><span className="text-slate-500">Storage:</span> In-Memory Structured Store</li>
              <li><span className="text-slate-500">Architecture:</span> Zero Database / REST API</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Notice</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              VirtuPass is configured for demo execution. Application state is held in-memory and will safely reset upon backend restart.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-500/10 border border-brand-500/20 text-brand-300 text-[11px] font-medium">
              <Heart className="w-3 h-3 text-rose-400" /> Hackathon Edition 2026
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© 2026 VirtuPass Technologies. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 text-[11px]">One Identity. One Verified Pass. One Seamless Entry.</p>
        </div>
      </footer>
    </div>
  );
};
