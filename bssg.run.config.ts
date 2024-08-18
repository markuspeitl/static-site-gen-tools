import type { SsgConfig } from "./src/config/ssg-config";

export function configure(config: SsgConfig) {
    //Config with initialized/compiled processing tree
    console.log("Hello world from 'bssg' run user config");
    return config;
}