export interface IApi {
  session: any;
  method: "POST" | "PATCH" | "DELETE" | "GET";
  body?: any;
  url: string;
  headers?: any;
}
