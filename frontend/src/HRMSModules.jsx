import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { apiClient } from "./services/apiClient";
import { getSession } from "./services/hrmsStorage";

const moduleItems = [
    { label: "Overview", path: "/dashboard", icon: "grid" },
    { label: "Employees", path: "/employees", icon: "users", roles: ["Admin", "HR Officer", "admin", "hr officer"] },
    { label: "Attendance", path: "/attendance", icon: "clock" },
    { label: "Time Off", path: "/leave", icon: "calendar" },
    { label: "My Profile", path: "/profile", icon: "user" },
    { label: "Salary Info", path: "/salary", icon: "receipt" },
];

function Icon({ name, size = 19 }) {
    const paths = {
        grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
        users: <><path d="M16 20v-1.8a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" /><circle cx="9" cy="7" r="3.5" /><path d="M22 20v-1.8a4 4 0 0 0-3-3.87M16 3.2a3.5 3.5 0 0 1 0 6.8" /></>,
        clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
        calendar: <><rect x="3" y="4.5" width="18" height="17" rx="2" /><path d="M16 2.5v4M8 2.5v4M3 10h18" /></>,
        user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
        receipt: <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z" /><path d="M8 8h8M8 12h8M8 16h4" /></>,
        search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
        chevron: <path d="m7 10 5 5 5-5" />,
        arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
        edit: <><path d="m4 16-.7 4.7L8 20l11-11-4-4L4 16Z" /><path d="m13.5 6.5 4 4" /></>,
        plus: <><path d="M12 5v14M5 12h14" /></>,
        check: <path d="m5 12 4 4L19 6" />,
        x: <><path d="m6 6 12 12M18 6 6 18" /></>,
    };
    return <svg className="dashboard-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function BrandMark() { return <div className="brand-mark" aria-hidden="true"><span /><span /><span /><span /></div>; }

function EmptyState({ title = "No data", detail = "There is nothing to show here yet." }) {
    return <div className="module-empty"><div className="module-empty-mark" aria-hidden="true"><Icon name="grid" size={21} /></div><strong>{title}</strong><p>{detail}</p></div>;
}

function Field({ label, name, type = "text", value, onChange, required = false, placeholder = "No data", disabled = false }) {
    return <label className="module-field"><span>{label}</span><input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} disabled={disabled} /></label>;
}

export function ModuleLayout({ title, eyebrow, subtitle, action, children }) {
    const [profileOpen, setProfileOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const session = getSession();
    const userName = session?.user?.first_name ? `${session.user.first_name} ${session.user.last_name || ""}` : session?.loginId || "No data";
    const userInitials = userName === "No data" ? "NA" : userName.slice(0, 2).toUpperCase();
    const role = session?.role || "Employee";
    const goTo = (path) => { setSidebarOpen(false); setProfileOpen(false); navigate(path); };
    const visibleItems = moduleItems.filter((item) => !item.roles || item.roles.map(r => r.toLowerCase()).includes(role.toLowerCase()));
    const pageTitleClean = title.replace(/ ✦$/, "");

    return (
        <div className="dashboard-shell">
            {sidebarOpen ? <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} /> : null}
            <aside className={`dashboard-sidebar ${sidebarOpen ? "is-open" : ""}`}>
                <div className="dashboard-brand"><BrandMark /><span>Odoo <strong>HRMS</strong></span></div>
                <div className="sidebar-label">Workspace</div>
                <nav aria-label="Main navigation">
                    {visibleItems.map((item) => (
                        <button
                            className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
                            key={item.path}
                            type="button"
                            onClick={() => goTo(item.path)}
                        >
                            <Icon name={item.icon} />
                            <span>{item.label}</span>
                            {location.pathname === item.path ? <span className="active-marker" /> : null}
                        </button>
                    ))}
                </nav>
                <div className="sidebar-bottom">
                    <div className="sidebar-label">Manage</div>
                    <button className={`nav-item ${location.pathname === "/settings" ? "active" : ""}`} type="button" onClick={() => goTo("/settings")}>
                        <Icon name="receipt" />
                        <span>Settings</span>
                        {location.pathname === "/settings" ? <span className="active-marker" /> : null}
                    </button>
                    <div className="sidebar-help">
                        <span className="help-icon">?</span>
                        <div><strong>Need help?</strong><small>Visit the help center</small></div>
                        <Icon name="arrow" size={16} />
                    </div>
                </div>
            </aside>
            <main className="dashboard-main">
                <header className="dashboard-header">
                    <button className="menu-toggle" type="button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}>
                        <Icon name="grid" />
                    </button>
                    <div className="breadcrumb">
                        <span>Workspace</span><b>/</b><strong>{pageTitleClean}</strong>
                    </div>
                    <div className="header-actions">
                        <button className="header-icon-button" type="button" aria-label="Search" aria-expanded={searchOpen} onClick={() => { setSearchOpen((open) => !open); setNotificationOpen(false); }}>
                            <Icon name="search" />
                        </button>
                        <button className="header-icon-button notification-button" type="button" aria-label="Notifications" aria-expanded={notificationOpen} onClick={() => { setNotificationOpen((open) => !open); setSearchOpen(false); }}>
                            <Icon name="bell" /><i />
                        </button>
                        <div className="profile-wrap">
                            <button className="profile-button" type="button" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}>
                                <span className="avatar avatar-small">{userInitials}</span>
                                <span className="profile-copy">
                                    <strong>{userName}</strong>
                                    <small>{role}</small>
                                </span>
                                <Icon name="chevron" size={16} />
                            </button>
                            {profileOpen ? (
                                <div className="profile-menu">
                                    <button type="button" onClick={() => goTo("/profile")}>
                                        <Icon name="user" size={17} /> My Profile
                                    </button>
                                    <button type="button" onClick={() => { window.localStorage.removeItem("hrms.session"); window.localStorage.removeItem("hrms.token"); goTo("/login"); }}>
                                        <span className="logout-dot" /> Logout
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </header>
                {searchOpen ? <div className="header-popover module-search-popover"><strong>Search</strong><span>Use the search toolbar filters on module pages.</span></div> : null}
                {notificationOpen ? <div className="header-popover module-notification-popover"><strong>Notifications</strong><span>All notifications up to date.</span></div> : null}

                <div className="module-content">
                    <div className="module-title-row">
                        <div>
                            {eyebrow ? <p className="section-kicker">{eyebrow}</p> : null}
                            <h1>{title}</h1>
                            {subtitle ? <p className="welcome-copy">{subtitle}</p> : null}
                        </div>
                        {action ? <div className="header-action-wrap">{action}</div> : null}
                    </div>
                    {children}
                </div>
            </main>
        </div>
    );
}

export function EmployeesPage() {
    const navigate = useNavigate();
    const session = getSession();
    const isManager = ["admin", "hr officer", "hr"].includes((session?.role || "").toLowerCase());
    
    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState("");
    const [department, setDepartment] = useState("All departments");
    const [loading, setLoading] = useState(true);
    
    // Add Employee Modal
    const [showModal, setShowModal] = useState(false);
    const [createdResult, setCreatedResult] = useState(null);
    const [modalError, setModalError] = useState("");
    const [newEmp, setNewEmp] = useState({
        first_name: "",
        last_name: "",
        email: "",
        work_phone: "",
        work_email: "",
        role: "employee",
        department: "Engineering",
        job_title: "Software Engineer",
        joining_year: 2026,
        wage: 60000,
    });

    useEffect(() => {
        let active = true;
        apiClient.getEmployees(department, search)
            .then((list) => {
                if (active) {
                    setEmployees(list || []);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (active) {
                    setEmployees([
                        { id: 1, first_name: "Admin", last_name: "Officer", login_id: "OIADMI20260001", email: "admin@dayflow.com", role: "admin", department: "Human Resources", job_title: "HR Officer", work_status: "green" },
                        { id: 2, first_name: "John", last_name: "Doe", login_id: "OIJODO20260002", email: "john.doe@dayflow.com", role: "employee", department: "Engineering", job_title: "Senior Frontend Developer", work_status: "green" },
                        { id: 3, first_name: "Sarah", last_name: "Smith", login_id: "OISMSM20260003", email: "sarah.smith@dayflow.com", role: "employee", department: "Design", job_title: "Lead UI/UX Designer", work_status: "airplane" },
                    ]);
                    setLoading(false);
                }
            });
        return () => { active = false; };
    }, [department, search]);

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setModalError("");
        try {
            const res = await apiClient.createEmployee(newEmp);
            if (res) {
                setCreatedResult(res);
                const updatedList = await apiClient.getEmployees(department, search);
                setEmployees(updatedList || []);
            }
        } catch (err) {
            setModalError(err.message || "Failed to create employee");
        }
    };

    return (
        <ModuleLayout
            title="Employees"
            eyebrow="People directory"
            subtitle="Manage employee records, roles, and departmental teams."
            action={
                isManager ? (
                    <button className="primary-button" type="button" onClick={() => { setCreatedResult(null); setModalError(""); setShowModal(true); }}>
                        <Icon name="plus" size={16} /> Add employee
                    </button>
                ) : null
            }
        >
            <div className="module-toolbar">
                <label className="module-search">
                    <Icon name="search" />
                    <input
                        placeholder="Search by name, login ID, email, or role"
                        aria-label="Search employees"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </label>
                <select
                    aria-label="Filter employees"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                >
                    <option value="All departments">All departments</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Design">Design</option>
                    <option value="People">People</option>
                    <option value="Sales">Sales</option>
                </select>
            </div>

            <div className="module-surface">
                {loading ? (
                    <div className="module-empty"><strong>Loading workforce data...</strong></div>
                ) : employees.length ? (
                    <div className="detail-grid" style={{ paddingTop: 0 }}>
                        {employees.map((emp) => {
                            const statusColor = emp.work_status === "airplane" ? "blue" : emp.work_status === "green" ? "green" : "slate";
                            const statusLabel = emp.work_status === "airplane" ? "On Leave" : emp.work_status === "green" ? "Checked In" : "Not Checked In";
                            return (
                                <article key={emp.id || emp.login_id} className="summary-card" style={{ flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
                                    <div style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between" }}>
                                        <div className="avatar avatar-small">{(emp.first_name || "E").slice(0, 1)}{(emp.last_name || "M").slice(0, 1)}</div>
                                        <span className={`activity-status ${statusColor}`}>{statusLabel}</span>
                                    </div>
                                    <div style={{ width: "100%" }}>
                                        <strong style={{ fontSize: "0.95rem" }}>{emp.first_name} {emp.last_name}</strong>
                                        <p style={{ marginTop: 2 }}>{emp.job_title || "Employee"} · <small style={{ color: "#2f7b84", fontWeight: 700 }}>{emp.login_id}</small></p>
                                        <span style={{ display: "block", marginTop: 4 }}>{emp.department || "General"}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className="text-button"
                                        style={{ marginTop: "auto", fontSize: "0.72rem" }}
                                        onClick={() => navigate("/employee-profile", { state: { employee: emp } })}
                                    >
                                        View details <Icon name="arrow" size={14} />
                                    </button>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <EmptyState title="No employees found" detail="Try clearing filters or search terms." />
                )}
            </div>

            {/* Add Employee Modal */}
            {showModal ? (
                <div className="modal-backdrop" role="presentation">
                    <section className="confirm-modal" style={{ width: "min(520px, 100%)" }} role="dialog" aria-modal="true">
                        <div className="section-heading" style={{ marginBottom: 16 }}>
                            <div>
                                <p className="section-kicker">Admin Operation</p>
                                <h2>Create New Employee</h2>
                            </div>
                            <button type="button" className="text-button" onClick={() => setShowModal(false)}><Icon name="x" size={18} /></button>
                        </div>

                        {createdResult ? (
                            <div style={{ display: "grid", gap: 14 }}>
                                <div className="feedback success">
                                    <Icon name="check" size={16} /> Employee created successfully!
                                </div>
                                <div className="module-surface" style={{ background: "#f5faf8" }}>
                                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#365255" }}>
                                        <strong>Login ID:</strong> <span style={{ color: "#2f7b84", fontWeight: 800 }}>{createdResult.login_id}</span>
                                    </p>
                                    <p style={{ margin: "8px 0 0", fontSize: "0.8rem", color: "#365255" }}>
                                        <strong>Temporary Password:</strong> <span style={{ color: "#bb4430", fontWeight: 800 }}>{createdResult.temp_password}</span>
                                    </p>
                                </div>
                                <button className="primary-button" type="button" onClick={() => setShowModal(false)}>Close & Refresh</button>
                            </div>
                        ) : (
                            <form className="profile-form" onSubmit={handleCreateSubmit}>
                                {modalError ? <div className="feedback error" role="alert">{modalError}</div> : null}
                                <div className="profile-fields">
                                    <Field label="First Name" name="first_name" value={newEmp.first_name} onChange={(e) => setNewEmp({ ...newEmp, first_name: e.target.value })} required />
                                    <Field label="Last Name" name="last_name" value={newEmp.last_name} onChange={(e) => setNewEmp({ ...newEmp, last_name: e.target.value })} required />
                                    <Field label="Email" name="email" type="email" value={newEmp.email} onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })} required />
                                    <Field label="Work Phone" name="work_phone" value={newEmp.work_phone} onChange={(e) => setNewEmp({ ...newEmp, work_phone: e.target.value })} />
                                    <label className="module-field">
                                        <span>Role</span>
                                        <select value={newEmp.role} onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}>
                                            <option value="employee">Employee</option>
                                            <option value="hr officer">HR Officer</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </label>
                                    <label className="module-field">
                                        <span>Department</span>
                                        <select value={newEmp.department} onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}>
                                            <option value="Engineering">Engineering</option>
                                            <option value="Human Resources">Human Resources</option>
                                            <option value="Design">Design</option>
                                            <option value="People">People</option>
                                            <option value="Sales">Sales</option>
                                        </select>
                                    </label>
                                    <Field label="Job Title" name="job_title" value={newEmp.job_title} onChange={(e) => setNewEmp({ ...newEmp, job_title: e.target.value })} required />
                                    <Field label="Monthly Wage ($)" name="wage" type="number" value={newEmp.wage} onChange={(e) => setNewEmp({ ...newEmp, wage: Number(e.target.value) })} required />
                                </div>
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                                    <button type="button" className="modal-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="primary-button">Create Employee</button>
                                </div>
                            </form>
                        )}
                    </section>
                </div>
            ) : null}
        </ModuleLayout>
    );
}

export function ModulePlaceholderPage({ title }) {
    return (
        <ModuleLayout
            title={title}
            eyebrow="HRMS workspace"
            subtitle="This module is set up and ready to connect with backend services."
        >
            <div className="module-surface">
                <EmptyState title="Under Progress" detail="This module will be available when connected to the HRMS service." />
            </div>
        </ModuleLayout>
    );
}

export function EmployeeProfilePage() {
    const location = useLocation();
    const emp = location.state?.employee || null;

    return (
        <ModuleLayout
            title="Employee View"
            eyebrow="People directory"
            subtitle="View detailed profile and operational records for employees."
        >
            <div className="module-surface">
                <div className="profile-hero">
                    <span className="avatar avatar-large">{(emp?.first_name || "N").slice(0, 1)}{(emp?.last_name || "A").slice(0, 1)}</span>
                    <div>
                        <h2>{emp ? `${emp.first_name} ${emp.last_name}` : "No data"}</h2>
                        <p>{emp?.job_title || "No data"} · {emp?.department || "No data"}</p>
                    </div>
                    <span className="view-only-badge">View only</span>
                </div>
                <div className="detail-grid">
                    <div className="detail-item"><span>Login ID</span><strong>{emp?.login_id || "No data"}</strong></div>
                    <div className="detail-item"><span>Work Email</span><strong>{emp?.work_email || emp?.email || "No data"}</strong></div>
                    <div className="detail-item"><span>Work Phone</span><strong>{emp?.work_phone || "No data"}</strong></div>
                    <div className="detail-item"><span>Department</span><strong>{emp?.department || "No data"}</strong></div>
                    <div className="detail-item"><span>Job Title</span><strong>{emp?.job_title || "No data"}</strong></div>
                    <div className="detail-item"><span>Role</span><strong>{emp?.role ? (emp.role.charAt(0).toUpperCase() + emp.role.slice(1)) : "No data"}</strong></div>
                    <div className="detail-item"><span>Joining Year</span><strong>{emp?.joining_year || "2026"}</strong></div>
                    <div className="detail-item"><span>Monthly Wage</span><strong>{emp?.wage ? `$${emp.wage.toLocaleString()}` : "No data"}</strong></div>
                </div>
            </div>
        </ModuleLayout>
    );
}

export function ProfilePage() {
    const [editing, setEditing] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");
    const [user, setUser] = useState(null);
    const [form, setForm] = useState({ fullName: "", email: "", phone: "", address: "", emergency: "" });

    useEffect(() => {
        let active = true;
        apiClient.getMe()
            .then((data) => {
                if (active && data) {
                    setUser(data);
                    setForm({
                        fullName: `${data.first_name} ${data.last_name || ""}`,
                        email: data.email || "",
                        phone: data.personal_phone || data.work_phone || "",
                        address: data.personal_address || "",
                        emergency: "",
                    });
                }
            })
            .catch(() => {
                if (active) {
                    const session = getSession();
                    setForm((prev) => ({ ...prev, email: session?.loginId || "" }));
                }
            });
        return () => { active = false; };
    }, []);

    const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

    const save = async (event) => {
        event.preventDefault();
        setError("");
        if (user && user.id) {
            try {
                await apiClient.updateEmployee(user.id, {
                    personal_phone: form.phone,
                    personal_address: form.address,
                });
                setEditing(false);
                setSaved(true);
                window.setTimeout(() => setSaved(false), 2500);
                const data = await apiClient.getMe();
                if (data) {
                    setUser(data);
                }
                return;
            } catch (err) {
                setError(err.message || "Failed to update profile");
            }
        }
        localStorage.setItem("hrms.profile", JSON.stringify(form));
        setEditing(false);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2500);
    };

    return (
        <ModuleLayout
            title="My Profile"
            eyebrow="Personal workspace"
            subtitle="View and update your personal information and contact details."
            action={
                <button className="outline-button" type="button" onClick={() => setEditing((value) => !value)}>
                    <Icon name="edit" size={16} /> {editing ? "Cancel" : "Edit profile"}
                </button>
            }
        >
            {saved ? <div className="feedback success" role="status"><Icon name="check" size={16} /> Profile saved successfully.</div> : null}
            {error ? <div className="feedback error" role="alert">{error}</div> : null}
            <form className="profile-form" onSubmit={save}>
                <section className="module-surface profile-section">
                    <div className="section-heading">
                        <div>
                            <p className="section-kicker">Personal details</p>
                            <h2>Profile information</h2>
                        </div>
                        {user?.login_id ? <span className="under-progress-badge" style={{ color: "#2f7b84" }}>{user.login_id}</span> : null}
                    </div>
                    <div className="profile-fields">
                        <Field label="Full name" name="fullName" value={form.fullName} onChange={update} required={editing} disabled={!editing} />
                        <Field label="Email" name="email" type="email" value={form.email} onChange={update} required={editing} disabled={!editing} />
                        <Field label="Personal Phone" name="phone" value={form.phone} onChange={update} disabled={!editing} />
                        <Field label="Personal Address" name="address" value={form.address} onChange={update} disabled={!editing} />
                    </div>
                </section>
                <section className="module-surface profile-section">
                    <div className="section-heading">
                        <div>
                            <p className="section-kicker">Emergency contact</p>
                            <h2>Contact information</h2>
                        </div>
                    </div>
                    <div className="profile-fields">
                        <Field label="Contact name and phone" name="emergency" value={form.emergency} onChange={update} disabled={!editing} />
                    </div>
                </section>
                {editing ? <button className="primary-button form-submit" type="submit">Save changes</button> : null}
            </form>
        </ModuleLayout>
    );
}

export function SalaryPage() {
    const session = getSession();
    const userWage = session?.user?.wage || 60000;
    const [form, setForm] = useState({ wage: userWage, allowance: 5000, fixedAllowance: 2000, pf: 1800, tax: 2500 });
    const [calculated, setCalculated] = useState(null);

    const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    const number = (key) => Number(form[key]) || 0;

    useEffect(() => {
        let active = true;
        apiClient.calculatePayroll(form.wage)
            .then((data) => {
                if (active && data) {
                    setCalculated(data);
                }
            })
            .catch(() => {
                // Ignore fallback
            });
        return () => { active = false; };
    }, [form.wage]);

    const basic = calculated ? calculated.basic : (number("wage") * 0.5);
    const hra = calculated ? calculated.hra : (basic * 0.4);
    const gross = calculated ? calculated.gross_salary : (basic + hra + number("allowance") + number("fixedAllowance"));
    const pf = calculated ? calculated.pf_deduction : number("pf");
    const tax = calculated ? calculated.tax_deduction : number("tax");
    const net = calculated ? calculated.net_salary : (gross - pf - tax);

    return (
        <ModuleLayout
            title="Salary Info"
            eyebrow="Compensation"
            subtitle="Calculate monthly wage breakdowns, allowances, and tax deductions."
            action={<span className="under-progress-badge">API Connected</span>}
        >
            <div className="salary-layout">
                <section className="module-surface salary-calculator">
                    <div className="section-heading">
                        <div>
                            <p className="section-kicker">Calculation preview</p>
                            <h2>Salary structure</h2>
                        </div>
                    </div>
                    <div className="profile-fields">
                        <Field label="Monthly wage ($)" name="wage" type="number" value={form.wage} onChange={update} placeholder="Monthly wage" />
                        <Field label="Allowances ($)" name="allowance" type="number" value={form.allowance} onChange={update} placeholder="Allowances" />
                        <Field label="Fixed allowance ($)" name="fixedAllowance" type="number" value={form.fixedAllowance} onChange={update} placeholder="Fixed allowance" />
                        <Field label="PF deduction ($)" name="pf" type="number" value={form.pf} onChange={update} placeholder="PF deduction" />
                        <Field label="Tax deduction ($)" name="tax" type="number" value={form.tax} onChange={update} placeholder="Tax deduction" />
                    </div>
                </section>
                <section className="module-surface salary-summary">
                    <p className="section-kicker">Calculated fields</p>
                    <h2>Monthly breakdown</h2>
                    {[
                        ["Basic (50%)", basic],
                        ["HRA (40% Basic)", hra],
                        ["Gross Salary", gross],
                        ["PF Deduction", pf],
                        ["Tax Deduction", tax],
                        ["Net Salary", net]
                    ].map(([label, value]) => (
                        <div className="salary-line" key={label}>
                            <span>{label}</span>
                            <strong>${(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </div>
                    ))}
                </section>
            </div>
        </ModuleLayout>
    );
}

export function AttendancePage() {
    const [view, setView] = useState("my");
    const [monthOffset, setMonthOffset] = useState(0);
    const [myLogs, setMyLogs] = useState([]);
    const [allLogs, setAllLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const role = getSession()?.role || "Employee";
    const isManager = ["admin", "hr officer", "hr"].includes(role.toLowerCase());
    
    const monthDate = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1);
    const monthLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(monthDate);

    useEffect(() => {
        let active = true;

        const fetchLogs = async () => {
            try {
                if (view === "my") {
                    const logs = await apiClient.getMyAttendance();
                    if (active) setMyLogs(logs || []);
                } else if (isManager) {
                    const logs = await apiClient.getAllAttendance();
                    if (active) setAllLogs(logs || []);
                }
            } catch {
                // Fallback
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchLogs();
        return () => { active = false; };
    }, [view, isManager]);

    const activeList = view === "my" ? myLogs : allLogs;

    return (
        <ModuleLayout
            title="Attendance"
            eyebrow="Time tracking"
            subtitle="Monitor working hours, shift tracking, and monthly attendance history."
        >
            <div className="module-tabs" role="tablist">
                <button className={view === "my" ? "active" : ""} type="button" onClick={() => setView("my")} role="tab" aria-selected={view === "my"}>
                    My monthly view
                </button>
                {isManager ? (
                    <button className={view === "team" ? "active" : ""} type="button" onClick={() => setView("team")} role="tab" aria-selected={view === "team"}>
                        Employee view
                    </button>
                ) : null}
            </div>
            <div className="module-surface attendance-view">
                <div className="month-picker" style={{ marginBottom: 16 }}>
                    <button type="button" aria-label="Previous month" onClick={() => setMonthOffset((value) => value - 1)}>‹</button>
                    <strong>{monthLabel}</strong>
                    <button type="button" aria-label="Next month" onClick={() => setMonthOffset((value) => value + 1)}>›</button>
                </div>

                {loading ? (
                    <div className="module-empty"><strong>Loading attendance records...</strong></div>
                ) : activeList.length ? (
                    <div style={{ display: "grid", gap: 10 }}>
                        {activeList.map((record) => (
                            <div key={record.id || record.date} className="request-row">
                                <div>
                                    <strong>{record.date}</strong>
                                    <small>Check-in: {record.check_in ? new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"} · Check-out: {record.check_out ? new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}</small>
                                </div>
                                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#365255" }}>{record.total_hours ? `${record.total_hours} hrs` : "In Progress"}</span>
                                <span className={`request-status ${(record.status || "present").toLowerCase() === "present" ? "approved" : "pending"}`}>
                                    {record.status || "Present"}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState detail="Your attendance logs will appear here when you check in." />
                )}
            </div>
        </ModuleLayout>
    );
}

export function TimeOffPage() {
    const role = getSession()?.role || "Employee";
    const isManager = ["admin", "hr officer", "hr"].includes(role.toLowerCase());

    const [form, setForm] = useState({ type: "annual", from: "", to: "", reason: "" });
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [myRequests, setMyRequests] = useState([]);
    const [allRequests, setAllRequests] = useState([]);
    const [activeTab, setActiveTab] = useState("my");

    const refreshLeaves = async () => {
        try {
            const myData = await apiClient.getMyTimeOff();
            setMyRequests(myData || []);
            if (isManager) {
                const allData = await apiClient.getAllTimeOff();
                setAllRequests(allData || []);
            }
        } catch {
            // Fallback
        }
    };

    useEffect(() => {
        let active = true;

        const fetchLeaves = async () => {
            try {
                const myData = await apiClient.getMyTimeOff();
                if (active) setMyRequests(myData || []);
                if (isManager) {
                    const allData = await apiClient.getAllTimeOff();
                    if (active) setAllRequests(allData || []);
                }
            } catch {
                // Fallback
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchLeaves();
        return () => { active = false; };
    }, [isManager]);

    const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

    const submit = async (event) => {
        event.preventDefault();
        setMessage("");
        if (new Date(form.to) < new Date(form.from)) {
            setMessage("End date must be on or after the start date.");
            return;
        }

        try {
            await apiClient.createTimeOff(form);
            setMessage("Time off request submitted successfully.");
            setForm({ type: "annual", from: "", to: "", reason: "" });
            refreshLeaves();
        } catch (err) {
            setMessage(err.message || "Failed to submit request.");
        }
    };

    const reviewRequest = async (id, status) => {
        try {
            await apiClient.updateTimeOffStatus(id, status);
            refreshLeaves();
        } catch (err) {
            alert(err.message || "Failed to update request status");
        }
    };

    return (
        <ModuleLayout
            title="Time Off"
            eyebrow="Leave management"
            subtitle="Submit and review leave requests and time-off balances."
            action={
                !isManager ? (
                    <button className="primary-button" type="button" onClick={() => document.getElementById("time-off-form")?.scrollIntoView({ behavior: "smooth" })}>
                        <Icon name="plus" size={16} /> New request
                    </button>
                ) : null
            }
        >
            <div className="module-tabs">
                <button className={activeTab === "my" ? "active" : ""} type="button" onClick={() => setActiveTab("my")}>My requests</button>
                {isManager ? (
                    <button className={activeTab === "all" ? "active" : ""} type="button" onClick={() => setActiveTab("all")}>Requests to review</button>
                ) : null}
            </div>

            {activeTab === "my" ? (
                <>
                    <form id="time-off-form" className="module-surface request-form" onSubmit={submit}>
                        <div className="section-heading">
                            <div>
                                <p className="section-kicker">Employee request</p>
                                <h2>Request time off</h2>
                            </div>
                        </div>
                        {message ? <div className={`feedback ${message.includes("successfully") ? "success" : "error"}`} role="alert">{message}</div> : null}
                        <div className="profile-fields">
                            <label className="module-field">
                                <span>Time off type</span>
                                <select name="type" value={form.type} onChange={update} required>
                                    <option value="annual">Annual leave</option>
                                    <option value="sick">Sick leave</option>
                                    <option value="other">Other</option>
                                </select>
                            </label>
                            <Field label="Start date" name="from" type="date" value={form.from} onChange={update} required />
                            <Field label="End date" name="to" type="date" value={form.to} onChange={update} required />
                            <Field label="Reason" name="reason" value={form.reason} onChange={update} required />
                        </div>
                        <button className="primary-button form-submit" type="submit">Submit request</button>
                    </form>

                    <div className="module-surface">
                        <h2>Request history</h2>
                        {loading ? (
                            <p className="empty-state">Loading leave history...</p>
                        ) : myRequests.length ? (
                            <div style={{ display: "grid", gap: 10 }}>
                                {myRequests.map((req) => (
                                    <div className="request-row" key={req.id}>
                                        <div>
                                            <strong>{req.leave_type}</strong>
                                            <small>{req.start_date} to {req.end_date} · {req.reason}</small>
                                        </div>
                                        <span className={`request-status ${(req.status || "pending").toLowerCase()}`}>{req.status}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState detail="Submitted requests will appear here." />
                        )}
                    </div>
                </>
            ) : (
                <div className="module-surface">
                    <div className="section-heading" style={{ marginBottom: 16 }}>
                        <div>
                            <p className="section-kicker">Management</p>
                            <h2>Employee Leave Approvals</h2>
                        </div>
                    </div>
                    {loading ? (
                        <p className="empty-state">Loading pending leave requests...</p>
                    ) : allRequests.length ? (
                        <div style={{ display: "grid", gap: 10 }}>
                            {allRequests.map((req) => (
                                <div className="request-row" key={req.id}>
                                    <div>
                                        <strong>{req.employee_name || "Employee"} (<small style={{ color: "#2f7b84" }}>{req.employee_login_id}</small>) · {req.leave_type}</strong>
                                        <small>{req.start_date} to {req.end_date} · Reason: {req.reason}</small>
                                    </div>
                                    <span className={`request-status ${(req.status || "pending").toLowerCase()}`}>{req.status}</span>
                                    {req.status === "Pending" ? (
                                        <div className="request-actions">
                                            <button type="button" aria-label="Approve request" onClick={() => reviewRequest(req.id, "Approved")}>
                                                <Icon name="check" size={16} />
                                            </button>
                                            <button type="button" aria-label="Reject request" onClick={() => reviewRequest(req.id, "Rejected")}>
                                                <Icon name="x" size={16} />
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState detail="Time off requests will appear here for review." />
                    )}
                </div>
            )}
        </ModuleLayout>
    );
}
