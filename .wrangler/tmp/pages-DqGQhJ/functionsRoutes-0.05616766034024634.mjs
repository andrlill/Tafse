import { onRequest as __api___sti___js_onRequest } from "/home/claude/tafse/functions/api/[[sti]].js"

export const routes = [
    {
      routePath: "/api/:sti*",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api___sti___js_onRequest],
    },
  ]