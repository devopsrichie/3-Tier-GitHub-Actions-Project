import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import AuctionList from './pages/AuctionList.jsx';
import AuctionDetail from './pages/AuctionDetail.jsx';
import Login from './pages/Login.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import AdminCreateAuction from './pages/AdminCreateAuction.jsx';

export default function App() {
  const { user, logout } = useAuth();

  return (
    <>
      <header className="nav">
        <Link to="/" className="brand">Auction Central</Link>
        <nav>
          <Link to="/">Auctions</Link>
          {user && <Link to="/dashboard">My Bids</Link>}
          {user?.role === 'admin' && <Link to="/admin/new">New Auction</Link>}
          {user ? (
            <button type="button" className="link" onClick={logout}>Log out ({user.name})</button>
          ) : (
            <Link to="/login">Log in</Link>
          )}
        </nav>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<AuctionList />} />
          <Route path="/auctions/:id" element={<AuctionDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={user ? <UserDashboard /> : <Navigate to="/login" />} />
          <Route
            path="/admin/new"
            element={user?.role === 'admin' ? <AdminCreateAuction /> : <Navigate to="/" />}
          />
        </Routes>
      </main>

      <footer className="footer">© {new Date().getFullYear()} Auction Central · Johannesburg</footer>
    </>
  );
}
