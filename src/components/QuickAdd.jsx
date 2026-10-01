import React, { useState } from 'react';
import { Modal } from './ui.jsx';
import { ErrorForm, PyqForm, SessionForm, ResourceForm, ExtraTaskForm } from './forms.jsx';
import { useStore } from '../store.jsx';
import { Plus, ListTodo, AlertCircle, FileQuestion, Clock, FileBarChart, Link2 } from 'lucide-react';

export default function QuickAdd() {
  const { setRoute } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(null);
  const close = () => { setForm(null); setOpen(false); };

  const options = [
    ['task', ListTodo, 'Add task', 'Extra task for today'],
    ['error', AlertCircle, 'Add error', 'Log a mistake'],
    ['pyq', FileQuestion, 'Add PYQ session', 'Attempted / correct / time'],
    ['session', Clock, 'Add study session', 'Log time manually'],
    ['mock', FileBarChart, 'Add mock', 'Record a mock result'],
    ['resource', Link2, 'Add resource', 'Lecture, PDF, notes…'],
  ];

  return (
    <>
      <button
        className="btn primary icon"
        style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 60, width: 46, height: 46, borderRadius: 99, justifyContent: 'center', boxShadow: '0 6px 20px rgba(0,0,0,.35)' }}
        onClick={() => setOpen(true)} aria-label="Quick add" title="Quick add">
        <Plus size={20} />
      </button>

      {open && !form && (
        <Modal title="Quick add" onClose={close}>
          <div className="grid g2">
            {options.map(([id, Icon, label, sub]) => (
              <button key={id} className="btn" style={{ justifyContent: 'flex-start', padding: '12px 14px' }}
                onClick={() => { if (id === 'mock') { close(); setRoute({ page: 'mocks' }); } else setForm(id); }}>
                <Icon size={16} className="muted" />
                <span style={{ textAlign: 'left' }}>{label}<br /><span className="small faint" style={{ fontWeight: 400 }}>{sub}</span></span>
              </button>
            ))}
          </div>
        </Modal>
      )}
      {form === 'task' && <Modal title="Add task for today" onClose={close}><ExtraTaskForm onDone={close} /></Modal>}
      {form === 'error' && <Modal title="Log mistake" onClose={close}><ErrorForm onDone={close} /></Modal>}
      {form === 'pyq' && <Modal title="Log PYQ session" onClose={close}><PyqForm onDone={close} /></Modal>}
      {form === 'session' && <Modal title="Log study time" onClose={close}><SessionForm onDone={close} /></Modal>}
      {form === 'resource' && <Modal title="Add resource" onClose={close}><ResourceForm onDone={close} /></Modal>}
    </>
  );
}
