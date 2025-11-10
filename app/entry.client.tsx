import { startTransition, StrictMode, Suspense } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      {/* <Suspense fallback={<div>Loading app...</div>}> */}
        <HydratedRouter />
      {/* </Suspense> */}
    </StrictMode>,
  );
});
