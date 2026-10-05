import React from 'react';
import { Link } from 'react-router-dom';
import { IconHome } from '../icons';
import { useSite } from '../SiteContext';

export default function NotFound() {
  const { blocks } = useSite();
  const nf = blocks.extras?.notFound || {};
  return (
    <section className="section notfound">
      <div className="container center">
        <IconHome size={54} className="nf-icon" />
        <h1 className="nf-code">404</h1>
        <h2>{nf.title || 'Yeh rasta kahin nahi jaata'}</h2>
        <p>{nf.sub || 'The page you are looking for has moved or never existed.'}</p>
        <Link to="/" className="btn btn-gold">Back to Home</Link>
      </div>
    </section>
  );
}
