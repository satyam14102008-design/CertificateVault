/**
 * Build a crisp inline SVG data URL thumbnail for seed certificates so cards
 * and image previews look realistic without external network dependencies.
 */
function wrapSvgTitle(title, maxChars = 32) {
  const words = title.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 2);
}

function buildSvgThumbnail({ title, issuer, issueDate, accent = '#2563EB', badge = 'VERIFIED' }) {
  const escapeXml = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const titleLines = wrapSvgTitle(title).map(escapeXml);
  const safeIssuer = escapeXml(issuer);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
    <rect width="640" height="420" fill="#FFFFFF"/>
    <rect x="16" y="16" width="608" height="388" rx="14" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="2"/>
    <rect x="16" y="16" width="608" height="10" rx="5" fill="${accent}"/>
    <circle cx="72" cy="84" r="24" fill="${accent}" fill-opacity="0.12"/>
    <path d="M72 70L84 75V83C84 91 79 97 72 99C65 97 60 91 60 83V75L72 70Z" stroke="${accent}" stroke-width="2.5" fill="none"/>
    <text x="112" y="79" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="700" fill="${accent}" letter-spacing="1.4">${badge}</text>
    <text x="112" y="100" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="600" fill="#475569">${safeIssuer}</text>
    <text x="48" y="176" font-family="Plus Jakarta Sans, Inter, Arial, sans-serif" font-size="24" font-weight="700" fill="#0F172A">${titleLines[0] || ''}</text>
    ${titleLines[1] ? `<text x="48" y="208" font-family="Plus Jakarta Sans, Inter, Arial, sans-serif" font-size="24" font-weight="700" fill="#0F172A">${titleLines[1]}</text>` : ''}
    <line x1="48" y1="252" x2="592" y2="252" stroke="#E2E8F0" stroke-width="1.5"/>
    <text x="48" y="294" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="600" fill="#94A3B8">AWARDED TO</text>
    <text x="48" y="318" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="600" fill="#0F172A">Aarav Sharma</text>
    <text x="420" y="294" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="600" fill="#94A3B8">ISSUED ON</text>
    <text x="420" y="318" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="600" fill="#0F172A">${issueDate}</text>
    <rect x="48" y="348" width="144" height="28" rx="14" fill="${accent}" fill-opacity="0.1"/>
    <text x="120" y="366" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="600" fill="${accent}">Credential Authentic</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const DEMO_USER = {
  id: 'usr_demo_01',
  name: 'Aarav Sharma',
  email: 'aarav.sharma@certificatevault.app',
  role: 'Full-Stack & ML Engineer',
  avatarDataUrl: '',
  createdAt: '2024-06-15T09:00:00.000Z',
};

export const SEED_CERTIFICATES = [
  {
    id: 'cert_01',
    userId: 'usr_demo_01',
    title: 'Python for Everybody Specialization',
    issuer: 'Coursera',
    category: 'Courses',
    issueDate: '2026-10-14',
    verificationUrl: 'https://coursera.org/verify/specialization/PY4E8921',
    description: 'Completed 5-course University of Michigan specialization covering Python data structures, APIs, web scraping, and relational databases.',
    isFavorite: true,
    source: 'manual',
    file: {
      name: 'python-coursera-specialization.pdf',
      type: 'application/pdf',
      size: 284120,
      storageKey: 'seed_cert_01',
    },
    thumbnail: buildSvgThumbnail({
      title: 'Python for Everybody Specialization',
      issuer: 'Coursera • University of Michigan',
      issueDate: 'Oct 14, 2026',
      accent: '#2563EB',
      badge: 'SPECIALIZATION',
    }),
    createdAt: '2026-10-15T11:20:00.000Z',
    updatedAt: '2026-10-15T11:20:00.000Z',
  },
  {
    id: 'cert_02',
    userId: 'usr_demo_01',
    title: 'Machine Learning Engineering Foundations',
    issuer: 'Google',
    category: 'Courses',
    issueDate: '2026-09-22',
    verificationUrl: 'https://www.cloudskillsboost.google/public_profiles/ml-9921',
    description: 'Hands-on training on supervised models, feature pipelines, evaluation metrics, and TensorFlow deployment workflows.',
    isFavorite: true,
    source: 'manual',
    file: {
      name: 'google-ml-foundations.png',
      type: 'image/png',
      size: 412800,
      storageKey: 'seed_cert_02',
    },
    thumbnail: buildSvgThumbnail({
      title: 'Machine Learning Engineering Foundations',
      issuer: 'Google Cloud Skills Boost',
      issueDate: 'Sep 22, 2026',
      accent: '#2563EB',
      badge: 'PROFESSIONAL TRACK',
    }),
    createdAt: '2026-09-23T08:40:00.000Z',
    updatedAt: '2026-09-23T08:40:00.000Z',
  },
  {
    id: 'cert_03',
    userId: 'usr_demo_01',
    title: 'Full-Stack Web Development Certification',
    issuer: 'freeCodeCamp',
    category: 'Courses',
    issueDate: '2026-08-11',
    verificationUrl: 'https://www.freecodecamp.org/certification/aarav/responsive-web',
    description: '300+ hours of responsive UI architecture, accessibility compliance, and RESTful JavaScript applications.',
    isFavorite: false,
    source: 'extension',
    file: {
      name: 'freecodecamp-web-dev.pdf',
      type: 'application/pdf',
      size: 198400,
      storageKey: 'seed_cert_03',
    },
    thumbnail: buildSvgThumbnail({
      title: 'Full-Stack Web Development Certification',
      issuer: 'freeCodeCamp',
      issueDate: 'Aug 11, 2026',
      accent: '#2563EB',
      badge: 'DEVELOPER CERT',
    }),
    createdAt: '2026-08-11T19:05:00.000Z',
    updatedAt: '2026-08-11T19:05:00.000Z',
  },
  {
    id: 'cert_04',
    userId: 'usr_demo_01',
    title: 'Frontend Engineering Summer Intern',
    issuer: 'Razorpay',
    category: 'Internships',
    issueDate: '2026-07-30',
    verificationUrl: 'https://razorpay.com/verify/intern-2026-041',
    description: '12-week product engineering internship building checkout telemetry dashboards and design system primitives in React.',
    isFavorite: true,
    source: 'manual',
    file: {
      name: 'razorpay-internship-letter.pdf',
      type: 'application/pdf',
      size: 512040,
      storageKey: 'seed_cert_04',
    },
    thumbnail: buildSvgThumbnail({
      title: 'Frontend Engineering Summer Intern',
      issuer: 'Razorpay Technologies',
      issueDate: 'Jul 30, 2026',
      accent: '#7C3AED',
      badge: 'INTERNSHIP',
    }),
    createdAt: '2026-08-01T10:15:00.000Z',
    updatedAt: '2026-08-01T10:15:00.000Z',
  },
  {
    id: 'cert_05',
    userId: 'usr_demo_01',
    title: 'Software Systems Apprenticeship',
    issuer: 'Infosys',
    category: 'Internships',
    issueDate: '2025-12-19',
    verificationUrl: 'https://infyspringboard.onwingspan.com/verify/app-810',
    description: 'Completed enterprise Java microservices, CI/CD automation, and unit testing modules during winter cohort.',
    isFavorite: false,
    source: 'manual',
    file: {
      name: 'infosys-apprenticeship.pdf',
      type: 'application/pdf',
      size: 325100,
      storageKey: 'seed_cert_05',
    },
    thumbnail: buildSvgThumbnail({
      title: 'Software Systems Apprenticeship',
      issuer: 'Infosys Springboard',
      issueDate: 'Dec 19, 2025',
      accent: '#7C3AED',
      badge: 'APPRENTICESHIP',
    }),
    createdAt: '2025-12-20T14:30:00.000Z',
    updatedAt: '2025-12-20T14:30:00.000Z',
  },
  {
    id: 'cert_06',
    userId: 'usr_demo_01',
    title: 'Global AI Hackathon — Top 10 Finalist',
    issuer: 'Devpost & Anthropic',
    category: 'Hackathons',
    issueDate: '2026-11-03',
    verificationUrl: 'https://devpost.com/software/docupulse-ai',
    description: 'Built an accessibility-first clinical document summarizer in 36 hours; selected among top 10 out of 1,400 submissions.',
    isFavorite: true,
    source: 'manual',
    file: {
      name: 'global-ai-hackathon-finalist.png',
      type: 'image/png',
      size: 620400,
      storageKey: 'seed_cert_06',
    },
    thumbnail: buildSvgThumbnail({
      title: 'Global AI Hackathon — Top 10 Finalist',
      issuer: 'Devpost',
      issueDate: 'Nov 3, 2026',
      accent: '#D97706',
      badge: 'FINALIST',
    }),
    createdAt: '2026-11-04T09:10:00.000Z',
    updatedAt: '2026-11-04T09:10:00.000Z',
  },
  {
    id: 'cert_07',
    userId: 'usr_demo_01',
    title: 'Cloud Native Builders Hackathon — Participation',
    issuer: 'MLH',
    category: 'Hackathons',
    issueDate: '2026-05-18',
    verificationUrl: 'https://verify.mlh.io/cert/cloud-2026-551',
    description: '48-hour distributed systems sprint creating an automated Kubernetes cost analyzer.',
    isFavorite: false,
    source: 'manual',
    file: null,
    thumbnail: '',
    createdAt: '2026-05-19T16:00:00.000Z',
    updatedAt: '2026-05-19T16:00:00.000Z',
  },
  {
    id: 'cert_08',
    userId: 'usr_demo_01',
    title: 'Java Programming & Spring Boot Intensive',
    issuer: 'Infosys',
    category: 'Workshops',
    issueDate: '2026-04-09',
    verificationUrl: 'https://infyspringboard.onwingspan.com/verify/java-312',
    description: 'Deep-dive workshop covering JVM internals, Spring Data JPA, and production observability.',
    isFavorite: false,
    source: 'manual',
    file: {
      name: 'java-spring-workshop.pdf',
      type: 'application/pdf',
      size: 274900,
      storageKey: 'seed_cert_08',
    },
    thumbnail: buildSvgThumbnail({
      title: 'Java Programming & Spring Boot Intensive',
      issuer: 'Infosys',
      issueDate: 'Apr 9, 2026',
      accent: '#0D9488',
      badge: 'WORKSHOP',
    }),
    createdAt: '2026-04-10T12:00:00.000Z',
    updatedAt: '2026-04-10T12:00:00.000Z',
  },
  {
    id: 'cert_09',
    userId: 'usr_demo_01',
    title: 'AWS Cloud Computing Essentials',
    issuer: 'AWS',
    category: 'Workshops',
    issueDate: '2026-11-12',
    verificationUrl: 'https://aws.amazon.com/verification/aws-cc-7782',
    description: 'Cloud architecture fundamentals spanning IAM, VPC networking, S3 lifecycle policies, and serverless compute.',
    isFavorite: true,
    source: 'extension',
    file: {
      name: 'aws-cloud-essentials.png',
      type: 'image/png',
      size: 389000,
      storageKey: 'seed_cert_09',
    },
    thumbnail: buildSvgThumbnail({
      title: 'AWS Cloud Computing Essentials',
      issuer: 'Amazon Web Services',
      issueDate: 'Nov 12, 2026',
      accent: '#0D9488',
      badge: 'CLOUD LAB',
    }),
    createdAt: '2026-11-12T20:45:00.000Z',
    updatedAt: '2026-11-12T20:45:00.000Z',
  },
  {
    id: 'cert_10',
    userId: 'usr_demo_01',
    title: "Dean's Honors List — Computer Science",
    issuer: 'Institute of Technology',
    category: 'Academic',
    issueDate: '2026-01-25',
    verificationUrl: '',
    description: 'Awarded for maintaining top 3% GPA across Algorithms, Distributed Systems, and Database Internals.',
    isFavorite: false,
    source: 'manual',
    file: {
      name: 'deans-honors-2026.pdf',
      type: 'application/pdf',
      size: 341200,
      storageKey: 'seed_cert_10',
    },
    thumbnail: buildSvgThumbnail({
      title: "Dean's Honors List — Computer Science",
      issuer: 'Institute of Technology',
      issueDate: 'Jan 25, 2026',
      accent: '#059669',
      badge: 'ACADEMIC HONORS',
    }),
    createdAt: '2026-01-26T09:00:00.000Z',
    updatedAt: '2026-01-26T09:00:00.000Z',
  },
  {
    id: 'cert_11',
    userId: 'usr_demo_01',
    title: 'National Algorithmic Coding Cup — Top 5%',
    issuer: 'HackerRank',
    category: 'Competitions',
    issueDate: '2026-06-07',
    verificationUrl: 'https://www.hackerrank.com/certificates/nacc-99420',
    description: 'Solved dynamic programming, graph theory, and segment tree problems within a 3-hour timed contest.',
    isFavorite: false,
    source: 'manual',
    file: {
      name: 'hackerrank-coding-cup.png',
      type: 'image/png',
      size: 295400,
      storageKey: 'seed_cert_11',
    },
    thumbnail: buildSvgThumbnail({
      title: 'National Algorithmic Coding Cup — Top 5%',
      issuer: 'HackerRank',
      issueDate: 'Jun 7, 2026',
      accent: '#E11D48',
      badge: 'COMPETITION',
    }),
    createdAt: '2026-06-08T15:20:00.000Z',
    updatedAt: '2026-06-08T15:20:00.000Z',
  },
  {
    id: 'cert_12',
    userId: 'usr_demo_01',
    title: 'Open Source Contributor Recognition',
    issuer: 'CNCF',
    category: 'Other',
    issueDate: '2025-10-04',
    verificationUrl: 'https://credly.com/badges/cncf-contrib-2025',
    description: 'Recognized for documentation and telemetry PR contributions during Hacktoberfest.',
    isFavorite: false,
    source: 'manual',
    file: {
      name: 'cncf-open-source-badge.pdf',
      type: 'application/pdf',
      size: 215000,
      storageKey: 'seed_cert_12',
    },
    thumbnail: buildSvgThumbnail({
      title: 'Open Source Contributor Recognition',
      issuer: 'Cloud Native Computing Foundation',
      issueDate: 'Oct 4, 2025',
      accent: '#475569',
      badge: 'RECOGNITION',
    }),
    createdAt: '2025-10-05T13:10:00.000Z',
    updatedAt: '2025-10-05T13:10:00.000Z',
  },
];
