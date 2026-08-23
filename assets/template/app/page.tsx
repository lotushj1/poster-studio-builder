"use client";

import PosterStudio from "./studio/PosterStudio";
import { templateConfig } from "./studio/config";

export default function Page() {
  return <PosterStudio config={templateConfig} />;
}
