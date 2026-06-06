"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday, 
  isBefore, 
  startOfDay, 
  parseISO 
} from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { getMonthSlotsAction, submitBookingAction } from '@/actions/public-booking';
import { useRouter } from 'next/navigation';
import TimezoneCombobox from '@/components/ui/TimezoneCombobox';

type Step = 'date_time' | 'details';

interface Props {
  user: {
    username: string;
    businessName: string | null;
    name: string;
    businessLogo: string | null;
  };
  eventType: {
    slug: string;
    name: string;
    description: string | null;
    duration: number;
    color: string | null;
    customFields: any;
  };
}

export default function BookingWizard({ user, eventType }: Props) {
  const router = useRouter();
  
  const [step, setStep] = useState<Step>('date_time');
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlotUtc, setSelectedSlotUtc] = useState<string | null>(null);
  
  const [slots, setSlots] = useState<{startTimeUtc: string; endTimeUtc: string}[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  const [formData, setFormData] = useState<Record<string, any>>({
    name: '',
    email: '',
    phone: '',
    guests: '',
    meeting_about: '',
    notes: ''
  });

  const parsedFormConfig = useMemo(() => {
    const config = eventType.customFields;
    const defaults = {
      name: { enabled: true, required: true, label: "Full Name" },
      email: { enabled: true, required: true, label: "Email Address" },
      phone: { enabled: false, required: false, label: "Phone Number" },
      guests: { enabled: false, required: false, label: "Add Guests (emails)" },
      meeting_about: { enabled: false, required: false, label: "What is this meeting about?" },
      notes: { enabled: false, required: false, label: "Additional Notes" }
    };
    
    if (config && typeof config === "object" && !Array.isArray(config)) {
      return {
        defaultFields: { ...defaults, ...(config as any).defaultFields },
        customFields: Array.isArray((config as any).customFields) ? (config as any).customFields : []
      };
    }
    
    // Fallback if old format
    return {
      defaultFields: defaults,
      customFields: Array.isArray(config) ? config : []
    };
  }, [eventType.customFields]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [viewerTimezone, setViewerTimezone] = useState("UTC");

  useEffect(() => {
    try {
      const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detectedTz) {
        setViewerTimezone(detectedTz);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Fetch slots when month changes
  useEffect(() => {
    const fetchSlots = async () => {
      setLoadingSlots(true);
      const monthStr = format(currentMonth, 'yyyy-MM');
      const res = await getMonthSlotsAction(user.username, eventType.slug, monthStr, viewerTimezone);
      if (res.data) {
        setSlots(res.data);
      }
      setLoadingSlots(false);
    };
    fetchSlots();
  }, [currentMonth, user.username, eventType.slug, viewerTimezone]);

  // Calendar logic
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });
  const firstDayOfMonth = startOfMonth(currentMonth).getDay();
  const paddingDays = Array.from({ length: firstDayOfMonth }).map((_, i) => i);

  // Group slots by local date string
  const slotsByDate = useMemo(() => {
    const map = new Map<string, typeof slots>();
    slots.forEach(slot => {
      // Convert UTC to viewer local date
      const localDateStr = formatInTimeZone(parseISO(slot.startTimeUtc), viewerTimezone, 'yyyy-MM-dd');
      if (!map.has(localDateStr)) map.set(localDateStr, []);
      map.get(localDateStr)!.push(slot);
    });
    return map;
  }, [slots, viewerTimezone]);

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const availableSlotsForSelectedDate = selectedDateStr ? (slotsByDate.get(selectedDateStr) || []) : [];

  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handlePrevMonth = () => {
    const prev = subMonths(currentMonth, 1);
    if (!isBefore(endOfMonth(prev), startOfDay(new Date()))) {
      setCurrentMonth(prev);
    }
  };

  const handleSlotSelect = (startTimeUtc: string) => {
    setSelectedSlotUtc(startTimeUtc);
  };

  const handleContinue = () => {
    if (selectedSlotUtc) setStep('details');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotUtc) return;
    
    setSubmitting(true);
    setError('');
    
    const res = await submitBookingAction(user.username, eventType.slug, selectedSlotUtc, formData);
    
    if (res.error) {
      setError(res.error);
      setSubmitting(false);
    } else {
      router.push(`/${user.username}/${eventType.slug}/success?token=${res.data?.managementToken}`);
    }
  };

  const displayName = user.businessName || user.name || user.username;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
      
      {/* LEFT SIDE: Event Details */}
      <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-200 p-8 flex flex-col">
        <div className="mb-8">
          {user.businessLogo ? (
            <img src={user.businessLogo} alt={displayName} className="w-16 h-16 rounded-full shadow-sm mb-4 object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full mb-4 bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold shadow-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <p className="text-sm font-medium text-slate-500 mb-1">{displayName}</p>
          <h1 className="text-2xl font-bold text-slate-800">{eventType.name}</h1>
        </div>
        
        <div className="flex items-center text-slate-600 mb-4 font-medium">
          <svg className="w-5 h-5 mr-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {eventType.duration} min
        </div>

        {step === 'details' && selectedSlotUtc && (
          <div className="flex items-start text-slate-600 mb-4 font-medium">
            <svg className="w-5 h-5 mr-3 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <div className="text-blue-600">
                {formatInTimeZone(parseISO(selectedSlotUtc), viewerTimezone, 'EEEE, MMMM d, yyyy')}
              </div>
              <div className="text-slate-500 text-sm mt-1">
                {formatInTimeZone(parseISO(selectedSlotUtc), viewerTimezone, 'h:mm a')} (Local Time)
              </div>
            </div>
          </div>
        )}

        {eventType.description && (
          <div className="mt-4 pt-4 border-t border-slate-200 text-slate-600 text-sm leading-relaxed">
            {eventType.description}
          </div>
        )}
      </div>

      {/* RIGHT SIDE: Interactive Section */}
      <div className="w-full md:w-2/3 p-8">
        {step === 'date_time' ? (
          <div className="flex flex-col md:flex-row gap-8 h-full">
            {/* Calendar */}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Select a Date & Time</h2>
              
              <div className="flex items-center justify-between mb-4">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="font-semibold text-slate-800">
                  {format(currentMonth, 'MMMM yyyy')}
                </div>
                <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {paddingDays.map(i => <div key={`pad-${i}`} />)}
                {daysInMonth.map(day => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const hasSlots = slotsByDate.has(dayStr) && slotsByDate.get(dayStr)!.length > 0;
                  const isPast = isBefore(endOfDay(day), new Date());
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  
                  const btnClass = `
                    aspect-square rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${isPast || !hasSlots ? 'text-slate-300 cursor-default' : 'cursor-pointer hover:bg-blue-50'}
                    ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' : ''}
                    ${!isSelected && hasSlots ? 'text-blue-600 bg-blue-50/50' : ''}
                  `;

                  return (
                    <button
                      key={day.toISOString()}
                      disabled={isPast || !hasSlots}
                      onClick={() => { setSelectedDate(day); setSelectedSlotUtc(null); }}
                      className={btnClass}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-8 border-t border-slate-100 pt-6">
                <label className="block text-xs font-semibold text-slate-500 mb-2 flex items-center justify-center gap-1.5 uppercase tracking-wider">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Viewing Timezone
                </label>
                <TimezoneCombobox
                  name="viewerTimezone"
                  defaultValue={viewerTimezone}
                  onChange={setViewerTimezone}
                  className="max-w-md mx-auto"
                />
              </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div className="w-full md:w-48 flex flex-col h-[400px]">
                <h3 className="font-semibold text-slate-800 mb-4 text-center md:text-left">
                  {format(selectedDate, 'EEEE, MMM d')}
                </h3>
                <div className="flex-1 overflow-y-auto pr-2 space-y-2 pb-4 scrollbar-thin">
                  {loadingSlots ? (
                    <div className="text-center text-sm text-slate-500 py-4">Loading...</div>
                  ) : availableSlotsForSelectedDate.length > 0 ? (
                    availableSlotsForSelectedDate.map(slot => {
                      const isSelected = selectedSlotUtc === slot.startTimeUtc;
                      const timeLabel = formatInTimeZone(parseISO(slot.startTimeUtc), viewerTimezone, 'h:mm a');
                      
                      return (
                        <div key={slot.startTimeUtc} className="flex gap-2">
                          <button
                            onClick={() => handleSlotSelect(slot.startTimeUtc)}
                            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium border transition-all ${
                              isSelected 
                                ? 'border-slate-800 bg-slate-800 text-white' 
                                : 'border-blue-200 text-blue-700 bg-white hover:border-blue-600 hover:text-blue-800'
                            }`}
                          >
                            {timeLabel}
                          </button>
                          {isSelected && (
                            <button
                              onClick={handleContinue}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg text-sm font-medium shadow-sm transition-colors"
                            >
                              Next
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-sm text-slate-500 py-4">No times available</div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <button 
              onClick={() => setStep('date_time')}
              className="text-blue-600 text-sm font-medium hover:underline mb-6 self-start flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back
            </button>
            
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Enter Details</h2>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 space-y-5">
              {/* Dynamic Default Fields */}
              {parsedFormConfig.defaultFields.name.enabled && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {parsedFormConfig.defaultFields.name.label} {parsedFormConfig.defaultFields.name.required ? '*' : ''}
                  </label>
                  <input 
                    type="text" 
                    required={parsedFormConfig.defaultFields.name.required}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    value={formData.name || ''}
                    onChange={e => handleInputChange('name', e.target.value)}
                  />
                </div>
              )}
              
              {parsedFormConfig.defaultFields.email.enabled && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {parsedFormConfig.defaultFields.email.label} {parsedFormConfig.defaultFields.email.required ? '*' : ''}
                  </label>
                  <input 
                    type="email" 
                    required={parsedFormConfig.defaultFields.email.required}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    value={formData.email || ''}
                    onChange={e => handleInputChange('email', e.target.value)}
                  />
                </div>
              )}

              {parsedFormConfig.defaultFields.phone.enabled && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {parsedFormConfig.defaultFields.phone.label} {parsedFormConfig.defaultFields.phone.required ? '*' : ''}
                  </label>
                  <input 
                    type="tel" 
                    required={parsedFormConfig.defaultFields.phone.required}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    value={formData.phone || ''}
                    onChange={e => handleInputChange('phone', e.target.value)}
                  />
                </div>
              )}

              {parsedFormConfig.defaultFields.guests.enabled && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {parsedFormConfig.defaultFields.guests.label} {parsedFormConfig.defaultFields.guests.required ? '*' : ''}
                  </label>
                  <input 
                    type="text" 
                    required={parsedFormConfig.defaultFields.guests.required}
                    placeholder="e.g. guest1@example.com, guest2@example.com"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    value={formData.guests || ''}
                    onChange={e => handleInputChange('guests', e.target.value)}
                  />
                </div>
              )}

              {parsedFormConfig.defaultFields.meeting_about.enabled && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {parsedFormConfig.defaultFields.meeting_about.label} {parsedFormConfig.defaultFields.meeting_about.required ? '*' : ''}
                  </label>
                  <input 
                    type="text" 
                    required={parsedFormConfig.defaultFields.meeting_about.required}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    value={formData.meeting_about || ''}
                    onChange={e => handleInputChange('meeting_about', e.target.value)}
                  />
                </div>
              )}

              {parsedFormConfig.defaultFields.notes.enabled && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {parsedFormConfig.defaultFields.notes.label} {parsedFormConfig.defaultFields.notes.required ? '*' : ''}
                  </label>
                  <textarea 
                    required={parsedFormConfig.defaultFields.notes.required}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    value={formData.notes || ''}
                    onChange={e => handleInputChange('notes', e.target.value)}
                  />
                </div>
              )}

              {/* Dynamic Custom Fields */}
              {parsedFormConfig.customFields.map((field: any) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {field.label} {field.required ? '*' : ''}
                  </label>
                  
                  {field.type === 'textarea' ? (
                    <textarea 
                      required={field.required}
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      value={formData[field.id] || ''}
                      onChange={e => handleInputChange(field.id, e.target.value)}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      required={field.required}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                      value={formData[field.id] || ''}
                      onChange={e => handleInputChange(field.id, e.target.value)}
                    >
                      <option value="">Select an option</option>
                      {field.options?.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type={field.type || 'text'}
                      required={field.required}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      value={formData[field.id] || ''}
                      onChange={e => handleInputChange(field.id, e.target.value)}
                    />
                  )}
                </div>
              ))}

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-70 flex justify-center items-center"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Confirming...
                    </>
                  ) : 'Schedule Event'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}

// Helper
function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
