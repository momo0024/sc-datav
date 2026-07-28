import { useMemo, type ReactNode } from "react";
import styled from "styled-components";
import SeamVirtualScroll from "@/components/seamVirtualScroll";
import { selectTopParks, usePanelDataStore } from "../stores/panelData";

const Rank = styled.span<{ $top?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 22px;
  padding: 0 6px;
  border-radius: 2px;
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: ${({ $top }) => ($top ? "#0b1224" : "#d5e2ff")};
  background: ${({ $top }) =>
    $top
      ? "linear-gradient(135deg, #d5e2ff, #7ea2ff)"
      : "rgba(77, 127, 255, 0.22)"};
`;

const Name = styled.span`
  color: rgba(244, 248, 255, 0.92);
  white-space: nowrap;
`;

const Count = styled.span`
  color: #9eb8ff;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
`;

const Bar = styled.span<{ $percent: number }>`
  display: inline-block;
  width: 72px;
  height: 6px;
  border-radius: 999px;
  background: rgba(77, 127, 255, 0.16);
  overflow: hidden;
  vertical-align: middle;

  &::after {
    content: "";
    display: block;
    height: 100%;
    width: ${({ $percent }) => `${$percent}%`};
    background: linear-gradient(90deg, #4d7fff, #bdcfff);
  }
`;

const Empty = styled.div`
  height: 100%;
  display: grid;
  place-items: center;
  color: rgba(189, 207, 255, 0.55);
  font-size: 13px;
  letter-spacing: 0.06em;
`;

export default function Chart2() {
  const parks = usePanelDataStore((s) => s.parks);
  const rows = useMemo(() => selectTopParks(parks, 50), [parks]);
  const max = Math.max(...rows.map((item) => item.count), 1);

  const data = useMemo(() => {
    return rows.map((item, index) => ({
      value1: (
        <Rank $top={index < 3}>{String(index + 1).padStart(2, "0")}</Rank>
      ) as ReactNode,
      value2: (<Name title={item.name}>{item.name}</Name>) as ReactNode,
      value3: (
        <Bar $percent={Math.max(12, Math.round((item.count / max) * 100))} />
      ) as ReactNode,
      value4: (<Count>{item.count} 家</Count>) as ReactNode,
    }));
  }, [rows, max]);

  if (!data.length) {
    return <Empty>暂无园区数据</Empty>;
  }

  return (
    <SeamVirtualScroll
      rowHeight={44}
      speed={2200}
      styles={{
        header: {
          color: "rgba(189, 207, 255, 0.7)",
          fontSize: 12,
          letterSpacing: "0.04em",
        },
        body: { color: "#9eb8ff" },
      }}
      column={[
        { title: "排名", dataIndex: "value1", noScroll: true, flex: 0.7 },
        {
          title: "园区名称",
          dataIndex: "value2",
          align: "left",
          flex: 2.2,
        },
        {
          title: "热度",
          dataIndex: "value3",
          align: "center",
          noScroll: true,
          flex: 1.1,
        },
        {
          title: "企业数",
          dataIndex: "value4",
          align: "right",
          noScroll: true,
          flex: 0.9,
        },
      ]}
      data={data}
    />
  );
}
