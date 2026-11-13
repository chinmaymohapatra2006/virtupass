import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  GraduationCap,
  Sparkles,
  QrCode,
  ArrowRight,
  CheckCircle2,
  Lock,
  Zap,
  Users,
  Building,
  Tag,
  Clock,
  Layers
} from 'lucide-react';
import { Button } from '../shared/components/Button';
import { EventCard } from '../shared/components/EventCard';
import { Card } from '../shared/components/Card';
import { Badge } from '../shared/components/Badge';
import { useEvents } from '../shared/hooks/useApi';

export const LandingPage: React.FC = () => {
  const { data: events } = useEvents();

  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-brand-600/20 via-indigo-500/20 to-teal-400/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span>Smart College Fest Ticketing Platform • 2026 Edition</span>
          </div>

          {/* Main Title & Tagline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.1]">
            One Identity. One Verified Pass.{' '}
            <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
              One Seamless Entry.
            </span>
          </h1>

          {/* Supporting Description */}
          <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Discover college events, verify your academic eligibility, unlock exclusive discounts, and enter events with secure digital tickets — all in one place.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/events" className="w-full sm:w-auto">
              <Button size="lg" variant="primary" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Explore Events
              </Button>
            </Link>
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full" leftIcon={<ShieldCheck className="w-5 h-5 text-brand-400" />}>
                Get Started
              </Button>
            </Link>
          </div>

          {/* Quick Portal Jump shortcuts for Reviewers */}
          <div className="mt-12 pt-8 border-t border-slate-800/80 max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">
              Explore The Three Distinct VirtuPass Portals:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/user/dashboard">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-brand-500/30 text-brand-300 text-xs font-semibold hover:bg-brand-950/40 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-brand-400" /> Student Portal
                </span>
              </Link>
              <Link to="/organizer/dashboard">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-teal-500/30 text-teal-300 text-xs font-semibold hover:bg-teal-950/40 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-teal-400" /> Organizer Portal
                </span>
              </Link>
              <Link to="/admin/dashboard">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-950/40 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Admin Portal
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW VIRTUPASS WORKS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="brand" className="mb-3">Streamlined 4-Step Lifecycle</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How VirtuPass Transforms Campus Ticketing
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            From single-sign-on academic verification to sub-second turnstile gate entry, everything is unified under one cryptographic passport.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'One-Time Academic Verification',
              desc: 'Verify institutional enrollment and CGPA once using university credentials or student documents.',
              icon: GraduationCap,
              color: 'from-brand-600 to-indigo-600'
            },
            {
              step: '02',
              title: 'Auto-Apply Merit Discounts',
              desc: 'High CGPA holders automatically receive tiered savings on hackathons, pro-shows, and technical symposiums.',
              icon: Tag,
              color: 'from-indigo-600 to-blue-600'
            },
            {
              step: '03',
              title: 'Tamper-Proof Digital Pass',
              desc: 'Receive dynamic, cryptographically signed mobile passes that rotate periodically to stop screenshot resale.',
              icon: Lock,
              color: 'from-blue-600 to-teal-600'
            },
            {
              step: '04',
              title: 'Rapid QR Gate Entry',
              desc: 'Organizers scan passes in milliseconds with low-latency optical validators — even in offline campus venues.',
              icon: QrCode,
              color: 'from-teal-600 to-emerald-600'
            }
          ].map((s, idx) => {
            const Icon = s.icon;
            return (
              <Card key={idx} variant="glass" padding="md" className="relative group">
                <div className="text-3xl font-black text-slate-800 font-mono mb-3">
                  {s.step}
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${s.color} flex items-center justify-center text-white mb-4 shadow-md`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{s.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 3. DISCOVER FEATURED EVENTS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="warning">Explore Fests</Badge>
              <span className="text-xs text-amber-400/90 font-mono">Demo Catalog Data</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Trending College Fests & Competitions
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Sample event cards loaded live from the in-memory Fastify backend.
            </p>
          </div>
          <Link to="/events">
            <Button variant="secondary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              View All Events
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(events || []).slice(0, 3).map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>

      {/* 4. ACADEMIC BENEFITS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-brand-950/60 via-slate-900/90 to-slate-950 border border-brand-500/25 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <Badge variant="brand" className="mb-3">Reward Academic Excellence</Badge>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Your CGPA Unlocks Direct Ticket Discounts
              </h2>
              <p className="mt-4 text-slate-300 text-sm leading-relaxed">
                VirtuPass pioneers merit-linked event pricing. College organizers incentivize top academic performers across the country with auto-applied fee waivers and premium access.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  'Tier 1 (CGPA ≥ 9.0): Up to 35% auto-discount across hackathons & workshops',
                  'Tier 2 (CGPA ≥ 8.0): Up to 25% auto-discount on technical & cultural fests',
                  'Instant institutional email validation (@nitt.edu, @iitm.ac.in, etc.)',
                  'Single tamper-proof cryptographic pass valid across all inter-collegiate entries'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link to="/user/dashboard">
                  <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Check Student Eligibility
                  </Button>
                </Link>
              </div>
            </div>

            {/* Visual Merit Showcase */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-brand-500/30 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-white">Student Passport Card</span>
                </div>
                <Badge variant="success">Verified Tier 1</Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-900">
                  <span className="text-slate-400">Student:</span>
                  <span className="font-bold text-white">Aarav Sharma</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-900">
                  <span className="text-slate-400">College:</span>
                  <span className="font-semibold text-slate-200">NIT Trichy</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-900">
                  <span className="text-slate-400">Verified CGPA:</span>
                  <span className="font-extrabold text-emerald-400 text-sm">9.30</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Platform Savings:</span>
                  <span className="font-bold text-brand-300">₹850 Saved this semester</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECURE QR ENTRY & ANTI-SCREENSHOT TECH */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
            <Badge variant="info">Zero Counterfeit Architecture</Badge>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Tamper-Proof Dynamic QR Turnstile Entry
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Traditional college fests suffer from ticket resale, duplicate printouts, and static WhatsApp screenshots. VirtuPass solves gate fraud with dynamic cryptographic time-seeded passes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <Clock className="w-5 h-5 text-brand-400 mb-2" />
                <h4 className="text-xs font-bold text-white">Time-Seeded Pass</h4>
                <p className="text-[11px] text-slate-400 mt-1">Rotates token seeds every 15s to invalidate static screenshots.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <Zap className="w-5 h-5 text-teal-400 mb-2" />
                <h4 className="text-xs font-bold text-white">Offline Verification</h4>
                <p className="text-[11px] text-slate-400 mt-1">Gate scanners validate signatures locally without spotty stadium 4G.</p>
              </div>
            </div>
          </div>

          {/* Interactive QR Simulation Preview */}
          <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-tr from-slate-900 to-slate-950 border border-slate-800">
            <div className="w-56 h-56 bg-white p-3 rounded-2xl shadow-2xl flex items-center justify-center mb-4">
              <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center p-2">
                <QrCode className="w-40 h-40 text-brand-400" />
              </div>
            </div>
            <p className="font-mono text-xs text-brand-300 font-bold">VP:LIVE:9F4A8C2D</p>
            <p className="text-[11px] text-slate-500 mt-1">Dynamic time-seeded ticket simulation</p>
          </div>
        </div>
      </section>

      {/* 6. WHY VIRTUPASS? STATS & TRUST */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="brand" className="mb-2">Platform Scale</Badge>
          <h2 className="text-3xl font-extrabold text-white">Why Colleges Trust VirtuPass</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
            <p className="text-3xl font-black text-white">4,820+</p>
            <p className="text-xs text-slate-400 mt-1">Verified Students</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
            <p className="text-3xl font-black text-brand-400">120+</p>
            <p className="text-xs text-slate-400 mt-1">College Clubs & Fests</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
            <p className="text-3xl font-black text-emerald-400">100%</p>
            <p className="text-xs text-slate-400 mt-1">Verified Gate Scans</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
            <p className="text-3xl font-black text-cyan-400">₹0</p>
            <p className="text-xs text-slate-400 mt-1">Platform Student Surcharge</p>
          </div>
        </div>
      </section>
    </div>
  );
};
