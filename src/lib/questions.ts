export type QuestionType = "single" | "multi" | "text" | "longtext" | "number" | "scale";

export type Section =
  | "Business Information"
  | "Revenue"
  | "Offer"
  | "Marketing"
  | "Sales"
  | "Systems"
  | "Operations"
  | "Team"
  | "Goals";

export type Question = {
  key: string;
  section: Section;
  label: string;
  help?: string;
  placeholder?: string;
  type: QuestionType;
  options?: { value: string; label: string; score?: number }[];
  minSelect?: number;
  maxSelect?: number;
  required?: boolean;
};

export const SECTIONS: Section[] = [
  "Business Information",
  "Revenue",
  "Offer",
  "Marketing",
  "Sales",
  "Systems",
  "Operations",
  "Team",
  "Goals",
];

export const INDUSTRIES = [
  "Business Coaching",
  "Consulting",
  "Real Estate Investing",
  "Marketing Agency",
  "Service Business",
  "Financial Services",
  "Health & Wellness",
  "Legal",
  "Construction & Trades",
  "E-commerce",
  "SaaS / Technology",
  "Other",
];

const s = (value: string, label: string, score: number) => ({ value, label, score });

export const QUESTIONS: Question[] = [
  {
    key: "full_name",
    section: "Business Information",
    label: "What's your full name?",
    type: "text",
    placeholder: "Jane Doe",
    required: true,
  },
  {
    key: "email",
    section: "Business Information",
    label: "What email should your report be tied to?",
    type: "text",
    placeholder: "you@company.com",
    required: true,
  },
  {
    key: "phone",
    section: "Business Information",
    label: "What's the best phone number to reach you?",
    type: "text",
    placeholder: "(555) 123-4567",
    required: true,
  },
  {
    key: "company",
    section: "Business Information",
    label: "What's the name of your company?",
    type: "text",
    placeholder: "Acme Advisory",
    required: true,
  },
  {
    key: "industries",
    section: "Business Information",
    label: "What industry are you in?",
    help: "Select up to 2.",
    type: "multi",
    minSelect: 1,
    maxSelect: 2,
    options: INDUSTRIES.map((i) => ({ value: i, label: i })),
    required: true,
  },
  {
    key: "years_in_business",
    section: "Business Information",
    label: "How long have you been in business?",
    type: "single",
    options: [
      s("<1", "Less than a year", 40),
      s("1-3", "1-3 years", 65),
      s("3-7", "3-7 years", 85),
      s("7+", "7+ years", 100),
    ],
  },
  {
    key: "monthly_revenue",
    section: "Revenue",
    label: "What is your current monthly revenue?",
    type: "single",
    options: [
      s("<10k", "Under $10,000", 30),
      s("10-25k", "$10,000 - $25,000", 50),
      s("25-50k", "$25,000 - $50,000", 65),
      s("50-100k", "$50,000 - $100,000", 80),
      s("100-250k", "$100,000 - $250,000", 90),
      s("250-500k", "$250,000 - $500,000", 100),
    ],
    required: true,
  },
  {
    key: "revenue_consistency",
    section: "Revenue",
    label: "How predictable is your monthly revenue?",
    type: "single",
    options: [
      s("very_unpredictable", "Wildly unpredictable - every month is a surprise", 15),
      s("unpredictable", "Somewhat unpredictable", 40),
      s("mostly", "Mostly predictable", 75),
      s("predictable", "Highly predictable and forecastable", 100),
    ],
  },
  {
    key: "avg_client_value",
    section: "Revenue",
    label: "What is your average client value (total revenue per client)?",
    type: "number",
    placeholder: "5000",
  },
  {
    key: "revenue_target",
    section: "Revenue",
    label: "What monthly revenue are you trying to reach in the next 12 months?",
    type: "number",
    placeholder: "150000",
  },
  {
    key: "icp",
    section: "Offer",
    label: "Who does your offer serve? (ICP - Ideal Client Profile)",
    type: "longtext",
    placeholder: "Describe your ideal client in as much detail as possible.",
    required: true,
  },
  {
    key: "offer_clarity",
    section: "Offer",
    label: "How clearly defined is your core offer?",
    type: "single",
    options: [
      s("none", "We don't really have one defined offer", 10),
      s("loose", "Loosely defined - it changes per client", 35),
      s("defined", "Defined, but not fully packaged", 65),
      s("productized", "Fully productized with clear deliverables and pricing", 100),
    ],
  },
  {
    key: "offer_differentiation",
    section: "Offer",
    label: "How different is your offer from competitors in your market?",
    type: "scale",
  },
  {
    key: "pricing_confidence",
    section: "Offer",
    label: "How confident are you that your pricing reflects the value you deliver?",
    type: "scale",
  },
  {
    key: "marketing_channels",
    section: "Marketing",
    label: "Which marketing channels are you actively using?",
    help: "Select all that apply.",
    type: "multi",
    options: [
      s("referrals", "Referrals & word of mouth", 60),
      s("paid_ads", "Paid ads", 80),
      s("organic_social", "Organic social content", 70),
      s("email", "Email marketing", 85),
      s("seo", "SEO / content", 80),
      s("outbound", "Cold outbound", 75),
      s("events", "Events & speaking", 70),
      s("partnerships", "Partnerships & JVs", 75),
      s("none", "Nothing consistent right now", 10),
    ],
    required: true,
  },
  {
    key: "lead_sources_working",
    section: "Marketing",
    label: "Which lead sources are actually producing qualified leads today?",
    help: "Select all that apply.",
    type: "multi",
    options: [
      s("referrals", "Referrals", 65),
      s("paid_ads", "Paid ads", 85),
      s("organic", "Organic content", 80),
      s("email", "Email list", 85),
      s("outbound", "Outbound", 80),
      s("partners", "Partners", 75),
      s("none", "Honestly, none of them consistently", 5),
    ],
    required: true,
  },
  {
    key: "marketing_gaps",
    section: "Marketing",
    label: "Which of these marketing problems are you experiencing?",
    help: "Select all that apply.",
    type: "multi",
    options: [
      s("no_leads", "Not enough leads", 20),
      s("low_quality", "Leads are low quality", 30),
      s("no_message", "Messaging doesn't land", 25),
      s("inconsistent", "Marketing is inconsistent", 25),
      s("no_tracking", "No idea what's actually working", 20),
      s("expensive", "Cost per lead is too high", 35),
      s("none", "None - marketing is performing well", 100),
    ],
    required: true,
  },
  {
    key: "marketing_assets",
    section: "Marketing",
    label: "Which marketing assets do you currently have in place?",
    help: "Select all that apply.",
    type: "multi",
    options: [
      s("landing_pages", "Dedicated landing pages", 80),
      s("lead_magnet", "Lead magnet / free resource", 80),
      s("case_studies", "Case studies & testimonials", 90),
      s("nurture", "Nurture email sequence", 90),
      s("webinar", "Webinar or VSL", 85),
      s("brand", "Clear brand positioning", 85),
      s("none", "None of these yet", 10),
    ],
    required: true,
  },
  {
    key: "marketing_tracking",
    section: "Marketing",
    label: "Which marketing numbers do you track weekly?",
    help: "Select all that apply.",
    type: "multi",
    options: [
      s("leads", "Lead volume", 80),
      s("cpl", "Cost per lead", 85),
      s("conversion", "Lead-to-appointment rate", 90),
      s("cac", "Customer acquisition cost", 95),
      s("roas", "Return on ad spend", 90),
      s("none", "None - we don't track weekly", 10),
    ],
    required: true,
  },
  {
    key: "monthly_leads",
    section: "Sales",
    label: "Roughly how many new leads do you get per month?",
    type: "number",
    placeholder: "50",
  },
  {
    key: "close_rate",
    section: "Sales",
    label: "What percentage of sales conversations turn into clients?",
    type: "single",
    options: [
      s("<10", "Under 10%", 20),
      s("10-20", "10-20%", 40),
      s("20-35", "20-35%", 65),
      s("35-50", "35-50%", 85),
      s("50+", "Over 50%", 100),
    ],
  },
  {
    key: "sales_process",
    section: "Sales",
    label: "How structured is your sales process?",
    type: "single",
    options: [
      s("none", "There isn't one - every call is different", 10),
      s("informal", "Informal, mostly in my head", 35),
      s("documented", "Documented but inconsistently followed", 65),
      s("systemized", "Documented, trained, and tracked", 100),
    ],
  },
  {
    key: "followup",
    section: "Sales",
    label: "What happens to a lead that doesn't buy on the first conversation?",
    type: "single",
    options: [
      s("nothing", "Nothing - they fall through the cracks", 5),
      s("manual", "We follow up manually when we remember", 30),
      s("some", "There's a short follow-up sequence", 65),
      s("automated", "Automated long-term nurture until they buy or opt out", 100),
    ],
  },
  {
    key: "show_rate",
    section: "Sales",
    label: "What percentage of booked appointments actually show up?",
    type: "single",
    options: [
      s("<40", "Under 40%", 20),
      s("40-60", "40-60%", 45),
      s("60-80", "60-80%", 75),
      s("80+", "Over 80%", 100),
    ],
  },
  {
    key: "crm",
    section: "Systems",
    label: "How are you managing leads and clients today?",
    type: "single",
    options: [
      s("none", "Spreadsheets, notes app, or memory", 10),
      s("basic", "A CRM, but we barely use it", 35),
      s("used", "A CRM we use fairly consistently", 70),
      s("integrated", "A CRM fully integrated with marketing and delivery", 100),
    ],
  },
  {
    key: "automation",
    section: "Systems",
    label: "How much of your lead-to-client journey is automated?",
    type: "single",
    options: [
      s("none", "None - it's all manual", 10),
      s("little", "A little (booking links, maybe a reminder)", 35),
      s("some", "Some key steps are automated", 70),
      s("most", "Most of it runs without me", 100),
    ],
  },
  {
    key: "data_visibility",
    section: "Systems",
    label: "Can you see your pipeline and key numbers in one place, right now?",
    type: "single",
    options: [
      s("no", "No - I'd have to piece it together", 15),
      s("partial", "Partially", 55),
      s("yes", "Yes, one dashboard shows everything", 100),
    ],
  },
  {
    key: "tool_sprawl",
    section: "Systems",
    label: "How well do your tools talk to each other?",
    type: "scale",
  },
  {
    key: "sops",
    section: "Operations",
    label: "How documented are your core processes (SOPs)?",
    type: "single",
    options: [
      s("none", "Not documented at all", 10),
      s("some", "A few things are written down", 40),
      s("most", "Most core processes are documented", 75),
      s("all", "Fully documented and actively used for training", 100),
    ],
  },
  {
    key: "delivery_consistency",
    section: "Operations",
    label: "How consistent is your client delivery experience?",
    type: "scale",
  },
  {
    key: "owner_dependency",
    section: "Operations",
    label: "What percentage of the business still depends on you personally?",
    type: "single",
    options: [
      s("90+", "90%+ - it stops without me", 10),
      s("70", "About 70%", 35),
      s("50", "About half", 60),
      s("<30", "Less than 30%", 100),
    ],
  },
  {
    key: "ops_bottlenecks",
    section: "Operations",
    label: "Where does work most often get stuck?",
    help: "Select all that apply.",
    type: "multi",
    options: [
      s("onboarding", "Client onboarding", 40),
      s("delivery", "Delivery / fulfillment", 40),
      s("comms", "Client communication", 45),
      s("admin", "Admin & billing", 50),
      s("handoffs", "Hand-offs between people", 40),
      s("none", "Nothing major gets stuck", 100),
    ],
  },
  {
    key: "team_size",
    section: "Team",
    label: "How many people are on your team (including contractors)?",
    type: "single",
    options: [
      s("solo", "Just me", 30),
      s("1-3", "1-3", 55),
      s("4-10", "4-10", 80),
      s("10+", "More than 10", 100),
    ],
  },
  {
    key: "role_clarity",
    section: "Team",
    label: "How clear is everyone on what they own?",
    type: "scale",
  },
  {
    key: "accountability",
    section: "Team",
    label: "Do you have measurable KPIs per role?",
    type: "single",
    options: [
      s("no", "No KPIs at all", 10),
      s("informal", "Informal expectations", 40),
      s("some", "KPIs for some roles", 70),
      s("all", "Every role has tracked KPIs", 100),
    ],
  },
  {
    key: "priorities",
    section: "Goals",
    label: "What matters most to you?",
    help: "Select 3 to 4.",
    type: "multi",
    minSelect: 3,
    maxSelect: 4,
    options: [
      { value: "predictable_revenue", label: "Predictable revenue" },
      { value: "more_leads", label: "More qualified leads" },
      { value: "higher_close", label: "Higher close rate" },
      { value: "automation", label: "Automating operations" },
      { value: "time_freedom", label: "Getting my time back" },
      { value: "scale_team", label: "Scaling the team" },
      { value: "client_experience", label: "Better client experience" },
      { value: "profit", label: "Higher profit margins" },
      { value: "exit", label: "Building toward an exit" },
    ],
    required: true,
  },
  {
    key: "biggest_challenge",
    section: "Goals",
    label: "In your own words, what feels most broken right now?",
    type: "longtext",
    placeholder: "Be specific - this shapes the diagnostic.",
    required: true,
  },
  {
    key: "timeline",
    section: "Goals",
    label: "How quickly do you want this fixed?",
    type: "single",
    options: [
      s("now", "Immediately - it's costing me money", 100),
      s("90", "Within 90 days", 80),
      s("6mo", "Within 6 months", 60),
      s("exploring", "Just exploring for now", 30),
    ],
  },
];

export const QUESTION_MAP = new Map(QUESTIONS.map((q) => [q.key, q]));

export function formatAnswer(question: Question, value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) {
    return value
      .map((v) => question.options?.find((o) => o.value === v)?.label ?? String(v))
      .join(", ");
  }
  if (question.type === "scale") return `${value} / 10`;
  const opt = question.options?.find((o) => o.value === value);
  return opt ? opt.label : String(value);
}