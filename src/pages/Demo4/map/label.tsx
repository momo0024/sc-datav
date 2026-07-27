import { Html } from "@react-three/drei";
import styled from "styled-components";
import { useConfigStore } from "../stores";
import type { ComponentProps, ReactNode } from "react";

const Label = styled(Html)`
  pointer-events: none;
  width: max-content;
  display: flex;
  color: #ffffff;
`;

const Name = styled.span`
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.04em;
  line-height: 1.2;
  white-space: nowrap;
  color: #f4f8ff;
  text-shadow:
    0 0 8px rgba(48, 97, 219, 0.85),
    0 0 18px rgba(141, 178, 255, 0.55),
    0 2px 6px rgba(0, 0, 0, 0.75);
`;

export default function Index(
  props: ComponentProps<typeof Label> & { children?: ReactNode }
) {
  const mapPlayComplete = useConfigStore((s) => s.mapPlayComplete);
  const { children, ...rest } = props;

  if (!mapPlayComplete) return null;

  return (
    <Label {...rest}>
      <Name>{children}</Name>
    </Label>
  );
}
