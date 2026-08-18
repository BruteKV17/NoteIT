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
  CheckCircle,
  FileQuestion,
  Send
} from 'lucide-react';
import { FAQ_ITEMS } from '../data';
import { Card, Button, Input, Badge } from './bauhaus';

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto pb-12 select-none text-[#111111]">
      
      {/* Knowledge search and FAQs (2 Columns) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Knowledge Base Search */}
        <Card shadow="md" className="bg-white p-6 border-2 border-[#111111] space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="yellow" size="sm">HELP CENTER</Badge>
            <h2 className="font-heading font-extrabold text-xl text-[#111111] uppercase tracking-tight">
              KNOWLEDGE BASE
            </h2>
          </div>
          <p className="text-xs font-mono text-[#666666]">
            Search official guides, citations mechanics, and student security frameworks.
          </p>
          
          <div className="relative mt-2">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#111111]" />
            <input
              type="text"
              value={supportSearch}
              onChange={(e) => setSupportSearch(e.target.value)}
              placeholder="Search concepts, backup configurations, billing cycles..."
              className="w-full rounded-[6px] border-2 border-[#111111] bg-white pl-10 pr-4 py-2.5 text-xs font-mono font-bold text-[#111111] outline-none shadow-paper-sm"
            />
          </div>
        </Card>

        {/* Accordions */}
        <div className="space-y-3">
          <span className="text-xs font-mono font-bold text-[#666666] uppercase tracking-widest pl-1">
            FREQUENTLY ASKED QUESTIONS
          </span>
          
          {filteredFaqs.length === 0 ? (
            <Card shadow="sm" className="bg-white rounded-[6px] border-2 border-[#111111] p-8 text-center text-xs font-mono text-[#666666]">
              We couldn't find matching guides for "{supportSearch}".
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq) => {
                const isOpen = expandedFaqId === faq.id;
                return (
                  <Card 
                    key={faq.id}
                    shadow="sm"
                    className="bg-white border-2 border-[#111111] rounded-[6px] overflow-hidden"
                  >
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full flex items-center justify-between p-4 text-left font-heading text-sm font-extrabold text-[#111111] uppercase hover:bg-[#FFF8D6] transition-colors cursor-pointer"
                    >
                      <span className="pr-4">{faq.question}</span>
                      <ChevronDown className={`h-4 w-4 text-[#111111] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isOpen && (
                      <div className="px-4 pb-4 pt-3 border-t-2 border-[#111111] bg-[#F6F2EA] text-xs font-mono text-[#111111] leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Contact Ticketing form sidebar (1 Column) */}
      <Card shadow="md" className="bg-white border-2 border-[#111111] p-6 space-y-5 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-[#111111] pb-3">
            <MessageSquare className="h-5 w-5 text-[#111111]" />
            <h3 className="font-heading font-extrabold text-base uppercase text-[#111111]">
              SUBMIT TICKETING REQ
            </h3>
          </div>

          <p className="text-xs font-mono text-[#666666]">
            Can't find what you need? Send a ticket directly to NoteIT research engineering team.
          </p>

          {ticketSubmitSuccess && (
            <div className="p-3 rounded-[4px] bg-[#19B56B]/20 border-2 border-[#111111] text-[#111111] text-xs font-mono font-bold flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#19B56B] shrink-0" />
              <span>Ticket submitted successfully! Response team notified.</span>
            </div>
          )}

          <form onSubmit={handleSendTicket} className="space-y-3">
            <div>
              <label className="section-label text-[10px] font-bold text-[#666666] uppercase tracking-[2px] block mb-1">
                TICKET SUBJECT
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Issue with Gemini Key SAS"
                className="w-full rounded-[6px] border-2 border-[#111111] bg-white p-2.5 text-xs font-mono font-bold text-[#111111] outline-none shadow-paper-sm"
              />
            </div>

            <div>
              <label className="section-label text-[10px] font-bold text-[#666666] uppercase tracking-[2px] block mb-1">
                PRIORITY LEVEL
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-[6px] border-2 border-[#111111] bg-white p-2.5 text-xs font-mono font-bold text-[#111111] outline-none shadow-paper-sm"
              >
                <option value="Standard">Standard Priority</option>
                <option value="Urgent">Urgent Priority</option>
                <option value="Critical">Critical Academic Emergency</option>
              </select>
            </div>

            <div>
              <label className="section-label text-[10px] font-bold text-[#666666] uppercase tracking-[2px] block mb-1">
                MESSAGE DESCRIPTION
              </label>
              <textarea
                required
                rows={4}
                value={ticketMsg}
                onChange={(e) => setTicketMsg(e.target.value)}
                placeholder="Provide detailed description of the error or feature request..."
                className="w-full rounded-[6px] border-2 border-[#111111] bg-white p-2.5 text-xs font-mono font-bold text-[#111111] outline-none shadow-paper-sm resize-none"
              />
            </div>

            <Button
              variant="primary"
              size="md"
              type="submit"
              className="w-full justify-center"
              icon={<Send className="h-4 w-4" />}
            >
              SEND SUPPORT TICKET
            </Button>
          </form>
        </div>
      </Card>

    </div>
  );
}
