import { useId, useLayoutEffect, type ComponentProps } from "react";
import styled from "styled-components";
import autofit from "autofit.js";

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
  display: flex;
  flex-direction: column;
`;

export type AutoFitProps = Omit<ComponentProps<typeof Wrapper>, "id">;

export default function AutoFit(props: AutoFitProps) {
  const reactId = useId().replace(/:/g, "");
  const id = `autofit_${reactId}`;

  useLayoutEffect(() => {
    autofit.init({ el: `#${id}` }, false);

    return () => {
      autofit.off(`#${id}`);
    };
  }, [id]);

  return <Wrapper id={id} {...props} />;
}
