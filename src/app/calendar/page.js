"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";

import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Link,
  Users,
  Sparkles,
  Video,
  X,
  AlertCircle
} from "lucide-react";

// ✅ FIX: Add API URL constant
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://my-app-2lpp.onrender.com";

// Fixed Analog Clock Component - Correct Hand Positions
function AnalogClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  // Calculate angles
  const hourAngle = ((hours % 12) * 30) + (minutes * 0.5);
  const minuteAngle = minutes * 6;
  const secondAngle = seconds * 6;

  // Clock numbers with their positions (12 at top, going clockwise)
  const numbers = [
    { number: 12, top: "5%", left: "50%" },
    { number: 1, top: "14%", left: "72%" },
    { number: 2, top: "28%", left: "86%" },
    { number: 3, top: "50%", left: "93%" },
    { number: 4, top: "72%", left: "86%" },
    { number: 5, top: "86%", left: "72%" },
    { number: 6, top: "93%", left: "50%" },
    { number: 7, top: "86%", left: "28%" },
    { number: 8, top: "72%", left: "14%" },
    { number: 9, top: "50%", left: "7%" },
    { number: 10, top: "28%", left: "14%" },
    { number: 11, top: "14%", left: "28%" },
  ];

  return (
    <div className="relative w-32 h-32 bg-gradient-to-br from-[#0B1220] to-[#081120] rounded-full shadow-lg border-2 border-[#1E293B]">
      {/* Clock face */}
      <div className="absolute inset-0 rounded-full">
        {/* Numbers */}
        {numbers.map((item, index) => (
          <div
            key={index}
            className="absolute text-xs font-bold text-white"
            style={{
              top: item.top,
              left: item.left,
              transform: "translate(-50%, -50%)",
            }}
          >
            {item.number}
          </div>
        ))}
        
        {/* Small tick marks for each minute */}
        {[...Array(60)].map((_, i) => {
          const angle = i * 6;
          const radian = (angle * Math.PI) / 180;
          const isHourMark = i % 5 === 0;
          const innerRadius = isHourMark ? 44 : 48;
          const outerRadius = isHourMark ? 38 : 42;
          const x1 = 64 + innerRadius * Math.sin(radian);
          const y1 = 64 - innerRadius * Math.cos(radian);
          
          return (
            <div
              key={i}
              className="absolute bg-[#94A3B8]"
              style={{
                width: '1px',
                height: isHourMark ? '3px' : '1.5px',
                left: `${x1}px`,
                top: `${y1}px`,
                transform: `rotate(${angle}deg)`,
                transformOrigin: '0 0',
              }}
            />
          );
        })}
        
        {/* Center point */}
        <div className="absolute w-3 h-3 bg-blue-500 rounded-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 shadow-lg" />
        
        {/* Hour hand - shorter and thicker */}
        <div
          className="absolute bg-white rounded-full origin-bottom"
          style={{
            width: '3px',
            height: '20px',
            left: 'calc(50% - 1.5px)',
            bottom: '50%',
            transform: `rotate(${hourAngle}deg)`,
            transformOrigin: 'center bottom',
            marginBottom: '32px',
            zIndex: 10,
          }}
        />
        
        {/* Minute hand - longer and thinner */}
        <div
          className="absolute bg-blue-400 rounded-full origin-bottom"
          style={{
            width: '2px',
            height: '28px',
            left: 'calc(50% - 1px)',
            bottom: '50%',
            transform: `rotate(${minuteAngle}deg)`,
            transformOrigin: 'center bottom',
            marginBottom: '32px',
            zIndex: 11,
          }}
        />
        
        {/* Second hand - longest and red */}
        <div
          className="absolute bg-red-500 rounded-full origin-bottom"
          style={{
            width: '1px',
            height: '32px',
            left: 'calc(50% - 0.5px)',
            bottom: '50%',
            transform: `rotate(${secondAngle}deg)`,
            transformOrigin: 'center bottom',
            marginBottom: '32px',
            zIndex: 12,
          }}
        />
      </div>
    </div>
  );
}

// Digital Clock Component
function DigitalClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const date = time.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="text-right">
      <div className="text-3xl font-mono font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        {hours}:{minutes}:{seconds}
      </div>
      <div className="text-sm text-[#94A3B8] mt-1">{date}</div>
    </div>
  );
}

export default function CalendarPage() {
  const [activeTab, setActiveTab] = useState("meetings");
  const [meetings, setMeetings] = useState([]);
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clockType, setClockType] = useState("analog");
  const [form, setForm] = useState({
    title: "",
    description: "",
    meeting_date: "",
    start_time: "",
    end_time: "",
    meeting_link: "",
    participants: "",
    event_date: "",
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : null;

  // ✅ FIX: Fetch meetings with API_URL
  const fetchMeetings = async () => {
    try {
      const res = await axios.get(`${API_URL}/meetings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMeetings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ FIX: Fetch events with API_URL
  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      Promise.all([fetchMeetings(), fetchEvents()]).finally(() => setLoading(false));
    }
  }, [token]);

  // ✅ FIX: Create meeting with API_URL
  const createMeeting = async () => {
    try {
      const participantsArray = form.participants.split(",").map(e => e.trim()).filter(e => e);
      
      await axios.post(`${API_URL}/create-meeting`, {
        title: form.title,
        description: form.description,
        meeting_date: form.meeting_date,
        start_time: form.start_time,
        end_time: form.end_time,
        meeting_link: form.meeting_link,
        participants: participantsArray
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowModal(false);
      setForm({
        title: "",
        description: "",
        meeting_date: "",
        start_time: "",
        end_time: "",
        meeting_link: "",
        participants: "",
        event_date: "",
      });
      fetchMeetings();
      alert("Meeting created successfully!");
    } catch (err) {
      alert("Failed to create meeting");
    }
  };

  // ✅ FIX: Create event with API_URL
  const createEvent = async () => {
    try {
      await axios.post(`${API_URL}/create-event`, {
        title: form.title,
        description: form.description,
        event_date: form.event_date,
        start_time: form.start_time,
        end_time: form.end_time
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowModal(false);
      setForm({
        title: "",
        description: "",
        meeting_date: "",
        start_time: "",
        end_time: "",
        meeting_link: "",
        participants: "",
        event_date: "",
      });
      fetchEvents();
      alert("Event created successfully!");
    } catch (err) {
      alert("Failed to create event");
    }
  };

  // ✅ FIX: Delete meeting with API_URL
  const deleteMeeting = async (id) => {
    if (!confirm("Delete this meeting?")) return;
    try {
      await axios.delete(`${API_URL}/delete-meeting/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMeetings();
      alert("Meeting deleted!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  // ✅ FIX: Delete event with API_URL
  const deleteEvent = async (id) => {
    if (!confirm("Delete this event?")) return;
    try {
      await axios.delete(`${API_URL}/delete-event/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEvents();
      alert("Event deleted!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  const handleSubmit = () => {
    if (activeTab === "meetings") {
      if (!form.title || !form.meeting_date || !form.start_time || !form.end_time) {
        alert("Please fill title, date, start time and end time");
        return;
      }
      createMeeting();
    } else {
      if (!form.title || !form.event_date) {
        alert("Please fill title and date");
        return;
      }
      createEvent();
    }
  };

  if (!token) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#050816]">
        <div className="text-white">Please login to access calendar</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#050816]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#050816] text-white flex">
      <div className="h-screen sticky top-0 flex-shrink-0 overflow-y-auto border-r border-[#1E293B] bg-[#081120]">
        <Sidebar user={user} />
      </div>

      <main className="flex-1 h-screen overflow-y-auto bg-gradient-to-br from-[#050816] via-[#09111F] to-[#050816]">
        <div className="p-8">
          {/* Header with Clock */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-[#94A3B8] mb-4">
                <Sparkles size={16} />
                Smart Scheduling
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-300 bg-clip-text text-transparent">
                Calendar Hub
              </h1>
              <p className="text-[#94A3B8] mt-2">Manage meetings and events</p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setClockType(clockType === "analog" ? "digital" : "analog")}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm"
              >
                {clockType === "analog" ? "Switch to Digital" : "Switch to Analog"}
              </button>
              
              {clockType === "analog" ? <AnalogClock /> : <DigitalClock />}
            </div>
          </div>

          {/* Create Button */}
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-lg"
            >
              <Plus size={20} />
              New {activeTab === "meetings" ? "Meeting" : "Event"}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-[#1E293B]">
            <button
              onClick={() => setActiveTab("meetings")}
              className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 ${
                activeTab === "meetings"
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <Video size={18} />
              Meetings ({meetings.length})
            </button>
            <button
              onClick={() => setActiveTab("events")}
              className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 ${
                activeTab === "events"
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <Calendar size={18} />
              Events ({events.length})
            </button>
          </div>

          {/* Meetings List */}
          {activeTab === "meetings" && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {meetings.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-[#0B1220] rounded-xl border border-[#1E293B]">
                  <Video size={48} className="mx-auto text-[#94A3B8] mb-4" />
                  <p className="text-[#94A3B8]">No meetings yet</p>
                  <button onClick={() => setShowModal(true)} className="mt-4 text-blue-400 hover:text-blue-300 transition-all">
                    Create your first meeting
                  </button>
                </div>
              ) : (
                meetings.map((meeting) => (
                  <div key={meeting.id} className="bg-[#0B1220] border border-[#1E293B] rounded-xl p-6 hover:border-blue-500/50 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold">{meeting.title}</h3>
                      <button
                        onClick={() => deleteMeeting(meeting.id)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                    <p className="text-[#94A3B8] text-sm mb-4 line-clamp-2">{meeting.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-[#CBD5E1]">
                        <Calendar size={14} />
                        <span>{meeting.meeting_date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#CBD5E1]">
                        <Clock size={14} />
                        <span>{meeting.start_time} - {meeting.end_time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#CBD5E1]">
                        <Users size={14} />
                        <span>{meeting.participants?.length || 0} participants</span>
                      </div>
                    </div>
                    {meeting.meeting_link && (
                      <a
                        href={meeting.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all text-sm"
                      >
                        <Link size={14} />
                        Join Meeting
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Events List */}
          {activeTab === "events" && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-[#0B1220] rounded-xl border border-[#1E293B]">
                  <Calendar size={48} className="mx-auto text-[#94A3B8] mb-4" />
                  <p className="text-[#94A3B8]">No events yet</p>
                  <button onClick={() => setShowModal(true)} className="mt-4 text-blue-400 hover:text-blue-300 transition-all">
                    Create your first event
                  </button>
                </div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="bg-[#0B1220] border border-[#1E293B] rounded-xl p-6 hover:border-green-500/50 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold">{event.title}</h3>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                    <p className="text-[#94A3B8] text-sm mb-4 line-clamp-2">{event.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-[#CBD5E1]">
                        <Calendar size={14} />
                        <span>{event.event_date}</span>
                      </div>
                      {(event.start_time || event.end_time) && (
                        <div className="flex items-center gap-2 text-[#CBD5E1]">
                          <Clock size={14} />
                          <span>{event.start_time || "Any time"} {event.end_time && `- ${event.end_time}`}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-5">
          <div className="w-full max-w-2xl bg-[#0B1220] border border-[#1E293B] rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                Create {activeTab === "meetings" ? "Meeting" : "Event"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title *"
                className="w-full p-3 rounded-lg bg-[#111827] border border-[#1E293B] outline-none focus:border-blue-500 transition-all"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />

              <textarea
                placeholder="Description"
                className="w-full p-3 rounded-lg bg-[#111827] border border-[#1E293B] outline-none focus:border-blue-500 transition-all"
                rows="3"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />

              {activeTab === "meetings" ? (
                <>
                  <input
                    type="date"
                    className="w-full p-3 rounded-lg bg-[#111827] border border-[#1E293B] outline-none focus:border-blue-500 transition-all"
                    value={form.meeting_date}
                    onChange={(e) => setForm({ ...form, meeting_date: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="time"
                      placeholder="Start Time"
                      className="p-3 rounded-lg bg-[#111827] border border-[#1E293B] outline-none focus:border-blue-500 transition-all"
                      value={form.start_time}
                      onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    />
                    <input
                      type="time"
                      placeholder="End Time"
                      className="p-3 rounded-lg bg-[#111827] border border-[#1E293B] outline-none focus:border-blue-500 transition-all"
                      value={form.end_time}
                      onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Meeting Link (Zoom, Google Meet, etc.)"
                    className="w-full p-3 rounded-lg bg-[#111827] border border-[#1E293B] outline-none focus:border-blue-500 transition-all"
                    value={form.meeting_link}
                    onChange={(e) => setForm({ ...form, meeting_link: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Participant Emails (comma separated)"
                    className="w-full p-3 rounded-lg bg-[#111827] border border-[#1E293B] outline-none focus:border-blue-500 transition-all"
                    value={form.participants}
                    onChange={(e) => setForm({ ...form, participants: e.target.value })}
                  />
                </>
              ) : (
                <>
                  <input
                    type="date"
                    className="w-full p-3 rounded-lg bg-[#111827] border border-[#1E293B] outline-none focus:border-blue-500 transition-all"
                    value={form.event_date}
                    onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="time"
                      placeholder="Start Time (Optional)"
                      className="p-3 rounded-lg bg-[#111827] border border-[#1E293B] outline-none focus:border-blue-500 transition-all"
                      value={form.start_time}
                      onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    />
                    <input
                      type="time"
                      placeholder="End Time (Optional)"
                      className="p-3 rounded-lg bg-[#111827] border border-[#1E293B] outline-none focus:border-blue-500 transition-all"
                      value={form.end_time}
                      onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 rounded-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Create
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}