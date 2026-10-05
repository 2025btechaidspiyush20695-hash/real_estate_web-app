import React from 'react';
import PageHero from '../components/PageHero';

export default function Terms() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms & Conditions" />
      <section className="section">
        <div className="container legal-page">
          <h2>Website use</h2>
          <p>This website displays property listings for informational purposes. Property details, prices and availability may change without notice. Please verify all information with our team before making any decision.</p>
          <h2>Enquiries</h2>
          <p>Submitting an enquiry does not create any binding agreement. Our team will contact you to discuss your requirements; any final terms are agreed separately in writing.</p>
          <h2>Property verification</h2>
          <p>We make every effort to verify the properties we list, however buyers and renters are advised to complete their own due diligence, including legal verification, before completing any transaction.</p>
          <h2>Limitation of liability</h2>
          <p>We are not liable for any loss arising from reliance on information published on this website. Always consult professional advisors for legal and financial matters.</p>
        </div>
      </section>
    </>
  );
}
