/* General-supervision references for the state profiles:
   - each state's 2025 SPP/APR determination-letter file (OSEP), by two-letter code, and
   - recent Differentiated Monitoring and Support (DMS) reports where OSEP has published one.
   Every URL below was verified against official ed.gov sources. The DMS list is a
   directly-verified recent sample (2024-2025), not the full history — the complete set
   lives in OSEP's searchable database (window.DMS.db). */
window.DMS = {
  overview: 'Through Differentiated Monitoring and Support (DMS 2.0), OSEP monitors every state’s IDEA Part B and Part C programs on a five-year cycle, reviewing general supervision, data (the SPP/APR), fiscal management, and dispute resolution, plus state-specific focus areas chosen by risk.',
  db: 'https://www.ed.gov/laws-and-policy/individuals-disabilities/idea/idea-differentiated-monitoring-and-support-dms-reports',
  // per-state SPP/APR submission file (FFY 2023); part is 'B' or 'C'
  sppLetter: function (ab, part) { return 'https://sites.ed.gov/idea/files/' + ab + '-' + (part || 'B') + '-SPP-APR-FFY23.docx'; },
  reports: {
    VA: [{ part: 'B', date: 'March 2024', url: 'https://www.ed.gov/media/document/dms-va-b-report-03-13-2024pdf-46237.pdf', themes: ['Dispute resolution', 'Procedural safeguards', 'Independent educational evaluations'] }],
    SC: [{ part: 'B', date: 'April 2024', url: 'https://www.ed.gov/sites/ed/files/fund/data/report/idea/partbdmsrpts/dms-sc-b-report-04-23-2024.pdf', themes: ['Monitoring and improvement', 'Dispute resolution', 'Significant disproportionality'] }],
    NV: [{ part: 'B', date: 'October 2024', url: 'https://www.ed.gov/media/document/nevada-dms-part-b-monitoring-report-of-oct-4-2024-108110.pdf', themes: ['Fiscal management', 'Dispute resolution', 'Significant disproportionality'] }],
    MA: [{ part: 'B', date: 'January 2025', url: 'https://www.ed.gov/media/document/massachusetts-part-b-dms-targeted-monitoring-report-of-january-16-2025-109502.pdf', themes: ['Child find and evaluation', 'Dispute resolution', 'Private-school placement'] }],
    OR: [{ part: 'B', date: 'June 2025', url: 'https://www.ed.gov/media/document/oregon-part-b-differentiated-monitoring-and-support-dms-report-june-11-2025-110277.pdf', themes: ['Fiscal management'] }],
    KS: [{ part: 'B', date: 'July 2025', url: 'https://www.ed.gov/media/document/osers-kansas-part-b-dms-monitoring-report-2025-110393.pdf', themes: ['Monitoring and improvement', 'Data (SPP/APR)', 'Fiscal management', 'Dispute resolution'] }],
    UT: [{ part: 'B', date: 'July 2025', url: 'https://www.ed.gov/media/document/osers-utah-part-b-dms-monitoring-report-2025-110394.pdf', themes: ['Monitoring and improvement', 'Dispute resolution'] }],
    ND: [{ part: 'B', date: 'July 2025', url: 'https://www.ed.gov/media/document/osers-north-dakota-part-b-dms-monitoring-report-july-2025-110428.pdf', themes: ['Monitoring and improvement', 'Fiscal management'] }],
    MS: [{ part: 'B', date: 'July 2025', url: 'https://www.ed.gov/media/document/osers-mississippi-part-b-dms-report-july-2025-110436.pdf', themes: ['Monitoring and improvement', 'Fiscal management', 'Dispute resolution', 'Discipline and behavior'] }],
    IN: [{ part: 'C', date: 'July 2025', url: 'https://www.ed.gov/media/document/osep-indiana-dms-part-c-monitoring-report-july-2025-110455.pdf', themes: ['Monitoring and improvement', 'Fiscal management', 'Dispute resolution'] }],
  },
};
