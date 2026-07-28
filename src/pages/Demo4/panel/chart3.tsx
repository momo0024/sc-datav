import { useMemo } from "react";
import styled from "styled-components";
import { usePanelDataStore } from "../stores/panelData";

const COLORS = [
  "#38bdf8",
  "#60a5fa",
  "#2563eb",
  "#22d3ee",
  "#0ea5e9",
  "#7dd3fc",
  "#4ade80",
  "#a78bfa",
];

function colorForName(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash + char.charCodeAt(0)) % COLORS.length;
  return COLORS[hash];
}

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
`;

const Summary = styled.div`
  align-self: flex-end;
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 13px;
  letter-spacing: 0.04em;
  color: rgba(189, 207, 255, 0.9);
  background: rgba(48, 97, 219, 0.28);
  border: 1px solid rgba(141, 178, 255, 0.22);
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0 2px 4px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(141, 178, 255, 0.35);
    border-radius: 4px;
  }
`;

const Row = styled.li`
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) 52px;
  align-items: center;
  gap: 10px;
  min-height: 26px;
`;

const Name = styled.span`
  color: rgba(232, 239, 255, 0.95);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const BarWrap = styled.div`
  position: relative;
  height: 20px;
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 4px;
  overflow: visible;
`;

const Bar = styled.div<{ $percent: number; $color: string; $top: boolean }>`
  position: absolute;
  top: 50%;
  left: 2px;
  height: 9px;
  width: ${({ $percent }) => `${Math.max(2, Math.min(100, $percent))}%`};
  max-width: calc(100% - 4px);
  transform: translateY(-50%);
  border-radius: 3px;
  background: ${({ $color, $top }) =>
    $top
      ? `linear-gradient(90deg, ${$color}cc, ${$color}55)`
      : `linear-gradient(90deg, ${$color}88, ${$color}33)`};
  box-shadow: ${({ $top }) =>
    $top ? "0 0 10px rgba(56, 189, 248, 0.18)" : "none"};
`;

const Percent = styled.span<{ $percent: number }>`
  position: absolute;
  top: 50%;
  left: ${({ $percent }) =>
    `min(calc(${Math.max(2, Math.min(100, $percent))}% + 4px), calc(100% - 42px))`};
  transform: translateY(-50%);
  color: #c5d4ea;
  font-size: 12px;
  white-space: nowrap;
  line-height: 1;
  font-variant-numeric: tabular-nums;
`;

const Count = styled.span`
  color: rgba(232, 239, 255, 0.95);
  font-size: 14px;
  font-weight: 600;
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

const Empty = styled.div`
  flex: 1;
  display: grid;
  place-items: center;
  color: rgba(189, 207, 255, 0.55);
  font-size: 13px;
  letter-spacing: 0.06em;
`;

export default function Chart3() {
  const parkChain = usePanelDataStore((s) => s.parkChain);

  const rows = useMemo(() => {
    const total = parkChain.reduce((sum, item) => sum + item.count, 0) || 1;
    return parkChain.map((item) => ({
      name: item.name,
      count: item.count,
      percent: Math.round((item.count / total) * 1000) / 10,
      color: colorForName(item.name),
    }));
  }, [parkChain]);

  const totalCount = useMemo(
    () => parkChain.reduce((sum, item) => sum + item.count, 0),
    [parkChain]
  );

  if (!rows.length) {
    return <Empty>暂无产业数据</Empty>;
  }

  return (
    <Wrapper>
      <Summary>
        {totalCount} 家 · {rows.length} 类
      </Summary>
      <List>
        {rows.map((item, idx) => (
          <Row key={item.name}>
            <Name title={item.name}>{item.name}</Name>
            <BarWrap>
              <Bar $percent={item.percent} $color={item.color} $top={idx < 3} />
              <Percent $percent={item.percent}>{item.percent}%</Percent>
            </BarWrap>
            <Count>{item.count}家</Count>
          </Row>
        ))}
      </List>
    </Wrapper>
  );
}
