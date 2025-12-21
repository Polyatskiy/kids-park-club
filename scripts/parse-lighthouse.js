const fs = require('fs');
const path = require('path');

const reportPath = path.join(process.env.USERPROFILE || process.env.HOME, 'Downloads', 'www.kids-park.club-20251221T172927.html');

try {
  const html = fs.readFileSync(reportPath, 'utf8');
  
  // Extract JSON from HTML
  const jsonMatch = html.match(/window\.__LIGHTHOUSE_JSON__ = ({.*?});/s);
  if (!jsonMatch) {
    console.error('Could not find Lighthouse JSON in HTML');
    process.exit(1);
  }
  
  const data = JSON.parse(jsonMatch[1]);
  
  // Extract key metrics
  const categories = data.categories || {};
  const audits = data.audits || {};
  
  console.log('\n=== LIGHTHOUSE REPORT ANALYSIS ===\n');
  
  // Overall scores
  console.log('CATEGORY SCORES:');
  Object.entries(categories).forEach(([key, value]) => {
    const score = (value.score * 100).toFixed(0);
    const emoji = value.score >= 0.9 ? '✅' : value.score >= 0.5 ? '⚠️' : '❌';
    console.log(`  ${emoji} ${key}: ${score}`);
  });
  
  // Core Web Vitals
  console.log('\nCORE WEB VITALS:');
  const metrics = [
    'first-contentful-paint',
    'largest-contentful-paint',
    'interaction-to-next-paint',
    'cumulative-layout-shift',
    'first-input-delay',
    'total-blocking-time',
  ];
  
  metrics.forEach(metricId => {
    const audit = audits[metricId];
    if (audit) {
      const score = audit.score !== null ? (audit.score * 100).toFixed(0) : 'N/A';
      const value = audit.displayValue || audit.numericValue || 'N/A';
      const emoji = audit.score >= 0.9 ? '✅' : audit.score >= 0.5 ? '⚠️' : '❌';
      console.log(`  ${emoji} ${audit.title}: ${value} (score: ${score})`);
    }
  });
  
  // Opportunities (sorted by potential savings)
  console.log('\nTOP OPPORTUNITIES:');
  const opportunities = Object.values(audits)
    .filter(audit => audit.details?.type === 'opportunity' && audit.numericValue)
    .sort((a, b) => (b.numericValue || 0) - (a.numericValue || 0))
    .slice(0, 10);
  
  opportunities.forEach((audit, index) => {
    const savings = audit.displayValue || `${Math.round(audit.numericValue)}ms`;
    console.log(`  ${index + 1}. ${audit.title}: ${savings}`);
    if (audit.description) {
      console.log(`     ${audit.description.substring(0, 100)}...`);
    }
  });
  
  // Accessibility issues
  console.log('\nACCESSIBILITY ISSUES:');
  const a11yIssues = Object.values(audits)
    .filter(audit => {
      // Check if it's an accessibility audit with issues
      const hasIssues = audit.score !== null && audit.score < 1;
      const isA11y = audit.id.startsWith('aria-') || 
                     audit.id.startsWith('color-') ||
                     audit.id.includes('label') ||
                     audit.id.includes('alt') ||
                     audit.id.includes('semantic') ||
                     audit.id.includes('keyboard') ||
                     audit.id.includes('focus');
      return hasIssues && isA11y;
    })
    .sort((a, b) => (a.score || 1) - (b.score || 1))
    .slice(0, 15);
  
  if (a11yIssues.length > 0) {
    a11yIssues.forEach((audit, index) => {
      const score = audit.score !== null ? (audit.score * 100).toFixed(0) : 'N/A';
      const emoji = audit.score >= 0.9 ? '✅' : audit.score >= 0.5 ? '⚠️' : '❌';
      console.log(`  ${emoji} ${audit.title} (${audit.id}): ${score}%`);
      if (audit.description) {
        console.log(`     ${audit.description.substring(0, 120)}`);
      }
    });
  } else {
    console.log('  No specific accessibility issues found in filtered audits');
  }
  
  // All failed audits
  console.log('\nALL FAILED/SKIPPED AUDITS:');
  const failedAudits = Object.entries(audits)
    .filter(([id, audit]) => audit.score !== null && audit.score < 1)
    .sort((a, b) => (a[1].score || 1) - (b[1].score || 1))
    .slice(0, 20);
  
  failedAudits.forEach(([id, audit], index) => {
    const score = (audit.score * 100).toFixed(0);
    const category = id.split('-')[0];
    console.log(`  ${index + 1}. [${category}] ${audit.title}: ${score}%`);
  });
  
  // Diagnostics
  console.log('\nKEY DIAGNOSTICS:');
  const diagnostics = Object.values(audits)
    .filter(audit => audit.details?.type === 'diagnostic' && audit.score !== null && audit.score < 0.9)
    .sort((a, b) => (a.score || 1) - (b.score || 1))
    .slice(0, 10);
  
  diagnostics.forEach((audit, index) => {
    const score = (audit.score * 100).toFixed(0);
    console.log(`  ${index + 1}. ${audit.title}: ${score}%`);
  });
  
} catch (error) {
  console.error('Error parsing report:', error.message);
  process.exit(1);
}

