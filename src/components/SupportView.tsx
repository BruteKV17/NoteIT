/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  MessageSquare, 
  ChevronDown, 
  ChevronDown as ChevronUp, 
  BookOpen, 
  Mail, 
  CheckCircle,
  FileQuestion,
  ExternalLink
} from 'lucide-react';
import { FAQItem } from '../types';
import { FAQ_ITEMS } from '../data';

export default function SupportView() {
  
  // States
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [supportSearch, setSupportSearch] = useState('');
  
  // Submit ticket states
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('Standard');
  const [ticketMsg, setTicketMsg] = useState('');
  const [ticketSubmitSuccess, setTicketSubmitSuccess] = useState(false);

  const toggleFaq = (id: string) => {
    setExpandedFaqId(prev => prev === id ? null : id);
  };

  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !ticketMsg.trim()) return;

    // Simulate sending
    setTicketSubmitSuccess(true);
    setSubject('');
    setTicketMsg('');
    setTimeout(() => setTicketSubmitSuccess(false), 4000);
  };

  const filteredFaqs = FAQ_ITEMS.filter(faq => 
    faq.question.toLowerCase().includes(supportSearch.toLowerCase()) ||
    faq.answer.toLowerCase().includes(supportSearch.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto pb-12">
      
      {/* Knowledge search and FAQs (2 Columns) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Knowledge Base Search */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200">
          <h2 className="font-sans font-bold text-lg text-gray-950 flex items-center gap-1.5">
            <HelpCircle className="h-5 w-5 text-gray-700" />
            <span>Help Knowledge Base</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">Search official guides, citations mechanics, and student security frameworks.</p>
          
          <div className="relative mt-4">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={supportSearch}
              onChange={(e) => setSupportSearch(e.target.value)}
              placeholder="Search concepts, backup configurations, billing cycles..."
              className="w-full rounded-xl border border-gray-200 bg-[#F9FAFB] pl-10 pr-4 py-2.5 text-xs font-semibold text-gray-900 outline-none focus:border-black focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Accordions */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 font-mono">Frequently Asked Questions</h3>
          
          {filteredFaqs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-xs text-gray-450 font-medium">
              We couldn't find matching guides for "{supportSearch}".
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredFaqs.map((faq) => {
                const isOpen = expandedFaqId === faq.id;
                return (
                  <div 
                    key={faq.id}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden transition-all shadow-xs"
                  >
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full flex items-center justify-between p-4.5 text-left font-sans text-[13px] font-bold text-slate-900 hover:bg-gray-50/50 focus:outline-none"
                    >
                      <span className="pr-4">{faq.question}</span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180 text-black' : ''}`} />
                    </button>
                    
                    {isOpen && (
                      <div className="px-4.5 pb-4 px-5 border-t border-gray-100 bg-gray-50/20 pt-3 text-xs text-gray-600 leading-relaxed font-sans">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Contact Ticketing form sidebar (1 Column) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
        
        <form onSubmit={handleSendTicket} className="space-y-4">
          <div>
            <h3 className="font-sans font-bold text-sm text-gray-950 flex items-center gap-1.5">
              <Mail className="h-4 w-4 text-gray-700" />
              <span>Contact Support Desk</span>
            </h3>
            <p className="text-[11px] text-gray-400 mt-1">Our academic engineering team typically responds within 4-6 hours.</p>
          </div>

          {ticketSubmitSuccess && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3.5 text-xs text-emerald-800 flex items-start gap-2 animate-pulse">
              <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="block font-bold">Ticket Submitted Successfully!</strong>
                <span className="text-[10px] mt-0.5 block leading-normal">Academic ID ticket reference: #{Math.floor(1000 + Math.random() * 9000)}. We'll email your registered inbox.</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase">SUBJECT SUMMARY</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Canvas Sync API Key fail"
              className="w-full rounded-lg border border-gray-200 bg-[#F9FAFB] p-2.5 text-xs font-semibold text-gray-900 mt-1 focus:border-black focus:bg-white outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase">URGENCY PRIORITY</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-[#F9FAFB] p-2.5 text-xs font-semibold text-gray-900 mt-1 focus:border-black focus:bg-white outline-none"
            >
              <option value="Standard">Standard Review</option>
              <option value="Urgent">Urgent Block (Researcher plan only)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase">DETAILED MESSAGE</label>
            <textarea
              required
              rows={4}
              value={ticketMsg}
              onChange={(e) => setTicketMsg(e.target.value)}
              placeholder="Outline your issue with precision..."
              className="w-full rounded-lg border border-gray-200 bg-[#F9FAFB] p-2.5 text-xs font-semibold text-gray-900 mt-1 focus:border-black focus:bg-white outline-none font-sans resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-black px-4 py-2.5 text-center text-xs font-bold text-white hover:bg-gray-800 transition-all active:scale-98 shadow-xs"
          >
            Submit Support Request
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <div className="text-[11px] font-semibold text-gray-450 leading-relaxed max-w-xs mx-auto">
            Review our official <a href="#" className="text-black border-b border-black font-bold">Privacy Sandbox Protocols</a> which details absolute isolation models.
          </div>
        </div>

      </div>

    </div>
  );
}
