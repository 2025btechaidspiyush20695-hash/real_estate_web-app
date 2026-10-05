import React, { useEffect, useState } from 'react';
import { api, fmtDate } from '../api';
import { useToast, Confirm, Empty, Badge, Spinner } from '../components/UI';
import CustomSelect from '../components/CustomSelect';
import { IconSearch, IconTrash, IconPhone, IconMail, IconCalendar, IconCheck } from '../icons';

const PIPELINE = [
  { v: '', l: 'All Leads' },
  { v: 'new', l: '🟡 New' },
  { v: 'contacted', l: '🔵 Contacted' },
  { v: 'qualified', l: '🟢 Qualified' },
  { v: 'site_visit', l: '🏠 Site Visit' },
  { v: 'negotiation', l: '🤝 Negotiation' },
  { v: 'closed', l: '✅ Closed' },
];
const TONE = {
  new: 'warn', contacted: 'neutral', qualified: 'ok',
  site_visit: 'teal', negotiation: 'gold', closed: 'ok',
};

export default function Enquiries() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const [del, setDel] = useState(null);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    api.getEnquiries({ status: filter, q })
      .then((d) => setItems(d.items))
      .catch((e) => toast(e.message, 'err'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter, q]);

  const setStatus = async (id, status) => {
    try {
      await api.setEnquiryStatus(id, { status });
      toast('Pipeline status updated');
      load();
    } catch (e) {
      toast(e.message, 'err');
    }
  };

  const setFollowUp = async (id, date) => {
    try {
      await api.setEnquiryStatus(id, { nextFollowUp: date || null });
      toast(date ? 'Follow-up set ✅' : 'Follow-up cleared');
      load();
    } catch (e) {
      toast(e.message, 'err');
    }
  };

  const doDelete = async () => {
    try {
      await api.deleteEnquiry(del._id);
      toast('Lead deleted');
      setDel(null);
      load();
    } catch (e) {
      toast(e.message, 'err');
    }
  };

  return (
    <div className="a-page">
      <div className="a-page-head">
        <div>
          <h1>Leads &amp; Enquiries</h1>
          <p>Har enquiry ek lead hai — pipeline me aage badhao: New → Contacted → Qualified → Site Visit → Negotiation → Closed.</p>
        </div>
      </div>

      {/* pipeline tabs */}
      <div className="a-pipeline-tabs">
        {PIPELINE.map((s) => (
          <button key={s.v} className={`a-pipe-tab ${filter === s.v ? 'on' : ''}`} onClick={() => setFilter(s.v)}>
            {s.l}
          </button>
        ))}
      </div>

      <div className="a-toolbar">
        <div className="a-search">
          <IconSearch size={16} />
          <input placeholder="Search name, phone, property…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Empty title="No leads found" sub="Website se nayi enquiries yahan aayengi." />
      ) : (
        <div className="a-enq-cards">
          {items.map((e) => (
            <div key={e._id} className={`a-enq-card ${open === e._id ? 'open' : ''}`}>
              <button className="a-enq-card-head" onClick={() => setOpen(open === e._id ? null : e._id)}>
                <span className="a-enq-av">{String(e.name).charAt(0)}</span>
                <span className="a-enq-info">
                  <strong>{e.name} <Badge tone={TONE[e.status] || 'neutral'}>{PIPELINE.find(p => p.v === e.status)?.l?.replace(/^\S+\s/, '') || e.status}</Badge></strong>
                  <small>{e.propertyTitle || (e.requirementType ? `${e.requirementType} · ${e.requirementCity}` : 'General enquiry')} · {fmtDate(e.createdAt)}</small>
                </span>
                {e.nextFollowUp && (
                  <span className="a-followup-chip"><IconCalendar size={12} /> {new Date(e.nextFollowUp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                )}
                <span className="a-enq-caret">{open === e._id ? '−' : '+'}</span>
              </button>

              {open === e._id && (
                <div className="a-enq-card-body">
                  {(e.requirementType || e.budget || e.bedrooms || e.timeline) && (
                    <div className="a-enq-req">
                      <strong>🎯 Requirement:</strong>
                      <span>{[e.requirementType, e.requirementCity, e.budget, e.bedrooms && `${e.bedrooms} BHK`, e.timeline].filter(Boolean).join(' · ')}</span>
                    </div>
                  )}
                  <p className="a-enq-msg">{e.message || 'No message.'}</p>

                  {/* lead details grid */}
                  <div className="a-lead-details">
                    <div><small>Phone</small><strong>{e.phone}</strong></div>
                    {e.email && <div><small>Email</small><strong>{e.email}</strong></div>}
                    <div><small>Source</small><strong>{e.source || 'Website'}</strong></div>
                    <div><small>Status</small>
                      <div style={{ minWidth: 140 }}>
                        <CustomSelect size="sm" value={e.status} onChange={(v) => setStatus(e._id, v)} options={PIPELINE.slice(1).map(p => ({ value: p.v, label: p.l }))} />
                      </div>
                    </div>
                    <div>
                      <small>Next follow-up</small>
                      <input
                        className="a-input"
                        type="date"
                        style={{ padding: '7px 10px', fontSize: '.8rem' }}
                        value={e.nextFollowUp ? e.nextFollowUp.slice(0, 10) : ''}
                        onChange={(ev) => setFollowUp(e._id, ev.target.value || null)}
                      />
                    </div>
                  </div>

                  <div className="a-enq-actions" style={{ marginTop: 12 }}>
                    <a className="a-btn ghost sm" href={`tel:${e.phone}`}><IconPhone size={14} /> Call</a>
                    {e.email && <a className="a-btn ghost sm" href={`mailto:${e.email}`}><IconMail size={14} /> Email</a>}
                    <button className="a-icon-btn danger" onClick={() => setDel(e)} title="Delete"><IconTrash size={15} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Confirm open={!!del} title="Delete this lead?" text={`${del?.name} ka data permanently delete ho jayega.`} onYes={doDelete} onNo={() => setDel(null)} danger />
    </div>
  );
}
