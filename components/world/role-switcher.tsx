"use client";

import type { DemoRole } from "@/lib/demo/types";

const roles: Array<{ id: DemoRole; label: string; shortLabel: string }> = [
  { id: "designer", label: "设计师视角", shortLabel: "设计师" },
  { id: "guild", label: "公会视角", shortLabel: "公会" },
  { id: "hr", label: "HR 视角", shortLabel: "HR" },
];

interface RoleSwitcherProps {
  role: DemoRole;
  onChange: (role: DemoRole) => void;
}

export function RoleSwitcher({ role, onChange }: RoleSwitcherProps) {
  return (
    <div className="roleSwitcher" aria-label="切换演示角色" role="group">
      {roles.map((item) => (
        <button
          aria-label={item.label}
          aria-pressed={role === item.id}
          className="roleButton"
          key={item.id}
          onClick={() => onChange(item.id)}
          type="button"
        >
          {item.shortLabel}
        </button>
      ))}
    </div>
  );
}
