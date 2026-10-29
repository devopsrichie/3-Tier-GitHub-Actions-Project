import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, formatDate, formatRand } from '../api.js';
import { useAuth } from '../auth.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function AuctionDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const [auction, setAuction] = useState(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const load = useCallback(() => {
    api(`/auctions/${id}`).then(setAuction).catch((e) => setMessage({ type: 'error', text: e.message }));
  }, [id]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000); // refresh bids every 10s
    return () => clearInterval(timer);
  }, [load]);

  if (!auction) return <p className="muted">{message.text || 'Loading…'}</p>;

  const minimum = auction.bid_count ? auction.current_bid + auction.bid_increment : auction.starting_price;

  const placeBid = async (e) => {
    e.preventDefault();
    try {
      await api(`/auctions/${id}/bids`, { method: 'POST', body: { amount: Number(amount) }, token });
      setMessage({ type: 'success', text: `Bid of ${formatRand(amount)} placed.` });
      setAmount('');
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <section className="detail">
      <Link to="/" className="muted">← All auctions</Link>
      <h1>{auction.title} <StatusBadge status={auction.status} /></h1>
      <p className="muted">{auction.location} · {auction.property_type}</p>
      <p>{auction.description}</p>

      <div className="stats">
        <div><span className="muted small">Current bid</span><strong>{formatRand(auction.current_bid)}</strong></div>
        <div><span className="muted small">Increment</span><strong>{formatRand(auction.bid_increment)}</strong></div>
        <div><span className="muted small">Opens</span><strong>{formatDate(auction.starts_at)}</strong></div>
        <div><span className="muted small">Closes</span><strong>{formatDate(auction.ends_at)}</strong></div>
      </div>

      {auction.status === 'live' && (
        token ? (
          <form onSubmit={placeBid} className="bid-form">
            <input
              type="number" min={minimum} step={1000} required
              placeholder={`Minimum ${formatRand(minimum)}`}
              value={amount} onChange={(e) => setAmount(e.target.value)}
            />
            <button type="submit">Place bid</button>
          </form>
        ) : (
          <p><Link to="/login">Log in</Link> to place a bid.</p>
        )
      )}
      {message.text && <p className={message.type}>{message.text}</p>}

      <h2>Bid history</h2>
      {auction.bids.length ? (
        <table>
          <thead><tr><th>Bidder</th><th>Amount</th><th>Time</th></tr></thead>
          <tbody>
            {auction.bids.map((b) => (
              <tr key={b.id}><td>{b.bidder}</td><td>{formatRand(b.amount)}</td><td>{formatDate(b.created_at)}</td></tr>
            ))}
          </tbody>
        </table>
      ) : <p className="muted">No bids yet.</p>}
    </section>
  );
}
