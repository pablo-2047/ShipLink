import React from "react";
import { cn } from "@/lib/utils";

type As = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";

export interface KineticTextProps extends React.HTMLAttributes<HTMLElement> {
  text: string;
  as?: As;
}

export function KineticText({
  text,
  as: Tag = "h1",
  className = "",
  style,
  ...rest
}: KineticTextProps) {
  const mergedStyle = {
    "--hover-padding": "calc(1em / 14)",
    "--text-stroke-width": "calc(1em * 125 / 6000)",
    ...(style as React.CSSProperties | undefined),
  } as React.CSSProperties;

  return (
    <Tag
      {...rest}
      className={cn(
        "flex font-[400] cursor-default select-none",
        className.includes("nowrap") ? "flex-nowrap" : "flex-wrap",
        className
      )}
      style={mergedStyle}
    >
      {text.split(" ").map((word, wordIdx) => (
        <span key={wordIdx} className="inline-flex whitespace-nowrap mr-[0.25em]">
          {word.split("").map((letter, letterIdx) => (
            <span
              key={letterIdx}
              aria-hidden="true"
              className="inline-block [will-change:font-weight,-webkit-text-stroke-width,padding] [-webkit-text-stroke-color:transparent] [-webkit-text-stroke-width:var(--text-stroke-width)] [transition:font-weight_0.35s,_-webkit-text-stroke-color_0.35s,_padding_0.35s] hover:[padding-inline:var(--hover-padding)] hover:font-[900] hover:[-webkit-text-stroke-color:currentcolor] hover:[-webkit-text-stroke-width:calc(var(--text-stroke-width)*2)] has-[+span+span:hover]:font-[400] has-[+span:hover]:[padding-inline:var(--hover-padding)] has-[+span:hover]:font-[600] [:hover+&]:[padding-inline:var(--hover-padding)] [:hover+&]:font-[600] [:hover+span+&]:font-[400]"
            >
              {letter}
            </span>
          ))}
        </span>
      ))}
      <span className="sr-only">{text}</span>
    </Tag>
  );
}
