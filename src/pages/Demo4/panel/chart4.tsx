import { useMemo } from "react";
import styled from "styled-components";
import NumberAnimation from "@/components/numberAnimation";
import {
  ratioPercent,
  selectCompanyMetrics,
  usePanelDataStore,
} from "../stores/panelData";

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(3, minmax(0, 1fr));
  gap: 10px;
`;

const Tile = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  overflow: hidden;
  background: linear-gradient(
    145deg,
    rgba(48, 97, 219, 0.32),
    rgba(12, 22, 48, 0.18) 55%,
    rgba(77, 127, 255, 0.12)
  );
  border: 1px solid rgba(189, 207, 255, 0.38);
  box-shadow:
    inset 0 0 24px rgba(77, 127, 255, 0.12),
    0 0 12px rgba(48, 97, 219, 0.18);
  clip-path: polygon(
    0 8px,
    8px 0,
    100% 0,
    100% calc(100% - 8px),
    calc(100% - 8px) 100%,
    0 100%
  );

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
    background: linear-gradient(180deg, #e8efff, #4d7fff 55%, transparent);
  }

  &::after {
    content: "";
    position: absolute;
    top: -40%;
    right: -20%;
    width: 70%;
    height: 90%;
    pointer-events: none;
    background: radial-gradient(
      ellipse at center,
      rgba(189, 207, 255, 0.16),
      transparent 70%
    );
  }
`;

const Label = styled.div`
  position: relative;
  z-index: 1;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #f4f8ff;
  line-height: 1.2;
  text-shadow: 0 0 10px rgba(141, 178, 255, 0.35);
`;

const Primary = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: baseline;
  gap: 6px;
`;

const PrimaryNumber = styled(NumberAnimation)`
  font-size: 30px;
  font-weight: 800;
  color: #ffffff;
  text-shadow:
    0 0 8px rgba(189, 207, 255, 0.95),
    0 0 22px rgba(77, 127, 255, 0.85),
    0 2px 0 rgba(11, 24, 56, 0.45);
  font-variant-numeric: tabular-nums;
  line-height: 1;
`;

const Unit = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: rgba(232, 239, 255, 0.72);
`;

const Secondary = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 12px;
  color: rgba(189, 207, 255, 0.9);
`;

const SecondaryNumber = styled(NumberAnimation)`
  font-size: 15px;
  font-weight: 700;
  color: #dce8ff;
  text-shadow: 0 0 10px rgba(77, 127, 255, 0.45);
  font-variant-numeric: tabular-nums;
`;

function findAbove(list: { remark: string; sum: number }[], keyword: string) {
  return list.find((item) => String(item.remark || "").includes(keyword));
}

export default function Chart4() {
  const companies = usePanelDataStore((s) => s.companies);
  const aboveScale = usePanelDataStore((s) => s.aboveScale);
  const metrics = useMemo(() => selectCompanyMetrics(companies), [companies]);

  const data = useMemo(() => {
    const industry = findAbove(aboveScale, "规上工业");
    const service = findAbove(aboveScale, "规上服务业");

    return [
      {
        label: "企业总量",
        value: metrics.total,
        unit: "家",
        label2: "专利",
        value2: metrics.patents,
        unit2: "件",
        digits: 0,
      },
      {
        label: "上市公司",
        value: metrics.listed,
        unit: "家",
        label2: "占比",
        value2: ratioPercent(metrics.listed, metrics.total),
        unit2: "%",
        digits: 1,
      },
      {
        label: "本土培育",
        value: metrics.native,
        unit: "家",
        label2: "占比",
        value2: ratioPercent(metrics.native, metrics.total),
        unit2: "%",
        digits: 1,
      },
      {
        label: "招商引资",
        value: metrics.attract,
        unit: "家",
        label2: "占比",
        value2: ratioPercent(metrics.attract, metrics.total),
        unit2: "%",
        digits: 1,
      },
      {
        label: industry?.remark || "规上工业",
        value: Number(industry?.sum) || 0,
        unit: "亿元",
        label2: industry?.remark || "规上工业",
        value2: null as number | null,
        unit2: "",
        digits: 0,
        primaryDigits: 2,
        hideTopLabel: true,
      },
      {
        label: service?.remark || "规上服务业",
        value: Number(service?.sum) || 0,
        unit: "亿元",
        label2: service?.remark || "规上服务业",
        value2: null as number | null,
        unit2: "",
        digits: 0,
        primaryDigits: 2,
        hideTopLabel: true,
      },
    ];
  }, [metrics, aboveScale]);

  return (
    <Wrapper>
      {data.map((el) => (
        <Tile key={el.label}>
          {!el.hideTopLabel && <Label>{el.label}</Label>}
          <Primary>
            <PrimaryNumber
              value={el.value}
              options={{
                minimumFractionDigits: el.primaryDigits ?? 0,
                maximumFractionDigits: el.primaryDigits ?? 0,
              }}
            />
            <Unit>{el.unit}</Unit>
          </Primary>
          <Secondary>
            <span>{el.label2}</span>
            {el.value2 != null && (
              <>
                <SecondaryNumber
                  value={el.value2}
                  options={{
                    minimumFractionDigits: el.digits,
                    maximumFractionDigits: el.digits,
                  }}
                />
                <span>{el.unit2}</span>
              </>
            )}
          </Secondary>
        </Tile>
      ))}
    </Wrapper>
  );
}
