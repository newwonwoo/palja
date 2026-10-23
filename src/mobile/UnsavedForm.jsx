import React, { useEffect, useRef, useState } from 'react';

function UnsavedFormDialog({ busy, onStay, onDiscard }) {
  const ref = useRef(null);
  useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className="vault-dialog" aria-label="저장하지 않은 입력" onCancel={event => { event.preventDefault(); if (!busy) onStay(); }}>
    <h2>저장하지 않은 입력</h2>
    <p>입력한 내용이 아직 저장되지 않았습니다. 계속 작성하거나, 저장하지 않고 이동할 수 있습니다.</p>
    <div className="button-row">
      <button type="button" className="secondary" disabled={busy} onClick={onStay}>계속 작성</button>
      <button type="button" className="primary" disabled={busy} onClick={onDiscard}>저장하지 않고 이동</button>
    </div>
  </dialog>;
}

export function useUnsavedForm(value, busy) {
  const initial = useRef(JSON.stringify(value));
  const allowed = useRef(false);
  const [pending, setPending] = useState(null);
  const dirty = JSON.stringify(value) !== initial.current;
  useEffect(() => {
    const guard = event => {
      if (allowed.current || (!dirty && !busy)) return;
      event.preventDefault();
      if (!busy) setPending(() => event.detail.resume);
    };
    const unload = event => {
      if (allowed.current || (!dirty && !busy)) return;
      event.preventDefault(); event.returnValue = '';
    };
    window.addEventListener('saju:before-history-leave', guard);
    window.addEventListener('beforeunload', unload);
    return () => {
      window.removeEventListener('saju:before-history-leave', guard);
      window.removeEventListener('beforeunload', unload);
    };
  }, [dirty, busy]);
  return {
    allowLeave: () => { allowed.current = true; },
    dialog: pending ? <UnsavedFormDialog busy={busy} onStay={() => setPending(null)} onDiscard={() => { const leave = pending; setPending(null); allowed.current = true; leave(); }} /> : null,
  };
}
