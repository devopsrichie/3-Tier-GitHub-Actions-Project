import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDate, formatRand } from '../api.js';
import { useAuth } from '../auth.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function UserDashboard() {
  const { token, user } = useAuth();
  const [bids, setBids] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/users/me/bids', { token }).then(setBids).catch((e) => setError(e.message));
  }, [token]);

  return (
    <section>
      <h1>Welcome, {user.name}</h1>
      <h2>My bids</h2>
      {error && <p className="error">{error}</p>}
      {!bids.length && !error && <p className="muted">You haven't bid on anything yet. <Link to="/">Browse auctions</Link></p>}
      {!!bids.length && (
        <table>
          <thead>
            <tr><th>Property</th><th>Status</th><th>My highest</th><th>Current bid</th><th>Position</th><th>Ends</th></tr>
          </thead>
          <tbody>
            {bids.map((b) => (
              <tr key={b.id}>
                <td><Link to={`/auctions/${b.id}`}>{b.title}</Link></td>
                <td><StatusBadge status={b.status} /></td>
                <td>{formatRand(b.my_highest)}</td>
                <td>{formatRand(b.current_bid)}</td>
                <td className={b.leading ? 'success' : 'error'}>
                  {b.leading ? (b.status === 'closed' ? 'Won' : 'Leading') : 'Outbid'}
                </td>
                <td>{formatDate(b.ends_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
