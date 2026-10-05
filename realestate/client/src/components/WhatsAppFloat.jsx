import React from 'react';
import { useSite } from '../SiteContext';
import { IconWhatsapp } from '../icons';

/** Floating WhatsApp button — bottom-right, direct enquiry chat. */
export default function WhatsAppFloat() {
  const { blocks } = useSite();
  const contact = blocks.contact || {};
  const wa = contact.whatsapp ? String(contact.whatsapp).replace(/\D/g, '') : '';
  if (!wa) return null;
  const msg = encodeURIComponent("Hello, I'm interested in Gurukripa Estate properties. I would like to know more.");
  return (
    <a
      className="whatsapp-float"
      href={`https://wa.me/${wa}?text=${msg}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
    >
      <IconWhatsapp size={26} />
      <span className="whatsapp-float-label">Chat with us</span>
    </a>
  );
}
