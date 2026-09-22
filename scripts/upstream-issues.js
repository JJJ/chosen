#!/usr/bin/env node

// Keep a small, reviewed queue alongside the live Harvest issue list.
const fs = require('node:fs');
const path = require('node:path');

const upstream = 'harvesthq/chosen';
const queuePath = path.join(__dirname, '..', 'triage', 'upstream-issues.json');
const statuses = new Set(['candidate', 'needs-reproduction', 'fixed-in-fork', 'covered-in-fork', 'blocked']);

function readQueue() {
  const entries = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
  const queue = new Map();
  for (const entry of entries) {
    if (!Number.isInteger(entry.number) || !statuses.has(entry.status) || queue.has(entry.number)) {
      throw new Error(`Invalid or duplicate upstream issue entry: ${entry.number}`);
    }
    queue.set(entry.number, entry);
  }
  return queue;
}

async function fetchOpenIssues() {
  const issues = [];
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  for (let page = 1; ; page += 1) {
    const response = await fetch(`https://api.github.com/repos/${upstream}/issues?state=open&per_page=100&page=${page}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'chosen-upstream-triage',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) throw new Error(`GitHub API returned ${response.status}: ${await response.text()}`);
    const batch = await response.json();
    issues.push(...batch.filter((issue) => !issue.pull_request));
    if (batch.length < 100) break;
  }
  return issues;
}

function issueLine(issue) {
  return `- [#${issue.number} ${issue.title}](${issue.html_url}) — ${issue.note || issue.status}`;
}

async function main() {
  const limitArgument = process.argv.find((argument) => argument.startsWith('--limit='));
  const limit = limitArgument ? Number(limitArgument.split('=')[1]) : 5;
  if (!Number.isInteger(limit) || limit < 0) throw new Error('--limit must be a non-negative integer');
  const searchArgument = process.argv.find((argument) => argument.startsWith('--search='));
  const search = searchArgument ? searchArgument.slice('--search='.length).toLowerCase() : '';
  const json = process.argv.includes('--json');
  const queue = readQueue();
  const allIssues = (await fetchOpenIssues()).map((issue) => ({
    number: issue.number,
    title: issue.title,
    html_url: issue.html_url,
    body: issue.body || '',
    comments: issue.comments,
    labels: issue.labels.map((label) => label.name),
    created_at: issue.created_at,
    updated_at: issue.updated_at,
    status: queue.get(issue.number)?.status || 'unreviewed',
    note: queue.get(issue.number)?.note || '',
    fork_pr: queue.get(issue.number)?.fork_pr || '',
  }));
  const openNumbers = new Set(allIssues.map((issue) => issue.number));
  const stale = [...queue.keys()].filter((number) => !openNumbers.has(number));
  if (stale.length) console.error(`Queue entries no longer open upstream: ${stale.join(', ')}`);
  const issues = search
    ? allIssues.filter((issue) => `${issue.title}\n${issue.body}`.toLowerCase().includes(search))
    : allIssues;

  if (json) {
    console.log(JSON.stringify(issues, null, 2));
    return;
  }

  const active = issues.filter((issue) => ['candidate', 'needs-reproduction'].includes(issue.status))
    .sort((a, b) => Number(b.status === 'candidate') - Number(a.status === 'candidate'));
  const unreviewed = issues.filter((issue) => issue.status === 'unreviewed')
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  console.log(`# Harvest Chosen issue queue\n`);
  console.log(`${allIssues.length} open issues${search ? `; ${issues.length} match "${search}"` : ''}; ${active.length} queued; ${unreviewed.length} unreviewed.\n`);
  console.log('## Reviewed candidates\n');
  console.log(active.length ? active.map(issueLine).join('\n') : 'None yet.');
  console.log(`\n## Recently updated, unreviewed (${Math.min(limit, unreviewed.length)} shown)\n`);
  console.log(unreviewed.slice(0, limit).map(issueLine).join('\n') || 'None.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
