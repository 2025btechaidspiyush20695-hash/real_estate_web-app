import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { Field, TextInput, NumInput, TextArea, Toggle, ImageManager, useToast, Spinner } from '../components/UI';
import CustomSelect from '../components/CustomSelect';
import { IconArrowLeft, IconCheck, IconPlus, IconX } from '../icons';

const DEFAULT_TYPES = ['House', 'Bungalow', 'Flat', 'Villa', 'Haveli', 'Duplex', 'Townhouse'];

const AMENITY_POOL = [
  'Parking', 'Garden', 'Power Backup', 'CCTV', 'Water 24x7', 'Vaastu Aligned', 'Pooja Room',
  'Modular Kitchen', 'Lift', 'Swimming Pool', 'Gym', 'Clubhouse', '24x7 Security', 'Children Play Area',
  'Rooftop Terrace', 'Solar Panels', 'Home Automation', 'Courtyard', 'Servant Quarter', 'Servant Room',
  'Heritage Design',
];

const EMPTY = {
  title: '', description: '', price: '', type: 'House', status: 'sale',
  city: 'Jaipur', locality: '', address: '', area: '', plotArea: '',
  bedrooms: 2, bathrooms: 2, floors: 1, parking: 1, yearBuilt: '',
  possession: 'Ready to move', furnishing: 'Semi-furnished',
  amenities: [], images: [], featured: false, active: true, availability: 'available',
};

export default function PropertyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = !!id;

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [newAmenity, setNewAmenity] = useState('');
  const [typeOptions, setTypeOptions] = useState(DEFAULT_TYPES);

  useEffect(() => {
    // editable property types from Website CMS (extras.propertyTypes)
    api.getContent().then((d) => {
      const extras = (d.items || []).find((c) => c.key === 'extras')?.data;
      const list = extras?.propertyTypes;
      if (Array.isArray(list) && list.length) setTypeOptions(list.filter(Boolean).map(String));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (isEdit) {
      api
        .getProperty(id)
        .then((d) => {
          const p = d.property;
          setForm({
            ...EMPTY,
            ...p,
            price: p.price,
            area: p.area || '',
            plotArea: p.plotArea || '',
            yearBuilt: p.yearBuilt || '',
          });
        })
        .catch((e) => {
          toast(e.message, 'err');
          navigate('/properties');
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const toggleAmenity = (a) =>
    set('amenities', form.amenities.includes(a) ? form.amenities.filter((x) => x !== a) : [...form.amenities, a]);

  /** Custom amenity add — admin apni marzi ki amenity bana sakta hai */
  const addCustomAmenity = () => {
    const val = newAmenity.trim();
    if (!val) return;
    if (form.amenities.includes(val)) { setNewAmenity(''); return; }
    set('amenities', [...form.amenities, val]);
    setNewAmenity('');
  };

  const save = async (e) => {
    e.preventDefault();
    setErr('');
    if (!form.title.trim()) return setErr('Title is required');
    if (!form.price) return setErr('Price is required');
    if (!form.images.length) return setErr('Add at least one image');
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        area: form.area ? Number(form.area) : 0,
        plotArea: form.plotArea ? Number(form.plotArea) : 0,
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: Number(form.bathrooms) || 0,
        floors: Number(form.floors) || 1,
        parking: Number(form.parking) || 0,
        yearBuilt: form.yearBuilt ? Number(form.yearBuilt) : undefined,
      };
      if (isEdit) {
        await api.updateProperty(id, payload);
        toast('Property updated — live on the website');
      } else {
        const d = await api.createProperty(payload);
        toast('Property published');
        navigate(`/properties/${d.property._id}/edit`, { replace: true });
      }
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="a-page"><Spinner /></div>;

  return (
    <div className="a-page">
      <div className="a-page-head">
        <div>
          <Link to="/properties" className="a-back"><IconArrowLeft size={14} /> Back to properties</Link>
          <h1>{isEdit ? 'Edit Property' : 'Add New Property'}</h1>
          <p>{isEdit ? 'Changes go live on the website instantly.' : 'Fill the details — the listing goes live instantly.'}</p>
        </div>
      </div>

      <form onSubmit={save} className="a-form">
        <div className="a-form-card">
          <h2>Basics</h2>
          <div className="a-form-grid">
            <Field label="Title *" wide>
              <TextInput required value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Gulmohar Bungalow — 4BHK with Garden" />
            </Field>
            <Field label="Description" wide>
              <TextArea rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe the house, neighbourhood, nearby schools & markets…" />
            </Field>
            <Field label="Price (₹) *">
              <NumInput required min={0} value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="For rent, enter monthly rent" />
            </Field>
            <Field label="Status">
              <CustomSelect value={form.status} onChange={(v) => set('status', v)} options={[
                { value: 'sale', label: 'For Sale' },
                { value: 'rent', label: 'For Rent' },
              ]} />
            </Field>
            <Field label="Availability">
              <CustomSelect value={form.availability || 'available'} onChange={(v) => set('availability', v)} options={[
                { value: 'available', label: '🟢 Available' },
                { value: 'limited', label: '🟠 Limited Availability' },
                { value: 'sold', label: '🔴 Sold' },
              ]} />
            </Field>
            <Field label="Type">
              <CustomSelect value={form.type} onChange={(v) => set('type', v)} options={[
                ...[...new Set([...typeOptions, ...DEFAULT_TYPES])],
              ].map((t) => ({ value: t, label: t }))} />
            </Field>
            <Field label="City">
              <TextInput value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Jaipur" />
            </Field>
            <Field label="Locality">
              <TextInput value={form.locality} onChange={(e) => set('locality', e.target.value)} placeholder="Vaishali Nagar" />
            </Field>
            <Field label="Full address" wide>
              <TextInput value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Plot 12, Gulmohar Lane…" />
            </Field>
          </div>
        </div>

        <div className="a-form-card">
          <h2>Specifications</h2>
          <div className="a-form-grid">
            <Field label="Bedrooms"><NumInput min={0} value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} /></Field>
            <Field label="Bathrooms"><NumInput min={0} value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} /></Field>
            <Field label="Floors"><NumInput min={1} value={form.floors} onChange={(e) => set('floors', e.target.value)} /></Field>
            <Field label="Parking spots"><NumInput min={0} value={form.parking} onChange={(e) => set('parking', e.target.value)} /></Field>
            <Field label="Carpet area (sq.ft)"><NumInput min={0} value={form.area} onChange={(e) => set('area', e.target.value)} /></Field>
            <Field label="Plot area (sq.yd)"><NumInput min={0} value={form.plotArea} onChange={(e) => set('plotArea', e.target.value)} /></Field>
            <Field label="Year built"><NumInput min={1800} max={2100} value={form.yearBuilt} onChange={(e) => set('yearBuilt', e.target.value)} /></Field>
            <Field label="Possession">
              <CustomSelect value={form.possession} onChange={(v) => set('possession', v)} options={[
                'Ready to move', 'Immediate', 'Under construction', 'Within 6 months', 'Within 1 year',
              ].map((x) => ({ value: x, label: x }))} />
            </Field>
            <Field label="Furnishing">
              <CustomSelect value={form.furnishing} onChange={(v) => set('furnishing', v)} options={[
                { value: 'Unfurnished', label: 'Unfurnished' },
                { value: 'Semi-furnished', label: 'Semi-furnished' },
                { value: 'Fully furnished', label: 'Fully furnished' },
              ]} />
            </Field>
          </div>
        </div>

        <div className="a-form-card">
          <h2>Photos</h2>
          <p className="a-muted">Maximum 20 photos per property. Pehli photo = cover (⭐ se change kar sakte ho). Multi-select (Ctrl) se ek saath kai upload karo.</p>
          <ImageManager images={form.images} onChange={(imgs) => set('images', imgs)} />
        </div>

        <div className="a-form-card">
          <h2>Amenities</h2>
          <p className="a-muted">Neeche se choose karo ya apni marzi ki amenity add karo.</p>

          {/* custom add */}
          <div className="a-amenity-add">
            <input
              className="a-input"
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomAmenity(); } }}
              placeholder="Apni amenity likho… e.g. Lift, Piped Gas, WiFi Society"
              maxLength={40}
            />
            <button type="button" className="a-btn gold sm" onClick={addCustomAmenity}>
              <IconPlus size={14} /> Add
            </button>
          </div>

          {/* selected custom amenities (remove-able) */}
          {form.amenities.filter((a) => !AMENITY_POOL.includes(a)).length > 0 && (
            <div className="a-amenity-selected">
              <span className="a-amenity-selected-label">Is property ki custom amenities:</span>
              {form.amenities.filter((a) => !AMENITY_POOL.includes(a)).map((a) => (
                <span className="a-chip on custom" key={a}>
                  <IconCheck size={13} /> {a}
                  <button type="button" className="a-chip-x" onClick={() => toggleAmenity(a)} title="Remove"><IconX size={12} /></button>
                </span>
              ))}
            </div>
          )}

          <div className="a-chips">
            {AMENITY_POOL.map((a) => (
              <button
                type="button"
                key={a}
                className={`a-chip ${form.amenities.includes(a) ? 'on' : ''}`}
                onClick={() => toggleAmenity(a)}
              >
                {form.amenities.includes(a) && <IconCheck size={13} />} {a}
              </button>
            ))}
          </div>
          <p className="a-muted" style={{ marginTop: 10 }}>
            {form.amenities.length} amenit{form.amenities.length === 1 ? 'y' : 'ies'} selected
          </p>
        </div>

        <div className="a-form-card row">
          <Toggle checked={form.featured} onChange={(v) => set('featured', v)} label="Featured on homepage" />
          <Toggle checked={form.active} onChange={(v) => set('active', v)} label="Visible on website" />
        </div>

        {err && <p className="a-form-err">{err}</p>}

        <div className="a-form-actions">
          <Link to="/properties" className="a-btn ghost">Cancel</Link>
          <button className="a-btn gold" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Publish Property'} {!saving && <IconCheck size={16} />}
          </button>
        </div>
      </form>
    </div>
  );
}
