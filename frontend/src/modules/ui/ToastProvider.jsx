import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);
let idSeq = 0;
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const remove = useCallback(id => setToasts(ts => ts.filter(t => t.id !== id)), []);
  const push = useCallback((msg, opts={}) => {
    const id = ++idSeq;
    const toast = { id, msg, type: opts.type || 'info', ttl: opts.ttl || 4000 };
    setToasts(ts => [...ts, toast]);
    if (toast.ttl > 0) setTimeout(()=> remove(id), toast.ttl);
    return id;
  }, [remove]);
  const api = { push, remove };
  return <ToastContext.Provider value={api}>
    {children}
    <div className="fixed inset-x-0 top-2 flex flex-col items-center space-y-2 z-50 pointer-events-none">
      {toasts.map(t => <div key={t.id} className={`pointer-events-auto px-4 py-2 rounded shadow text-sm text-white ${t.type==='error'?'bg-red-600':t.type==='success'?'bg-green-600':'bg-gray-800'}`}>{t.msg}</div>)}
    </div>
  </ToastContext.Provider>;
}
export function useToast() { return useContext(ToastContext); }
