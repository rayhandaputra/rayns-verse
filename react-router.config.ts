import type { Config as BaseConfig } from "@react-router/dev/config";

interface ExtraConfig {
  tailwind?: boolean;
  postcss?: boolean;
  ssr?: boolean;
}

type Config = BaseConfig & ExtraConfig;

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  tailwind: true,
  postcss: true,

  ssr: true,
} satisfies Config;
