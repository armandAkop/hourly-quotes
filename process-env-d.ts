declare global {
  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined;
      VIDEO_ID: string;
    }
  }
}