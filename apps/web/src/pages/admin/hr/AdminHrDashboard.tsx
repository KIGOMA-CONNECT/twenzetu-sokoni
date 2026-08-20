import { useNavigate } from 'react-router-dom';

const modules = [
  { title: 'Organization', desc: 'Org units, types & profiles', path: '/admin/org/units', color: '#3b82f6' },
  { title: 'Positions', desc: 'Manage positions & grades', path: '/admin/hr/positions', color: '#8b5cf6' },
  { title: 'Employees', desc: 'Employee records & lifecycle', path: '/admin/hr/employees', color: '#06b6d4' },
  { title: 'Leave & Attendance', desc: 'Leave types, requests, clock-in/out', path: '/admin/hr/leave', color: '#10b981' },
  { title: 'Payroll', desc: 'Salary structures, periods, payslips', path: '/admin/hr/payroll', color: 'var(--warning)' },
  { title: 'Recruitment', desc: 'Job requisitions, candidates, hiring', path: '/admin/hr/recruitment', color: '#ef4444' },
  { title: 'Performance', desc: 'Goals, review cycles & reviews', path: '/admin/hr/performance', color: '#ec4899' },
  { title: 'Compensation', desc: 'Salary revisions & benefit plans', path: '/admin/hr/compensation', color: '#14b8a6' },
  { title: 'Learning', desc: 'Courses & enrollments', path: '/admin/hr/learning', color: 'var(--accent)' },
  { title: 'Succession', desc: 'Succession plans & candidates', path: '/admin/hr/succession', color: '#6366f1' },
  { title: 'Offboarding', desc: 'Offboarding cases & tasks', path: '/admin/hr/offboarding', color: 'var(--danger)' },
  { title: 'Compliance', desc: 'Requirements & records', path: '/admin/hr/compliance', color: '#84cc16' },
  { title: 'Workflows', desc: 'Approval definitions & instances', path: '/admin/workflows', color: '#a855f7' },
];

export default function AdminHrDashboard() {
  const navigate = useNavigate();
  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>HR & Workforce Suite</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>Manage your organization, employees, and HR operations</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
        {modules.map(m => (
          <div
            key={m.path}
            onClick={() => navigate(m.path)}
            style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem', color: m.color, fontSize: '1.2rem', fontWeight: 700 }}>{m.title[0]}</div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{m.title}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{m.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
