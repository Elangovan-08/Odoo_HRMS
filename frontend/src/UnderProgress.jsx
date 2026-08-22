import { useNavigate } from "react-router";

function UnderProgress({ title = "This module" }) {
    const navigate = useNavigate();

    return (
        <main className="under-progress-page">
            <div className="under-progress-card">
                <div className="under-progress-mark" aria-hidden="true">•••</div>
                <p className="section-kicker">Coming soon</p>
                <h1>{title} is under progress</h1>
                <p>This workspace is being connected to the HRMS service. Your data will appear here once the module is available.</p>
                <button className="under-progress-button" type="button" onClick={() => navigate("/dashboard")}>Back to overview</button>
            </div>
        </main>
    );
}

export default UnderProgress;
