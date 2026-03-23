import { createInitialGraphState } from "../graph/questionGraph";

export interface AppStore {
  state: ReturnType<typeof createInitialGraphState>;
  startSession: () => void;
}

export const appStore: AppStore = {
  state: createInitialGraphState(),
  startSession() {
    this.state = {
      ...createInitialGraphState(),
      sessionStatus: "questioning"
    };
  }
};
