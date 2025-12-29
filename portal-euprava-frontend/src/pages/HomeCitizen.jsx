// src/pages/HomeCitizen.jsx
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
  Table,
  Text,
  Title,
  Box,
  Divider,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconDownload, IconRefresh, IconCheck, IconExternalLink } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";
import { getAuth, getRoleLabel } from "../utils/auth";
import Slider from "../components/Slider";
import useLatestSerbianNews from "../hooks/useLatestSerbianNews";

const NAVY = "#0B1F3B";

function StatusBadge({ status }) {
  const map = {
    DRAFT: { c: "gray", t: "DRAFT" },
    SUBMITTED: { c: "blue", t: "SUBMITTED" },
    IN_REVIEW: { c: "yellow", t: "IN_REVIEW" },
    APPROVED: { c: "green", t: "APPROVED" },
    REJECTED: { c: "red", t: "REJECTED" },
  };
  const s = map[status] ?? { c: "gray", t: status ?? "-" };
  return (
    <Badge color={s.c} variant="light">
      {s.t}.
    </Badge>
  );
}

function fmtDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleString();
}

export default function HomeCitizen() {
  const navigate = useNavigate();
  const auth = getAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [services, setServices] = useState([]);
  const [requests, setRequests] = useState([]);

  const quickServices = useMemo(() => services.slice(0, 4), [services]);
  const lastRequests = useMemo(() => requests.slice(0, 5), [requests]);

  // ✅ Latest news hook.
  const {
    news,
    loading: newsLoading,
    error: newsError,
    refetch: refetchNews,
  } = useLatestSerbianNews({ limit: 6 });

  const load = async () => {
    setLoading(true);
    try {
      const [s1, s2, s3] = await Promise.all([
        api.get("/stats"),
        api.get("/services"),
        api.get("/service-requests"),
      ]);

      setStats(s1.data);
      setServices(Array.isArray(s2.data?.data) ? s2.data.data : s2.data ?? []);
      setRequests(Array.isArray(s3.data?.data) ? s3.data.data : s3.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  // ✅ PDF download preko axios-a (sa auth headerom).
  const downloadPdf = async (requestId) => {
    try {
      const res = await api.get(`/service-requests/${requestId}/pdf`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `zahtev-${requestId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);

      notifications.show({
        title: "PDF preuzet.",
        message: "Dokument je uspešno preuzet.",
        color: "blue",
        icon: <IconCheck size={18} />,
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "PDF nije moguće preuzeti (proveri da li si ulogovan/a i da li zahtev postoji).";

      notifications.show({
        title: "Greška.",
        message: msg,
        color: "red",
      });
    }
  };

  // ✅ Pokreni zahtev -> vodi na stranicu za novi zahtev (+ serviceId opcionalno).
  const startRequest = (serviceId) => {
    navigate(`/citizen/new-request?serviceId=${serviceId}`);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Slider />

      <div style={{ flex: 1 }}>
        <div className="auth-page" style={{ padding: 0 }}>
          <Container size="lg" py={24} style={{ position: "relative", zIndex: 1 }}>
            <Stack gap="md">
              {/* HERO */}
              <Paper
                radius="xl"
                style={{
                  position: "relative",
                  overflow: "hidden",
                  border: "1px solid rgba(11,31,59,0.12)",
                  background: "rgba(255,255,255,0.92)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Box
                  style={{
                    position: "relative",
                    padding: 20,
                    borderRadius: 16,
                    background:
                      "radial-gradient(900px 320px at 10% 10%, rgba(11,31,59,0.10), transparent 60%)," +
                      "radial-gradient(700px 300px at 85% 20%, rgba(11,31,59,0.08), transparent 55%)," +
                      "linear-gradient(180deg, rgba(231,240,255,0.70), rgba(255,255,255,0.95))",
                  }}
                >
                  <Group justify="space-between" align="flex-start">
                    <Box>
                      <Title order={2} c={NAVY}>
                        Dobrodošli, {auth?.user?.name}.
                      </Title>
                      <Text c="dimmed" mt={4}>
                        Vaš portal za digitalne usluge. Uloga: {getRoleLabel(auth?.user?.role)}.
                      </Text>

                      <Text c={NAVY} mt={10} fw={700} style={{ opacity: 0.9 }}>
                        Pregled vaših zahteva i servisa na jednom mestu.
                      </Text>
                    </Box>

                    <ActionIcon
                      variant="light"
                      color="blue"
                      radius="xl"
                      onClick={load}
                      aria-label="refresh"
                      style={{
                        zIndex: 3,
                        border: "1px solid rgba(11,31,59,0.12)",
                        background: "rgba(255,255,255,0.70)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <IconRefresh size={18} />
                    </ActionIcon>
                  </Group>
                </Box>
              </Paper>

              {/* CONTENT */}
              <Paper
                p="xl"
                radius="xl"
                style={{
                  border: "1px solid rgba(11,31,59,0.12)",
                  background: "rgba(255,255,255,0.90)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Stack gap="lg">
                  {loading ? (
                    <Group justify="center" py={30}>
                      <Loader />
                    </Group>
                  ) : (
                    <>
                      {/* METRIKE */}
                      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
                        <Card withBorder radius="xl">
                          <Text c="dimmed" size="sm">
                            Ukupno zahteva.
                          </Text>
                          <Title order={2} c={NAVY}>
                            {stats?.total_requests ?? 0}.
                          </Title>
                        </Card>

                        <Card withBorder radius="xl">
                          <Text c="dimmed" size="sm">
                            U obradi.
                          </Text>
                          <Title order={2} c={NAVY}>
                            {stats?.by_status?.find((x) => x.status === "IN_REVIEW")?.total ?? 0}.
                          </Title>
                        </Card>

                        <Card withBorder radius="xl">
                          <Text c="dimmed" size="sm">
                            Odobreno.
                          </Text>
                          <Title order={2} c={NAVY}>
                            {stats?.by_status?.find((x) => x.status === "APPROVED")?.total ?? 0}.
                          </Title>
                        </Card>

                        <Card withBorder radius="xl">
                          <Text c="dimmed" size="sm">
                            Odbijeno.
                          </Text>
                          <Title order={2} c={NAVY}>
                            {stats?.by_status?.find((x) => x.status === "REJECTED")?.total ?? 0}.
                          </Title>
                        </Card>
                      </SimpleGrid>

                      {/* ✅ NAJNOVIJE VESTI */}
                      <Card withBorder radius="xl" p="lg">
                        <Group justify="space-between" mb="sm">
                          <Title order={4} c={NAVY}>
                            Najnovije vesti (Srbija).
                          </Title>

                          <Button variant="light" color="blue" radius="xl" onClick={refetchNews}>
                            Osveži.
                          </Button>
                        </Group>

                        {newsLoading ? (
                          <Group justify="center" py={14}>
                            <Loader size="sm" />
                          </Group>
                        ) : newsError ? (
                          <Text c="dimmed">{newsError}</Text>
                        ) : news.length === 0 ? (
                          <Text c="dimmed">Trenutno nema vesti za prikaz.</Text>
                        ) : (
                          <Stack gap="sm">
                            {news.map((n, idx) => (
                              <Card key={n.url ?? idx} withBorder radius="xl" p="md">
                                <Group justify="space-between" align="flex-start">
                                  <Box style={{ flex: 1 }}>
                                    <Text fw={800} c={NAVY} lineClamp={2}>
                                      {n.title}.
                                    </Text>
                                    <Text c="dimmed" size="sm" mt={4}>
                                      Izvor: {n.source}. • {fmtDate(n.publishedAt)}.
                                    </Text>
                                  </Box>

                                  <ActionIcon
                                    variant="light"
                                    color="blue"
                                    radius="xl"
                                    component="a"
                                    href={n.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label="open"
                                  >
                                    <IconExternalLink size={18} />
                                  </ActionIcon>
                                </Group>
                              </Card>
                            ))}
                          </Stack>
                        )}

                        <Divider my="md" />

                        <Text size="sm" c="dimmed">
                          Vesti se preuzimaju sa javnog izvora (GDELT). Naslovi mogu biti iz različitih medija.
                        </Text>
                      </Card>

                      {/* SERVISI */}
                      <Card withBorder radius="xl" p="lg">
                        <Group justify="space-between" mb="sm">
                          <Title order={4} c={NAVY}>
                            Servisi.
                          </Title>
                          <Button variant="subtle" color="blue" onClick={() => navigate("/citizen/services")}>
                            Prikaži sve.
                          </Button>
                        </Group>

                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                          {quickServices.map((svc) => (
                            <Card key={svc.id} radius="xl" withBorder>
                              <Text fw={800} c={NAVY}>
                                {svc.name}.
                              </Text>
                              <Text c="dimmed" size="sm" lineClamp={2}>
                                {svc.description ?? "-"}
                              </Text>

                              <Group mt="sm" justify="space-between">
                                <Badge variant="light" color="blue">
                                  Taksa: {svc.fee} RSD.
                                </Badge>

                                <Button
                                  size="xs"
                                  radius="xl"
                                  variant="light"
                                  color="blue"
                                  onClick={() => startRequest(svc.id)}
                                >
                                  Pokreni zahtev.
                                </Button>
                              </Group>
                            </Card>
                          ))}
                        </SimpleGrid>
                      </Card>

                      {/* MOJI ZAHTEVI */}
                      <Card withBorder radius="xl" p="lg">
                        <Group justify="space-between" mb="sm">
                          <Title order={4} c={NAVY}>
                            Moji zahtevi.
                          </Title>
                          <Button variant="subtle" color="blue" onClick={() => navigate("/citizen/requests")}>
                            Prikaži sve.
                          </Button>
                        </Group>

                        <Table striped highlightOnHover withTableBorder>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>ID.</Table.Th>
                              <Table.Th>Servis.</Table.Th>
                              <Table.Th>Status.</Table.Th>
                              <Table.Th>PDF.</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {lastRequests.map((r) => (
                              <Table.Tr key={r.id}>
                                <Table.Td>{r.id}.</Table.Td>
                                <Table.Td>{r.service?.name ?? r.service_name ?? "-"}</Table.Td>
                                <Table.Td>
                                  <StatusBadge status={r.status} />
                                </Table.Td>
                                <Table.Td>
                                  <ActionIcon
                                    variant="light"
                                    color="blue"
                                    aria-label="pdf"
                                    onClick={() => downloadPdf(r.id)}
                                  >
                                    <IconDownload size={18} />
                                  </ActionIcon>
                                </Table.Td>
                              </Table.Tr>
                            ))}

                            {lastRequests.length === 0 && (
                              <Table.Tr>
                                <Table.Td colSpan={4}>
                                  <Text c="dimmed">Nemate zahteve još uvek.</Text>
                                </Table.Td>
                              </Table.Tr>
                            )}
                          </Table.Tbody>
                        </Table>
                      </Card>
                    </>
                  )}
                </Stack>
              </Paper>
            </Stack>
          </Container>
        </div>
      </div>
    </div>
  );
}
