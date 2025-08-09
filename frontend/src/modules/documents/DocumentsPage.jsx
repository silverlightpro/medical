import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth, authHeader } from '../auth/AuthContext.jsx';

export default function DocumentsPage() {
  const { token } = useAuth();
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const res = await axios.get('/documents', { headers: authHeader(token) });
    setDocs(res.data);
  }
  useEffect(() => { load(); }, []); // eslint-disable-line

  async function upload(e) {
    const files = e.target.files;
    if (!files?.length) return;
    const form = new FormData();
    for (const f of files) form.append('files', f);
    setUploading(true);
    await axios.post('/documents', form, { headers: { ...authHeader(token) } });
    setUploading(false);
    load();
  }

  return <div className="p-6 space-y-4">
    <h1 className="text-2xl font-semibold">My Documents</h1>
    <input type="file" multiple onChange={upload} />
    {uploading && <div>Uploading...</div>}
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {docs.map(d => <div key={d.id} className="border rounded p-3 bg-white">
        <div className="font-medium truncate" title={d.fileName}>{d.fileName}</div>
        <div className="text-xs text-gray-600">Uploaded {new Date(d.createdAt).toLocaleString()}</div>
      </div>)}
    </div>
  </div>;
}
