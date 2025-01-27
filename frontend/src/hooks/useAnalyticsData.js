// src/hooks/useAnalyticsData.js

import { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import api from "../utils/api";

// Top-level constant so it's not re-created each render
const PRESET_RANGES = {
  "1 Week": 7,
  "1 Month": 30,
  "1 Quarter": 90,
  "1 Half-Year": 180,
  "1 Year": 365,
};

export const useAnalyticsData = () => {
  // Loading state
  const [loading, setLoading] = useState(true);

  // Data states for each endpoint
  const [dailyTrends, setDailyTrends] = useState([]);
  const [weeklyOverview, setWeeklyOverview] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [monthlyComparison, setMonthlyComparison] = useState([]);
  const [annualOverview, setAnnualOverview] = useState([]);
  const [spendingPercentage, setSpendingPercentage] = useState(null);
  const [milestones, setMilestones] = useState({});
  const [topDays, setTopDays] = useState([]);
  const [averageDailyConsumption, setAverageDailyConsumption] = useState(null);

  // Compare-months range controls
  const [selectedPreset, setSelectedPreset] = useState("1 Month");
  const [customRange, setCustomRange] = useState({
    start: dayjs().subtract(30, "days"),
    end: dayjs(),
  });

  // Helper function to determine which months to compare
  const getComparisonMonths = useCallback(() => {
    if (selectedPreset === "Custom") {
      // Enumerate each month from customRange.start to customRange.end
      let startMonth = customRange.start.startOf("month");
      const endMonth = customRange.end.startOf("month");
      const months = [];

      while (
        startMonth.isBefore(endMonth) ||
        startMonth.isSame(endMonth, "month")
      ) {
        months.push(startMonth.format("YYYY-MM"));
        startMonth = startMonth.add(1, "month");
      }
      return months;
    }

    // Use preset day ranges mapped to approximate months
    const totalDays = PRESET_RANGES[selectedPreset] || 30;
    const monthsCount = Math.round(totalDays / 30);

    // Generate month strings in descending order
    return Array.from({ length: monthsCount }, (_, i) =>
      dayjs().subtract(i, "month").format("YYYY-MM")
    );
    // Note: We do NOT list PRESET_RANGES in the dependency array,
    // because it's defined at the top level and does not change.
  }, [selectedPreset, customRange.start, customRange.end]);

  // Fetch data for all endpoints in parallel
  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    try {
      const userId = 1; // Example user ID; adjust as needed

      // Retrieve data from all endpoints
      const [
        dailyTrendsRes,
        weeklyRes,
        monthlyTrendsRes,
        monthComparisonRes,
        annualRes,
        spendingRes,
        milestonesRes,
        topDaysRes,
        avgConsumptionRes,
      ] = await Promise.all([
        api.get("/analytics/daily-trends", {
          params: { user_id: userId },
        }),
        api.get("/analytics/weekly-overview", {
          params: { user_id: userId },
        }),
        api.get("/analytics/monthly-trends", {
          params: { user_id: userId },
        }),
        api.get("/analytics/compare-months", {
          params: { user_id: userId, months: getComparisonMonths() },
        }),
        api.get("/analytics/annual-overview", {
          params: { user_id: userId },
        }),
        api.get("/analytics/spending-percentage", {
          params: { user_id: userId },
        }),
        api.get("/analytics/milestones", {
          params: { user_id: userId },
        }),
        api.get("/analytics/top-days", {
          params: { user_id: userId, type: "spending" },
        }),
        api.get("/analytics/average-daily-consumption", {
          params: { user_id: userId },
        }),
      ]);

      // Store each response in state
      setDailyTrends(dailyTrendsRes.data.trends || []);
      setWeeklyOverview(weeklyRes.data.weekly_overview || []);
      setMonthlyTrends(monthlyTrendsRes.data.daily_trends || []);
      setMonthlyComparison(monthComparisonRes.data.comparison || []);
      setAnnualOverview(annualRes.data.monthly_data || []);
      setSpendingPercentage(spendingRes.data || null);
      setMilestones(milestonesRes.data.milestones_reached || {});
      setTopDays(topDaysRes.data.top_days || []);
      setAverageDailyConsumption(
        avgConsumptionRes.data.average_daily_consumption || 0
      );
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    } finally {
      setLoading(false);
    }
  }, [getComparisonMonths]);

  // Refresh data on mount or when getComparisonMonths changes
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  return {
    loading,
    dailyTrends,
    weeklyOverview,
    monthlyTrends,
    monthlyComparison,
    annualOverview,
    spendingPercentage,
    milestones,
    topDays,
    averageDailyConsumption,
    selectedPreset,
    setSelectedPreset,
    customRange,
    setCustomRange,
    fetchAnalyticsData,
  };
};
