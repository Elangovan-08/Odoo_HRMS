import { useEffect, useMemo, useState } from "react";
import { Link, Outlet } from "react-router";
import "./App.css";

function EyeIcon({ visible }) {
    if (visible) {
        return (
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M2 12s3.8-6 10-6 10 6 10 6-3.8 6-10 6-10-6-10-6Z" />
                <circle cx="12" cy="12" r="3" />
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M2 12s3.8-6 10-6c2.4 0 4.4.8 6 2" />
            <path d="M22 12s-3.8 6-10 6c-2.4 0-4.4-.8-6-2" />
            <path d="M4 4l16 16" />
        </svg>
    );
}

function App() {
    return (
        <div className="auth-shell">
            <div className="auth-glow auth-glow-left" />
            <div className="auth-glow auth-glow-right" />
            <Outlet />
        </div>
    );
}

function AuthLayout({ title, subtitle, mode, children }) {
    return (
        <section className="auth-stage">
            <aside className="showcase-panel" aria-hidden="true">
                <p className="showcase-tag">People Operations</p>
                <h2>{mode === "signin" ? "Welcome back" : "Build your HR command center"}</h2>
                <p>
                    {mode === "signin"
                        ? "Track workforce updates, onboarding and approvals from one clean dashboard."
                        : "Create a secure workspace for teams, policies, attendance and payroll workflows."}
                </p>
            </aside>

            <div className="auth-card" aria-labelledby={`${mode}-title`}>
                <p className="eyebrow">Odoo HRMS</p>
                <h1 id={`${mode}-title`}>{title}</h1>
                <p className="support-text">{subtitle}</p>
                {children}
            </div>
        </section>
    );
}

function SignInPage() {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <AuthLayout
            title="Sign in to your workspace"
            subtitle="Use your login ID or email to continue."
            mode="signin"
        >

            <form className="auth-form">
                <label htmlFor="signin-login">Login ID / Email</label>
                <input
                    id="signin-login"
                    name="signin-login"
                    type="text"
                    autoComplete="username"
                    placeholder="you@company.com"
                    required
                />

                <label htmlFor="signin-password">Password</label>
                <div className="password-input-wrap">
                    <input
                        id="signin-password"
                        name="signin-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        required
                    />
                    <button
                        type="button"
                        className="password-toggle"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((value) => !value)}
                    >
                        <EyeIcon visible={showPassword} />
                    </button>
                </div>

                <button type="submit">Sign in</button>
            </form>

            <p className="auth-switch">
                Don&apos;t have an account? <Link to="/sign-up">Sign up</Link>
            </p>
        </AuthLayout>
    );
}

function SignUpPage() {
    const [logoFile, setLogoFile] = useState(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [formError, setFormError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const logoPreview = useMemo(() => {
        if (!logoFile) {
            return "";
        }
        return URL.createObjectURL(logoFile);
    }, [logoFile]);

    useEffect(() => {
        return () => {
            if (logoPreview) {
                URL.revokeObjectURL(logoPreview);
            }
        };
    }, [logoPreview]);

    const handleSubmit = (event) => {
        event.preventDefault();
        if (password !== confirmPassword) {
            setFormError("Passwords do not match.");
            return;
        }
        setFormError("");
    };

    return (
        <AuthLayout
            title="Create your company account"
            subtitle="Set up your management workspace in minutes."
            mode="signup"
        >

            <form className="auth-form" onSubmit={handleSubmit}>
                <label htmlFor="company-name">Company Name</label>
                <input
                    id="company-name"
                    name="company-name"
                    type="text"
                    placeholder="Acme People Ops"
                    required
                />

                <label htmlFor="company-logo">Company Logo</label>
                <input
                    id="company-logo"
                    name="company-logo"
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        setLogoFile(file);
                    }}
                />

                <div className="logo-preview" aria-live="polite">
                    {logoPreview ? (
                        <img src={logoPreview} alt="Company logo preview" />
                    ) : (
                        <span>No logo selected yet</span>
                    )}
                </div>

                <label htmlFor="full-name">Name</label>
                <input
                    id="full-name"
                    name="full-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your full name"
                    required
                />

                <label htmlFor="email">Email</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    required
                />

                <label htmlFor="phone">Phone</label>
                <div className="phone-input-wrap">
                    <select id="country-code" name="country-code" aria-label="Country code" defaultValue="+91">
                        <option value="+1">+1 US</option>
                        <option value="+44">+44 UK</option>
                        <option value="+61">+61 AU</option>
                        <option value="+65">+65 SG</option>
                        <option value="+91">+91 IN</option>
                    </select>
                    <input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel-national"
                        placeholder="98765 43210"
                        required
                    />
                </div>

                <label htmlFor="password">Password</label>
                <div className="password-input-wrap">
                    <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Create a strong password"
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                    <button
                        type="button"
                        className="password-toggle"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((value) => !value)}
                    >
                        <EyeIcon visible={showPassword} />
                    </button>
                </div>

                <label htmlFor="confirm-password">Confirm Password</label>
                <div className="password-input-wrap">
                    <input
                        id="confirm-password"
                        name="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Re-enter password"
                        required
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                    <button
                        type="button"
                        className="password-toggle"
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        onClick={() => setShowConfirmPassword((value) => !value)}
                    >
                        <EyeIcon visible={showConfirmPassword} />
                    </button>
                </div>

                {formError ? <p className="form-error">{formError}</p> : null}

                <button type="submit">Sign up</button>
            </form>

            <p className="auth-switch">
                Already have an account? <Link to="/sign-in">Sign in</Link>
            </p>
        </AuthLayout>
    );
}

export { SignInPage, SignUpPage };
export default App;
