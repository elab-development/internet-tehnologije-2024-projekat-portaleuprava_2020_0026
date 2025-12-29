// src/pages/StatisticsOfficer.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconLogout, IconRefresh } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import api from "../api/api";
import Slider from "../components/Slider";
import { clearAuth, getAuth } from "../utils/auth";

const NAVY = "#0B1F3B";

const STATUS_META = {
  DRAFT: { label: "DRAFT", color: "#868e96" },
  SUBMITTED: { label: "SUBMITTED", color: "#228be6" },
  IN_REVIEW: { label: "IN_REVIEW", color: "#fab005" },
  APPROVED: { label: "APPROVED", color: "#40c057" },
  REJECTED: { label: "REJECTED", color: "#fa5252" },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] ?? { label: status ?? "-", color: "#868e96" };
  return (
    <Badge variant="light" color="blue">
      {m.label}.
    </Badge>
  );
}

function safeNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

export default function StatisticsOfficer() {
  const navigate = useNavigate();
  const auth = getAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/stats");
      setStats(res.data ?? null);
    } catch (err) {
      notifications.show({
        title: "Greška.",
        message:
          err?.response?.data?.message ||
          "Nije moguće učitati statistiku. Proverite autorizaciju i konekciju.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const byStatusArr = useMemo(() => {
    const raw = Array.isArray(stats?.by_status) ? stats.by_status : [];
    // Normalize + order
    const order = ["DRAFT", "SUBMITTED", "IN_REVIEW", "APPROVED", "REJECTED"];
    const map = new Map(raw.map((x) => [String(x.status), safeNum(x.total)]));
    return order.map((st) => ({
      status: st,
      label: STATUS_META[st]?.label ?? st,
      total: map.get(st) ?? 0,
      color: STATUS_META[st]?.color ?? "#868e96",
    }));
  }, [stats]);

  const totalRequests = useMemo(() => safeNum(stats?.total_requests), [stats]);

  const countBy = (status) =>
    safeNum(stats?.by_status?.find((x) => x.status === status)?.total);

  // Optional: top services if backend returns something like stats.top_services / stats.by_service
  const topServices = useMemo(() => {
    const raw =
      (Array.isArray(stats?.top_services) && stats.top_services) ||
      (Array.isArray(stats?.by_service) && stats.by_service) ||
      [];
    // Try to normalize into { name, total }
    const normalized = raw
      .map((x) => {
        const name =
          x?.service?.name ??
          x?.service_name ??
          x?.name ??
          x?.label ??
          x?.service ??
          "Servis";
        const total = safeNum(x?.total ?? x?.count ?? x?.value);
        return { name: String(name), total };
      })
      .filter((x) => x.total > 0);

    return normalized.slice(0, 10);
  }, [stats]);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Slider />

      <div style={{ flex: 1 }}>
        <div className="auth-page" style={{ padding: 0 }}>
          <Container size="lg" py={24} style={{ position: "relative", zIndex: 1 }}>
            {/* Header */}
            <Paper
              radius="xl"
              style={{
                position: "relative",
                overflow: "hidden",
                border: "1px solid rgba(11,31,59,0.12)",
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(8px)",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  padding: 18,
                  background:
                    "radial-gradient(900px 320px at 10% 10%, rgba(11,31,59,0.10), transparent 60%)," +
                    "radial-gradient(700px 300px at 85% 20%, rgba(11,31,59,0.08), transparent 55%)," +
                    "linear-gradient(180deg, rgba(231,240,255,0.70), rgba(255,255,255,0.95))",
                }}
              >
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Title order={2} c={NAVY}>
                      Statistika – službenik.
                    </Title>
                    <Text c="dimmed" mt={4}>
                      Pregled ukupnih metrika i raspodele po statusima.
                    </Text>
                  </div>

                  <Group>
                    <ActionIcon
                      variant="light"
                      color="blue"
                      radius="xl"
                      onClick={load}
                      aria-label="refresh"
                      style={{
                        border: "1px solid rgba(11,31,59,0.12)",
                        background: "rgba(255,255,255,0.70)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <IconRefresh size={18} />
                    </ActionIcon>

                    <Button
                      variant="light"
                      color="blue"
                      radius="xl"
                      leftSection={<IconLogout size={16} />}
                      onClick={logout}
                    >
                      Odjavi se.
                    </Button>
                  </Group>
                </Group>
              </div>
            </Paper>

            <Paper
              radius="xl"
              p="lg"
              style={{
                border: "1px solid rgba(11,31,59,0.12)",
                background: "rgba(255,255,255,0.90)",
                backdropFilter: "blur(8px)",
              }}
            >
              {loading ? (
                <Group justify="center" py={26}>
                  <Loader />
                </Group>
              ) : (
                <Stack gap="lg">
                  {/* KPI */}
                  <SimpleGrid cols={{ base: 1, sm: 2, md: 5 }} spacing="md">
                    <Card withBorder radius="xl">
                      <Text c="dimmed" size="sm">
                        Ukupno zahteva.
                      </Text>
                      <Title order={2} c={NAVY}>
                        {totalRequests}.
                      </Title>
                    </Card>

                    <Card withBorder radius="xl">
                      <Text c="dimmed" size="sm">
                        DRAFT.
                      </Text>
                      <Title order={2} c={NAVY}>
                        {countBy("DRAFT")}.
                      </Title>
                    </Card>

                    <Card withBorder radius="xl">
                      <Text c="dimmed" size="sm">
                        SUBMITTED.
                      </Text>
                      <Title order={2} c={NAVY}>
                        {countBy("SUBMITTED")}.
                      </Title>
                    </Card>

                    <Card withBorder radius="xl">
                      <Text c="dimmed" size="sm">
                        IN_REVIEW.
                      </Text>
                      <Title order={2} c={NAVY}>
                        {countBy("IN_REVIEW")}.
                      </Title>
                    </Card>

                    <Card withBorder radius="xl">
                      <Text c="dimmed" size="sm">
                        APPROVED / REJECTED.
                      </Text>
                      <Title order={2} c={NAVY}>
                        {countBy("APPROVED") + countBy("REJECTED")}.
                      </Title>
                    </Card>
                  </SimpleGrid>

                  {/* Charts */}
                  <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                    {/* Bar */}
                    <Card withBorder radius="xl" p="lg">
                      <Group justify="space-between" mb="sm">
                        <div>
                          <Title order={4} c={NAVY}>
                            Raspodela po statusu.
                          </Title>
                          <Text c="dimmed" size="sm">
                            Broj zahteva po statusu.
                          </Text>
                        </div>
                        <StatusBadge status="SUBMITTED" />
                      </Group>

                      <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={byStatusArr}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis allowDecimals={false} />
                            <Tooltip
                              formatter={(v) => [v, "Ukupno"]}
                              labelFormatter={(l) => `Status: ${l}`}
                            />
                            <Bar dataKey="total" radius={[10, 10, 0, 0]}>
                              {byStatusArr.map((entry) => (
                                <Cell key={entry.status} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    {/* Pie */}
                    <Card withBorder radius="xl" p="lg">
                      <Group justify="space-between" mb="sm">
                        <div>
                          <Title order={4} c={NAVY}>
                            Udeo statusa.
                          </Title>
                          <Text c="dimmed" size="sm">
                            Procentualni prikaz po statusu.
                          </Text>
                        </div>
                      </Group>

                      <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={byStatusArr}
                              dataKey="total"
                              nameKey="label"
                              outerRadius={110}
                              innerRadius={60}
                              paddingAngle={3}
                            >
                              {byStatusArr.map((entry) => (
                                <Cell key={entry.status} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(v, n) => [v, String(n)]}
                              labelFormatter={() => ""}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </SimpleGrid>

                  {/* Optional: Top services if backend returns them */}
                  {topServices.length > 0 && (
                    <Card withBorder radius="xl" p="lg">
                      <Title order={4} c={NAVY} mb={6}>
                        Najaktivniji servisi.
                      </Title>
                      <Text c="dimmed" size="sm" mb="md">
                        Top 10 po broju zahteva (ako backend vraća ove podatke).
                      </Text>

                      <div style={{ height: 320 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topServices} layout="vertical" margin={{ left: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" allowDecimals={false} />
                            <YAxis type="category" dataKey="name" width={160} />
                            <Tooltip formatter={(v) => [v, "Ukupno"]} />
                            <Bar dataKey="total" radius={[0, 10, 10, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  )}
                </Stack>
              )}
            </Paper>
          </Container>
        </div>
      </div>
    </div>
  );
}
