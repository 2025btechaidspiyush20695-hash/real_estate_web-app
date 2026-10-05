import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { CONTENT_SCHEMA } from '../contentSchema';
import { Field, TextInput, NumInput, TextArea, Spinner, useToast } from '../components/UI';
import CustomSelect from '../components/CustomSelect';
import { IconPlus, IconTrash, IconCheck, IconUpload, IconX } from '../icons';

/* ---------------- field renderers ---------------- */

function ImageField({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const fileRef = React.useRef(null);
  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const d = await api.uploadImage(file);
      onChange(d.url);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };
  return (
    <div className="a-image-field">
      {value ? (
        <div className="a-image-field-preview">
          <img src={value} alt="" />
          <button type="button" className="a-img-x" onClick={() => onChange('')} title="Remove image"><IconX size={13} /></button>
          <button type="button" className="a-img-replace" onClick={() => fileRef.current?.click()}>Replace</button>
        </div>
      ) : (
        <button type="button" className="a-image-pick" onClick={() => fileRef.current?.click()}>
          <IconUpload size={18} /> {busy ? 'Uploading…' : 'Upload image'}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={upload} />
    </div>
  );
}

function GroupField({ field, value, onChange }) {
  const v = value && typeof value === 'object' ? value : {};
  return (
    <div className="a-group">
      {field.fields.map((f) => (
        <RenderField key={f.key} field={f} value={v[f.key]} onChange={(nv) => onChange({ ...v, [f.key]: nv })} />
      ))}
    </div>
  );
}

function ListField({ field, value, onChange }) {
  const v = Array.isArray(value) ? value : [];
  return (
    <div className="a-list">
      {v.map((item, i) => (
        <div className="a-list-row" key={i}>
          <TextInput value={item} onChange={(e) => onChange(v.map((x, k) => (k === i ? e.target.value : x)))} placeholder={`${field.itemLabel || 'item'} ${i + 1}`} />
          <button type="button" className="a-icon-btn danger" onClick={() => onChange(v.filter((_, k) => k !== i))} title="Remove"><IconTrash size={14} /></button>
        </div>
      ))}
      <button type="button" className="a-btn ghost sm" onClick={() => onChange([...v, ''])}><IconPlus size={14} /> Add {field.itemLabel || 'item'}</button>
    </div>
  );
}

function ListObjField({ field, value, onChange }) {
  const v = Array.isArray(value) ? value : [];
  const move = (i, dir) => {
    const next = [...v];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="a-list-obj">
      {v.map((item, i) => (
        <div className="a-obj-card" key={i}>
          <div className="a-obj-head">
            <strong>{field.itemLabel || 'Item'} {i + 1}</strong>
            <div>
              <button type="button" className="a-icon-btn" disabled={i === 0} onClick={() => move(i, -1)} title="Move up">↑</button>
              <button type="button" className="a-icon-btn" disabled={i === v.length - 1} onClick={() => move(i, 1)} title="Move down">↓</button>
              <button type="button" className="a-icon-btn danger" onClick={() => onChange(v.filter((_, k) => k !== i))} title="Remove"><IconTrash size={14} /></button>
            </div>
          </div>
          {field.fields.map((f) => (
            <RenderField key={f.key} field={f} value={item[f.key]} onChange={(nv) => onChange(v.map((x, k) => (k === i ? { ...x, [f.key]: nv } : x)))} />
          ))}
        </div>
      ))}
      <button type="button" className="a-btn ghost sm" onClick={() => onChange([...v, {}])}><IconPlus size={14} /> Add {field.itemLabel || 'item'}</button>
    </div>
  );
}

function RenderField({ field, value, onChange }) {
  switch (field.type) {
    case 'textarea':
      return <Field label={field.label} hint={field.hint} wide><TextArea value={value || ''} onChange={(e) => onChange(e.target.value)} /></Field>;
    case 'number':
      return <Field label={field.label} hint={field.hint}><NumInput value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} /></Field>;
    case 'select':
      return (
        <Field label={field.label} hint={field.hint}>
          <CustomSelect value={value || ''} onChange={onChange} options={(field.options || []).map((o) => ({ value: o, label: o }))} placeholder="Select…" />
        </Field>
      );
    case 'image':
      return <Field label={field.label} hint={field.hint}><ImageField value={value} onChange={onChange} /></Field>;
    case 'list':
      return <Field label={field.label} hint={field.hint} wide><ListField field={field} value={value} onChange={onChange} /></Field>;
    case 'listObj':
      return <Field label={field.label} hint={field.hint} wide><ListObjField field={field} value={value} onChange={onChange} /></Field>;
    case 'group':
      return <Field label={field.label} hint={field.hint} wide><GroupField field={field} value={value} onChange={onChange} /></Field>;
    default:
      return <Field label={field.label} hint={field.hint}><TextInput value={value || ''} onChange={(e) => onChange(e.target.value)} /></Field>;
  }
}

/* ---------------- page ---------------- */

export default function Content() {
  const [docs, setDocs] = useState(null);
  const [activeKey, setActiveKey] = useState(CONTENT_SCHEMA[0].key);
  const [form, setForm] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const toast = useToast();

  useEffect(() => {
    api
      .getContent()
      .then((d) => {
        const map = {};
        d.items.forEach((it) => (map[it.key] = it.data));
        setDocs(map);
        const first = CONTENT_SCHEMA[0].key;
        setForm(map[first] || {});
      })
      .catch((e) => toast(e.message, 'err'));
  }, []);

  const open = (key) => {
    if (dirty && !window.confirm('You have unsaved changes in this section. Discard them?')) return;
    setActiveKey(key);
    setForm(docs[key] || {});
    setDirty(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const d = await api.saveContent(activeKey, form);
      setDocs((m) => ({ ...m, [activeKey]: d.data }));
      setDirty(false);
      setSavedAt(new Date());
      toast('Saved! The website shows this within a minute.');
    } catch (e) {
      toast(e.message, 'err');
    } finally {
      setSaving(false);
    }
  };

  if (!docs) return <div className="a-page"><Spinner /></div>;

  const schema = CONTENT_SCHEMA.find((s) => s.key === activeKey);

  return (
    <div className="a-page">
      <div className="a-page-head">
        <div>
          <h1>Site Content</h1>
          <p>Edit everything visitors see — headlines, images, numbers, reviews. Changes go live on the website instantly (within ~1 minute or on refresh).</p>
        </div>
        <div className="a-head-actions">
          {dirty && <span className="a-dirty-dot">Unsaved changes</span>}
          <button className="a-btn gold" onClick={save} disabled={saving || !dirty}>
            {saving ? 'Saving…' : 'Save Section'} <IconCheck size={16} />
          </button>
        </div>
      </div>

      <div className="a-content-split">
        <nav className="a-content-nav">
          {CONTENT_SCHEMA.map((s) => (
            <button key={s.key} className={s.key === activeKey ? 'on' : ''} onClick={() => open(s.key)}>
              <span className="a-content-nav-label">{s.label}</span>
              <small>{s.desc || ''}</small>
            </button>
          ))}
        </nav>

        <div className="a-content-edit">
          <div className="a-form-card">
            <div className="a-edit-head">
              <h2>{schema.label}</h2>
              {savedAt && <span className="a-saved-at">Last saved {savedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
            </div>
            <p className="a-muted">{schema.desc}</p>
            <div className="a-form-grid">
              {schema.fields.map((f) => (
                <RenderField key={f.key} field={f} value={form[f.key]} onChange={(nv) => { setForm((x) => ({ ...x, [f.key]: nv })); setDirty(true); }} />
              ))}
            </div>
            <div className="a-form-actions">
              <button className="a-btn gold" onClick={save} disabled={saving || !dirty}>
                {saving ? 'Saving…' : 'Save Section'} <IconCheck size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
