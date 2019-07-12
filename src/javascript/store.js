import { createStore } from "redux";
import { photoApp } from "./reducers";

export const store = createStore(
  photoApp,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);
