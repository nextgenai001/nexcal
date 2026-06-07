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
  isAfter,
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
    weekStart?: number;
    dateFormat?: string;
  };
  eventType: {
    slug: string;
    name: string;
    description: string | null;
    duration: number;
    color: string | null;
    customFields: any;
    startDate?: string | Date | null;
    endDate?: string | Date | null;
  };
}

export default function BookingWizard({ user, eventType }: Props) {
  const router = useRouter();
  
  const [step, setStep] = useState<Step>('date_time');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    if (eventType.startDate) {
      const startD = new Date(eventType.startDate);
      if (startD > now) {
        return startOfMonth(startD);
      }
    }
    return startOfMonth(now);
  });
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
  const weekStart = user.weekStart ?? 1; // Default to Monday (1)
  const paddingCount = (firstDayOfMonth - weekStart + 7) % 7;
  const paddingDays = Array.from({ length: paddingCount }).map((_, i) => i);

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

  const canGoPrev = useMemo(() => {
    const prev = subMonths(currentMonth, 1);
    if (isBefore(endOfMonth(prev), startOfDay(new Date()))) return false;
    if (eventType.startDate) {
      const startLimit = startOfMonth(new Date(eventType.startDate));
      if (prev < startLimit) return false;
    }
    return true;
  }, [currentMonth, eventType.startDate]);

  const canGoNext = useMemo(() => {
    const next = addMonths(currentMonth, 1);
    if (eventType.endDate) {
      const endLimit = endOfMonth(new Date(eventType.endDate));
      if (next > endLimit) return false;
    }
    return true;
  }, [currentMonth, eventType.endDate]);

  const handleNextMonth = () => {
    if (canGoNext) setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handlePrevMonth = () => {
    if (canGoPrev) setCurrentMonth(subMonths(currentMonth, 1));
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

  // Collapse sidebar state for the booking wizard
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Read customization options from eventType.customFields
  const customConfig = useMemo(() => {
    const config = eventType.customFields;
    if (config && typeof config === "object" && !Array.isArray(config)) {
      return config as Record<string, any>;
    }
    return {};
  }, [eventType.customFields]);

  const themeColor = customConfig.themeColor || "#2563eb";
  const isDark = customConfig.backgroundTheme === "dark";
  const isSquare = customConfig.borderRadius === "square";
  const bookingButtonText = customConfig.bookingButtonText || "Schedule Event";

  const containerClass = `${
    isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
  } ${isSquare ? "rounded-none" : "rounded-2xl"} shadow-sm border overflow-hidden flex flex-col md:flex-row min-h-[600px]`;

  const sidebarClass = `w-full md:w-1/3 border-r p-8 flex flex-col shrink-0 ${
    isDark ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"
  }`;

  return (
    <div className={containerClass}>
      
      {/* LEFT SIDE: Event Details */}
      {!sidebarCollapsed && (
        <div className={sidebarClass}>
          <div className="flex items-center justify-between mb-8">
            {user.businessLogo ? (
              <img src={user.businessLogo} alt={displayName} className="w-16 h-16 rounded-full shadow-sm object-cover" />
            ) : (
              <div 
                style={{ backgroundColor: themeColor + "15", color: themeColor }}
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-sm"
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed(true)}
              className="p-1.5 rounded-lg hover:bg-slate-200/50 text-slate-400 hover:text-slate-600 transition-colors hidden md:block"
              title="Collapse event details"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          </div>
          <p className={`text-sm font-medium mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{displayName}</p>
          <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{eventType.name}</h1>
          
          <div className="flex items-center mt-6 mb-4 font-medium">
            <svg className="w-5 h-5 mr-3 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {eventType.duration} min
          </div>

          {step === 'details' && selectedSlotUtc && (
            <div className="flex items-start mb-4 font-medium">
              <svg 
                style={{ color: themeColor }}
                className="w-5 h-5 mr-3 shrink-0" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={2} 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <div style={{ color: themeColor }}>
                  {formatInTimeZone(parseISO(selectedSlotUtc), viewerTimezone, 'EEEE, ') + formatInTimeZone(parseISO(selectedSlotUtc), viewerTimezone, user.dateFormat ?? 'MM/dd/yyyy')}
                </div>
                <div className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {formatInTimeZone(parseISO(selectedSlotUtc), viewerTimezone, 'h:mm a')} ({viewerTimezone})
                </div>
              </div>
            </div>
          )}

          {eventType.description && (
            <div 
              className={`mt-4 pt-4 border-t text-sm leading-relaxed whitespace-pre-wrap ${isDark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-600"}`}
              dangerouslySetInnerHTML={{ __html: eventType.description }}
            />
          )}
        </div>
      )}

      {/* RIGHT SIDE: Interactive Section */}
      <div className="flex-1 p-8">
        {step === 'date_time' ? (
          <div className="flex flex-col md:flex-row gap-8 h-full">
            {/* Calendar */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-6">
                {sidebarCollapsed && (
                  <button
                    type="button"
                    onClick={() => setSidebarCollapsed(false)}
                    style={{ color: themeColor }}
                    className="p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors hidden md:block"
                    title="Expand event details"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                )}
                <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-800"}`}>Select a Date & Time</h2>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handlePrevMonth}
                  disabled={!canGoPrev}
                  className={`p-2 rounded-full transition-colors ${
                    !canGoPrev 
                      ? (isDark ? 'text-slate-800 cursor-not-allowed' : 'text-slate-200 cursor-not-allowed') 
                      : (isDark ? 'hover:bg-slate-800 text-slate-300 cursor-pointer' : 'hover:bg-slate-100 text-slate-600 cursor-pointer')
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>
                  {format(currentMonth, 'MMMM yyyy')}
                </div>
                <button
                  onClick={handleNextMonth}
                  disabled={!canGoNext}
                  className={`p-2 rounded-full transition-colors ${
                    !canGoNext 
                      ? (isDark ? 'text-slate-800 cursor-not-allowed' : 'text-slate-200 cursor-not-allowed') 
                      : (isDark ? 'hover:bg-slate-800 text-slate-300 cursor-pointer' : 'hover:bg-slate-100 text-slate-600 cursor-pointer')
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>

              <div className={`grid grid-cols-7 gap-1 mb-2 text-center text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                {Array.from({ length: 7 }).map((_, i) => {
                  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
                  const dayName = dayNames[((user.weekStart ?? 1) + i) % 7];
                  return <div key={i}>{dayName}</div>;
                })}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {paddingDays.map(i => <div key={`pad-${i}`} />)}
                {daysInMonth.map(day => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const hasSlots = slotsByDate.has(dayStr) && slotsByDate.get(dayStr)!.length > 0;
                  const isPast = isBefore(endOfDay(day), new Date());
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  
                  let isOutsideRange = false;
                  if (eventType.startDate) {
                    const startD = startOfDay(new Date(eventType.startDate));
                    if (isBefore(startOfDay(day), startD)) isOutsideRange = true;
                  }
                  if (eventType.endDate) {
                    const endD = startOfDay(new Date(eventType.endDate));
                    if (isAfter(startOfDay(day), endD)) isOutsideRange = true;
                  }

                  const isDisabled = isPast || !hasSlots || isOutsideRange;
                  
                  const btnClass = `
                    aspect-square flex items-center justify-center text-sm font-medium transition-all
                    ${isDisabled 
                      ? (isDark ? 'text-slate-700 cursor-default' : 'text-slate-300 cursor-default') 
                      : 'cursor-pointer'
                    }
                  `;

                  const btnStyle: React.CSSProperties = {};
                  if (!isDisabled) {
                    if (isSelected) {
                      btnStyle.backgroundColor = themeColor;
                      btnStyle.color = '#fff';
                    } else {
                      btnStyle.color = themeColor;
                      btnStyle.backgroundColor = themeColor + '15';
                    }
                  }
                  if (!isSquare) {
                    btnStyle.borderRadius = '9999px';
                  } else {
                    btnStyle.borderRadius = '0px';
                  }

                  return (
                    <button
                      key={day.toISOString()}
                      disabled={isDisabled}
                      onClick={() => { setSelectedDate(day); setSelectedSlotUtc(null); }}
                      className={btnClass}
                      style={btnStyle}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
              
              <div className={`mt-8 border-t pt-6 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
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
                <h3 className={`font-semibold mb-4 text-center md:text-left ${isDark ? "text-white" : "text-slate-800"}`}>
                  {format(selectedDate, 'EEEE, ') + format(selectedDate, user.dateFormat ?? 'MM/dd/yyyy')}
                </h3>
                <div className="flex-1 overflow-y-auto pr-2 space-y-2 pb-4 scrollbar-thin">
                  {loadingSlots ? (
                    <div className="text-center text-sm text-slate-500 py-4">Loading...</div>
                  ) : availableSlotsForSelectedDate.length > 0 ? (
                    availableSlotsForSelectedDate.map(slot => {
                      const isSelected = selectedSlotUtc === slot.startTimeUtc;
                      const timeLabel = formatInTimeZone(parseISO(slot.startTimeUtc), viewerTimezone, 'h:mm a');
                      
                      const btnStyle: React.CSSProperties = {
                        borderRadius: isSquare ? "0px" : "8px"
                      };
                      if (isSelected) {
                        btnStyle.backgroundColor = themeColor;
                        btnStyle.borderColor = themeColor;
                        btnStyle.color = "#fff";
                      } else {
                        btnStyle.borderColor = themeColor + "44";
                        btnStyle.color = themeColor;
                        btnStyle.backgroundColor = isDark ? "transparent" : "#fff";
                      }

                      return (
                        <div key={slot.startTimeUtc} className="flex gap-2">
                          <button
                            onClick={() => handleSlotSelect(slot.startTimeUtc)}
                            style={btnStyle}
                            className="flex-1 py-3 px-4 text-sm font-medium border transition-all"
                          >
                            {timeLabel}
                          </button>
                          {isSelected && (
                            <button
                              onClick={handleContinue}
                              style={{ 
                                backgroundColor: themeColor,
                                borderRadius: isSquare ? "0px" : "8px"
                              }}
                              className="hover:opacity-90 text-white px-4 rounded-lg text-sm font-medium shadow-sm transition-colors"
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
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={() => setStep('date_time')}
                style={{ color: themeColor }}
                className="text-sm font-medium hover:underline flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back
              </button>
              
              {sidebarCollapsed && (
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(false)}
                  style={{ color: themeColor }}
                  className="p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors hidden md:block"
                  title="Expand event details"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              )}
            </div>
            
            <h2 className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-slate-800"}`}>Enter Details</h2>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 space-y-5">
              {/* Dynamic Default Fields */}
              {parsedFormConfig.defaultFields.name.enabled && (
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    {parsedFormConfig.defaultFields.name.label} {parsedFormConfig.defaultFields.name.required ? '*' : ''}
                  </label>
                  <input 
                    type="text" 
                    required={parsedFormConfig.defaultFields.name.required}
                    className={`w-full px-4 py-2 border rounded-lg outline-none transition-all ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                    style={{ borderRadius: isSquare ? '0px' : '8px' }}
                    value={formData.name || ''}
                    onChange={e => handleInputChange('name', e.target.value)}
                  />
                </div>
              )}
              
              {parsedFormConfig.defaultFields.email.enabled && (
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    {parsedFormConfig.defaultFields.email.label} {parsedFormConfig.defaultFields.email.required ? '*' : ''}
                  </label>
                  <input 
                    type="email" 
                    required={parsedFormConfig.defaultFields.email.required}
                    className={`w-full px-4 py-2 border rounded-lg outline-none transition-all ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                    style={{ borderRadius: isSquare ? '0px' : '8px' }}
                    value={formData.email || ''}
                    onChange={e => handleInputChange('email', e.target.value)}
                  />
                </div>
              )}

              {parsedFormConfig.defaultFields.phone.enabled && (
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    {parsedFormConfig.defaultFields.phone.label} {parsedFormConfig.defaultFields.phone.required ? '*' : ''}
                  </label>
                  <input 
                    type="tel" 
                    required={parsedFormConfig.defaultFields.phone.required}
                    className={`w-full px-4 py-2 border rounded-lg outline-none transition-all ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                    style={{ borderRadius: isSquare ? '0px' : '8px' }}
                    value={formData.phone || ''}
                    onChange={e => handleInputChange('phone', e.target.value)}
                  />
                </div>
              )}

              {parsedFormConfig.defaultFields.guests.enabled && (
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    {parsedFormConfig.defaultFields.guests.label} {parsedFormConfig.defaultFields.guests.required ? '*' : ''}
                  </label>
                  <input 
                    type="text" 
                    required={parsedFormConfig.defaultFields.guests.required}
                    placeholder="e.g. guest1@example.com, guest2@example.com"
                    className={`w-full px-4 py-2 border rounded-lg outline-none transition-all ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                    style={{ borderRadius: isSquare ? '0px' : '8px' }}
                    value={formData.guests || ''}
                    onChange={e => handleInputChange('guests', e.target.value)}
                  />
                </div>
              )}

              {parsedFormConfig.defaultFields.meeting_about.enabled && (
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    {parsedFormConfig.defaultFields.meeting_about.label} {parsedFormConfig.defaultFields.meeting_about.required ? '*' : ''}
                  </label>
                  <input 
                    type="text" 
                    required={parsedFormConfig.defaultFields.meeting_about.required}
                    className={`w-full px-4 py-2 border rounded-lg outline-none transition-all ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                    style={{ borderRadius: isSquare ? '0px' : '8px' }}
                    value={formData.meeting_about || ''}
                    onChange={e => handleInputChange('meeting_about', e.target.value)}
                  />
                </div>
              )}

              {parsedFormConfig.defaultFields.notes.enabled && (
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    {parsedFormConfig.defaultFields.notes.label} {parsedFormConfig.defaultFields.notes.required ? '*' : ''}
                  </label>
                  <textarea 
                    required={parsedFormConfig.defaultFields.notes.required}
                    rows={3}
                    className={`w-full px-4 py-2 border rounded-lg outline-none transition-all ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                    style={{ borderRadius: isSquare ? '0px' : '8px' }}
                    value={formData.notes || ''}
                    onChange={e => handleInputChange('notes', e.target.value)}
                  />
                </div>
              )}

              {/* Dynamic Custom Fields */}
              {parsedFormConfig.customFields.map((field: any) => (
                <div key={field.id}>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    {field.label} {field.required ? '*' : ''}
                  </label>
                  
                  {field.type === 'textarea' ? (
                    <textarea 
                      required={field.required}
                      rows={3}
                      className={`w-full px-4 py-2 border rounded-lg outline-none transition-all ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500' 
                          : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                      }`}
                      style={{ borderRadius: isSquare ? '0px' : '8px' }}
                      value={formData[field.id] || ''}
                      onChange={e => handleInputChange(field.id, e.target.value)}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      required={field.required}
                      className={`w-full px-4 py-2 border rounded-lg outline-none transition-all bg-white ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500' 
                          : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                      }`}
                      style={{ borderRadius: isSquare ? '0px' : '8px' }}
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
                      className={`w-full px-4 py-2 border rounded-lg outline-none transition-all ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500' 
                          : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                      }`}
                      style={{ borderRadius: isSquare ? '0px' : '8px' }}
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
                  style={{ 
                    backgroundColor: themeColor,
                    borderRadius: isSquare ? "0px" : "8px"
                  }}
                  className="w-full text-white font-semibold py-3 px-6 transition-colors shadow-sm disabled:opacity-70 flex justify-center items-center hover:opacity-90"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Confirming...
                    </>
                  ) : bookingButtonText}
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

