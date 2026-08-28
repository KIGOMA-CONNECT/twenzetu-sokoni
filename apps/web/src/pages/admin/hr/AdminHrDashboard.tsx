import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AiAssistant from '../../../components/AiAssistant';

export default function AdminHrDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const modules = [
    { title: t('hr.dashboard.orgTitle'), desc: t('hr.dashboard.orgDesc'), path: '/admin/org/units', color: '#3b82f6' },
    { title: t('hr.dashboard.positionsTitle'), desc: t('hr.dashboard.positionsDesc'), path: '/admin/hr/positions', color: '#8b5cf6' },
    { title: t('hr.dashboard.employeesTitle'), desc: t('hr.dashboard.employeesDesc'), path: '/admin/hr/employees', color: '#06b6d4' },
    { title: t('hr.dashboard.leaveTitle'), desc: t('hr.dashboard.leaveDesc'), path: '/admin/hr/leave', color: '#10b981' },
    { title: t('hr.dashboard.payrollTitle'), desc: t('hr.dashboard.payrollDesc'), path: '/admin/hr/payroll', color: 'var(--warning)' },
    { title: t('hr.dashboard.recruitmentTitle'), desc: t('hr.dashboard.recruitmentDesc'), path: '/admin/hr/recruitment', color: '#ef4444' },
    { title: t('hr.dashboard.performanceTitle'), desc: t('hr.dashboard.performanceDesc'), path: '/admin/hr/performance', color: '#ec4899' },
    { title: t('hr.dashboard.compensationTitle'), desc: t('hr.dashboard.compensationDesc'), path: '/admin/hr/compensation', color: '#14b8a6' },
    { title: t('hr.dashboard.learningTitle'), desc: t('hr.dashboard.learningDesc'), path: '/admin/hr/learning', color: 'var(--accent)' },
    { title: t('hr.dashboard.successionTitle'), desc: t('hr.dashboard.successionDesc'), path: '/admin/hr/succession', color: '#6366f1' },
    { title: t('hr.dashboard.offboardingTitle'), desc: t('hr.dashboard.offboardingDesc'), path: '/admin/hr/offboarding', color: 'var(--danger)' },
    { title: t('hr.dashboard.complianceTitle'), desc: t('hr.dashboard.complianceDesc'), path: '/admin/hr/compliance', color: '#84cc16' },
    { title: t('hr.dashboard.workflowsTitle'), desc: t('hr.dashboard.workflowsDesc'), path: '/admin/workflows', color: '#a855f7' },
  ];

  const hrContext = useMemo(() => {
    const facts: Record<string, unknown> = { moduleCount: modules.length, modules: modules.map((m) => m.title).join(', ') };
    const rows = modules.map((m) => ({ kind: 'hrModule', title: m.title, path: m.path }));
    return { summary: `HR suite — ${modules.length} modules`, facts, rows, constraints: ['Ground in HR suite modules.'] };
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>{t('hr.dashboard.suiteTitle')}</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>{t('hr.dashboard.suiteSubtitle')}</p>
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
      <div style={{ marginTop: '1.5rem' }}>
        <AiAssistant
          module="hr"
          feature="assistant"
          features={['assistant', 'analyze', 'recommend', 'summarize', 'review']}
          context={hrContext}
          title="AI · HR Suite"
          description="Ask about org, roles, leave or payroll — AI sees the HR suite map."
          placeholder="e.g. How should I structure org units? Summarize HR coverage…"
          suggestedPrompts={['Summarize HR suite coverage', 'Recommend next HR module to implement', 'Analyze gaps in HR data', 'Draft a new position description']}
        />
      </div>
    </div>
  );
}
