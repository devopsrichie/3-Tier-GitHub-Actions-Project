import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const data = await api(`/auth/${mode}`, { method: 'POST', body: form });
      login(data);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="auth">
      <h1>{mode === 'login' ? 'Log in' : 'Create an account'}</h1>
      <form onSubmit={submit}>
        {mode === 'register' && <input name="name" placeholder="Full name" value={form.name} onChange={update} required />}
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={update} required />
        <input name="password" type="password" placeholder="Password (min 8 characters)" value={form.password} onChange={update} required />
        <button type="submit">{mode === 'login' ? 'Log in' : 'Register'}</button>
      </form>
      {error && <p className="error">{error}</p>}
      <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
        {mode === 'login' ? 'New here? Register to bid' : 'Already registered? Log in'}
      </button>
    </section>
  );
}
