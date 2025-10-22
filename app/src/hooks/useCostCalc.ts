// Copilot: recompute total cost on shift change
import { useState, useEffect, useCallback } from 'react';

export interface Shift {
  id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  hourly_rate: number;
  status: 'scheduled' | 'published' | 'completed' | 'cancelled';
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  hourly_rate: number;
}

export interface CostCalculation {
  totalCost: number;
  totalHours: number;
  employeeCosts: Record<string, {
    cost: number;
    hours: number;
    shifts: number;
  }>;
  dailyCosts: Record<string, number>;
}

interface UseCostCalcProps {
  shifts: Shift[];
  employees: Employee[];
  budget?: number;
}

export const useCostCalc = ({ shifts, employees, budget = 0 }: UseCostCalcProps) => {
  const [calculation, setCalculation] = useState<CostCalculation>({
    totalCost: 0,
    totalHours: 0,
    employeeCosts: {},
    dailyCosts: {}
  });

  const calculateShiftDuration = useCallback((shift: Shift): number => {
    const start = new Date(`1970-01-01T${shift.start_time}`);
    const end = new Date(`1970-01-01T${shift.end_time}`);
    
    // Handle overnight shifts (end time is next day)
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    
    // Subtract break time
    const breakHours = shift.break_minutes / 60;
    return Math.max(0, durationHours - breakHours);
  }, []);

  const calculateShiftCost = useCallback((shift: Shift): number => {
    const hours = calculateShiftDuration(shift);
    return hours * shift.hourly_rate;
  }, [calculateShiftDuration]);

  const recalculate = useCallback(() => {
    const newCalculation: CostCalculation = {
      totalCost: 0,
      totalHours: 0,
      employeeCosts: {},
      dailyCosts: {}
    };

    // Initialize employee costs
    employees.forEach(employee => {
      newCalculation.employeeCosts[employee.id] = {
        cost: 0,
        hours: 0,
        shifts: 0
      };
    });

    // Calculate for each shift
    shifts.forEach(shift => {
      const hours = calculateShiftDuration(shift);
      const cost = calculateShiftCost(shift);
      
      // Update totals
      newCalculation.totalCost += cost;
      newCalculation.totalHours += hours;
      
      // Update employee costs
      if (newCalculation.employeeCosts[shift.employee_id]) {
        newCalculation.employeeCosts[shift.employee_id].cost += cost;
        newCalculation.employeeCosts[shift.employee_id].hours += hours;
        newCalculation.employeeCosts[shift.employee_id].shifts += 1;
      }
      
      // Update daily costs
      if (!newCalculation.dailyCosts[shift.date]) {
        newCalculation.dailyCosts[shift.date] = 0;
      }
      newCalculation.dailyCosts[shift.date] += cost;
    });

    setCalculation(newCalculation);
  }, [shifts, employees, calculateShiftDuration, calculateShiftCost]);

  // Recalculate when shifts or employees change
  useEffect(() => {
    recalculate();
  }, [recalculate]);

  // Budget calculations
  const budgetUsagePercentage = budget > 0 ? (calculation.totalCost / budget) * 100 : 0;
  const remainingBudget = budget - calculation.totalCost;
  const budgetStatus: 'normal' | 'warning' | 'over' = budgetUsagePercentage > 100 ? 'over' : 
                      budgetUsagePercentage > 90 ? 'warning' : 'normal';

  return {
    calculation,
    budget: {
      total: budget,
      used: calculation.totalCost,
      remaining: remainingBudget,
      usagePercentage: budgetUsagePercentage,
      status: budgetStatus
    },
    recalculate,
    calculateShiftCost,
    calculateShiftDuration
  };
};
