import React, { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '../ui/Skeleton.jsx';
import axios from 'axios';
import { useAuth, authHeader } from '../auth/AuthContext.jsx';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { token } = useAuth();
  const [claims, setClaims] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 9;
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

  async function toggleArchive(c) {
    const res = await axios.patch(`/claims/${c.id}/archive`, { archived: !c.archived }, { headers: authHeader(token) });
    setClaims(list => list.map(x => x.id===c.id ? res.data : x));
  }
  const filtered = useMemo(()=> claims.filter(c => (showArchived ? c.archived : !c.archived) && (
    !search || c.caseDescription?.toLowerCase().includes(search.toLowerCase()) || c.status.toLowerCase().includes(search.toLowerCase()) || c.id.includes(search)
  )), [claims, showArchived, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page-1)*pageSize, page*pageSize);
  return <div className="p-6 space-y-4">
    <div className="flex flex-wrap gap-4 items-center justify-between">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="flex gap-2 items-center text-sm">
        <button onClick={()=>setShowArchived(false)} className={`px-3 py-1 rounded border ${!showArchived?'bg-blue-600 text-white':'bg-white'}`}>Active</button>
        <button onClick={()=>setShowArchived(true)} className={`px-3 py-1 rounded border ${showArchived?'bg-blue-600 text-white':'bg-white'}`}>Archived</button>
        <button onClick={createClaim} className="ml-4 bg-green-600 text-white px-4 py-2 rounded">New Claim</button>
      </div>
    </div>
    <div className="flex flex-wrap gap-3 items-center">
      <input className="input max-w-xs" placeholder="Search (id, status, text)" value={search} onChange={e=> { setSearch(e.target.value); setPage(1); }} />
      <div className="text-xs text-gray-600">{filtered.length} result(s)</div>
    </div>
    {loading ? <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{Array.from({length:6}).map((_,i)=><div key={i} className="card space-y-3"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3" /><Skeleton className="h-3 w-2/3" /></div>)}</div> : <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {pageItems.map(c => <div key={c.id} className="card flex flex-col justify-between">
        <div className="space-y-1">
          <div className="font-medium">Claim {c.id.slice(0,8)}</div>
          <div className="text-xs inline-block px-2 py-0.5 rounded bg-gray-100 border">{c.status}</div>
          {c.archived && <div className="text-[10px] text-red-600">Archived</div>}
        </div>
        <div className="flex gap-2 mt-3 text-sm">
          <Link to={`/claims/${c.id}`} className="text-blue-600">View</Link>
          <Link to={`/claims/${c.id}/wizard/description`} className="text-indigo-600">Wizard</Link>
          <button onClick={()=>toggleArchive(c)} className="text-gray-600">{c.archived?'Unarchive':'Archive'}</button>
        </div>
      </div>)}
      {!filtered.length && <div className="text-sm text-gray-500">No {showArchived?'archived':'active'} claims.</div>}
    </div>}
    {totalPages>1 && <div className="flex gap-2 items-center justify-center pt-2 text-sm flex-wrap">
      <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-2 py-1 border rounded disabled:opacity-40">Prev</button>
      {Array.from({length: totalPages}).map((_,i)=><button key={i} onClick={()=>setPage(i+1)} className={`px-2 py-1 rounded border ${page===i+1?'bg-blue-600 text-white':'bg-white'}`}>{i+1}</button>)}
      <button disabled={page===totalPages} onClick={()=>setPage(p=>p+1)} className="px-2 py-1 border rounded disabled:opacity-40">Next</button>
    </div>}
  </div>;
}
