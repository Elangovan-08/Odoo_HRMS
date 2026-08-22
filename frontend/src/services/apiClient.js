const API_BASE_URL = "http://localhost:8000/api";
const TOKEN_KEY = "hrms.token";
const USER_KEY = "hrms.user_data";

export function getToken() {
    try {
        return window.localStorage.getItem(TOKEN_KEY) || "";
    } catch {
        return "";
    }
}

export function setToken(token) {
    try {
        if (token) {
            window.localStorage.setItem(TOKEN_KEY, token);
        } else {
            window.localStorage.removeItem(TOKEN_KEY);
        }
    } catch {
        // Storage restricted
    }
}

export function getStoredUser() {
    try {
        const value = window.localStorage.getItem(USER_KEY);
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
}

export function setStoredUser(user) {
    try {
        if (user) {
            window.localStorage.setItem(USER_KEY, JSON.stringify(user));
        } else {
            window.localStorage.removeItem(USER_KEY);
        }
    } catch {
        // Storage restricted
    }
}

export function logout() {
    setToken(null);
    setStoredUser(null);
    try {
        window.localStorage.removeItem("hrms.session");
    } catch {
        // Ignore
    }
}

async function request(path, options = {}) {
    const token = getToken();
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    const response = await fetch(`${API_BASE_URL}${path}`, config);
    
    if (!response.ok) {
        let errorDetail = "API Request failed";
        try {
            const errJson = await response.json();
            errorDetail = errJson.detail || errJson.message || errorDetail;
        } catch {
            errorDetail = await response.text() || response.statusText;
        }
        throw new Error(errorDetail);
    }

    if (response.status === 24) {
        return null;
    }

    return response.json();
}

export const apiClient = {
    async login(loginIdOrEmail, password) {
        const data = await request("/auth/login", {
            method: "POST",
            body: JSON.stringify({
                login_id_or_email: loginIdOrEmail.trim(),
                password: password,
            }),
        });

        if (data?.access_token) {
            setToken(data.access_token);
        }
        if (data?.user) {
            setStoredUser(data.user);
        }
        return data;
    },

    async getMe() {
        const user = await request("/auth/me");
        if (user) {
            setStoredUser(user);
        }
        return user;
    },

    async changePassword(currentPassword, newPassword) {
        return request("/auth/change-password", {
            method: "POST",
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword,
            }),
        });
    },

    async getAnalyticsSummary() {
        return request("/analytics/summary");
    },

    async getAttendanceStatus() {
        return request("/attendance/status");
    },

    async checkIn(notes = "") {
        return request("/attendance/check-in", {
            method: "POST",
            body: JSON.stringify({ notes }),
        });
    },

    async checkOut() {
        return request("/attendance/check-out", {
            method: "POST",
        });
    },

    async getMyAttendance() {
        return request("/attendance/my");
    },

    async getAllAttendance() {
        return request("/attendance/all");
    },

    async getEmployees(department = "", search = "") {
        const params = new URLSearchParams();
        if (department && department !== "All departments") {
            params.append("department", department);
        }
        if (search) {
            params.append("search", search.trim());
        }
        const queryStr = params.toString() ? `?${params.toString()}` : "";
        return request(`/employees${queryStr}`);
    },

    async createEmployee(employeeData) {
        return request("/employees", {
            method: "POST",
            body: JSON.stringify(employeeData),
        });
    },

    async getEmployeeById(id) {
        return request(`/employees/${id}`);
    },

    async updateEmployee(id, updateData) {
        return request(`/employees/${id}`, {
            method: "PATCH",
            body: JSON.stringify(updateData),
        });
    },

    async createTimeOff(leaveData) {
        return request("/time-off", {
            method: "POST",
            body: JSON.stringify({
                leave_type: leaveData.leave_type || leaveData.type,
                start_date: leaveData.start_date || leaveData.from,
                end_date: leaveData.end_date || leaveData.to,
                days_count: Number(leaveData.days_count) || 0,
                reason: leaveData.reason || "",
            }),
        });
    },

    async getMyTimeOff() {
        return request("/time-off/my");
    },

    async getAllTimeOff() {
        return request("/time-off/all");
    },

    async updateTimeOffStatus(id, newStatus) {
        return request(`/time-off/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status: newStatus }),
        });
    },

    async calculatePayroll(wage) {
        return request(`/payroll/calculate?wage=${Number(wage) || 0}`);
    },

    async getEmployeePayroll(id) {
        return request(`/payroll/employee/${id}`);
    },
};
