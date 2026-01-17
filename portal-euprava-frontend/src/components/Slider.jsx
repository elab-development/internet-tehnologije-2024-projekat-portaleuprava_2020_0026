import React, { useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ActionIcon,
  Box,
  Divider,
  Group,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import {
  IconHome,
  IconFilePlus,
  IconListCheck,
  IconInbox,
  IconBuildingBank,
  IconSettings,
  IconUsers,
  IconChartBar,
  IconLogout,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";

import api from "../api/api";
import { clearAuth, getAuth } from "../utils/auth";

const NAVY = "#0B1F3B";

function getMenuByRole(role) {
  // Napomena: rute su primeri za frontend. Kasnije ih poveži sa realnim stranicama.
  if (role === "ADMIN") {
    return [
      { label: "Početna.", to: "/home-admin", icon: IconHome },
      { label: "Statistika.", to: "/admin/stats", icon: IconChartBar },
      { label: "Institucije.", to: "/admin/institutions", icon: IconBuildingBank },
      { label: "Servisi.", to: "/admin/services", icon: IconSettings },
      { label: "Korisnici.", to: "/admin/users", icon: IconUsers },
    ];
  }

  if (role === "OFFICER") {
    return [
      { label: "Početna.", to: "/home-officer", icon: IconHome },
      { label: "Inbox zahtevi.", to: "/officer/inbox", icon: IconInbox },
      { label: "Moji zahtevi.", to: "/officer/assigned", icon: IconListCheck },
      { label: "Statistika.", to: "/officer/stats", icon: IconChartBar },
    ];
  }

  // CITIZEN default
  return [
    { label: "Početna.", to: "/home-citizen", icon: IconHome },
    { label: "Novi zahtev.", to: "/citizen/new-request", icon: IconFilePlus },
    { label: "Moji zahtevi.", to: "/citizen/requests", icon: IconListCheck },
    { label: "Servisi.", to: "/citizen/services", icon: IconSettings },
  ];
}

function MenuItem({ item, collapsed, active }) {
  const Icon = item.icon;

  const button = (
    <UnstyledButton
      component={NavLink}
      to={item.to}
      style={{
        width: "100%",
        borderRadius: 14,
        padding: collapsed ? "12px 10px" : "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: active ? "rgba(11,31,59,0.10)" : "transparent",
        border: active ? "1px solid rgba(11,31,59,0.14)" : "1px solid transparent",
        transition: "all 160ms ease",
      }}
    >
      <Box
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          display: "grid",
          placeItems: "center",
          background: active ? "rgba(11,31,59,0.12)" : "rgba(11,31,59,0.06)",
          border: "1px solid rgba(11,31,59,0.10)",
        }}
      >
        <Icon size={18} color={NAVY} />
      </Box>

      {!collapsed && (
        <Text
          style={{
            color: NAVY,
            fontWeight: 700,
            fontSize: 14,
            lineHeight: 1,
          }}
        >
          {item.label}
        </Text>
      )}
    </UnstyledButton>
  );

  // Kad je collapsed, nema teksta — tooltip na hover.
  if (collapsed) {
    return (
      <Tooltip label={item.label} position="right" withArrow>
        <div>{button}</div>
      </Tooltip>
    );
  }

  return button;
}

export default function Slider() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();

  const role = auth?.user?.role ?? "CITIZEN";

  const [collapsed, setCollapsed] = useState(false);

  const menu = useMemo(() => getMenuByRole(role), [role]);

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // ignore
    } finally {
      clearAuth();
      navigate("/auth", { replace: true });
    }
  };

  return (
    <Box
      style={{
        width: collapsed ? 82 : 280,
        minWidth: collapsed ? 82 : 280,
        height: "100vh",
        position: "sticky",
        top: 0,
        padding: 14,
        background: "rgba(255,255,255,0.88)",
        borderRight: "1px solid rgba(11,31,59,0.12)",
        backdropFilter: "blur(10px)",
        transition: "width 180ms ease",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Header: logo + collapse button */}
      <Group justify="space-between" align="center" style={{ gap: 10 }}>
        <Group gap={10} align="center" wrap="nowrap">
          <img
            src={collapsed ? "/images/logoSmall.png" : "/images/logo.png"}
            alt="Portal eUprava"
            style={{
              width: collapsed ? 44 : 140,
              height: 44,
              objectFit: "contain",
              transition: "all 180ms ease",
            }}
          />
        </Group>

        <ActionIcon
          variant="light"
          color="blue"
          radius="xl"
          onClick={() => setCollapsed((v) => !v)}
          aria-label="toggle"
          style={{
            border: "1px solid rgba(11,31,59,0.12)",
            background: "rgba(11,31,59,0.06)",
          }}
        >
          {collapsed ? <IconChevronRight size={18} color={NAVY} /> : <IconChevronLeft size={18} color={NAVY} />}
        </ActionIcon>
      </Group>

      <Divider />

      {/* Menu */}
      <Stack gap={8} style={{ flex: 1 }}>
        {menu.map((item) => {
          const active = location.pathname === item.to;
          return (
            <MenuItem
              key={item.to}
              item={item}
              collapsed={collapsed}
              active={active}
            />
          );
        })}
      </Stack>

      <Divider />

      {/* Footer */}
      <Stack gap={10}>
        {!collapsed && (
          <Box
            style={{
              borderRadius: 16,
              border: "1px solid rgba(11,31,59,0.12)",
              background: "rgba(11,31,59,0.04)",
              padding: 12,
            }}
          >
            <Text style={{ color: NAVY, fontWeight: 800, fontSize: 14 }}>
              {auth?.user?.name ?? "Korisnik"}.
            </Text>
          <Group gap={8} align="center" wrap="nowrap" style={{ marginTop: 6 }}>
            <Text c="dimmed" size="sm">
              Uloga:
            </Text>

            <BadgeRole role={role} />
          </Group>
          </Box>
        )}

        {collapsed ? (
          <Tooltip label="Odjavi se." position="right" withArrow>
            <div>
              <ActionIcon
                variant="light"
                radius="xl"
                onClick={logout}
                style={{
                  width: "100%",
                  height: 46,
                  borderRadius: 14,
                  background: "rgba(11,31,59,0.06)",
                  border: "1px solid rgba(11,31,59,0.12)",
                }}
              >
                <IconLogout size={18} color={NAVY} />
              </ActionIcon>
            </div>
          </Tooltip>
        ) : (
          <UnstyledButton
            onClick={logout}
            style={{
              width: "100%",
              borderRadius: 14,
              padding: "12px 12px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "rgba(11,31,59,0.06)",
              border: "1px solid rgba(11,31,59,0.12)",
              transition: "all 160ms ease",
            }}
          >
            <Box
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                display: "grid",
                placeItems: "center",
                background: "rgba(11,31,59,0.08)",
                border: "1px solid rgba(11,31,59,0.10)",
              }}
            >
              <IconLogout size={18} color={NAVY} />
            </Box>
            <Text style={{ color: NAVY, fontWeight: 800, fontSize: 14 }}>
              Odjavi se.
            </Text>
          </UnstyledButton>
        )}
      </Stack>
    </Box>
  );
}

function BadgeRole({ role }) {
const roleMap = {
  CITIZEN: "Građanin",
  OFFICER: "Službenik",
  ADMIN: "Administrator",
};

  return (
    <Box
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        background: "rgba(11,31,59,0.06)",
        border: "1px solid rgba(11,31,59,0.12)",
        color: NAVY,
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {roleMap[role] ?? role}.
    </Box>
  );
}
