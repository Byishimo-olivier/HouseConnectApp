export type AssistantRole = 'MAID' | 'EMPLOYER';

export interface AssistantAction {
  label: string;
  route: string;
}

export interface AssistantReply {
  text: string;
  action?: AssistantAction;
}

interface AssistantIntent {
  id: string;
  keywords: string[];
  roles?: AssistantRole[];
  getReply: (role: AssistantRole) => AssistantReply;
}

export const assistantStarterPrompts: Record<AssistantRole, string[]> = {
  EMPLOYER: [
    'How do I find a maid?',
    'How do I post a job?',
    'How do I unlock maid contacts?',
  ],
  MAID: [
    'How do I find jobs?',
    'How do I update my availability?',
    'How do I message an employer?',
  ],
};

function getActions(role: AssistantRole) {
  if (role === 'MAID') {
    return {
      jobs: { label: 'Open Find Jobs', route: '/maid/jobs' },
      applications: { label: 'Open My Applications', route: '/maid/applications' },
      messages: { label: 'Open Messages', route: '/maid/messages' },
      notifications: { label: 'Open Alerts', route: '/maid/notifications' },
      profile: { label: 'Open Profile', route: '/maid/profile' },
      disputes: { label: 'Open My Disputes', route: '/maid/disputes' },
    };
  }

  return {
    maids: { label: 'Open Find Maids', route: '/employee/maids' },
    postJob: { label: 'Open Post Job', route: '/employee/jobs/new' },
    applications: { label: 'Open Applications', route: '/applications/list' },
    messages: { label: 'Open Messages', route: '/employee/messages' },
    notifications: { label: 'Open Notifications', route: '/employee/notifications' },
    profile: { label: 'Open Profile', route: '/employee/profile' },
    payments: { label: 'Open Payments', route: '/employee/payments' },
    disputes: { label: 'Open My Disputes', route: '/employee/disputes' },
  };
}

export function getAssistantWelcome(role: AssistantRole, fullName?: string | null) {
  const firstName = fullName?.trim().split(/\s+/)[0];
  const greeting = firstName ? `Hi ${firstName}.` : 'Hi.';

  if (role === 'MAID') {
    return `${greeting} I can help you use MaidConnect for jobs, applications, messages, profile updates, alerts, and disputes.`;
  }

  return `${greeting} I can help you find maids, post jobs, review applications, unlock contacts, manage payments, and use messages or alerts.`;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const intents: AssistantIntent[] = [
  {
    id: 'greeting',
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
    getReply: (role) => ({
      text:
        role === 'MAID'
          ? 'Hello. Ask me about jobs, applications, messages, profile, alerts, or disputes.'
          : 'Hello. Ask me about finding maids, posting jobs, applications, payments, messages, or alerts.',
    }),
  },
  {
    id: 'thanks',
    keywords: ['thank you', 'thanks', 'thx'],
    getReply: () => ({
      text: 'You can ask another app question any time.',
    }),
  },
  {
    id: 'maid-find-jobs',
    roles: ['MAID'],
    keywords: ['find jobs', 'get jobs', 'job search', 'find work', 'apply job', 'job'],
    getReply: (role) => ({
      text:
        'Open Find Jobs to browse available work. Tap a job to see details, then submit your application from that screen.',
      action: getActions(role).jobs,
    }),
  },
  {
    id: 'maid-applications',
    roles: ['MAID'],
    keywords: ['application', 'applications', 'applied', 'my applications', 'status'],
    getReply: (role) => ({
      text:
        'Use My Applications to track jobs you already applied for and check whether each one is pending, accepted, or rejected.',
      action: getActions(role).applications,
    }),
  },
  {
    id: 'maid-availability',
    roles: ['MAID'],
    keywords: ['availability', 'online', 'offline', 'accepting jobs', 'status switch'],
    getReply: () => ({
      text:
        'Use the Availability Status switch at the top of the home screen to go online or offline for new jobs.',
    }),
  },
  {
    id: 'maid-messages',
    roles: ['MAID'],
    keywords: ['message', 'messages', 'chat', 'conversation', 'talk to employer', 'contact employer'],
    getReply: (role) => ({
      text:
        'Open Messages from the header chat icon or the chat area to continue conversations with employers.',
      action: getActions(role).messages,
    }),
  },
  {
    id: 'maid-profile',
    roles: ['MAID'],
    keywords: ['profile', 'edit profile', 'documents', 'skills', 'salary', 'personal info'],
    getReply: (role) => ({
      text:
        'Open Profile to update your personal details, work preferences, expected salary, skills, and documents.',
      action: getActions(role).profile,
    }),
  },
  {
    id: 'maid-notifications',
    roles: ['MAID'],
    keywords: ['notification', 'notifications', 'alert', 'alerts'],
    getReply: (role) => ({
      text:
        'Open Alerts to review updates about job applications, chat activity, and important account events.',
      action: getActions(role).notifications,
    }),
  },
  {
    id: 'maid-earnings',
    roles: ['MAID'],
    keywords: ['earnings', 'earned', 'money', 'income', 'payment', 'paid'],
    getReply: () => ({
      text:
        'Your current earnings summary is shown in the stats cards on the home screen. Keep checking job and message updates for payment-related progress.',
    }),
  },
  {
    id: 'maid-disputes',
    roles: ['MAID'],
    keywords: ['dispute', 'complaint', 'problem', 'issue', 'report problem'],
    getReply: (role) => ({
      text: 'If you have a problem with a job or employer, open My Disputes to review or file a case.',
      action: getActions(role).disputes,
    }),
  },
  {
    id: 'employee-find-maid',
    roles: ['EMPLOYER'],
    keywords: ['find maid', 'hire maid', 'search maid', 'maid search', 'maid'],
    getReply: (role) => ({
      text:
        'Use Find Maids from Quick Actions to browse available maids, filter results, and open a full profile before hiring.',
      action: getActions(role).maids,
    }),
  },
  {
    id: 'employee-post-job',
    roles: ['EMPLOYER'],
    keywords: ['post job', 'create job', 'new job', 'job posting', 'hire', 'vacancy'],
    getReply: (role) => ({
      text:
        'Open Post Job, complete the job details like title, location, date, and salary, then submit it so maids can apply.',
      action: getActions(role).postJob,
    }),
  },
  {
    id: 'employee-unlock',
    roles: ['EMPLOYER'],
    keywords: ['unlock', 'unlock contacts', 'maid contacts', 'contact details', 'unlock profile'],
    getReply: (role) => ({
      text:
        'Open a maid profile, tap Unlock Contact Details, complete the payment, then verify the transaction to reveal contacts and documents.',
      action: getActions(role).maids,
    }),
  },
  {
    id: 'employee-applications',
    roles: ['EMPLOYER'],
    keywords: ['application', 'applications', 'applicants', 'pending applications', 'candidate'],
    getReply: (role) => ({
      text:
        'Your applicants are listed under Applications. You can also tap the Applicants or Pending cards on the home screen.',
      action: getActions(role).applications,
    }),
  },
  {
    id: 'employee-messages',
    roles: ['EMPLOYER'],
    keywords: ['message', 'messages', 'chat', 'conversation', 'talk to maid', 'contact maid'],
    getReply: (role) => ({
      text:
        'Open Messages from the header chat icon or from Quick Actions to continue conversations with maids.',
      action: getActions(role).messages,
    }),
  },
  {
    id: 'employee-notifications',
    roles: ['EMPLOYER'],
    keywords: ['notification', 'notifications', 'alert', 'alerts'],
    getReply: (role) => ({
      text:
        'Open Notifications to review applicant updates, payment events, and other account activity.',
      action: getActions(role).notifications,
    }),
  },
  {
    id: 'employee-profile',
    roles: ['EMPLOYER'],
    keywords: ['profile', 'edit profile', 'account', 'my account', 'personal info'],
    getReply: (role) => ({
      text:
        'Open Profile to update your personal information, photo, and account details used during hiring and payments.',
      action: getActions(role).profile,
    }),
  },
  {
    id: 'employee-payments',
    roles: ['EMPLOYER'],
    keywords: ['payment', 'payments', 'pay', 'card', 'billing'],
    getReply: (role) => ({
      text:
        'Use the Payment tab for payment-related screens. For unlocking a maid profile, the payment starts directly from that maid profile.',
      action: getActions(role).payments,
    }),
  },
  {
    id: 'employee-disputes',
    roles: ['EMPLOYER'],
    keywords: ['dispute', 'complaint', 'problem', 'issue', 'report problem'],
    getReply: (role) => ({
      text: 'If something goes wrong with a hire or payment, open My Disputes to manage the case.',
      action: getActions(role).disputes,
    }),
  },
];

export function getAssistantReply(role: AssistantRole, input: string): AssistantReply {
  const normalizedInput = normalizeText(input);

  if (!normalizedInput) {
    return {
      text: 'Type a question about the app and I will guide you to the right screen.',
    };
  }

  let bestIntent: AssistantIntent | null = null;
  let bestScore = 0;

  for (const intent of intents) {
    if (intent.roles && !intent.roles.includes(role)) {
      continue;
    }

    let score = 0;
    for (const keyword of intent.keywords) {
      if (normalizedInput.includes(keyword)) {
        score += keyword.includes(' ') ? 3 : 1;
      }
    }

    if (score > bestScore) {
      bestIntent = intent;
      bestScore = score;
    }
  }

  if (bestIntent) {
    return bestIntent.getReply(role);
  }

  if (role === 'MAID') {
    return {
      text:
        'I can help with finding jobs, checking applications, updating profile details, messages, alerts, earnings, and disputes. Try one of the quick prompts below.',
    };
  }

  return {
    text:
      'I can help with finding maids, posting jobs, reviewing applications, unlocking contacts, payments, messages, alerts, and disputes. Try one of the quick prompts below.',
  };
}
