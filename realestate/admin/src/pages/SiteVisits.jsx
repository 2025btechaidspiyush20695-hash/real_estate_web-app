import React, { useEffect, useState } from 'react';
import { api, fmtDate } from '../api';
import { useToast, Confirm, Empty, Badge, Spinner } from '../components/UI';
import CustomSelect from '../components/CustomSelect';
import { IconPlus, IconTrash, IconCalendar, IconSearch } from '../icons';

const STATUS_OPTS = [
  { value: '', label: 'All statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rescheduled', label: 'Rescheduled' },
];
const STATUS_TONE = { scheduled: 'neutral', confirmed: 'ok', completed: 'teal', cancelled: 'err', rescheduled: 'warn' };

function fmtDateOnly(d) {
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function SiteVisits() {
  const [items, setItems] = useState([]);
  const [props, setProps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [q, setQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [del, setDel] = useState(null);
  const [openCard, setOpenCard] = useState(null);
  const toast = useToast();

  // form state
  const [form, setForm] = useState({ leadName: '', phone: '', property: '', date: '', time: '11:00 AM' });

  const load = () => {
    setLoading(true);
    api.getSiteVisits({ status: filter, q })
      .then((d) => setItems(d.items))
      .catch((e) => toast(e.message, 'err'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter, q]);

  useEffect(() => {
    api.getProperties({ limit: 100 }).then((d) => setProps(d.items)).catch(() => {});
  }, []);

  const createVisit = async (e) => {
    e.preventDefault();
    if (!form.leadName || !form.phone || !form.date) return toast('Lead name, phone aur date required hain', 'err');
    try {
      const prop = props.find((p) => p._id === form.property);
      await api.createSiteVisit({
        leadName: form.leadName,
        phone: form.phone,
        property: form.property || null,
        propertyTitle: prop?.title || '',
        date: form.date,
        time: form.time,
      });
      toast('Site visit scheduled ✅');
      setShowForm(false);
      setForm({ leadName: '', phone: '', property: '', date: '', time: '11:00 AM' });
      load();
    } catch (e2) {
      toast(e2.message, 'err');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.updateSiteVisit(id, { status });
      toast('Status updated');
      load();
    } catch (e2) {
      toast(e2.message, 'err');
    }
  };

  // group by date
  const groups = {};
  items.forEach((v) => {
    const key = fmtDateOnly(v.date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(v);
  });

  return (
    <div className="a-page">
      <div className="a-page-head">
        <div>
          <h1>Site Visits</h1>
          <p>Schedule visits, track status aur visit ke baad feedback record karo.</p>
        </div>
        <button className="a-btn gold" onClick={() => setShowForm(!showForm)}>
          <IconPlus size={16} /> {showForm ? 'Close' : 'Schedule Visit'}
        </button>
      </div>

      {showForm && (
        <div className="a-panel">
          <h2 style={{ marginBottom: 14 }}>Schedule New Site Visit</h2>
          <form onSubmit={createVisit} className="a-form-grid" style={{ marginBottom: 0 }}>
            <label className="a-field"><span className="a-field-label">Lead name *</span>
              <input className="a-input" required value={form.leadName} onChange={(e) => setForm({ ...form, leadName: e.target.value })} placeholder="Rahul Sharma" />
            </label>
            <label className="a-field"><span className="a-field-label">Phone *</span>
              <input className="a-input" required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98765 43210" />
            </label>
            <label className="a-field"><span className="a-field-label">Property</span>
              <CustomSelect
                value={form.property}
                onChange={(v) => setForm({ ...form, property: v })}
                placeholder="Select property"
                options={[{ value: '', label: 'Select property (optional)' }, ...props.map((p) => ({ value: p._id, label: p.title }))]}
              />
            </label>
            <label className="a-field"><span className="a-field-label">Date *</span>
              <input className="a-input" required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </label>
            <label className="a-field"><span className="a-field-label">Time</span>
              <input className="a-input" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </label>
            <div className="a-field" style={{ justifyContent: 'flex-end' }}>
              <button className="a-btn gold" type="submit"><IconCalendar size={15} /> Schedule</button>
            </div>
          </form>
        </div>
      )}

      <div className="a-toolbar">
        <div className="a-search">
          <IconSearch size={16} />
          <input placeholder="Search lead, property, phone…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div style={{ minWidth: 170 }}>
          <CustomSelect value={filter} onChange={setFilter} options={STATUS_OPTS} />
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Empty title="No site visits" sub="Schedule your first site visit — jaise hi visitor property dekhna chahe." />
      ) : (
        Object.entries(groups).map(([day, dayVisits]) => (
          <div className="a-visit-day" key={day}>
            <h3 className="a-visit-day-label">{day} <span>({dayVisits.length})</span></h3>
            {dayVisits.map((v) => (
              <div className={`a-visit-card ${openCard === v._id ? 'open' : ''}`} key={v._id}>
                <button className="a-visit-card-head" onClick={() => setOpenCard(openCard === v._id ? null : v._id)}>
                  <span className="a-visit-time">{v.time}</span>
                  <span className="a-visit-info">
                    <strong>{v.leadName} <small>· {v.phone}</small></strong>
                    <small>{v.propertyTitle || 'Property not selected'}</small>
                  </span>
                  <Badge tone={STATUS_TONE[v.status] || 'neutral'}>{v.status}</Badge>
                  <span className="a-enq-caret">{openCard === v._id ? '−' : '+'}</span>
                </button>

                {openCard === v._id && (
                  <div className="a-visit-card-body">
                    {/* status update */}
                    <div className="a-visit-actions">
                      <CustomSelect size="sm" value={v.status} onChange={(s) => updateStatus(v._id, s)} options={STATUS_OPTS.slice(1)} />
                      <button className="a-icon-btn danger" onClick={() => setDel(v)} title="Delete"><IconTrash size={15} /></button>
                    </div>

                    {/* feedback (after visit) */}
                    {v.status === 'completed' ? (
                      <FeedbackForm visit={v} onSaved={() => { load(); toast('Feedback saved'); }} />
                    ) : (
                      <p className="a-muted" style={{ marginTop: 10 }}>
                        Visit complete hone ke baad feedback form yahan aayega — interested? budget suitable? follow-up kab?
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))
      )}

      <Confirm
        open={!!del}
        title="Delete this site visit?"
        text={`${del?.leadName} ki visit delete ho jayegi.`}
        onYes={async () => { try { await api.deleteSiteVisit(del._id); toast('Deleted'); setDel(null); load(); } catch (e) { toast(e.message, 'err'); } }}
        onNo={() => setDel(null)}
        danger
      />
    </div>
  );
}

/* feedback form for completed visits */
function FeedbackForm({ visit, onSaved }) {
  const [fb, setFb] = useState({
    interested: visit.interested || '',
    budgetSuitable: visit.budgetSuitable || '',
    followUpDate: visit.followUpDate ? visit.followUpDate.slice(0, 10) : '',
    notes: visit.notes || '',
  });
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.updateSiteVisit(visit._id, {
        interested: fb.interested,
        budgetSuitable: fb.budgetSuitable,
        followUpDate: fb.followUpDate || null,
        notes: fb.notes,
      });
      onSaved();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="a-feedback">
      <h4>Site Visit Feedback</h4>
      <div className="a-feedback-row">
        <label className="a-field"><span className="a-field-label">Interested?</span>
          <CustomSelect size="sm" value={fb.interested} onChange={(v) => setFb({ ...fb, interested: v })} options={[
            { value: '', label: '—' }, { value: 'yes', label: '✅ Yes' }, { value: 'maybe', label: '🤔 Maybe' }, { value: 'no', label: '❌ No' },
          ]} />
        </label>
        <label className="a-field"><span className="a-field-label">Budget suitable?</span>
          <CustomSelect size="sm" value={fb.budgetSuitable} onChange={(v) => setFb({ ...fb, budgetSuitable: v })} options={[
            { value: '', label: '—' }, { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' },
          ]} />
        </label>
        <label className="a-field"><span className="a-field-label">Follow-up date</span>
          <input className="a-input" type="date" value={fb.followUpDate} onChange={(e) => setFb({ ...fb, followUpDate: e.target.value })} />
        </label>
      </div>
      <label className="a-field"><span className="a-field-label">Notes</span>
        <textarea className="a-input" rows={2} value={fb.notes} onChange={(e) => setFb({ ...fb, notes: e.target.value })} placeholder='"Client liked location but wants lower price."' />
      </label>
      <div className="a-form-actions">
        <button className="a-btn gold sm" disabled={busy}>{busy ? 'Saving…' : 'Save Feedback'}</button>
      </div>
    </form>
  );
}
