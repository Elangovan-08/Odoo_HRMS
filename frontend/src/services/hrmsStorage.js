import { getStoredUser, getToken, logout, setStoredUser } from "./apiClient";

const SESSION_KEY = "hrms.session";
const ATTENDANCE_KEY = "hrms.attendance";

function todayKey() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
}

function readJson(key, fallback) {
    try {
        const value = window.localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function writeJson(key, value) {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Storage restricted
    }
}

function isValidTimestamp(value) {
    return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

export function getSession() {
    const user = getStoredUser();
    const token = getToken();
    const session = readJson(SESSION_KEY, null);
    
    if (user && token) {
        return {
            authenticated: true,
            loginId: user.login_id || user.email,
            role: user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : "Employee",
            user: user,
        };
    }
    
    return session?.authenticated === true ? session : null;
}

export function createSession(loginId, role = "Employee", user = null) {
    const session = {
        authenticated: true,
        loginId,
        role,
        user,
        createdAt: new Date().toISOString(),
    };
    writeJson(SESSION_KEY, session);
    if (user) {
        setStoredUser(user);
    }
    return session;
}

export function clearSession() {
    logout();
    try {
        window.localStorage.removeItem(SESSION_KEY);
    } catch {
        // Ignore
    }
}

export function getTodayAttendance() {
    const record = readJson(ATTENDANCE_KEY, null);
    if (record?.date !== todayKey() || !isValidTimestamp(record.checkInAt) || (record.checkOutAt !== null && !isValidTimestamp(record.checkOutAt))) {
        return null;
    }
    return record;
}

export function checkIn() {
    const existing = getTodayAttendance();
    if (existing) {
        return existing;
    }
    const record = { date: todayKey(), status: "present", checkInAt: new Date().toISOString(), checkOutAt: null, totalSeconds: null };
    writeJson(ATTENDANCE_KEY, record);
    return record;
}

export function checkOut() {
    const existing = getTodayAttendance();
    if (!existing || existing.checkOutAt) {
        return existing;
    }
    const checkOutAt = new Date().toISOString();
    const totalSeconds = Math.max(0, Math.floor((new Date(checkOutAt).getTime() - new Date(existing.checkInAt).getTime()) / 1000));
    const record = { ...existing, checkOutAt, totalSeconds };
    writeJson(ATTENDANCE_KEY, record);
    return record;
}

export function formatTime(value) {
    if (!isValidTimestamp(value)) {
        return "--:--";
    }
    return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function formatDuration(totalSeconds) {
    const seconds = Math.max(0, Math.floor(totalSeconds || 0));
    return `${String(Math.floor(seconds / 3600)).padStart(2, "0")}h ${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}m`;
}

export function getElapsedSeconds(record) {
    if (!isValidTimestamp(record?.checkInAt)) {
        return 0;
    }
    const end = isValidTimestamp(record.checkOutAt) ? new Date(record.checkOutAt).getTime() : Date.now();
    return Math.max(0, Math.floor((end - new Date(record.checkInAt).getTime()) / 1000));
}
