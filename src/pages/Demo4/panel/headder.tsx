import type { ComponentProps } from "react";
import styled from "styled-components";

const PLATFORM_BASE =
  (import.meta.env.VITE_PLATFORM_BASE as string | undefined)?.replace(
    /\/$/,
    ""
  ) || "http://localhost:6001";

const NAV_LINKS = [
  { path: "/", name: "产业图谱" },
  { path: "/geo-screen", name: "企业地图" },
] as const;

const TitleWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 5;
`;

const Title = styled.div`
  font-size: 36px;
  letter-spacing: 8px;
  color: #fff;
  text-shadow: 0 8px 10px rgba(48, 97, 219, 0.8);
  font-weight: 700;
  background: linear-gradient(to bottom, #bdcfff, #4d7fff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;

  &::after {
    content: "SEMICONDUCTOR ENTERPRISE OVERVIEW";
    display: block;
    font-size: 12px;
    letter-spacing: 6px;
    text-align: center;
    color: rgba(141, 178, 255, 0.65);
    margin-top: -5px;
    -webkit-text-fill-color: rgba(141, 178, 255, 0.65);
  }
`;

const Nav = styled.nav`
  position: absolute;
  right: 28px;
  top: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 6;
  pointer-events: auto;
`;

const NavLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 4px;
  border: 1px solid rgba(138, 180, 255, 0.45);
  background: linear-gradient(
    180deg,
    rgba(48, 97, 219, 0.35),
    rgba(12, 28, 68, 0.55)
  );
  color: #d7e4ff;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-decoration: none;
  white-space: nowrap;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;

  &:hover {
    color: #fff;
    border-color: rgba(189, 207, 255, 0.85);
    background: linear-gradient(
      180deg,
      rgba(77, 127, 255, 0.55),
      rgba(12, 28, 68, 0.7)
    );
  }
`;

const Bg = styled.svg.attrs({
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 1920 82",
  width: "100%",
  height: "100%",
  preserveAspectRatio: "none",
  children: (
    <>
      <defs>
        <radialGradient
          id="demo4-radialGradient"
          cx="50%"
          cy="50%"
          fx="100%"
          fy="50%"
          r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1"></stop>
          <stop offset="100%" stopColor="#fff" stopOpacity="0"></stop>
        </radialGradient>
        <mask id="demo4-svgline-1">
          <circle r="100" cx="0" cy="0" fill="url(#demo4-radialGradient)">
            <animateMotion
              begin="0s"
              dur="3s"
              path="M0,60 L620,60 L670,80 L960,80"
              rotate="auto"
              keyPoints="0;1"
              keyTimes="0;1"
              repeatCount="indefinite"></animateMotion>
          </circle>
        </mask>
        <mask id="demo4-svgline-2">
          <circle r="100" cx="0" cy="0" fill="url(#demo4-radialGradient)">
            <animateMotion
              begin="0s"
              dur="3s"
              path="M1920,60 L1300,60 L1250,80 L960,80"
              rotate="auto"
              keyPoints="0;1"
              keyTimes="0;1"
              repeatCount="indefinite"></animateMotion>
          </circle>
        </mask>
      </defs>

      <path
        d="M0,0 L1920,0 L1920,60 L1300,60 L1250,80 L670,80 L620,60 L0,60 Z"
        fill="rgba(12, 28, 68, 0.92)"
      />

      <path
        d="M0,60 L620,60 L670,80 L1250,80 L1300,60 L1920,60"
        fill="none"
        stroke="rgba(77, 127, 255, 0.85)"
        strokeWidth="1"
      />

      <path
        d="M0,60 L620,60 L670,80 L960,80"
        fill="none"
        stroke="#8ab4ff"
        strokeWidth="4"
        mask="url(#demo4-svgline-1)"
      />

      <path
        d="M1920,60 L1300,60 L1250,80 L960,80"
        fill="none"
        stroke="#8ab4ff"
        strokeWidth="4"
        mask="url(#demo4-svgline-2)"
      />
    </>
  ),
})`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
`;

export default function Headder(props: ComponentProps<typeof TitleWrapper>) {
  return (
    <TitleWrapper {...props}>
      <Bg />
      <Title>半导体企业总览</Title>
      <Nav>
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.path}
            href={`${PLATFORM_BASE}${link.path}`}
            target="_top"
            rel="noopener noreferrer">
            {link.name}
          </NavLink>
        ))}
      </Nav>
    </TitleWrapper>
  );
}
