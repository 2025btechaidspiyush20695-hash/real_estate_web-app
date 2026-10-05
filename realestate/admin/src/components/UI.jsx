import React, { useState } from 'react';
import { IconTrash, IconUpload, IconGrip, IconImage, IconStar, IconAlert } from '../icons';
import { api } from '../api';
import { ToastCtx } from './Layout';

/* ---------- simple form primitives ---------- */

export function Field({ label, hint, children, wide }) {
  return (
    <label className={`a-field ${wide ? 'wide' : ''}`}>
      <span className="a-field-label">{label}</span>
      {children}
      {hint && <span className="a-field-hint">{hint}</span>}
    </label>
  );
}

export const TextInput = (p) => <input className="a-input" {...p} />;
export const NumInput = (p) => <input className="a-input" type="number" {...p} />;
export const TextArea = (p) => <textarea className="a-input" rows={p.rows || 4} {...p} />;

export const Select = ({ children, ...p }) => (
  <select className="a-input" {...p}>{children}</select>
);

export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" className={`a-toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
      <i />
      {label}
    </button>
  );
}

export function Spinner({ text = 'Loading…' }) {
  return (
    <div className="a-spinner-wrap">
      <div className="a-spinner" />
      <p>{text}</p>
    </div>
  );
}

export function Empty({ title, sub }) {
  return (
    <div className="a-empty">
      <svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true">
        <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M32 10 C36 18, 38 24, 32 30 C26 24, 28 18, 32 10 Z" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="32" cy="32" r="5" fill="currentColor" />
      </svg>
      <h3>{title}</h3>
      <p>{sub}</p>
    </div>
  );
}

export function Badge({ children, tone = 'neutral' }) {
  return <span className={`a-badge ${tone}`}>{children}</span>;
}

export function Confirm({ open, title, text, onYes, onNo, danger }) {
  if (!open) return null;
  return (
    <div className="a-modal-veil" onClick={onNo}>
      <div className="a-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{text}</p>
        <div className="a-modal-actions">
          <button className="a-btn ghost" onClick={onNo}>Cancel</button>
          <button className={`a-btn ${danger ? 'danger' : 'gold'}`} onClick={onYes}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   IMAGE MANAGER — multiple upload, max 20 photos per property
   - multi-select (Ctrl/Shift) se ek saath kai photos select karo
   - 0/20 counter + progress
   - first image = cover (⭐), reorder, remove
   ================================================================ */
export const MAX_PHOTOS = 20;

export function ImageManager({ images = [], onChange }) {
  const [busy, setBusy] = useState(false);
  const [uploaded, setUploaded] = useState(0);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState('');

  const fileRef = React.useRef(null);
  const remaining = MAX_PHOTOS - images.length;

  const upload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (files.length > remaining) {
      setErr(`Sirf ${remaining} aur photo${remaining === 1 ? '' : 'e'} add ho sakti hain (limit ${MAX_PHOTOS}). Aapne ${files.length} select ki.`);
      e.target.value = '';
      return;
    }
    setBusy(true);
    setErr('');
    setUploaded(0);
    setTotal(files.length);
    const newUrls = [...images];
    try {
      for (let i = 0; i < files.length; i++) {
        const d = await api.uploadImage(files[i]);
        newUrls.push(d.url);
        setUploaded(i + 1);
      }
      onChange(newUrls.slice(0, MAX_PHOTOS));
    } catch (e2) {
      setErr(e2.message + (uploaded > 0 ? ` — ${uploaded}/${files.length} upload hue, baaki try karo.` : ''));
      onChange(newUrls.slice(0, MAX_PHOTOS));
    } finally {
      setBusy(false);
      setUploaded(0);
      setTotal(0);
      e.target.value = '';
    }
  };

  const move = (i, dir) => {
    const next = [...images];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const setCover = (i) => {
    const next = [...images];
    const [item] = next.splice(i, 1);
    next.unshift(item);
    onChange(next);
  };

  const remove = async (i) => {
    const url = images[i];
    const filename = url.split('/').pop();
    onChange(images.filter((_, k) => k !== i));
    api.deleteUpload(filename).catch(() => {});
  };

  return (
    <div className="a-imgs">
      <div className="a-imgs-head">
        <span className={`a-imgs-count ${images.length >= MAX_PHOTOS ? 'full' : ''}`}>
          <IconImage size={14} /> {images.length}/{MAX_PHOTOS} photos
        </span>
        {images.length > 0 && <span className="a-imgs-hint">⭐ pehli photo = cover · arrows = order</span>}
      </div>

      <div className="a-imgs-grid">
        {images.map((src, i) => (
          <div className="a-img" key={src + i}>
            <img src={src} alt={`Photo ${i + 1}`} />
            {i === 0 && <span className="a-img-first"><IconStar size={10} /> Cover</span>}
            <div className="a-img-actions">
              <button type="button" title="Set as cover" onClick={() => setCover(i)}><IconStar size={13} /></button>
              <button type="button" title="Move left" disabled={i === 0} onClick={() => move(i, -1)}><IconGrip size={14} /></button>
              <button type="button" title="Move right" disabled={i === images.length - 1} onClick={() => move(i, 1)}><IconGrip size={14} style={{ transform: 'rotate(180deg)' }} /></button>
              <button type="button" className="del" title="Remove" onClick={() => remove(i)}><IconTrash size={14} /></button>
            </div>
          </div>
        ))}

        {remaining > 0 && (
          <button
            type="button"
            className={`a-img-add ${busy ? 'busy' : ''}`}
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            {busy ? (
              <>
                <span className="a-img-uploading">
                  <i className="a-spinner sm" />
                  Uploading {uploaded}/{total}…
                </span>
              </>
            ) : (
              <>
                <IconUpload size={22} />
                <span>{images.length ? 'Add more photos' : 'Upload photos'}</span>
                <small>Multi-select (Ctrl) — JPG/PNG/WEBP, max 8 MB each</small>
                <em>{remaining} slot{remaining === 1 ? '' : 's'} left</em>
              </>
            )}
          </button>
        )}
      </div>

      {images.length >= MAX_PHOTOS && (
        <p className="a-imgs-full"><IconAlert size={13} /> Photo limit ({MAX_PHOTOS}) reach ho gayi — nayi photo add karne ke liye pehle koi remove karo.</p>
      )}
      {err && <p className="a-form-err">{err}</p>}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={upload} />
    </div>
  );
}

/* ---------- simple toast hook ---------- */
export function useToast() {
  return React.useContext(ToastCtx);
}
