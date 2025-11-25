"use client";

import { useState } from "react";
import Image from "next/image";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    contactDetails: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ title: '', message: '', contactDetails: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-form-container">
      <div className="contact-form-wrapper">
        <div className="contact-image-section">
          <Image 
            src="/ContactImage.png" 
            alt="Contact us" 
            className="contact-image"
            width={550}
            height={400}
            priority
          />
        </div>
        <div className="contact-form-section">
          <h2>Neem Contact Op</h2>
          <p>Heb je een vraag of wil je samenwerken? We horen graag van je!</p>
        
        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-group">
            <label htmlFor="title">Onderwerp *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Waar gaat dit over?"
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Bericht *</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              placeholder="Vertel ons meer..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="contactDetails">Contactgegevens</label>
            <input
              type="text"
              id="contactDetails"
              name="contactDetails"
              value={formData.contactDetails}
              onChange={handleChange}
              placeholder="Je e-mailadres of telefoonnummer (optioneel)"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="submit-button"
          >
            {isSubmitting ? 'Versturen...' : 'Bericht Versturen'}
          </button>

          {submitStatus === 'success' && (
            <div className="success-message">
              ✅ Bericht succesvol verzonden! We nemen binnenkort contact met je op.
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="error-message">
              ❌ Verzenden mislukt. Probeer het opnieuw.
            </div>
          )}
        </form>
        </div>
      </div>
    </div>
  );
} 