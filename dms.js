/* General-supervision references for the state profiles:
   - each state's SPP/APR determination-letter file (OSEP), by two-letter code,
   - recent Differentiated Monitoring and Support (DMS) reports with key OSEP findings, and
   - special-education personnel (percent of teachers fully certified), national + by state.
   Every URL and figure below was verified against official ed.gov sources. The DMS list is a
   directly-verified recent sample (2024-2025) with findings quoted from each report; the full
   history lives in OSEP's searchable database (window.DMS.db). */
window.DMS = {
  overview: 'Through Differentiated Monitoring and Support (DMS 2.0), OSEP monitors every state\u2019s IDEA Part B and Part C programs on a five-year cycle, reviewing general supervision, data (the SPP/APR), fiscal management, and dispute resolution, plus state-specific focus areas chosen by risk.',
  db: 'https://www.ed.gov/laws-and-policy/individuals-disabilities/idea/idea-differentiated-monitoring-and-support-dms-reports',
  sppLetter: function (ab, part) { return 'https://sites.ed.gov/idea/files/' + ab + '-' + (part || 'B') + '-SPP-APR-FFY23.docx'; },
  reports: {
  "VA": [
    {
      "part": "B",
      "date": "March 2024",
      "url": "https://www.ed.gov/media/document/dms-va-b-report-03-13-2024pdf-46237.pdf",
      "insights": [
        "OSEP issued 10 findings and found that, in resolving State complaints, Virginia does not consistently identify and require correction of all noncompliance with IDEA when the noncompliance was not specifically alleged in the complaint, inconsistent with 34 C.F.R. sections 300.149, 300.151, 300.153, and 300.600 through 300.602.",
        "OSEP found the State's guidance saying prior written notice is not required after an IEP team meeting when the child's IEP has not been finalized is inconsistent with 34 C.F.R. section 300.503(a)."
      ]
    }
  ],
  "SC": [
    {
      "part": "B",
      "date": "April 2024",
      "url": "https://www.ed.gov/sites/ed/files/fund/data/report/idea/partbdmsrpts/dms-sc-b-report-04-23-2024.pdf",
      "insights": [
        "OSEP found that South Carolina does not have a general supervision system reasonably designed to identify noncompliance with all IDEA Part B requirements in a timely manner as required under 34 C.F.R. sections 300.149 and 300.600 through 300.602.",
        "OSEP found that the State's policies and procedures for the 'reasonable progress' flexibility in identifying LEAs with significant disproportionality are not consistent with 34 C.F.R. section 300.647(d)(2)."
      ]
    }
  ],
  "NV": [
    {
      "part": "B",
      "date": "October 2024",
      "url": "https://www.ed.gov/media/document/nevada-dms-part-b-monitoring-report-of-oct-4-2024-108110.pdf",
      "insights": [
        "OSEP made three findings, including that Nevada does not have a reasonably designed general supervision system, including policies and procedures, for subrecipient monitoring and fiscal management, inconsistent with 2 C.F.R. sections 200.332, 200.339 and 34 C.F.R. sections 300.149, 300.600 through 602, and 300.604.",
        "OSEP found the State does not have mechanisms in place to ensure due process hearing decisions are implemented within the timeframe prescribed by the hearing officer, or a reasonable time set by the State, as required by 34 C.F.R. sections 300.149, 300.511 through 300.514, and 300.600."
      ]
    }
  ],
  "MA": [
    {
      "part": "B",
      "date": "January 2025",
      "url": "https://www.ed.gov/media/document/massachusetts-part-b-dms-targeted-monitoring-report-of-january-16-2025-109502.pdf",
      "insights": [
        "In this targeted monitoring report, OSEP found that Massachusetts does not have a reasonably designed general supervision system ensuring that all children needing special education are identified, located, and evaluated (child find) under 34 C.F.R. section 300.111 and that public agencies initiate initial evaluations under 34 C.F.R. section 300.301.",
        "OSEP found the State's laws and regulations (M.G.L. ch. 71B, Section 3 and 603 CMR 28.04(5)(c)) are inconsistent with 34 C.F.R. section 300.502 because they result in parents sharing the cost of a publicly funded Independent Educational Evaluation (IEE)."
      ]
    }
  ],
  "OR": [
    {
      "part": "B",
      "date": "June 2025",
      "url": "https://www.ed.gov/media/document/oregon-part-b-differentiated-monitoring-and-support-dms-report-june-11-2025-110277.pdf",
      "insights": [
        "All three findings concerned fiscal management/subrecipient monitoring; OSEP found Oregon is not informing subrecipients that unobligated IDEA Part B funds remain available in the succeeding fiscal year, as permitted under the GEPA Tydings Amendment (20 U.S.C. section 1225(b)) and 34 C.F.R. section 76.709(a).",
        "OSEP found the State does not have a mechanism to ensure a management decision is issued for applicable single audit findings pertaining to IDEA and to verify correction of the noncompliance, inconsistent with 34 C.F.R. sections 300.149, 300.600 through 300.602, and 300.604."
      ]
    }
  ],
  "KS": [
    {
      "part": "B",
      "date": "July 2025",
      "url": "https://www.ed.gov/media/document/osers-kansas-part-b-dms-monitoring-report-2025-110393.pdf",
      "insights": [
        "OSEP issued 16 findings, including that Kansas does not monitor interlocals, special education cooperatives, or education service centers that operate as LEAs for compliance with IDEA Part B and is not making annual determinations for each such LEA, inconsistent with 34 C.F.R. sections 300.149, 300.600 through 300.602, and 300.603(b)(1).",
        "OSEP found the State's method for collecting discipline-incident data results in an inflated student count when calculating significant-disproportionality risk ratios under 34 C.F.R. section 300.647(b)(4) and does not meet the valid-and-reliable data requirements in 34 C.F.R. sections 300.601(b) and 300.640 through 300.646."
      ]
    }
  ],
  "UT": [
    {
      "part": "B",
      "date": "July 2025",
      "url": "https://www.ed.gov/media/document/osers-utah-part-b-dms-monitoring-report-2025-110394.pdf",
      "insights": [
        "OSEP issued four findings, including that Utah does not have a general supervision system reasonably designed to verify the correction of noncompliance, as required by 34 C.F.R. section 300.600(e).",
        "OSEP found the State does not have reasonably designed dispute resolution procedures and practices to effectively implement the due process complaint requirements, including the resolution process under 34 C.F.R. section 300.510."
      ]
    }
  ],
  "ND": [
    {
      "part": "B",
      "date": "July 2025",
      "url": "https://www.ed.gov/media/document/osers-north-dakota-part-b-dms-monitoring-report-july-2025-110428.pdf",
      "insights": [
        "OSEP issued three findings, including that North Dakota does not have a reasonably designed general supervision system, including policies and procedures, for subrecipient monitoring, inconsistent with 34 C.F.R. sections 300.149, 300.600 through 300.602, and 300.604 and 2 C.F.R. sections 200.332 and 200.303.",
        "OSEP found the State's grant award notifications (GANs) do not include the required information consistent with 2 C.F.R. section 200.332(a)(1)(v) and (vi)."
      ]
    }
  ],
  "MS": [
    {
      "part": "B",
      "date": "July 2025",
      "url": "https://www.ed.gov/media/document/osers-mississippi-part-b-dms-report-july-2025-110436.pdf",
      "insights": [
        "OSEP issued 10 findings, including that Mississippi has not submitted valid and reliable SPP/APR data and has not been reporting valid and reliable data for the secondary transition requirements under Indicator 13, as required by 34 C.F.R. sections 300.601(b) and 300.640 through 300.646.",
        "OSEP found the State was unable to provide evidence of a reasonably designed general supervision system for subrecipient monitoring and fiscal management, including issuance of a closeout letter to LEAs, consistent with 2 C.F.R. section 200.332(d) through (h) and 34 C.F.R. sections 300.149, 300.600 through 602, and 300.604."
      ]
    }
  ],
  "IN": [
    {
      "part": "C",
      "date": "July 2025",
      "url": "https://www.ed.gov/media/document/osep-indiana-dms-part-c-monitoring-report-july-2025-110455.pdf",
      "insights": [
        "OSEP issued 11 findings on Indiana's Part C early intervention system, including that the State does not make annual determinations about the performance of each early intervention service (EIS) program, in accordance with 34 C.F.R. sections 303.700(a)(2) and 303.703(b).",
        "OSEP found the State does not ensure the SEA and appropriate LEA are notified of infants or toddlers identified as potentially eligible for Part B preschool services (child find/transition), consistent with 34 C.F.R. section 303.209(b)."
      ]
    }
  ]
},
  personnel: {
  "national": {
    "teacherPct": 91.2,
    "teacherFTE": 444915,
    "teacherCertFTE": 405972,
    "relatedPct": 97,
    "relatedFTE": 253386,
    "year": "Fall 2022"
  },
  "byState": {
    "AK": 90.5,
    "AL": 97.8,
    "AR": 86.4,
    "AZ": 93.4,
    "CA": 94.1,
    "CO": 94.4,
    "CT": 94.4,
    "DC": 82.2,
    "DE": 75.9,
    "FL": 100,
    "GA": 95.6,
    "HI": 93.3,
    "IA": 100,
    "ID": 99,
    "IL": 98.9,
    "IN": 73.3,
    "KS": 84.7,
    "KY": 96.4,
    "LA": 74.3,
    "MD": 88,
    "ME": 97.8,
    "MI": 93.2,
    "MN": 82.7,
    "MO": 93.8,
    "MS": 99.4,
    "MT": 75.5,
    "NC": 93.6,
    "ND": 100,
    "NE": 90,
    "NJ": 100,
    "NM": 95.6,
    "NV": 95.5,
    "NY": 81.3,
    "OH": 96.8,
    "OK": 97.6,
    "OR": 82.9,
    "PA": 96.7,
    "RI": 99.1,
    "SC": 98.3,
    "SD": 94,
    "TN": 95.3,
    "TX": 78.1,
    "UT": 91.1,
    "VA": 93.7,
    "VT": 91.5,
    "WA": 96.6,
    "WI": 96.6,
    "WV": 80.4,
    "WY": 90.8
  }
}
};
