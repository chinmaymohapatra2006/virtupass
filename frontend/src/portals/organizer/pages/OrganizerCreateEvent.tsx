import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Badge } from '../../../shared/components/Badge';
import { apiClient } from '../../../shared/services/apiClient';
import { Calendar, Tag, GraduationCap, Check, ArrowRight, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { EventCategory } from '../../../shared/types';

export const OrganizerCreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState<string>('InnovateX 2027: National Robotics & AI Conclave');
  const [shortDescription, setShortDescription] = useState<string>('National inter-college robotics combat and computer vision hackathon.');
  const [fullDescription, setFullDescription] = useState<string>('Join premier robotics engineers and researchers for a 48-hour hands-on hardware build marathon. Keynotes on spatial computing and embedded AI.');
  const [category, setCategory] = useState<EventCategory>('Technical');
  const [venue, setVenue] = useState<string>('Main Auditorium & Robotics Arena, NIT Trichy');
  const [eventDate, setEventDate] = useState<string>('2027-01-20T09:00:00Z');
  const [startTime, setStartTime] = useState<string>('09:00 AM');
  const [endTime, setEndTime] = useState<string>('08:00 PM');
  const [bannerUrl, setBannerUrl] = useState<string>('https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80');

  // Ticket Tiers
  const [ticketCategories, setTicketCategories] = useState<
    { name: string; description: string; basePrice: number; totalAllocation: number }[]
  >([
    {
      name: 'Delegate Pass',
      description: 'Full day keynote auditorium and exhibition arena access',
      basePrice: 299,
      totalAllocation: 300
    },
    {
      name: 'Hardware Combat Pass',
      description: 'Includes robotics pit access, test arena, and power stations',
      basePrice: 799,
      totalAllocation: 80
    }
  ]);

  const handleAddTier = () => {
    setTicketCategories((prev) => [
      ...prev,
      {
        name: `Tier ${prev.length + 1}`,
        description: 'Standard event access',
        basePrice: 499,
        totalAllocation: 100
      }
    ]);
  };

  const handleRemoveTier = (index: number) => {
    if (ticketCategories.length <= 1) return;
    setTicketCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTierChange = (index: number, field: string, value: any) => {
    setTicketCategories((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await apiClient.createOrganizerEvent({
        title,
        shortDescription,
        fullDescription,
        category,
        venue,
        eventDate,
        startTime,
        endTime,
        bannerUrl,
        ticketCategories
      });
      navigate('/organizer/events');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="Publish New College Festival / Conclave"
        description="Set up ticket tiers, allocations, and submit for platform administrator review."
      />

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card variant="glass" padding="lg" className="space-y-4">
          <h3 className="text-base font-bold text-white mb-2">1. Event Overview & Schedule</h3>
          
          <Input
            label="Event / Fest Name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-brand-500"
              >
                <option value="Technical">Technical</option>
                <option value="Cultural">Cultural</option>
                <option value="Music">Music</option>
                <option value="Gaming">Gaming</option>
                <option value="Workshop">Workshop</option>
                <option value="Dance">Dance</option>
                <option value="Sports">Sports</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <Input
              label="Physical Campus Venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Event Date (ISO/Text)"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
            <Input
              label="Start Time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <Input
              label="End Time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>

          <Input
            label="Short Description (Card Summary)"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Description</label>
            <textarea
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              rows={3}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-brand-500"
              required
            />
          </div>

          <Input
            label="Banner Image URL"
            value={bannerUrl}
            onChange={(e) => setBannerUrl(e.target.value)}
          />
        </Card>

        {/* Ticket Tiers */}
        <Card variant="glass" padding="lg" className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">2. Ticket Tiers & Allocations</h3>
              <p className="text-xs text-slate-400">Configure pass prices and maximum seat capacity.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleAddTier}
            >
              Add Tier
            </Button>
          </div>

          <div className="space-y-3">
            {ticketCategories.map((cat, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white uppercase">Pass Tier #{idx + 1}</span>
                  {ticketCategories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(idx)}
                      className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Tier Name"
                    value={cat.name}
                    onChange={(e) => handleTierChange(idx, 'name', e.target.value)}
                    required
                  />
                  <Input
                    label="Base Price (INR)"
                    type="number"
                    value={cat.basePrice}
                    onChange={(e) => handleTierChange(idx, 'basePrice', parseFloat(e.target.value) || 0)}
                    required
                  />
                  <Input
                    label="Total Seats Allocated"
                    type="number"
                    value={cat.totalAllocation}
                    onChange={(e) => handleTierChange(idx, 'totalAllocation', parseInt(e.target.value) || 0)}
                    required
                  />
                </div>

                <Input
                  label="Tier Description"
                  value={cat.description}
                  onChange={(e) => handleTierChange(idx, 'description', e.target.value)}
                  required
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => navigate('/organizer/events')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create Fest Scaffold
          </Button>
        </div>
      </form>
    </div>
  );
};