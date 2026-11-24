"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import "swagger-ui-dist/swagger-ui.css";

export default function ApiDocs() {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    void import("swagger-ui-dist/swagger-ui-bundle.js").then(({ default: SwaggerUIBundle }) => {
      if (active && container.current) SwaggerUIBundle({ domNode: container.current, url: "/api/openapi.json", deepLinking: true });
    });
    return () => { active = false; if (container.current) container.current.innerHTML = ""; };
  }, []);
  return <main className="api-docs"><Link href="/">← Back to Payme</Link><div ref={container}/></main>;
}
