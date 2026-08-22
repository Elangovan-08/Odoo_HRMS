from pydantic import BaseModel


class SalaryComponentDetail(BaseModel):
    name: str
    computation_type: str  # "Percentage of Wage", "Percentage of Basic", "Fixed Amount", "Calculated Balance"
    value_display: str
    amount: float


class SalaryBreakdownResponse(BaseModel):
    wage: float
    wage_type: str = "Fixed Wage"
    components: list[SalaryComponentDetail]
    total_earnings: float
    
    # Statutory Deductions
    pf_rate_percent: float = 12.0
    pf_amount: float
    professional_tax: float = 200.0
    total_deductions: float
    
    net_salary: float


def compute_salary_breakdown(wage: float) -> SalaryBreakdownResponse:
    w = max(0.0, wage)
    
    basic = round(0.50 * w, 2)
    hra = round(0.50 * basic, 2)
    standard_allowance = 4167.0 if w >= 4167.0 else round(w, 2)
    performance_bonus = round(0.0833 * w, 2)
    lta = round(0.08333 * w, 2)
    
    sum_specified = basic + hra + standard_allowance + performance_bonus + lta
    fixed_allowance = round(max(0.0, w - sum_specified), 2)
    
    total_earnings = round(basic + hra + standard_allowance + performance_bonus + lta + fixed_allowance, 2)
    
    pf_amount = round(0.12 * basic, 2)
    professional_tax = 200.0 if w > 10000 else 0.0
    total_deductions = round(pf_amount + professional_tax, 2)
    
    net_salary = round(total_earnings - total_deductions, 2)
    
    components = [
        SalaryComponentDetail(
            name="Basic Salary",
            computation_type="Percentage of Wage",
            value_display="50% of Wage",
            amount=basic,
        ),
        SalaryComponentDetail(
            name="House Rent Allowance (HRA)",
            computation_type="Percentage of Basic",
            value_display="50% of Basic",
            amount=hra,
        ),
        SalaryComponentDetail(
            name="Standard Allowance",
            computation_type="Fixed Amount",
            value_display="₹4,167 / month",
            amount=standard_allowance,
        ),
        SalaryComponentDetail(
            name="Performance Bonus",
            computation_type="Percentage of Wage",
            value_display="8.33% of Wage",
            amount=performance_bonus,
        ),
        SalaryComponentDetail(
            name="Leave Travel Allowance (LTA)",
            computation_type="Percentage of Wage",
            value_display="8.333% of Wage",
            amount=lta,
        ),
        SalaryComponentDetail(
            name="Fixed Allowance",
            computation_type="Calculated Balance",
            value_display="Wage - Total Components",
            amount=fixed_allowance,
        ),
    ]
    
    return SalaryBreakdownResponse(
        wage=w,
        wage_type="Fixed Wage",
        components=components,
        total_earnings=total_earnings,
        pf_rate_percent=12.0,
        pf_amount=pf_amount,
        professional_tax=professional_tax,
        total_deductions=total_deductions,
        net_salary=net_salary,
    )
