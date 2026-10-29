import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDate, formatRand } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';

const FILTERS = ['all', 'live', 'upcoming', 'closed'];

export default function AuctionList() {
  const [filter, setFilter] = useState('live');
  const [auctions, setAuctions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api(filter === 'all' ? '/auctions' : `/auctions?status=${filter}`)
      .then((data) => { setAuctions(data); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <section>
      <h1>Property Auctions</h1>
      <div className="tabs">
        {FILTERS.map((f) => (
          <button key={f} type="button" className={f === filter ? 'tab active' : 'tab'} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading…</p>}
      {!loading && !auctions.length && !error && <p className="muted">No auctions in this category.</p>}

      <div className="grid">
        {auctions.map((a) => (
          <Link to={`/auctions/${a.id}`} key={a.id} className="card">
            <div className="card-img">{a.property_type}</div>
            <div className="card-body">
              <StatusBadge status={a.status} />
              <h3>{a.title}</h3>
              <p className="muted">{a.location}</p>
              <p className="price">{formatRand(a.current_bid)}</p>
              <p className="muted small">
                {a.bid_count} bid{a.bid_count === 1 ? '' : 's'} · ends {formatDate(a.ends_at)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
