import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

const TYPES = ['Residential', 'Sectional Title', 'Commercial', 'Industrial', 'Vacant Land', 'Farm'];

export default function AdminCreateAuction() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', location: '', property_type: 'Residential',
    starting_price: '', bid_increment: '10000', starts_at: '', ends_at: '',
  });

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const body = {
        ...form,
        starting_price: Number(form.starting_price),
        bid_increment: Number(form.bid_increment),
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
      };
      const { id } = await api('/auctions', { method: 'POST', body, token });
      navigate(`/auctions/${id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="auth">
      <h1>New auction</h1>
      <form onSubmit={submit}>
        <input name="title" placeholder="Title" value={form.title} onChange={update} required />
        <textarea name="description" placeholder="Description" value={form.description} onChange={update} rows={4} />
        <input name="location" placeholder="Location (suburb, city)" value={form.location} onChange={update} required />
        <select name="property_type" value={form.property_type} onChange={update}>
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <label>Starting price (R)<input name="starting_price" type="number" min="1" value={form.starting_price} onChange={update} required /></label>
        <label>Bid increment (R)<input name="bid_increment" type="number" min="1" value={form.bid_increment} onChange={update} required /></label>
        <label>Opens<input name="starts_at" type="datetime-local" value={form.starts_at} onChange={update} required /></label>
        <label>Closes<input name="ends_at" type="datetime-local" value={form.ends_at} onChange={update} required /></label>
        <button type="submit">Publish auction</button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
