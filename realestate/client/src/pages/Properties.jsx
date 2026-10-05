import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHero from '../components/PageHero';
import { useSite } from '../SiteContext';
import PropertyCard from '../components/PropertyCard';
import Reveal from '../components/Reveal';
import CustomSelect from '../components/CustomSelect';
import { getProperties, getMeta } from '../api';
import { IconSearch, IconFilter, IconChevronDown, IconArrowLeft, IconArrowRight } from '../icons';

const FALLBACK_TYPES = ['House', 'Bungalow', 'Flat', 'Villa', 'Haveli', 'Duplex', 'Townhouse'];
const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most viewed' },
];
const STATUS_OPTS = [
  { value: '', label: 'Buy / Rent' },
  { value: 'sale', label: 'For Sale' },
  { value: 'rent', label: 'For Rent' },
];
export default function Properties() {
  const { blocks } = useSite();
  const pageTxt = blocks.pages?.properties || {};
  // property types admin se editable (Website CMS → extras.propertyTypes)
  const cmsTypes = Array.isArray(blocks.extras?.propertyTypes) && blocks.extras.propertyTypes.length
    ? blocks.extras.propertyTypes.filter(Boolean).map(String)
    : FALLBACK_TYPES;
  const TYPE_OPTS = [
    { value: '', label: 'All Types' },
    ...cmsTypes.map((t) => ({ value: t, label: t })),
  ];
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ cities: [], types: [] });

  const q = params.get('q') || '';
  const type = params.get('type') || '';
  const city = params.get('city') || '';
  const status = params.get('status') || '';
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page')) || 1;

  const pageSize = 9;

  useEffect(() => {
    getMeta().then(setMeta).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    getProperties({ q, type, city, status, sort, page, limit: pageSize })
      .then((d) => setData(d))
      .catch(() => setData({ items: [], total: 0 }))
      .finally(() => setLoading(false));
  }, [q, type, city, status, sort, page]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));
  const cities = useMemo(() => meta.cities || [], [meta]);

  return (
    <>
      <PageHero
        eyebrow={pageTxt.eyebrow || 'Apni Manzil Chuniye'}
        title={pageTxt.title || 'Homes for Every Family'}
        sub={pageTxt.sub || 'Verified houses, flats, bungalows and havelis — with honest prices and zero brokerage.'}
      />

      <section className="section props-page">
        <div className="container">
          {/* Filter bar */}
          <Reveal className="filter-bar">
            <div className="filter-search">
              <IconSearch size={17} />
              <input
                placeholder="Search by name, city or locality…"
                value={q}
                onChange={(e) => setParam('q', e.target.value)}
              />
            </div>
            <div className="filter-select">
              <CustomSelect
                icon={<IconFilter size={15} />}
                value={status}
                onChange={(v) => setParam('status', v)}
                options={STATUS_OPTS}
                placeholder="Buy / Rent"
              />
            </div>
            <div className="filter-select">
              <CustomSelect
                value={type}
                onChange={(v) => setParam('type', v)}
                options={[
                  { value: '', label: 'All Types' },
                  ...[...new Set([...cmsTypes, ...(meta.types || [])])].map((t) => ({ value: t, label: t })),
                ]}
                placeholder="All Types"
              />
            </div>
            <div className="filter-select">
              <CustomSelect
                value={city}
                onChange={(v) => setParam('city', v)}
                options={[{ value: '', label: 'All Cities' }, ...cities.map((c) => ({ value: c, label: c }))]}
                placeholder="All Cities"
              />
            </div>
            <div className="filter-select">
              <CustomSelect
                value={sort}
                onChange={(v) => setParam('sort', v)}
                options={SORTS}
                placeholder="Sort"
              />
            </div>
          </Reveal>

          {/* Status chips */}
          <div className="chip-row">
            <button className={`chip-btn ${!status ? 'on' : ''}`} onClick={() => setParam('status', '')}>All</button>
            <button className={`chip-btn ${status === 'sale' ? 'on' : ''}`} onClick={() => setParam('status', 'sale')}>Buy</button>
            <button className={`chip-btn ${status === 'rent' ? 'on' : ''}`} onClick={() => setParam('status', 'rent')}>Rent</button>
          </div>

          <p className="props-count">
            {loading ? 'Loading homes…' : `${data.total} home${data.total === 1 ? '' : 's'} found`}
          </p>

          {loading ? (
            <div className="prop-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div className="skeleton-card" key={i}><span /><span /><span /></div>
              ))}
            </div>
          ) : data.items.length === 0 ? (
            <div className="empty-state">
              <MandalaMini />
              <h3>Koi ghar nahi mila</h3>
              <p>Try changing the filters, or call us — we might have something unlisted.</p>
            </div>
          ) : (
            <div className="prop-grid">
              {data.items.map((p, i) => (
                <Reveal key={p._id} delay={(i % 3) * 80}>
                  <PropertyCard p={p} index={i} />
                </Reveal>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={page <= 1} onClick={() => setParam('page', String(page - 1))}>
                <IconArrowLeft size={16} />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} className={`page-btn ${page === i + 1 ? 'on' : ''}`} onClick={() => setParam('page', String(i + 1))}>
                  {i + 1}
                </button>
              ))}
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setParam('page', String(page + 1))}>
                <IconArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function MandalaMini() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" className="empty-mandala" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="32" cy="32" r="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 4" />
      <path d="M32 6 C36 14, 38 20, 32 26 C26 20, 28 14, 32 6 Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="32" cy="32" r="4" fill="currentColor" />
    </svg>
  );
}
