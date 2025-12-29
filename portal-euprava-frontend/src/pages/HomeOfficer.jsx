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
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { IconLogout, IconRefresh, IconUserCheck, IconDownload } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { clearAuth, getAuth } from "../utils/auth";
import Slider from "../components/Slider";

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
  return <Badge color={s.c} variant="light">{s.t}.</Badge>;
}

export default function HomeOfficer() {
  const navigate = useNavigate();
  const auth = getAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);

  const inbox = useMemo(
    () => requests.filter((r) => r.status === "SUBMITTED" && (r.processed_by == null)),
    [requests]
  );

  const assigned = useMemo(
    () => requests.filter((r) => r.processed_by === auth?.user?.id),
    [requests, auth]
  );

  const load = async () => {
    setLoading(true);
    try {
      const [s1, s2] = await Promise.all([
        api.get("/stats"),
        api.get("/service-requests"),
      ]);
      setStats(s1.data);
      setRequests(Array.isArray(s2.data?.data) ? s2.data.data : (s2.data ?? []));
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

  const assignToMe = async (id) => {
    await api.patch(`/service-requests/${id}/assign`);
    load();
  };

  const updateStatus = async (id, status) => {
    await api.patch(`/service-requests/${id}/status`, { status });
    load();
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  return (
         <div style={{ display: "flex", minHeight: "100vh" }}>
    <Slider />
    <div style={{ flex: 1 }}>
    <div className="auth-page" style={{ padding: 0 }}>
      <Container size="lg" py={28} style={{ position: "relative", zIndex: 1 }}>
        <Paper
          p="xl"
          radius="xl"
          style={{
            border: "1px solid rgba(11,31,59,0.12)",
            background: "rgba(255,255,255,0.90)",
            backdropFilter: "blur(8px)",
          }}
        >
          <Group justify="space-between" align="flex-start">
            <Group gap="sm">
              <div>
                <Title order={2} c={NAVY}>Službenik – radna tabla.</Title>
              </div>
            </Group>

            <Group>
              <ActionIcon variant="light" color="blue" onClick={load}>
                <IconRefresh size={18} />
              </ActionIcon>
              <Button variant="light" color="blue" leftSection={<IconLogout size={16} />} onClick={logout}>
                Odjavi se.
              </Button>
            </Group>
          </Group>

          <Stack mt="lg" gap="lg">
            {loading ? (
              <Group justify="center" py={30}><Loader /></Group>
            ) : (
              <>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
                  <Card withBorder radius="xl">
                    <Text c="dimmed" size="sm">Ukupno u opsegu.</Text>
                    <Title order={2} c={NAVY}>{stats?.total_requests ?? 0}.</Title>
                  </Card>
                  <Card withBorder radius="xl">
                    <Text c="dimmed" size="sm">Inbox (SUBMITTED).</Text>
                    <Title order={2} c={NAVY}>{inbox.length}.</Title>
                  </Card>
                  <Card withBorder radius="xl">
                    <Text c="dimmed" size="sm">Dodeljeno meni.</Text>
                    <Title order={2} c={NAVY}>{assigned.length}.</Title>
                  </Card>
                  <Card withBorder radius="xl">
                    <Text c="dimmed" size="sm">Odobreno.</Text>
                    <Title order={2} c={NAVY}>
                      {stats?.by_status?.find((x) => x.status === "APPROVED")?.total ?? 0}.
                    </Title>
                  </Card>
                </SimpleGrid>

                {/* INBOX */}
                <Card withBorder radius="xl" p="lg">
                  <Title order={4} c={NAVY} mb="sm">Inbox – novi zahtevi.</Title>

                  <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>ID.</Table.Th>
                        <Table.Th>Servis.</Table.Th>
                        <Table.Th>Status.</Table.Th>
                        <Table.Th>Akcije.</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {inbox.map((r) => (
                        <Table.Tr key={r.id}>
                          <Table.Td>{r.id}.</Table.Td>
                          <Table.Td>{r.service?.name ?? "-"}</Table.Td>
                          <Table.Td><StatusBadge status={r.status} /></Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <Button
                                size="xs"
                                radius="xl"
                                variant="light"
                                color="blue"
                                leftSection={<IconUserCheck size={16} />}
                                onClick={() => assignToMe(r.id)}
                              >
                                Preuzmi.
                              </Button>

                              <ActionIcon
                                variant="light"
                                color="blue"
                                component="a"
                                href={`/api/service-requests/${r.id}/pdf`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <IconDownload size={18} />
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                      {inbox.length === 0 && (
                        <Table.Tr>
                          <Table.Td colSpan={4}>
                            <Text c="dimmed">Trenutno nema novih zahteva.</Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </Card>

                {/* MOJI ZAHTEVI */}
                <Card withBorder radius="xl" p="lg">
                  <Title order={4} c={NAVY} mb="sm">Moji dodeljeni zahtevi.</Title>

                  <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>ID.</Table.Th>
                        <Table.Th>Servis.</Table.Th>
                        <Table.Th>Status.</Table.Th>
                        <Table.Th>Promena statusa.</Table.Th>
                        <Table.Th>PDF.</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {assigned.map((r) => (
                        <Table.Tr key={r.id}>
                          <Table.Td>{r.id}.</Table.Td>
                          <Table.Td>{r.service?.name ?? "-"}</Table.Td>
                          <Table.Td><StatusBadge status={r.status} /></Table.Td>

                          <Table.Td style={{ width: 220 }}>
                            <Select
                              radius="xl"
                              placeholder="Izaberi."
                              data={[
                                { value: "IN_REVIEW", label: "IN_REVIEW." },
                                { value: "APPROVED", label: "APPROVED." },
                                { value: "REJECTED", label: "REJECTED." },
                              ]}
                              onChange={(v) => v && updateStatus(r.id, v)}
                            />
                          </Table.Td>

                          <Table.Td>
                            <ActionIcon
                              variant="light"
                              color="blue"
                              component="a"
                              href={`/api/service-requests/${r.id}/pdf`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <IconDownload size={18} />
                            </ActionIcon>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                      {assigned.length === 0 && (
                        <Table.Tr>
                          <Table.Td colSpan={5}>
                            <Text c="dimmed">Nemate dodeljene zahteve trenutno.</Text>
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
      </Container>
    </div>
        </div>
  </div>
  );
}
