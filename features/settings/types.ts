export type SettingsActionState = {
  ok: boolean;
  message: string;
};

export const initialSettingsState: SettingsActionState = { ok: false, message: "" };
