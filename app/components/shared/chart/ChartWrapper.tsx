import React from "react";
import ReactApexChart from "react-apexcharts";

interface ChartWrapperProps {
  options: any;
  series: any;
  type: "line" | "bar" | "area" | "pie" | "donut";
  height?: number;
}

export default function ChartWrapper({
  options,
  series,
  type,
  height = 300,
}: ChartWrapperProps) {
  return (
    <ReactApexChart
      options={options}
      series={series}
      type={type}
      height={height}
    />
  );
}
