import { useEffect } from "react";
import styled from "styled-components";
import useMoveTo from "@/hooks/useMoveTo";
import AutoFit from "@/components/autoFit";
import { useConfigStore } from "../stores";
import { usePanelDataStore } from "../stores/panelData";

import Headder from "./headder";
import Chart2 from "./chart2";
import Chart4 from "./chart4";
import Chart3 from "./chart3";
import Chart1 from "./chart1";

const GridWrapper = styled.div`
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 24px;
  padding: 20px 24px 28px;
`;

const CardWrapper = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  pointer-events: auto;
`;

const CardTitle = styled.div`
  position: relative;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: #eef3ff;
  border-bottom: 1px solid rgba(186, 206, 255, 0.28);
  line-height: 50px;
  margin-inline: 20px;
  text-shadow: 0 0 12px rgba(141, 178, 255, 0.25);

  &::before {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 56px;
    height: 3px;
    background: linear-gradient(90deg, #bdcfff, rgba(189, 207, 255, 0));
  }

  &::after {
    content: "";
    position: absolute;
    right: 0;
    bottom: 0;
    width: 4px;
    height: 4px;
    border-radius: 2px;
    background-color: #bdcfff;
    box-shadow: 0 0 8px rgba(189, 207, 255, 0.8);
  }
`;

const CardContent = styled.div`
  flex: 1;
  min-height: 0;
  padding: 14px 18px 18px;
`;

const Card = ({
  title,
  children,
  ...props
}: React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> & { title: string }) => (
  <div {...props}>
    <svg
      width="100%"
      height="100%"
      fill="none"
      viewBox="0 0 260 180"
      preserveAspectRatio="none">
      <path
        fill="#3061DB"
        fillRule="evenodd"
        d="M206 10 190 0H9L0 9v171h45l4.5-4h161l4.5 4h45V10h-54Zm53 1h-53.287l-16-10H9.414L1 9.414V179h43.62l4.5-4h161.76l4.5 4H259V11Z"
      />

      <path fill="#789eff" d="m51 178-2 2h162l-2-2H51ZM0 0v7l7-7H0Z" />
      <path stroke="#789eff" strokeWidth={2} d="M1 169v10h10M259 21V11h-10" />
    </svg>
    <CardWrapper>
      <CardTitle>{title}</CardTitle>
      <CardContent>{children}</CardContent>
    </CardWrapper>
  </div>
);

export default function Panel() {
  const loadPanelData = usePanelDataStore((s) => s.load);
  const topBox = useMoveTo("toBottom", 0.6);
  const leftBox = useMoveTo("toRight", 0.8, 0.5);
  const leftBox1 = useMoveTo("toRight", 0.8, 0.65);
  const rightBox = useMoveTo("toLeft", 0.8, 0.5);
  const rightBox1 = useMoveTo("toLeft", 0.8, 0.65);

  useEffect(() => {
    void loadPanelData();
  }, [loadPanelData]);

  useEffect(() => {
    const unMapPlaySub = useConfigStore.subscribe(
      (s) => s.mapPlayComplete,
      (v) => {
        if (v) {
          topBox.restart();
          leftBox.restart();
          leftBox1.restart();
          rightBox.restart();
          rightBox1.restart();
        }
      }
    );

    return () => {
      unMapPlaySub();
    };
  }, []);

  return (
    <AutoFit>
      <Headder ref={topBox.ref} />
      <GridWrapper>
        <Card
          ref={leftBox.ref}
          style={{ gridArea: "1 / 1 / 2 / 2" }}
          title="核心指标总览">
          <Chart4 />
        </Card>
        <Card
          ref={leftBox1.ref}
          style={{ gridArea: "2 / 1 / 3 / 2" }}
          title="产业公司性质分布">
          <Chart1 />
        </Card>
        <Card
          ref={rightBox.ref}
          style={{ gridArea: "1 / 4 / 2 / 5" }}
          title="园区分布">
          <Chart2 />
        </Card>
        <Card
          ref={rightBox1.ref}
          style={{ gridArea: "2 / 4 / 3 / 5" }}
          title="产业集群分布">
          <Chart3 />
        </Card>
      </GridWrapper>
    </AutoFit>
  );
}
