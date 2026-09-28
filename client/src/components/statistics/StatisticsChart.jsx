// client/src/components/statistics/StatisticsChart.jsx
import React from "react";
import Chart from "react-apexcharts";
import { CHART_COLORS } from "../../utils/statisticsUtils";

const StatisticsChart = ({
  options,
  series,
  type = "bar",
  height = 350,
  width = "100%",
  title = "",
}) => {
  if (!series || (Array.isArray(series) && series.length === 0)) {
    return (
      <div
        className="flex items-center justify-center p-8 bg-white rounded-lg shadow"
        style={{ height: height }}
      >
        <p className="text-gray-500">No data available for chart</p>
      </div>
    );
  }

  // Merge default options with provided options
  const chartOptions = {
    ...options,
    chart: {
      ...options?.chart,
      type: type,
      height: height,
      stacked: true,
    },
    plotOptions: {
      ...options?.plotOptions,
      bar: {
        ...options?.plotOptions?.bar,
        horizontal: true,
        barHeight: "50%",
        endingShape: "rounded",
      },
    },
    dataLabels: {
      enabled: true,
    },
    // ✅ RED/GREEN DESIGN: Green=Completed, Red=Issues, Orange=Accent
    colors: options?.colors || CHART_COLORS,
    title: {
      ...options?.title,
      text: title || options?.title?.text || "",
      align: "center",
      style: {
        fontSize: "16px",
        fontWeight: 600,
        color: "#333",
      },
    },
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <Chart
        options={chartOptions}
        series={series}
        type={type}
        height={height}
        width={width}
      />
    </div>
  );
};

export default StatisticsChart;
