import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtINR } from '../api';
import { useToast, Confirm, Empty, Badge } from '../components/UI';
import { IconSearch, IconPlus, IconEdit, IconTrash, IconEye, IconSparkle } from '../icons';
import CustomSelect from '../components/CustomSelect';

export default function Properties() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [del, setDel] = useState(null);
  const toast = useToast();

  const LIMIT = 10;

  const load = () => {
    setLoading(true);
    api
      .getProperties({ q, status, page, limit: LIMIT })
      .then((d) => {
        setItems(d.items);
        setTotal(d.total);
      })
      .catch((e) => toast(e.message, 'err'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [q, status, page]);

  const toggleFeature = async (p) => {
    try {
      await api.toggleFeature(p._id);
      toast(p.featured ? 'Removed from featured' : 'Marked as featured');
      load();
    } catch (e) {
      toast(e.message, 'err');
    }
  };

  const doDelete = async () => {
    try {
      await api.deleteProperty(del._id);
      toast('Property deleted');
      setDel(null);
      load();
    } catch (e) {
      toast(e.message, 'err');
    }
  };

  const pages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="a-page">
      <div className="a-page-head">
        <div>
          <h1>Properties</h1>
          <p>{total} listing{total === 1 ? '' : 's'} in the catalogue.</p>
        </div>
        <Link to="/properties/new" className="a-btn gold"><IconPlus size={16} /> Add Property</Link>
      </div>

      <div className="a-toolbar">
        <div className="a-search">
          <IconSearch size={16} />
          <input placeholder="Search title, city…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <div style={{ minWidth: 170 }}>
          <CustomSelect value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[
            { value: '', label: 'All statuses' },
            { value: 'sale', label: 'For Sale' },
            { value: 'rent', label: 'For Rent' },
          ]} />
        </div>
      </div>

      {loading ? (
        <div className="a-spinner" />
      ) : items.length === 0 ? (
        <Empty title="No properties found" sub="Try a different search, or add a new property." />
      ) : (
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Type</th>
                <th>City</th>
                <th>Price</th>
                <th>Views</th>
                <th>Featured</th>
                <th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="a-cell-prop">
                      <img src={p.images?.[0] || '/uploads/seed/hero.jpg'} alt="" />
                      <span>
                        <strong>{p.title}</strong>
                        <small>{p.bedrooms} BHK · {p.area ? `${p.area} sq.ft` : '—'} · <Badge tone={p.status === 'sale' ? 'gold' : 'teal'}>{p.status}</Badge></small>
                      </span>
                    </div>
                  </td>
                  <td>{p.type}</td>
                  <td>{p.city}</td>
                  <td className="a-nowrap">{fmtINR(p.price)}</td>
                  <td><span className="a-eyes"><IconEye size={13} /> {p.views}</span></td>
                  <td>
                    <button
                      className={`a-star ${p.featured ? 'on' : ''}`}
                      onClick={() => toggleFeature(p)}
                      title="Toggle featured"
                    >
                      <IconSparkle size={16} />
                    </button>
                  </td>
                  <td className="right">
                    <div className="a-row-actions">
                      <Link to={`/properties/${p._id}/edit`} className="a-icon-btn" title="Edit"><IconEdit size={15} /></Link>
                      <button className="a-icon-btn danger" title="Delete" onClick={() => setDel(p)}><IconTrash size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="a-pager">
          <button className="a-btn ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span>Page {page} of {pages}</span>
          <button className="a-btn ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      <Confirm
        open={!!del}
        title="Delete this property?"
        text={`"${del?.title}" will be permanently removed. This cannot be undone.`}
        onYes={doDelete}
        onNo={() => setDel(null)}
        danger
      />
    </div>
  );
}
