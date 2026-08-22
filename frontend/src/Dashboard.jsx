import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { activity, employee, quickActions, summaryCards } from "./dashboardData";
import { apiClient } from "./services/apiClient";
import { checkIn, checkOut, formatDuration, formatTime, getElapsedSeconds, getSession, getTodayAttendance } from "./services/hrmsStorage";
import { ModuleLayout } from "./HRMSModules.jsx";

function Icon({ name, size = 20 }) {
    const paths = {
        grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
        calendar: <><rect x="3" y="4.5" width="18" height="17" rx="2" /><path d="M16 2.5v4M8 2.5v4M3 10h18" /></>,
        users: <><path d="M16 20v-1.8a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" /><circle cx="9" cy="7" r="3.5" /><path d="M22 20v-1.8a4 4 0 0 0-3-3.87M16 3.2a3.5 3.5 0 0 1 0 6.8" /></>,
        clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
        file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></>,
        settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.41 1.41-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.55V20h-2v-.5a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06-1.41-1.41.06-.06A1.7 1.7 0 0 0 9.6 15a1.7 1.7 0 0 0-1.55-1H7.5v-2H8a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.41-1.41.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1-1.55V6h2v.5a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.41 1.41-.06.06A1.7 1.7 0 0 0 19.4 11c.18.6.73 1 1.36 1h.24v2h-.24a1.7 1.7 0 0 0-1.36 1Z" /></>,
        bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
        search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
        arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
        check: <><path d="m5 12 4 4L19 6" /></>,
        inbox: <><path d="M4 4h16l1 11H3L4 4Z" /><path d="M3 15h5l1 2h6l1-2h5M8 8h8" /></>,
        plane: <><path d="m3 11 18-8-8 18-2-7-8-3Z" /><path d="m11 14 4-5" /></>,
        receipt: <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z" /><path d="M8 8h8M8 12h8M8 16h4" /></>,
        user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
        chevron: <path d="m7 10 5 5 5-5" />,
    };
    return <svg className="dashboard-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Dashboard() {
    const [attendanceRecord, setAttendanceRecord] = useState(() => getTodayAttendance());
    const [elapsedSeconds, setElapsedSeconds] = useState(() => getElapsedSeconds(getTodayAttendance()));
    const [checkoutPending, setCheckoutPending] = useState(false);
    const [monthOpen, setMonthOpen] = useState(false);
    const [analytics, setAnalytics] = useState(null);
    const navigate = useNavigate();



    useEffect(() => {
        let active = true;

        apiClient.getAttendanceStatus().then((statusData) => {
            if (active && statusData && statusData.current_attendance) {
                const att = statusData.current_attendance;
                const rec = {
                    date: att.date,
                    status: att.status,
                    checkInAt: att.check_in,
                    checkOutAt: att.check_out,
                };
                setAttendanceRecord(rec);
                setElapsedSeconds(getElapsedSeconds(rec));
            }
        }).catch(() => {});

        apiClient.getAnalyticsSummary().then((data) => {
            if (active && data) {
                setAnalytics(data);
            }
        }).catch(() => {});

        const timer = window.setInterval(() => {
            setElapsedSeconds((prev) => {
                const currentRecord = getTodayAttendance();
                if (currentRecord?.checkInAt && !currentRecord.checkOutAt) {
                    return getElapsedSeconds(currentRecord);
                }
                return prev;
            });
        }, 1000);
        return () => {
            active = false;
            window.clearInterval(timer);
        };
    }, []);

    const goTo = (path) => {
        navigate(path);
    };

    const handleCheckIn = async () => {
        try {
            const res = await apiClient.checkIn();
            if (res) {
                const rec = {
                    date: res.date,
                    status: res.status,
                    checkInAt: res.check_in,
                    checkOutAt: res.check_out,
                };
                setAttendanceRecord(rec);
                setElapsedSeconds(getElapsedSeconds(rec));
                apiClient.getAnalyticsSummary().then(data => { if (data) setAnalytics(data); }).catch(() => {});
                return;
            }
        } catch {
            // Fallback
        }
        const record = checkIn();
        setAttendanceRecord(record);
        setElapsedSeconds(getElapsedSeconds(record));
    };

    const handleCheckOut = async () => {
        try {
            const res = await apiClient.checkOut();
            if (res) {
                const rec = {
                    date: res.date,
                    status: res.status,
                    checkInAt: res.check_in,
                    checkOutAt: res.check_out,
                };
                setAttendanceRecord(rec);
                setElapsedSeconds(getElapsedSeconds(rec));
                apiClient.getAnalyticsSummary().then(data => { if (data) setAnalytics(data); }).catch(() => {});
                return;
            }
        } catch {
            // Fallback
        }
        const record = checkOut();
        setAttendanceRecord(record);
        setElapsedSeconds(getElapsedSeconds(record));
    };

    const isCheckedIn = Boolean(attendanceRecord?.checkInAt);
    const isCheckedOut = Boolean(attendanceRecord?.checkOutAt);
    const displayHours = isCheckedIn ? formatDuration(elapsedSeconds) : "No data";
    const checkInTime = formatTime(attendanceRecord?.checkInAt);
    const checkOutTime = formatTime(attendanceRecord?.checkOutAt);
    const session = getSession();
    const userName = session?.loginId || employee.name;
    const todayLabel = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date());

    return (
        <ModuleLayout
            title={`Good morning, ${userName === "No data" ? "No data" : userName.split(" ")[0]} ✦`}
            eyebrow={todayLabel}
            subtitle="Here's what's happening with your workday."
            action={
                <div className="month-control">
                    <button className="outline-button" type="button" aria-expanded={monthOpen} onClick={() => setMonthOpen((open) => !open)}>
                        <Icon name="calendar" size={17} /> This month <Icon name="chevron" size={15} />
                    </button>
                    {monthOpen ? (
                        <div className="header-popover month-popover">
                            <strong>Period</strong>
                            <button type="button" onClick={() => setMonthOpen(false)}>This month</button>
                            <button type="button" onClick={() => setMonthOpen(false)}>Previous month</button>
                        </div>
                    ) : null}
                </div>
            }
        >
            <section className="attendance-panel" aria-labelledby="attendance-title">
                <div className="attendance-intro">
                    <div className="live-status">
                        <span /> {isCheckedOut ? "Attendance complete" : isCheckedIn ? "Live attendance" : "Not checked in"}
                    </div>
                    <h2 id="attendance-title">
                        {isCheckedOut ? "Your workday is complete." : isCheckedIn ? "You're having a great day!" : "Ready to start your day?"}
                    </h2>
                    <p>
                        {isCheckedOut ? `Checked out at ${checkOutTime}.` : isCheckedIn ? "Keep up the momentum. Your shift ends at 06:00 PM." : "Check in to start tracking your working hours."}
                    </p>
                    <div className="attendance-details">
                        <div>
                            <span>Check in</span>
                            <strong>{isCheckedIn ? checkInTime : "No data"}</strong>
                        </div>
                        <div>
                            <span>Work hours</span>
                            <strong>{displayHours}</strong>
                        </div>
                        <div>
                            <span>Shift</span>
                            <strong>No data</strong>
                        </div>
                    </div>
                </div>
                <div className="attendance-action">
                    <div className="progress-ring" style={{ "--progress": `${Math.min(100, Math.round((elapsedSeconds / (9 * 3600)) * 100)) * 3.6}deg` }}>
                        <div>
                            <strong>{Math.min(100, Math.round((elapsedSeconds / (9 * 3600)) * 100))}%</strong>
                            <span>complete</span>
                        </div>
                    </div>
                    {isCheckedIn && !isCheckedOut ? (
                        <button className="check-out-button" type="button" onClick={() => setCheckoutPending(true)}>
                            <span /> Check out
                        </button>
                    ) : (
                        <button className="check-out-button" type="button" onClick={handleCheckIn} disabled={isCheckedOut}>
                            <span /> {isCheckedOut ? "Checked out" : "Check in"}
                        </button>
                    )}
                </div>
            </section>

            <section className="summary-section" aria-labelledby="summary-title">
                <div className="section-heading">
                    <div>
                        <p className="section-kicker">At a glance</p>
                        <h2 id="summary-title">Your summary</h2>
                    </div>
                    <button className="text-button" type="button" onClick={() => goTo("/reports")}>
                        View reports <Icon name="arrow" size={16} />
                    </button>
                </div>
                <div className="summary-grid">
                    {summaryCards.map((card) => {
                        let value = card.value;
                        let detail = card.detail;

                        if (analytics) {
                            if (card.label === "Leave balance") {
                                value = `${analytics.on_leave_today} On Leave`;
                                detail = "Approved today";
                            } else if (card.label === "Present days") {
                                value = isCheckedIn ? "Present" : `${analytics.present_today} Present`;
                                detail = "Today";
                            } else if (card.label === "Working hours") {
                                value = isCheckedIn ? displayHours : `${analytics.total_employees} Total Team`;
                                detail = isCheckedIn ? "Today" : "Employees registered";
                            } else if (card.label === "Pending requests") {
                                value = `${analytics.pending_leave_requests} Pending`;
                                detail = "Time-off requests";
                            }
                        } else {
                            if (card.label === "Present days" && isCheckedIn) {
                                value = "Present";
                                detail = "Today";
                            } else if (card.label === "Working hours" && isCheckedIn) {
                                value = displayHours;
                                detail = "Today";
                            }
                        }

                        return (
                            <article className="summary-card" key={card.label}>
                                <div className={`summary-icon ${card.tone}`}>
                                    <Icon name={card.icon} size={19} />
                                </div>
                                <div>
                                    <p>{card.label}</p>
                                    <strong>{value}</strong>
                                    <span>{detail}</span>
                                </div>
                                <Icon name="arrow" size={17} />
                            </article>
                        );
                    })}
                </div>
            </section>

            <div className="dashboard-lower">
                <section className="quick-section" aria-labelledby="quick-title">
                    <div className="section-heading">
                        <div>
                            <p className="section-kicker">Shortcuts</p>
                            <h2 id="quick-title">Quick actions</h2>
                        </div>
                    </div>
                    <div className="quick-grid">
                        {quickActions.map((action) => (
                            <button
                                className="quick-action"
                                type="button"
                                key={action.label}
                                onClick={() => goTo(action.label === "Apply for leave" ? "/leave" : action.label === "View payslips" ? "/payslips" : "/profile")}
                            >
                                <span className="quick-icon">
                                    <Icon name={action.icon} size={19} />
                                </span>
                                <span>
                                    <strong>{action.label}</strong>
                                    <small>{action.label === "Apply for leave" || action.label === "View payslips" || action.label === "Update profile" ? "Under Progress" : action.detail}</small>
                                </span>
                                <Icon name="arrow" size={17} />
                            </button>
                        ))}
                    </div>
                </section>
                <section className="activity-section" aria-labelledby="activity-title">
                    <div className="section-heading">
                        <div>
                            <p className="section-kicker">Latest updates</p>
                            <h2 id="activity-title">Recent activity</h2>
                        </div>
                        <button className="text-button" type="button" onClick={() => goTo("/activity")}>
                            See all <Icon name="arrow" size={16} />
                        </button>
                    </div>
                    <div className="activity-list">
                        {activity.length ? (
                            activity.map((item) => (
                                <div className="activity-item" key={item.title}>
                                    <span className={`activity-dot ${item.color}`} />
                                    <div>
                                        <strong>{item.title}</strong>
                                        <small>{item.detail}</small>
                                    </div>
                                    <span className={`activity-status ${item.color}`}>{item.status}</span>
                                </div>
                            ))
                        ) : (
                            <p className="empty-state">No data</p>
                        )}
                    </div>
                </section>
            </div>
            {checkoutPending ? (
                <div className="modal-backdrop" role="presentation">
                    <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
                        <p className="section-kicker">Confirm attendance</p>
                        <h2 id="checkout-title">Check out now?</h2>
                        <p>Your working hours will be saved for today.</p>
                        <div>
                            <button className="modal-secondary" type="button" onClick={() => setCheckoutPending(false)}>
                                Cancel
                            </button>
                            <button className="modal-primary" type="button" onClick={() => { handleCheckOut(); setCheckoutPending(false); }}>
                                Check out
                            </button>
                        </div>
                    </section>
                </div>
            ) : null}
        </ModuleLayout>
    );
}

export default Dashboard;

