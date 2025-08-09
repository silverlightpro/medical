import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth, authHeader } from '../auth/AuthContext.jsx';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { token } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await axios.get('/claims', { headers: authHeader(token) });
      setClaims(res.data);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []); // eslint-disable-line

  async function createClaim() {
    const res = await axios.post('/claims', {}, { headers: authHeader(token) });
    setClaims([res.data, ...claims]);
  }

  return <div className="p-6 space-y-4">
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <button onClick={createClaim} className="bg-green-600 text-white px-4 py-2 rounded">New Claim</button>
    </div>
    {loading ? <div>Loading...</div> : <div className="space-y-2">
      {claims.map(c => <div key={c.id} className="border rounded p-3 bg-white flex justify-between">
        <div>
          <div className="font-medium">Claim {c.id.slice(0,8)}</div>
          <div className="text-sm text-gray-600">Status: {c.status}</div>
        </div>
        <Link to={`/claims/${c.id}`} className="text-blue-600 self-center">Open</Link>
      </div>)}
      {!claims.length && <div>No claims yet.</div>}
    </div>}
  </div>;
}
