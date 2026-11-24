declare module "swagger-ui-dist/swagger-ui-bundle.js" {
  const SwaggerUIBundle: (options: { domNode: HTMLElement; url: string; deepLinking?: boolean }) => unknown;
  export default SwaggerUIBundle;
}
