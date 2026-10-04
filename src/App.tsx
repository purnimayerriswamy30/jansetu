import { FormEvent, ReactNode, useMemo, useState,useEffect} from "react";
import "./index.css"
import React from "react";
const API_BASE = "http://127.0.0.1:5000";

type Complaint = {
  id: number;
  reference_no: string;
  title: string;
  description: string;
  category: string;
  location: string;
  severity: "Low" | "Medium" | "High" | "Urgent";
  status: string;
  progress_note: string | null;
  resident_name: string;
  resident_email: string;
  created_at: string;
};

async function getAuthorityComplaints(): Promise<Complaint[]> {
  const response = await fetch(`${API_BASE}/api/authority/complaints`);
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Could not load complaints");
  }

  return data.complaints;
}

async function saveComplaintUpdate(
  id: number,
  status: string,
  progress_note: string
) {
  const response = await fetch(
    `${API_BASE}/api/authority/complaints/${id}/status`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, progress_note }),
    }
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Could not save complaint update");
  }

  return data;
}
type Language = "en" | "te" | "hi";
type Page =
  | "roleSelect"
  | "login"
  | "register"
  | "dashboard"
  | "report"
  | "success"
  | "complaints"
  | "tracking"
  | "notifications"
  | "authority"
  | "review"
  | "settings";

const copy = {
  en: {
    login: "Login",
    create: "Create an account",
    welcome: "Welcome to JanSetu",
    intro: "Sign in to report local issues and track their progress.",
    identity: "Mobile number or email",
    password: "Password",
    forgot: "Forgot password?",
    demo: "Explore resident demo",
    home: "Home",
    report: "Report an Issue",
    complaints: "My Complaints",
    notifications: "Notifications",
    settings: "Profile & Help",
    welcomeBack: "Welcome back, Ananya",
    welcomeBody: "Help improve your community by reporting local problems and following their progress.",
    total: "Total complaints",
    review: "Awaiting review",
    progress: "In progress",
    resolved: "Resolved",
    recent: "Recent complaints",
    view: "View details",
    all: "View all complaints",
    demoData: "Demonstration data",
    logout: "Log out",
    official: "Official workspace",
  },
  te: {
    login: "లాగిన్",
    create: "ఖాతా సృష్టించండి",
    welcome: "జన్‌సేతుకు స్వాగతం",
    intro: "స్థానిక సమస్యలను నివేదించడానికి మరియు పురోగతిని తెలుసుకోవడానికి సైన్ ఇన్ చేయండి.",
    identity: "మొబైల్ నంబర్ లేదా ఇమెయిల్",
    password: "పాస్‌వర్డ్",
    forgot: "పాస్‌వర్డ్ మర్చిపోయారా?",
    demo: "నివాసి డెమోను చూడండి",
    home: "హోమ్",
    report: "సమస్యను నివేదించండి",
    complaints: "నా ఫిర్యాదులు",
    notifications: "నోటిఫికేషన్లు",
    settings: "ప్రొఫైల్ & సహాయం",
    welcomeBack: "తిరిగి స్వాగతం, అనన్య",
    welcomeBody: "స్థానిక సమస్యలను నివేదించి, వాటి పురోగతిని తెలుసుకుంటూ మీ సమాజాన్ని మెరుగుపరచండి.",
    total: "మొత్తం ఫిర్యాదులు",
    review: "సమీక్ష కోసం",
    progress: "పనిలో ఉంది",
    resolved: "పరిష్కరించబడింది",
    recent: "ఇటీవలి ఫిర్యాదులు",
    view: "వివరాలు చూడండి",
    all: "అన్ని ఫిర్యాదులు",
    demoData: "ప్రదర్శన సమాచారం",
    logout: "లాగ్ అవుట్",
    official: "అధికారుల విభాగం",
  },
  hi: {
    login: "लॉग इन",
    create: "खाता बनाएँ",
    welcome: "जनसेतु में आपका स्वागत है",
    intro: "स्थानीय समस्याओं की रिपोर्ट करने और प्रगति देखने के लिए साइन इन करें।",
    identity: "मोबाइल नंबर या ईमेल",
    password: "पासवर्ड",
    forgot: "पासवर्ड भूल गए?",
    demo: "निवासी डेमो देखें",
    home: "होम",
    report: "समस्या दर्ज करें",
    complaints: "मेरी शिकायतें",
    notifications: "सूचनाएँ",
    settings: "प्रोफ़ाइल और सहायता",
    welcomeBack: "वापसी पर स्वागत है, अनन्या",
    welcomeBody: "स्थानीय समस्याएँ दर्ज करके और उनकी प्रगति देखकर अपने समुदाय को बेहतर बनाएँ।",
    total: "कुल शिकायतें",
    review: "समीक्षा में",
    progress: "काम जारी",
    resolved: "समाधान हुआ",
    recent: "हाल की शिकायतें",
    view: "विवरण देखें",
    all: "सभी शिकायतें देखें",
    demoData: "प्रदर्शन डेटा",
    logout: "लॉग आउट",
    official: "अधिकारी कार्यक्षेत्र",
  },
};

const icons: Record<string, ReactNode> = {
  home: <path d="M3 11.5 12 4l9 7.5M5.5 10v10h13V10M9 20v-6h6v6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  file: <path d="M7 3h7l4 4v14H7zM14 3v5h5M10 13h5M10 17h5" />,
  bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />,
  user: <path d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10" />,
  arrow: <path d="m9 18 6-6-6-6" />,
  back: <path d="m15 18-6-6 6-6" />,
  check: <path d="m5 12 4 4L19 6" />,
  search: <path d="m21 21-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0" />,
  road: <><path d="M8 21 10 3M16 21 14 3M12 5v3M12 11v3M12 17v3" /></>,
  water: <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11zM9 15c.5 1.2 1.5 2 3 2" />,
  waste: <path d="M5 7h14M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" />,
  light: <path d="M9 18h6M10 22h4M8.5 14.5A6 6 0 1 1 15.5 14.5C14.6 15.1 14 16 14 18h-4c0-2-.6-2.9-1.5-3.5z" />,
  drain: <path d="M3 7h18M5 11h14M7 15h10M9 19h6" />,
  pin: <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />,
  upload: <path d="M12 16V4M7 9l5-5 5 5M5 14v6h14v-6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  shield: <path d="M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10zM9 12l2 2 4-5" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  more: <path d="M5 12h.01M12 12h.01M19 12h.01" />,
  filter: <path d="M4 5h16l-6 7v6l-4 2v-8z" />,
  alert: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>,
  building: <path d="M4 21V7l8-4 8 4v14M8 10h2M14 10h2M8 14h2M14 14h2M10 21v-3h4v3" />,
  lock: <path d="M6 10h12v11H6zM8 10V7a4 4 0 0 1 8 0v3" />,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-1 .5-1 1-1 2M12 17h.01" /></>,
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return <svg aria-hidden="true" className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icons[name]}</svg>;
}

function Logo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <div className={`logo-lockup ${light ? "light" : ""}`}>
      <svg className="brand-mark" viewBox="0 0 42 48" aria-label="JanSetu logo">
        <path d="M21 1.8C10.2 1.8 2 10.2 2 20.3 2 32 21 46 21 46s19-14 19-25.7C40 10.2 31.8 1.8 21 1.8Z" fill="currentColor" />
        <path d="M9 22c3.2-5 7.2-7.5 12-7.5S29.8 17 33 22M9 22h24M13.5 22v5.5M28.5 22v5.5M18 22v5.5M24 22v5.5M11 28h20" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      {!compact && <div><div className="wordmark">JanSetu</div><div className="logo-sub">Your voice. Your village.</div></div>}
    </div>
  );
}

function Button({ children, onClick, variant = "primary", icon, type = "button", disabled = false, full = false }: {
  children: ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "ghost" | "danger"; icon?: string; type?: "button" | "submit"; disabled?: boolean; full?: boolean;
}) {
  return <button type={type} className={`btn btn-${variant} ${full ? "btn-full" : ""}`} onClick={onClick} disabled={disabled}>{icon && <Icon name={icon} />}{children}</button>;
}

function Field({ label, placeholder, type = "text", hint, required = false, value, onChange }: {
  label: string; placeholder?: string; type?: string; hint?: string; required?: boolean; value?: string; onChange?: (value: string) => void;
}) {
  return <label className="field"><span>{label}{required && <b> *</b>}</span><input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange?.(e.target.value)} />{hint && <small>{hint}</small>}</label>;
}

function SelectField({ label, children, value, onChange }: { label: string; children: ReactNode; value?: string; onChange?: (value: string) => void }) {
  return <label className="field"><span>{label}</span><select value={value} onChange={(e) => onChange?.(e.target.value)}>{children}</select></label>;
}

function LanguageSelect({ language, setLanguage, inverse = false }: { language: Language; setLanguage: (value: Language) => void; inverse?: boolean }) {
  return <label className={`language ${inverse ? "inverse" : ""}`}><span className="sr-only">Select language</span><Icon name="building" size={17} /><select value={language} onChange={(e) => setLanguage(e.target.value as Language)} aria-label="Language"><option value="en">English</option><option value="te">తెలుగు</option><option value="hi">हिन्दी</option></select></label>;
}

function Status({ value, tone = "info" }: { value: string; tone?: "info" | "warning" | "success" | "danger" | "neutral" }) {
  return <span className={`status status-${tone}`}><span className="status-dot" />{value}</span>;
}

function Login({
  go,
  language,
  setLanguage,
  setCurrentUser,
  selectedRole,
}: {
  go: (page: Page) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  setCurrentUser: (user: {
    id: number;
    name: string;
    email: string;
    role: string;
  }) => void;
  selectedRole: "resident" | "authority";
}) {
  const t = copy[language];
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password,expected_role:selectedRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      setCurrentUser(data.user);

      // IMPORTANT: the dashboard is selected from the authenticated
      // backend role, not from the role chosen before login.
      if (data.user?.role === "authority") {
        go("authority");
      } else {
        go("dashboard");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not connect to server"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`auth-page ${selectedRole === "authority" ? "authority-auth-page" : ""}`}>
      <section className="auth-story">
        <div className="auth-top">
          <Logo light />
          <LanguageSelect
            language={language}
            setLanguage={setLanguage}
            inverse
          />
        </div>

        <div className="story-copy">
          <div className="eyebrow light-text">
            SMART CIVIC PARTICIPATION
          </div>
          <div className="display-title">
            Your voice can<br />shape your village.
          </div>
          <p>
            Report local problems, follow every update, and understand the
            action taken—all in one clear place.
          </p>
          <div className="trust-row">
            <span><Icon name="shield" />Private by design</span>
            <span><Icon name="clock" />Transparent updates</span>
          </div>
        </div>

        <VillageArt />
        <p className="disclaimer">
          JanSetu is a student demonstration platform and is not an official
          government service.
        </p>
      </section>

      <section className="auth-panel">
        <div className="mobile-auth-top">
          <Logo />
          <LanguageSelect language={language} setLanguage={setLanguage} />
        </div>

        <form className="auth-card" onSubmit={submit}>
          <div className={`auth-heading ${selectedRole === "authority" ? "authority-login-heading" : ""}`}>
            <div className="section-title">{selectedRole === "authority" ? "Authority sign in" : t.welcome}</div>
            <p>{selectedRole === "authority" ? "Sign in to review complaints, accept cases, manage work, and publish progress updates." : t.intro}</p>
          </div>

          <Field
            label="Email"
            placeholder="name@example.com"
            type="email"
            value={email}
            onChange={setEmail}
            required
          />

          <Field
            label={t.password}
            placeholder="Enter your password"
            type="password"
            value={password}
            onChange={setPassword}
            required
          />

          {error && (
            <p role="alert" style={{ color: "red" }}>
              {error}
            </p>
          )}

          <div className="form-row">
            <label className="check">
              <input type="checkbox" /> Remember me
            </label>
            <button className="text-button" type="button">
              {t.forgot}
            </button>
          </div>

          <Button type="submit" full disabled={loading}>
            {loading ? "Signing in…" : t.login}
          </Button>

          <div className="or"><span />or<span /></div>

          <p className="auth-foot">
            New to JanSetu?{" "}
            <button type="button" onClick={() => go("register")}>
              {t.create}
            </button>
          </p>

          <div className="privacy-note">
            <Icon name="lock" size={18} />
            <span>
              Your contact details stay private and are only used to manage
              your complaints.
            </span>
          </div>
        </form>
      </section>
    </main>
  );
}

function VillageArt() {
  return <svg className="village-art" viewBox="0 0 700 310" role="img" aria-label="Illustration of a connected village community">
    <path d="M0 250c110-42 205-32 300 0 105 35 245 44 400-4v64H0z" fill="#0b5f59" />
    <circle cx="590" cy="52" r="27" fill="#f6c453" />
    <path d="M0 224c95-35 155-24 231 9 85 36 178 18 255-17 74-34 137-30 214-5v74H0z" fill="#147a70" />
    <path d="M77 207v-71h86v71M69 137l51-39 51 39" fill="#f8f2df" stroke="#16324f" strokeWidth="5" />
    <path d="M107 207v-39h26v39M93 149h14v18H93zM137 149h14v18h-14z" fill="#80c4bb" />
    <path d="M436 211v-92h103v92M426 120l61-48 61 48" fill="#fff" stroke="#16324f" strokeWidth="5" />
    <path d="M474 211v-44h28v44M449 137h17v19h-17zM510 137h17v19h-17z" fill="#80c4bb" />
    <path d="M220 214V111h78v103M212 112l47-34 47 34" fill="#f3c979" stroke="#16324f" strokeWidth="5" />
    <path d="M247 214v-37h24v37" fill="#80c4bb" />
    <path d="M320 220c15-72 73-70 96 0M330 220c14-53 60-53 76 0" fill="none" stroke="#fff" strokeWidth="7" />
    <path d="M352 217v-38M385 217v-38" stroke="#fff" strokeWidth="5" />
    <g fill="#f6c453"><circle cx="201" cy="232" r="9" /><circle cx="568" cy="225" r="9" /><circle cx="602" cy="235" r="9" /></g>
    <g stroke="#f6c453" strokeWidth="4" strokeDasharray="5 9" fill="none"><path d="M168 105c52-54 113-58 174-25" /><path d="M417 78c57-34 111-28 157 1" /></g>
    <g fill="#f6c453"><circle cx="169" cy="104" r="8" /><circle cx="342" cy="80" r="8" /><circle cx="417" cy="78" r="8" /><circle cx="574" cy="79" r="8" /></g>
  </svg>;
}

function Register({ go, language, setLanguage, selectedRole }: {
  go: (p: Page) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  selectedRole: "resident" | "authority";
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: selectedRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      setSuccess("Account created! Please log in.");
      setTimeout(() => go("login"), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`simple-page ${selectedRole === "authority" ? "authority-register-page" : ""}`}>
      <div className="simple-top">
        <Logo />
        <LanguageSelect language={language} setLanguage={setLanguage} />
      </div>

      <form className="form-shell" onSubmit={submit}>
        <button type="button" className="back-link" onClick={() => go("login")}>
          <Icon name="back" />Back to login
        </button>

        <div className="section-title">
          Create your {selectedRole === "authority" ? "authority" : "resident"} account
        </div>
        <p className="section-sub">
          {selectedRole === "authority"
            ? "Create an authority account to review complaints, accept cases, manage work, and publish progress updates."
            : "Enter your name, email and password to register."}
        </p>

        <div className="form-grid">
          <Field label="Full name" placeholder="Your full name"
            value={name} onChange={setName} required />
          <Field label="Email" placeholder="name@example.com" type="email"
            value={email} onChange={setEmail} required />
          <Field label="Create password" placeholder="At least 8 characters"
            type="password" value={password} onChange={setPassword} required />
          <Field label="Confirm password" placeholder="Enter password again"
            type="password" value={confirmPassword}
            onChange={setConfirmPassword} required />
        </div>

        {error && <p role="alert" style={{ color: "red" }}>{error}</p>}
        {success && <p role="status">{success}</p>}

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={() => go("login")}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </div>
      </form>
    </main>
  );
}

function AppShell({ page, go, language, setLanguage, children, official = false }: { page: Page; go: (p: Page) => void; language: Language; setLanguage: (l: Language) => void; children: ReactNode; official?: boolean }) {
  const t = copy[language];
  const [open, setOpen] = useState(false);
  const items: { page: Page; icon: string; label: string }[] = official
    ? [{ page: "authority", icon: "home", label: "Overview" }, { page: "review", icon: "file", label: "Complaint review" }, { page: "notifications", icon: "bell", label: t.notifications }, { page: "settings", icon: "user", label: t.settings }]
    : [{ page: "dashboard", icon: "home", label: t.home }, { page: "report", icon: "plus", label: t.report }, { page: "complaints", icon: "file", label: t.complaints }, { page: "notifications", icon: "bell", label: t.notifications }];
  return <div className={`app-shell ${official ? "official-shell" : ""}`}>
    <header className="app-header"><Logo compact /><button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Open navigation"><Icon name="menu" /></button><nav className={open ? "open" : ""}>{items.map((item) => <button key={item.page} className={page === item.page ? "active" : ""} onClick={() => { go(item.page); setOpen(false); }}><Icon name={item.icon} />{item.label}</button>)}</nav><div className="header-tools"><LanguageSelect language={language} setLanguage={setLanguage} /><button className="icon-button" onClick={() => go("notifications")} aria-label="Notifications"><Icon name="bell" /><i /></button><button className="avatar" onClick={() => go("settings")} aria-label="Open profile">{official ? "A" : "U"}</button></div></header>
    {official && <aside className="official-side"><Logo light /><div className="official-label"><Icon name="shield" />Authorized workspace</div>{items.map((item) => <button key={item.page} className={page === item.page ? "active" : ""} onClick={() => go(item.page)}><Icon name={item.icon} />{item.label}</button>)}</aside>}
    <main className="app-main">{children}</main>
  </div>;
}

const complaints = [
  { id: "JS-2025-1048", title: "Large pothole near primary school", category: "Roads & potholes", date: "18 Jun 2025", location: "Ward 4 · School Road", status: "In Progress", tone: "info" as const, severity: "High" },
  { id: "JS-2025-1012", title: "Streetlight not working", category: "Streetlights", date: "12 Jun 2025", location: "Ward 2 · Temple Lane", status: "Under Review", tone: "warning" as const, severity: "Medium" },
  { id: "JS-2025-0976", title: "Waste collection missed", category: "Waste management", date: "05 Jun 2025", location: "Ward 4 · Market Street", status: "Resolved", tone: "success" as const, severity: "Medium" },
];

function PageTitle({ eyebrow, title, body, action }: { eyebrow?: string; title: string; body?: string; action?: ReactNode }) {
  return <div className="page-heading">{eyebrow && <div className="eyebrow">{eyebrow}</div>}<div className="page-title-row"><div><div className="page-title">{title}</div>{body && <p>{body}</p>}</div>{action}</div></div>;
}

function Dashboard({
  go,
  language,
  setLanguage,
  currentUser,
}: {
  go: (p: Page) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  currentUser?: {
    id: number;
    name: string;
    email: string;
    role: string;
  } | null;
}) {
  const t = copy[language];
  const userId=currentUser?.id;

  const [dbComplaints, setDbComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser?.id) {
      setDbComplaints([]);
      setError("");
      return;
    }

    let cancelled = false;

    async function loadComplaints() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `http://127.0.0.1:5000/api/complaints?user_id=${userId}`
        );

        const data = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(
            data.message || "Failed to load complaints."
          );
        }

        const items = Array.isArray(data)
          ? data
          : Array.isArray(data.complaints)
            ? data.complaints
            : [];

        if (!cancelled) {
          setDbComplaints(items);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to connect to the server."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadComplaints();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const total = dbComplaints.length;

  const resolved = dbComplaints.filter(
    (c) => String(c.status || "").toLowerCase() === "resolved"
  ).length;

  const active = dbComplaints.filter((c) =>
    ["pending", "submitted", "under review", "in progress"].includes(
      String(c.status || "")
        .toLowerCase()
        .replace(/[_-]/g, " ")
    )
  ).length;

  const inProgress = dbComplaints.filter(
    (c) =>
      String(c.status || "")
        .toLowerCase()
        .replace(/[_-]/g, " ") === "in progress"
  ).length;

  return (
    <AppShell
      page="dashboard"
      go={go}
      language={language}
      setLanguage={setLanguage}
    >
      <div className="content-wrap">
        <section className="welcome-banner">
          <div>
            <span className="demo-pill">
              {currentUser ? "LIVE DATA" : t.demoData}
            </span>

            <div className="hero-title">
              {currentUser
                ? `Welcome, ${currentUser.name}`
                : t.welcomeBack}
            </div>

            <p>
              {currentUser
                ? "Track your civic complaints and their progress."
                : "Please sign in to view your complaints."}
            </p>

            <Button
              icon="plus"
              onClick={() => go("report")}
            >
              {t.report}
            </Button>
          </div>

          <div className="welcome-graphic">
            <Icon name="building" size={70} />
            <span />
            <span />
          </div>
        </section>

        {error && (
          <div
            role="alert"
            style={{
              color: "#b91c1c",
              background: "#fef2f2",
              padding: 12,
              borderRadius: 8,
              marginTop: 16,
            }}
          >
            {error}
            <button
              onClick={() => {
                if (currentUser?.id) {
                  setError("");
                  setLoading(true);

                  fetch(
                    `http://127.0.0.1:5000/api/complaints?user_id=${currentUser.id}`
                  )
                    .then(async (response) => {
                      const data = await response.json();

                      if (!response.ok) {
                        throw new Error(
                          data.message || "Failed to load complaints."
                        );
                      }

                      const items = Array.isArray(data)
                        ? data
                        : Array.isArray(data.complaints)
                          ? data.complaints
                          : [];

                      setDbComplaints(items);
                      setError("");
                    })
                    .catch((err: unknown) => {
                      setError(
                        err instanceof Error
                          ? err.message
                          : "Failed to load complaints."
                      );
                    })
                    .finally(() => setLoading(false));
                }
              }}
              style={{
                marginLeft: 12,
                border: 0,
                background: "transparent",
                color: "#166534",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Retry
            </button>
          </div>
        )}

        <section className="stat-grid">
          {[
            [t.total, String(total), "file", "neutral"],
            [t.review, String(active), "clock", "warning"],
            [t.progress, String(inProgress), "road", "info"],
            [t.resolved, String(resolved), "check", "success"],
          ].map(([label, value, icon, tone]) => (
            <div
              className={`stat-card tone-${tone}`}
              key={label}
            >
              <div className="stat-icon">
                <Icon name={icon} />
              </div>

              <div>
                <div className="stat-value">
                  {loading ? "…" : value}
                </div>
                <div className="stat-label">{label}</div>
              </div>

              <span className="trend">
                Database complaints
              </span>
            </div>
          ))}
        </section>

        <section className="section-block">
          <div className="section-head">
            <div>
              <div className="section-title">
                {t.recent}
              </div>
              <p>Your latest reports and their current status</p>
            </div>

            <Button
              variant="ghost"
              onClick={() => go("complaints")}
            >
              {t.all}
              <Icon name="arrow" size={17} />
            </Button>
          </div>

          {loading ? (
            <p>Loading your complaints...</p>
          ) : dbComplaints.length > 0 ? (
            <div className="complaint-list">
              {dbComplaints.slice(0, 5).map((c, index) => {
                const complaint = {
                  id: String(c.reference_no || c.id || index),
                  title: c.title || "Untitled complaint",
                  category: c.category || "General",
                  date: c.created_at
                    ? new Date(c.created_at).toLocaleDateString()
                    : "Date unavailable",
                  location: c.location || "Location unavailable",
                  status: c.status || "Pending",
                  tone: "success" as const,
                  severity: c.severity || "Medium",
                };

                return (
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    onClick={() => go("tracking")}
                    view={t.view}
                  />
                );
              })}
            </div>
          ) : (
            <div className="section-title">
              {currentUser
                ? "No complaints found. Submit your first civic issue!"
                : "Sign in to view your complaints."}

              {currentUser && (
                <div style={{ marginTop: 16 }}>
                  <Button
                    onClick={() => go("report")}
                  >
                    + Report an issue
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="how-section">
          <div className="section-title">
            How JanSetu works
          </div>

          <div className="how-grid">
            {[
              [
                "plus",
                "1",
                "Report a problem",
                "Describe the issue and provide its location.",
              ],
              [
                "clock",
                "2",
                "Track progress",
                "Follow the latest status of your complaint.",
              ],
              [
                "check",
                "3",
                "View the action",
                "Check whether your issue has been resolved.",
              ],
            ].map(([icon, number, title, body]) => (
              <div className="how-item" key={number}>
                <div className="how-icon">
                  <Icon name={icon} />
                  <b>{number}</b>
                </div>

                <div>
                  <strong>{title}</strong>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function ComplaintCard({ complaint: c, onClick, view = "View details" }: { complaint: typeof complaints[0]; onClick: () => void; view?: string }) {
  return <article className="complaint-card"><div className="complaint-accent" /><div className="complaint-main"><div className="card-meta"><span>{c.id}</span><Status value={c.status} tone={c.tone} /></div><div className="card-title">{c.title}</div><div className="detail-row"><span><Icon name="file" size={16} />{c.category}</span><span><Icon name="pin" size={16} />{c.location}</span><span><Icon name="clock" size={16} />{c.date}</span></div></div><div className="card-side"><span className={`severity severity-${c.severity.toLowerCase()}`}>{c.severity} priority</span><Button variant="ghost" onClick={onClick}>{view}<Icon name="arrow" size={17} /></Button></div></article>;
}

const categories = [
  ["road", "Roads & potholes", "Damaged roads, potholes, unsafe paths"],
  ["water", "Water supply", "No water, leakage, poor water quality"],
  ["waste", "Garbage & waste", "Missed collection or dumping"],
  ["light", "Streetlights", "Broken or non-working streetlights"],
  ["drain", "Drainage & sanitation", "Blocked drains or sanitation concerns"],
  ["more", "Other civic issue", "Any other local public issue"],
];

function ReportIssue({ go, language, setLanguage, currentUser }: {
  go: (p: Page) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  currentUser?: { id: number; name: string; email: string; role: string } | null;
}) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("Roads & potholes");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("Medium");
  const [village, setVillage] = useState("");
  const [ward, setWard] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");

  const submitComplaint = async () => {
    if (!currentUser?.id) {
      setError("Please log in before submitting a complaint.");
      return;
    }
    if (!title.trim() || !description.trim() || !location.trim()) {
      setError("Please enter the issue title, description, and location.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://127.0.0.1:5000/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          title: title.trim(),
          description: description.trim(),
          category,
          severity,
          location: [village, ward, location].filter(Boolean).join(", "),
          status: "Pending",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(data.message || `Complaint could not be saved (HTTP ${response.status}).`);
      }
      setReference(String(data.reference_no || data.complaint?.reference_no || data.id || data.complaint?.id || ""));
      go("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect to the Flask server.");
    } finally {
      setLoading(false);
    }
  };

  return <AppShell page="report" go={go} language={language} setLanguage={setLanguage}>
    <div className="narrow-wrap">
      <button className="back-link" onClick={() => step > 1 ? setStep(step - 1) : go("dashboard")}><Icon name="back" />{step > 1 ? "Previous step" : "Back to dashboard"}</button>
      <PageTitle eyebrow="NEW COMPLAINT" title="Report a local issue" body="Share clear details so the right team can review your report." />
      <div className="stepper">{[1,2,3,4,5].map((n) => <div className={`${n === step ? "current" : ""} ${n < step ? "done" : ""}`} key={n}><span>{n < step ? <Icon name="check" size={15} /> : n}</span><small>{["Category","Details","Location","Evidence","Review"][n-1]}</small></div>)}</div>
      <section className="form-card">
        {step === 1 && <><div className="form-title">What type of issue are you reporting?</div><p className="section-sub">Choose the category that best matches the problem.</p><div className="category-grid">{categories.map(([icon,name,desc]) => <button type="button" className={category === name ? "selected" : ""} onClick={() => setCategory(name)} key={name}><span><Icon name={icon} /></span><strong>{name}</strong><small>{desc}</small>{category === name && <i><Icon name="check" size={13} /></i>}</button>)}</div></>}
        {step === 2 && <><div className="form-title">Describe the issue</div><Field label="Short issue title" placeholder="e.g. Large pothole near primary school" value={title} onChange={setTitle} required /><label className="field"><span>Description <b>*</b></span><textarea rows={5} placeholder="What happened? How is it affecting people nearby?" value={description} onChange={e => setDescription(e.target.value)} required /></label><SelectField label="Severity" value={severity} onChange={setSeverity}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Urgent">Urgent</option></SelectField></>}
        {step === 3 && <><div className="form-title">Where is the issue?</div><div className="two-col"><Field label="Village or town" placeholder="Enter village or town" value={village} onChange={setVillage} /><Field label="Ward or local area" placeholder="Enter ward or area" value={ward} onChange={setWard} /></div><Field label="Street or landmark" placeholder="e.g. Opposite school, Main Road" value={location} onChange={setLocation} required /></>}
        {step === 4 && <><div className="form-title">Evidence</div><p className="section-sub">Photo upload is optional. You can continue without a photo.</p><div className="info-box"><Icon name="alert" /><span>Only text details are currently sent to the database by this form.</span></div></>}
        {step === 5 && <><div className="form-title">Review your complaint</div><div className="review-summary"><ReviewRow label="Category" value={category} /><ReviewRow label="Issue" value={title || "Not entered"} /><ReviewRow label="Description" value={description || "Not entered"} /><ReviewRow label="Severity" value={severity} /><ReviewRow label="Location" value={[village, ward, location].filter(Boolean).join(", ") || "Not entered"} /></div></>}
        {error && <p role="alert" style={{ color: "#b91c1c", marginTop: 12 }}>{error}</p>}
        <div className="form-nav"><Button variant="secondary" onClick={() => step > 1 ? setStep(step - 1) : go("dashboard")}>Back</Button><div><Button variant="ghost" onClick={() => go("dashboard")}>Cancel</Button>{step < 5 ? <Button onClick={() => { setError(""); if (step === 2 && (!title.trim() || !description.trim())) { setError("Please enter the title and description."); return; } if (step === 3 && !location.trim()) { setError("Please enter the street or landmark."); return; } setStep(step + 1); }}>Continue <Icon name="arrow" /></Button> : <Button disabled={loading} onClick={submitComplaint}>{loading ? "Submitting..." : "Submit complaint"}</Button>}</div></div>
      </section>
    </div>
  </AppShell>;
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong><button>Edit</button></div>;
}

function Success({ go, language, setLanguage }: { go: (p: Page) => void; language: Language; setLanguage: (l: Language) => void }) {
  return <AppShell page="report" go={go} language={language} setLanguage={setLanguage}><div className="success-wrap"><div className="success-card"><div className="success-mark"><Icon name="check" size={42} /></div><div className="page-title">Your complaint has been submitted</div><p>Your report is now recorded and ready for review. You can follow every update from your dashboard.</p><div className="reference-box"><span>COMPLAINT REFERENCE</span><strong>JS-2025-1053</strong><button>Copy reference</button></div><div className="success-details"><ReviewRow label="Issue" value="Large pothole near primary school" /><ReviewRow label="Category" value="Roads & potholes" /><ReviewRow label="Submitted" value="18 June 2025, 10:42 AM" /><ReviewRow label="Location" value="Ward 4, Rampur" /></div><div className="next-note"><Icon name="clock" /><div><strong>What happens next?</strong><p>Your complaint will be reviewed and categorized. We’ll notify you when its recorded status changes. No response time is guaranteed in this demonstration.</p></div></div><div className="success-actions"><Button onClick={() => go("tracking")}>Track my complaint</Button><Button variant="secondary" onClick={() => go("dashboard")}>Back to dashboard</Button></div><small className="sample-note">Sample reference shown for demonstration purposes.</small></div></div></AppShell>;
}

function MyComplaints({ go, language, setLanguage, currentUser }: {
  go: (p: Page) => void; language: Language; setLanguage: (l: Language) => void;
  currentUser?: { id: number; name: string; email: string; role: string } | null;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!currentUser?.id) { setItems([]); return; }
    let cancelled = false;
    setLoading(true); setError("");
    fetch(`http://127.0.0.1:5000/api/complaints?user_id=${currentUser.id}`)
      .then(async response => {
        const data = await response.json();
        if (!response.ok || data.success === false) throw new Error(data.message || "Failed to load complaints.");
        const rows = Array.isArray(data) ? data : Array.isArray(data.complaints) ? data.complaints : [];
        if (!cancelled) setItems(rows);
      })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : "Could not load complaints."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [currentUser?.id]);
  return <AppShell page="complaints" go={go} language={language} setLanguage={setLanguage}><div className="content-wrap"><PageTitle eyebrow="RESIDENT PORTAL" title="My complaints" body="Search, filter, and follow every issue you have reported." action={<Button icon="plus" onClick={() => go("report")}>Report new issue</Button>} />
    {error && <p role="alert" style={{color:"#b91c1c"}}>{error}</p>}
    {loading ? <p>Loading your complaints...</p> : items.length ? <><div className="results-meta"><span>Showing {items.length} complaints</span><span>Live database</span></div><div className="complaint-list large">{items.map((c, i) => <ComplaintCard key={c.id || c.reference_no || i} complaint={{id:String(c.reference_no || c.id || i), title:c.title || "Untitled complaint", category:c.category || "General", date:c.created_at ? new Date(c.created_at).toLocaleDateString() : "Date unavailable", location:c.location || "Location unavailable", status:c.status || "Pending", tone:(String(c.status || "").toLowerCase()==="resolved" ? "success" : "info") as "info" | "success", severity:c.severity || "Medium"}} onClick={() => go("tracking")} />)}</div></> : <section className="white-card"><div className="section-title">{currentUser ? "No complaints saved yet." : "Please log in to view your complaints."}</div><p className="section-sub">Submit an issue to see it listed here.</p><Button onClick={() => go("report")}>Report an issue</Button></section>}
  </div></AppShell>;
}

function Tracking({ go, language, setLanguage }: { go: (p: Page) => void; language: Language; setLanguage: (l: Language) => void }) {
  const events = [
    ["18 Jun · 10:42 AM","Complaint submitted","Your report was successfully recorded.","done"],
    ["18 Jun · 02:15 PM","Reviewed and accepted","The report was reviewed and accepted for action.","done"],
    ["19 Jun · 09:30 AM","Assigned to Roads Maintenance","Assigned for field inspection by the local maintenance team.","done"],
    ["20 Jun · 11:10 AM","Work in progress","Site inspection completed. Repair work has been scheduled.","current"],
    ["—","Resolution update","Resolution notes and evidence will appear here once recorded.","upcoming"],
  ];
  return <AppShell page="complaints" go={go} language={language} setLanguage={setLanguage}><div className="content-wrap"><button className="back-link" onClick={() => go("complaints")}><Icon name="back" />Back to my complaints</button><div className="tracking-head"><div><div className="eyebrow">COMPLAINT JS-2025-1048</div><div className="page-title">Large pothole near primary school</div><div className="detail-row"><span><Icon name="file" />Roads & potholes</span><span><Icon name="pin" />Ward 4 · School Road</span><span><Icon name="clock" />Reported 18 Jun 2025</span></div></div><Status value="In Progress" tone="info" /></div><div className="tracking-layout"><div className="tracking-primary"><section className="white-card status-overview"><div><span>Current status</span><strong>Repair work has been scheduled</strong><p>Last updated 20 June 2025 at 11:10 AM</p></div><div className="progress-ring">4<small>of 5</small></div></section><section className="white-card"><div className="section-title">Progress timeline</div><p className="section-sub">Every recorded action appears here in chronological order.</p><div className="timeline">{events.map(([date,title,body,state]) => <div className={`timeline-event ${state}`} key={title}><div className="timeline-marker">{state === "done" ? <Icon name="check" /> : state === "current" ? <span /> : null}</div><div><small>{date}</small><strong>{title}</strong><p>{body}</p>{state === "current" && <span className="current-label">CURRENT STEP</span>}</div></div>)}</div></section><section className="white-card"><div className="section-title">Issue details</div><p>The road surface has a large, deep pothole near the primary school entrance. It becomes difficult to see after rain and may create a safety risk for students and riders.</p><div className="evidence-placeholder"><Icon name="road" size={38} /><span>Photo evidence · 1 image</span></div></section></div><aside className="tracking-side"><section className="white-card"><div className="mini-title">Responsible team</div><div className="department"><span><Icon name="building" /></span><div><strong>Roads Maintenance</strong><p>Local works department</p></div></div><div className="privacy-note"><Icon name="shield" /><span>Official details are shown only when recorded and permitted.</span></div></section><section className="white-card"><div className="mini-title">Need help?</div><p>If important details have changed, add an update for the reviewing team.</p><Button full variant="secondary">Add information</Button></section><section className="white-card transparency"><Icon name="shield" /><div><strong>Transparent by design</strong><p>JanSetu never marks a complaint resolved without an authorized recorded action.</p></div></section></aside></div></div></AppShell>;
}

function Notifications({ go, language, setLanguage, official = false }: {
  go: (p: Page) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  official?: boolean;
}) {
  const notes = [
    ["road","Work has started on your complaint","Roads Maintenance recorded a new progress update for JS-2025-1048.","12 minutes ago",true],
    ["check","Complaint accepted for action","Your complaint JS-2025-1048 was reviewed and accepted.","Yesterday",true],
    ["file","Complaint submitted successfully","Your reference number is JS-2025-1048.","18 Jun",false],
    ["check","Resolution recorded","Waste collection was completed for JS-2025-0976. View the resolution notes.","06 Jun",false],
  ];
  return <AppShell page="notifications" go={go} language={language} setLanguage={setLanguage} official={official}><div className="narrow-wrap"><PageTitle eyebrow="UPDATES" title="Notifications" body="Status changes and requests related to your complaints." action={<Button variant="ghost">Mark all as read</Button>} /><div className="notification-list">{notes.map(([icon,title,body,time,unread]) => <button className={unread ? "unread" : ""} key={String(title)} onClick={() => go("tracking")}><span className="note-icon"><Icon name={String(icon)} /></span><div><strong>{String(title)}</strong><p>{String(body)}</p><small>{String(time)}</small></div>{unread && <i />}</button>)}</div></div></AppShell>;
}

function Authority({
  go,
  language,
  setLanguage,
}: {
  go: (p: Page) => void;
  language: Language;
  setLanguage: (l: Language) => void;
}) {
  const [rows, setRows] = React.useState<Complaint[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All statuses");
  const [priorityFilter, setPriorityFilter] = React.useState("All priorities");

  React.useEffect(() => {
    getAuthorityComplaints()
      .then(setRows)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredRows = rows.filter((r) => {
    const text = `${r.reference_no} ${r.title} ${r.location}`.toLowerCase();

    return (
      text.includes(search.toLowerCase()) &&
      (statusFilter === "All statuses" || r.status === statusFilter) &&
      (priorityFilter === "All priorities" || r.severity === priorityFilter)
    );
  });

  const count = (status: string) =>
    rows.filter((r) => r.status === status).length;

  const highPriority = rows.filter(
    (r) => r.severity === "High" || r.severity === "Urgent"
  ).length;

  return (
    <AppShell
      page="authority"
      go={go}
      language={language}
      setLanguage={setLanguage}
      official
    >
      <div className="content-wrap">
        <PageTitle
          eyebrow="AUTHORIZED OFFICIAL VIEW"
          title="Complaint dashboard"
          body="Review and manage complaints submitted by residents."
          action={<div className="demo-pill">Live database</div>}
        />

        <section className="authority-stats">
          {[
            [String(rows.length), "Total complaints", "file"],
            [String(count("Submitted")), "New submissions", "plus"],
            [String(count("Under Review")), "Pending review", "clock"],
            [String(highPriority), "High priority", "alert"],
            [String(count("In Progress")), "In progress", "road"],
            [String(count("Resolved")), "Resolved", "check"],
          ].map(([value, label, icon]) => (
            <div key={label}>
              <span>
                <Icon name={icon} />
              </span>
              <strong>{value}</strong>
              <small>{label}</small>
            </div>
          ))}
        </section>

        <section className="priority-banner">
          <span>
            <Icon name="alert" />
          </span>
          <div>
            <strong>{highPriority} high-priority complaints</strong>
            <p>
              Review severity and safety concerns before deciding on the next
              action.
            </p>
          </div>
        </section>

        <section className="white-card table-card">
          <div className="section-head">
            <div>
              <div className="section-title">Complaint management</div>
              <p>Review, assign, and update recorded complaints</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setLoading(true);
                setError("");
                getAuthorityComplaints()
                  .then(setRows)
                  .catch((err) => setError(err.message))
                  .finally(() => setLoading(false));
              }}
            >
              Refresh
            </Button>
          </div>

          <div className="table-tools">
            <label className="search-box">
              <Icon name="search" />
              <input
                placeholder="Search ID, title, or location"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All statuses</option>
              <option>Submitted</option>
              <option>Under Review</option>
              <option>Accepted</option>
              <option>In Progress</option>
              <option>Resolved</option>
              <option>Rejected</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option>All priorities</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </div>

          {loading && <p>Loading complaints...</p>}

          {error && (
            <p role="alert">
              {error}
            </p>
          )}

          {!loading && !error && (
            <>
              <div className="data-table">
                <div className="table-row table-header">
                  <span>Complaint</span>
                  <span>Category</span>
                  <span>Location</span>
                  <span>Reported</span>
                  <span>Priority</span>
                  <span>Status</span>
                  <span />
                </div>

                {filteredRows.map((r) => (
                  <button
                    className="table-row"
                    key={r.id}
                    onClick={() => {
                      sessionStorage.setItem(
                        "selectedComplaintId",
                        String(r.id)
                      );
                      go("review");
                    }}
                  >
                    <span>
                      <b>{r.reference_no}</b>
                      <small>{r.title}</small>
                    </span>
                    <span>{r.category}</span>
                    <span>{r.location}</span>
                    <span>
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                    <span>
                      <i
                        className={`priority-dot ${r.severity.toLowerCase()}`}
                      />
                      {r.severity}
                    </span>
                    <span>
                      <Status
                        value={r.status}
                        tone={
                          r.status === "Submitted" ? "warning" : "info"
                        }
                      />
                    </span>
                    <span>
                      <Icon name="arrow" />
                    </span>
                  </button>
                ))}

                {filteredRows.length === 0 && (
                  <p>No matching complaints found.</p>
                )}
              </div>

              <div className="pagination">
                <span>
                  Showing {filteredRows.length} of {rows.length} complaints
                </span>
              </div>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}
function AuthorityReview({
  go,
  language,
  setLanguage,
}: {
  go: (p: Page) => void;
  language: Language;
  setLanguage: (l: Language) => void;
}) {
  const [complaint, setComplaint] = React.useState<Complaint | null>(null);
  const [status, setStatus] = React.useState("Under Review");
  const [note, setNote] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    const selectedId = sessionStorage.getItem("selectedComplaintId");

    if (!selectedId) {
      setError("No complaint selected. Return to the complaint queue.");
      setLoading(false);
      return;
    }

    getAuthorityComplaints()
      .then((items) => {
        const selected = items.find((item) => item.id === Number(selectedId));

        if (!selected) {
          throw new Error("Complaint not found.");
        }

        setComplaint(selected);
        setStatus(
          ["Submitted", "Under Review", "Accepted", "In Progress", "Resolved", "Rejected"].includes(selected.status)
            ? selected.status
            : "Under Review"
        );
        setNote(selected.progress_note || "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!complaint) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await saveComplaintUpdate(complaint.id, status, note);

      setComplaint({
        ...complaint,
        status,
        progress_note: note,
      });

      setMessage("Complaint update saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save update.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      page="review"
      go={go}
      language={language}
      setLanguage={setLanguage}
      official
    >
      <div className="content-wrap">
        <button className="back-link" onClick={() => go("authority")}>
          <Icon name="back" />
          Back to complaint queue
        </button>

        {loading && <p>Loading complaint...</p>}

        {error && <p role="alert">{error}</p>}

        {complaint && !loading && (
          <>
            <div className="tracking-head">
              <div>
                <div className="eyebrow">
                  {complaint.reference_no} ·{" "}
                  {new Date(complaint.created_at).toLocaleString()}
                </div>
                <div className="page-title">{complaint.title}</div>
              </div>
              <Status value={complaint.status} tone="info" />
            </div>

            <div className="review-layout">
              <div>
                <section className="white-card">
                  <div className="section-title">Complaint details</div>

                  <div className="admin-detail-grid">
                    <ReviewRow label="Category" value={complaint.category} />
                    <ReviewRow label="Resident severity" value={complaint.severity} />
                    <ReviewRow label="Location" value={complaint.location} />
                    <ReviewRow
                      label="Resident"
                      value={complaint.resident_name}
                    />
                    <ReviewRow
                      label="Email"
                      value={complaint.resident_email}
                    />
                  </div>

                  <div className="description-block">
                    <span>Description</span>
                    <p>{complaint.description}</p>
                  </div>
                </section>

                <section className="white-card">
                  <div className="section-title">Public response</div>

                  <label className="field">
                    <span>Update visible to resident</span>
                    <textarea
                      rows={4}
                      placeholder="Explain what has been reviewed or what will happen next..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </label>
                </section>
              </div>

              <aside>
                <section className="white-card decision-card">
                  <div className="mini-title">Review complaint</div>

                  <label className="field">
                    <span>Next status</span>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="Under Review">Under Review</option>
                      <option value="Accepted">Accepted</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </label>

                  <Button full onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save and notify resident"}
                  </Button>

                  {message && <p>{message}</p>}
                  {error && <p role="alert">{error}</p>}

                  <p>
                    The status and progress note will be sent to the backend.
                    Resident notification delivery needs a separate
                    notification implementation.
                  </p>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
function Settings({ go, language, setLanguage, currentUser, official = false }: {
  go: (p: Page) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  currentUser?: { id: number; name: string; email: string; role: string } | null;
  official?: boolean;
}) {
  const name = currentUser?.name || "Not signed in";
  const email = currentUser?.email || "—";
  const initials = name.split(/\s+/).filter(Boolean).map(part => part[0]).join("").slice(0,2).toUpperCase() || "?";
  return <AppShell page="settings" go={go} language={language} setLanguage={setLanguage} official={official}><div className="content-wrap"><PageTitle eyebrow="ACCOUNT" title="Profile, help & settings" body="Your profile details from the account you used to log in." /><div className="settings-layout"><aside className="settings-nav"><button className="active"><Icon name="user" />Profile</button><button><Icon name="bell" />Notifications</button><button><Icon name="lock" />Privacy & security</button><button><Icon name="help" />Help & FAQs</button></aside><div className="settings-content"><section className="white-card"><div className="profile-head"><span>{initials}</span><div><div className="section-title">{name}</div><p>{currentUser?.role || "Resident account"}</p></div></div><div className="form-grid"><Field label="Full name" value={name} /><Field label="Email" value={email} /><Field label="User ID" value={currentUser ? String(currentUser.id) : "—"} /><SelectField label="Preferred language" value={language} onChange={(v) => setLanguage(v as Language)}><option value="en">English</option><option value="te">తెలుగు</option><option value="hi">हिन्दी</option></SelectField></div><p className="section-sub">Profile details are loaded from your login response. Profile editing is not connected to the backend yet.</p></section><section className="white-card"><div className="section-title">Help and frequently asked questions</div>{["How do I track my complaint?","Who can see my contact information?","What does each complaint status mean?","How do I add more information?"].map((q) => <button className="faq" key={q}>{q}<Icon name="arrow" /></button>)}</section><section className="white-card privacy-section"><Icon name="shield" size={30} /><div><div className="mini-title">Your privacy</div><p>Your phone number and account information are not displayed publicly.</p></div></section><Button variant="danger" onClick={() => go("login")}>{copy[language].logout}</Button></div></div></div></AppShell>;
}
function RoleSelection({
  go,
  setSelectedRole,
}: {
  go: (page: Page) => void;
  setSelectedRole: (role: "resident" | "authority") => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "var(--background)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          padding: "36px",
          borderRadius: "18px",
          background: "white",
          boxShadow: "var(--shadow)",
          textAlign: "center",
        }}
      >
        <h1 style={{ color: "var(--navy)", marginBottom: "8px" }}>
          Welcome to JanSetu
        </h1>

        <p style={{ color: "var(--muted)", marginBottom: "28px" }}>
          Select your role to continue
        </p>

        <button
          className="btn btn-primary"
          style={{ width: "100%", marginBottom: "14px" }}
          onClick={() => {
            setSelectedRole("resident");
            go("login");
          }}
        >
          Resident Login
        </button>

        <button
          className="btn btn-secondary"
          style={{ width: "100%" }}
          onClick={() => {
            setSelectedRole("authority");
            go("login");
          }}
        >
          Authority Login
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("roleSelect");
  const [language, setLanguage] = useState<Language>("en");

  const [selectedRole, setSelectedRole] = useState<
    "resident" | "authority"
  >("resident");

  const [currentUser, setCurrentUser] = useState<{
    id: number;
    name: string;
    email: string;
    role: string;
  } | null>(null);
  
    const props = {
      go: setPage,
      language,
      setLanguage,
      currentUser,
      setCurrentUser,
    };

  const screen = useMemo(() => {
  switch (page) {
    case "roleSelect":
  return (
    <RoleSelection
      {...props}
      setSelectedRole={setSelectedRole}
    />
  );

    case "login":
      return (
        <Login
          {...props}
          selectedRole={selectedRole}
        />
      );

    case "register":
      return <Register {...props} selectedRole={selectedRole} />;
    case "dashboard":
      return currentUser?.role === "authority"
        ? <Authority {...props} />
        : <Dashboard {...props} />;
    case "report":
      return currentUser?.role === "authority"
        ? <Authority {...props} />
        : <ReportIssue {...props} />;
    case "success":
      return currentUser?.role === "authority"
        ? <Authority {...props} />
        : <Success {...props} />;
    case "complaints":
      return currentUser?.role === "authority"
        ? <Authority {...props} />
        : <MyComplaints {...props} />;
    case "tracking":
      return currentUser?.role === "authority"
        ? <Authority {...props} />
        : <Tracking {...props} />;
    case "notifications":
      return <Notifications {...props} official={currentUser?.role === "authority"} />;
    case "authority":
      return <Authority {...props} />;
    case "review":
      return <AuthorityReview {...props} />;
    case "settings":
      return <Settings {...props} official={currentUser?.role === "authority"} />;

    default:
      return <Login {...props} selectedRole={selectedRole} />;
  }
}, [page, language, currentUser, selectedRole]);

  return screen;
}