import { useMemo, useRef } from "react";
import Chart from "@/components/chart";
import useRafInterval from "@/hooks/useRafInterval";
import { BarChart, type BarSeriesOption } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  type GridComponentOption,
  type TooltipComponentOption,
} from "echarts/components";
import type { ComposeOption, EChartsType } from "echarts/core";
import styled from "styled-components";
import { usePanelDataStore } from "../stores/panelData";

type BarOption = ComposeOption<
  BarSeriesOption | TooltipComponentOption | GridComponentOption
>;

const Empty = styled.div`
  height: 100%;
  display: grid;
  place-items: center;
  color: rgba(189, 207, 255, 0.55);
  font-size: 13px;
  letter-spacing: 0.06em;
`;

export default function Chart1() {
  const typeInfo = usePanelDataStore((s) => s.typeInfo);
  const rows = useMemo(() => typeInfo.slice(0, 8), [typeInfo]);
  const xData = rows.map((item) => item.name);
  const data = rows.map((item) => item.count);

  const chartRef = useRef<EChartsType>(null);
  const tipIndex = useRef(0);

  useRafInterval(
    () => {
      if (chartRef.current && data.length) {
        chartRef.current?.dispatchAction({
          type: "showTip",
          seriesIndex: 0,
          dataIndex: tipIndex.current,
        });
        tipIndex.current = (tipIndex.current + 1) % data.length;
      }
    },
    3_000,
    true
  );

  if (!rows.length) {
    return <Empty>暂无性质数据</Empty>;
  }

  return (
    <Chart<BarOption>
      ref={chartRef}
      use={[BarChart, TooltipComponent, GridComponent]}
      option={{
        tooltip: {
          trigger: "axis",
          backgroundColor: "rgba(6, 12, 28, 0.92)",
          borderColor: "rgba(141, 178, 255, 0.35)",
          borderWidth: 1,
          borderRadius: 4,
          textStyle: {
            color: "rgba(255, 255, 255, 0.88)",
            fontSize: 12,
          },
          axisPointer: {
            type: "line",
            lineStyle: {
              width: 1,
              type: "dotted",
              color: "#4d7fff",
            },
          },
          formatter: (params: unknown) => {
            const list = Array.isArray(params) ? params : [params];
            const first = list[0] as { name?: string; value?: number };
            return `${first?.name || ""}<br/>企业 ${first?.value ?? 0} 家`;
          },
        },
        grid: {
          top: "16%",
          bottom: "10%",
          left: 8,
          right: 12,
          outerBoundsMode: "same",
        },
        xAxis: {
          type: "category",
          axisLine: {
            lineStyle: { color: "rgba(255, 255, 255, 0.1)" },
          },
          axisLabel: {
            interval: 0,
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: 10,
            formatter: (value: string) =>
              value.length > 4 ? `${value.slice(0, 4)}…` : value,
          },
          axisTick: { show: false },
          data: xData,
        },
        yAxis: {
          type: "value",
          splitLine: { show: false },
          axisLine: { show: false },
          axisLabel: { color: "rgba(255, 255, 255, 0.55)" },
          axisTick: { show: false },
        },
        series: [
          {
            name: "企业数",
            type: "bar",
            barWidth: 18,
            label: {
              show: true,
              position: "top",
              color: "#9eb8ff",
              fontSize: 11,
              fontWeight: 600,
            },
            itemStyle: {
              borderRadius: [4, 4, 0, 0],
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: "#9eb8ff" },
                  { offset: 1, color: "rgba(48, 97, 219, 0.35)" },
                ],
                global: false,
              },
            },
            data,
          },
        ],
      }}
    />
  );
}
