import type { SsgConfig } from "./src/config/ssg-config";

export function configure(config: SsgConfig) {
    console.log("Hello world from 'bssg' user config");
    return config;
}