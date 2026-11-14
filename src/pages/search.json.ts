import { getCollection } from 'astro:content';
import site from '../data/site.json';

export async function GET() {
  const posts = await getCollection('blog');
  const items = [
    { t: 'Home', k: 'Page', u: 'index.html', d: site.summary },
    { t: 'Curriculum vitae', k: 'Page', u: 'cv.html', d: 'Career journey, licenses, education and certifications' },
    { t: 'Research and publications', k: 'Page', u: 'research.html', d: 'Six publications on haemodynamics, lung ultrasound, sepsis and nutrition' },
    { t: 'Clinical blog', k: 'Page', u: 'blog.html', d: 'Evidence-based articles for intensive care clinicians' },
    { t: 'Media', k: 'Page', u: 'media.html', d: 'ICU gallery and videos' },
    { t: 'Contact', k: 'Page', u: 'contact.html', d: 'Collaborations, speaking and senior ICU roles' },
    ...posts.map((p) => ({ t: p.data.title, k: 'Article · ' + p.data.category, u: 'blog/' + p.id + '.html', d: p.data.description + ' ' + (p.data.keywords || '') })),
    ...site.publications.map((p) => ({ t: p.title, k: 'Publication · ' + p.year, u: 'research.html', d: p.venue })),
    ...site.licenses.map((l) => ({ t: l.name + ' (' + l.body + ')', k: 'License', u: 'cv.html', d: l.status })),
    ...site.expertise.map((e) => ({ t: e.name, k: 'Expertise', u: 'index.html#expertise', d: e.note })),
    ...site.jobs.map((j) => ({ t: j.place, k: 'Career · ' + j.dates, u: 'cv.html', d: j.role + ', ' + j.city })),
  ];
  return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json' } });
}
