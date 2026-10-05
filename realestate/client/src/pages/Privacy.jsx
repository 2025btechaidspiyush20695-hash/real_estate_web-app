import React from 'react';
import PageHero from '../components/PageHero';

export default function Privacy() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy Policy" />
      <section className="section">
        <div className="container legal-page">
          <h2>Information we collect</h2>
          <p>When you submit an enquiry on this website, we collect your name, phone number, email address and the message you send. This information is used solely to respond to your enquiry about our properties and services.</p>
          <h2>How we use your information</h2>
          <p>Your contact details are used to call or message you regarding properties you are interested in. We never sell, rent or share your personal information with third parties for marketing purposes.</p>
          <h2>Data storage</h2>
          <p>Your enquiry data is stored securely in our database and is accessible only to the website owner. You may request deletion of your data at any time by contacting us.</p>
          <h2>Contact</h2>
          <p>For any privacy-related questions, please contact us through the contact page of this website.</p>
        </div>
      </section>
    </>
  );
}
